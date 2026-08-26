import L from 'leaflet';
import { getStoredTile } from './offlineMapStorage';

export interface OfflineTileLayerOptions extends L.TileLayerOptions {
  layerName?: string;
  autoCache?: boolean;
}

/**
 * Custom Leaflet TileLayer that loads raster tiles from IndexedDB first.
 * If cached offline tile exists, renders immediately from Blob URL.
 * Otherwise, falls back to the network tile URL.
 */
export class OfflineTileLayer extends L.TileLayer {
  private layerName: string;
  private activeObjectUrls: Set<string> = new Set();

  constructor(urlTemplate: string, options: OfflineTileLayerOptions = {}) {
    super(urlTemplate, options);
    this.layerName = options.layerName || 'carto';
  }

  createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const tile = document.createElement('img');

    if (this.options.crossOrigin || this.options.crossOrigin === '') {
      tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
    }

    tile.alt = '';
    tile.setAttribute('role', 'presentation');
    tile.style.userSelect = 'none';
    (tile.style as any).webkitUserSelect = 'none';

    // Hook Leaflet's standard load / error callbacks safely
    const handleLoad = () => {
      if (!this._map) return;
      try {
        (this as any)._tileOnLoad(done, tile);
      } catch {
        done(undefined as any, tile);
      }
    };

    const handleError = () => {
      if (!this._map) return;
      try {
        (this as any)._tileOnError(done, tile);
      } catch {
        done(undefined as any, tile);
      }
    };

    L.DomEvent.on(tile, 'load', handleLoad);
    L.DomEvent.on(tile, 'error', handleError);

    let isCancelled = false;

    // Retrieve from IndexedDB offline storage
    getStoredTile(this.layerName, coords.z, coords.x, coords.y)
      .then((blob) => {
        if (isCancelled || !this._map) return;
        if (blob) {
          try {
            const objectUrl = URL.createObjectURL(blob);
            this.activeObjectUrls.add(objectUrl);
            tile.src = objectUrl;
          } catch {
            tile.src = this.getTileUrl(coords);
          }
        } else {
          // Standard network tile
          tile.src = this.getTileUrl(coords);
        }
      })
      .catch(() => {
        if (isCancelled || !this._map) return;
        tile.src = this.getTileUrl(coords);
      });

    (tile as any)._cancel = () => {
      isCancelled = true;
    };

    return tile;
  }

  _removeTile(key: string): void {
    const tile = (this as any)._tiles ? (this as any)._tiles[key] : null;
    if (tile && tile.el) {
      if ((tile.el as any)._cancel) {
        (tile.el as any)._cancel();
      }
      if (tile.el.src && tile.el.src.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(tile.el.src);
          this.activeObjectUrls.delete(tile.el.src);
        } catch {
          // Ignore
        }
      }
    }
    (L.TileLayer.prototype as any)._removeTile.call(this, key);
  }

  onRemove(map: L.Map): this {
    // Revoke cached object URLs to free up browser memory
    this.activeObjectUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore
      }
    });
    this.activeObjectUrls.clear();
    return super.onRemove(map);
  }
}

export function createOfflineTileLayer(
  urlTemplate: string,
  options: OfflineTileLayerOptions = {}
): OfflineTileLayer {
  return new OfflineTileLayer(urlTemplate, options);
}
