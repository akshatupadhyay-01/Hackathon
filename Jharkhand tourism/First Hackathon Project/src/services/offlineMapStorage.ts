/**
 * Jharkhand Eco-Tourism GIS - Offline Map & Tile Storage Engine
 * Uses IndexedDB to store raster tile blobs and critical GIS metadata for offline use in remote forest/hill regions.
 */

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface OfflineRegion {
  id: string;
  name: string;
  district: string;
  description: string;
  bounds: MapBounds;
  minZoom: number;
  maxZoom: number;
  totalTiles: number;
  downloadedTiles: number;
  sizeBytes: number;
  downloadedAt?: string;
  status: 'available' | 'downloading' | 'ready' | 'error' | 'paused';
  category: 'national_park' | 'waterfalls' | 'hills' | 'valley' | 'wildlife' | 'cultural' | 'custom' | 'statewide';
  icon: string;
  poiHighlights: string[];
  suggestedActivities: string[];
}

export interface StoredTile {
  key: string; // e.g. "voyager_12_3012_1754"
  z: number;
  x: number;
  y: number;
  layer: string;
  blob: Blob;
  size: number;
  timestamp: number;
  regionId?: string;
}

export interface StorageStats {
  regionCount: number;
  totalTiles: number;
  totalSizeBytes: number;
  formattedSize: string;
}

const DB_NAME = 'jharkhand_eco_gis_offline_v2';
const DB_VERSION = 2;
const STORE_TILES = 'tiles';
const STORE_REGIONS = 'regions';
const STORE_POIS = 'gis_pois';

// Curated Jharkhand Eco-Tourism & Sanctuary GIS Regions for Offline Download
export const PRESET_OFFLINE_REGIONS: Omit<OfflineRegion, 'status' | 'downloadedTiles' | 'sizeBytes' | 'downloadedAt'>[] = [
  {
    id: 'region_betla_palamu',
    name: 'Betla National Park & Palamu Tiger Reserve',
    district: 'Latehar & Palamu',
    description: 'Dense Sal forests, Koel & Burha river basins, wildlife safari routes, tribal watchtowers & Betla Chero Fort.',
    bounds: {
      south: 23.75,
      west: 84.10,
      north: 23.96,
      east: 84.38,
    },
    minZoom: 10,
    maxZoom: 14,
    totalTiles: 146,
    category: 'national_park',
    icon: '🐅',
    poiHighlights: ['Betla Fort', 'Kamaldah Elephant Lake', 'Kehr Forest Post', 'Koel River Confluence', 'Sal Tree Canopy Trail'],
    suggestedActivities: ['Wildlife Safari', 'Bird Watching', 'Forest Trekking', 'Heritage Photography'],
  },
  {
    id: 'region_netarhat_falls',
    name: 'Netarhat Hills & Waterfalls Circuit',
    district: 'Latehar',
    description: 'Queen of Chotanagpur plateau, Magnolia Sunset Point, Koel View, Lodh Falls (143m) & Upper/Lower Ghaghri.',
    bounds: {
      south: 23.40,
      west: 84.18,
      north: 23.62,
      east: 84.45,
    },
    minZoom: 10,
    maxZoom: 14,
    totalTiles: 152,
    category: 'hills',
    icon: '🌄',
    poiHighlights: ['Magnolia Sunset Point', 'Lodh Waterfall Gorge', 'Koel River Viewpoint', 'Upper Ghaghri Dam', 'Pine Forest Eco-Track'],
    suggestedActivities: ['Sunrise/Sunset Treks', 'Waterfall Rappelling', 'Stargazing', 'Tribal Handicrafts'],
  },
  {
    id: 'region_parasnath_shikharji',
    name: 'Parasnath Hills & Shikharji Sanctuary',
    district: 'Giridih',
    description: 'Highest peak of Jharkhand (1,365m), ancient pilgrim pathways, dense botanical bio-reserve & Madhuban base.',
    bounds: {
      south: 23.90,
      west: 86.05,
      north: 24.08,
      east: 86.26,
    },
    minZoom: 10,
    maxZoom: 14,
    totalTiles: 138,
    category: 'hills',
    icon: '⛰️',
    poiHighlights: ['Sammed Shikharji Top', 'Madhuban Base Camp', 'Parasnath Wildlife Trail', 'Gandharva Nala', 'Jain Museum'],
    suggestedActivities: ['Pilgrim Hiking (9km ascent)', 'Flora & Fauna Photography', 'Eco-Walks'],
  },
  {
    id: 'region_ranchi_waterfalls',
    name: 'Ranchi Waterfalls & Subarnarekha Circuit',
    district: 'Ranchi',
    description: 'Hundru (98m), Jonha (Gautamdhara), Dassam (Kanchi River), Sita Falls & Angara tribal craft belt.',
    bounds: {
      south: 23.22,
      west: 85.35,
      north: 23.52,
      east: 85.78,
    },
    minZoom: 10,
    maxZoom: 14,
    totalTiles: 168,
    category: 'waterfalls',
    icon: '💧',
    poiHighlights: ['Hundru Falls Gorge', 'Jonha 722 Steps Trail', 'Dassam Kanchi Rapids', 'Getalsud Dam Eco-Park', 'Sita Waterfalls'],
    suggestedActivities: ['Water Cascade Viewing', 'Riverbed Walking', 'Local Cuisine Tasting'],
  },
  {
    id: 'region_dalma_wildlife',
    name: 'Dalma Wildlife Sanctuary & Elephant Reserve',
    district: 'East Singhbhum & Saraikela',
    description: 'Dalma Hill Range (926m), migratory elephant corridors, Shiva temple summit, Dimna lake catchment.',
    bounds: {
      south: 22.80,
      west: 86.10,
      north: 23.00,
      east: 86.35,
    },
    minZoom: 10,
    maxZoom: 14,
    totalTiles: 142,
    category: 'wildlife',
    icon: '🐘',
    poiHighlights: ['Dalma Hilltop Temple', 'Elephant Hideout Pindrabera', 'Dimna Lake Boating', 'Majhgharn Eco-Camp', 'Deer Enclosure'],
    suggestedActivities: ['Forest Canopy Walks', 'Elephant Tracking Guides', 'Lake Picnics'],
  },
  {
    id: 'region_patratu_valley',
    name: 'Patratu Valley & Dam GIS Circuit',
    district: 'Ramgarh',
    description: 'Iconic winding hairpin roads, Patratu Reservoir boating, Palna Island, Nalkari river eco-park.',
    bounds: {
      south: 23.56,
      west: 85.22,
      north: 23.72,
      east: 85.39,
    },
    minZoom: 10,
    maxZoom: 14,
    totalTiles: 112,
    category: 'valley',
    icon: '🛣️',
    poiHighlights: ['Patratu Hairpin Viewpoint', 'Reservoir Island Pier', 'Nalkari Riverside Walk', 'Valley Sunset Deck', 'Water Sports Complex'],
    suggestedActivities: ['Scenic Driving', 'Speed Boating', 'Valley Photography', 'Café Relaxation'],
  },
  {
    id: 'region_deoghar_trikut',
    name: 'Deoghar Cultural & Trikut Hills Eco-Zone',
    district: 'Deoghar',
    description: 'Baba Baidyanath Jyotirlinga, Trikut ropeway & three-peak caves, Tapovan eco-forest & Mayurakshi watershed.',
    bounds: {
      south: 24.40,
      west: 86.60,
      north: 24.58,
      east: 86.85,
    },
    minZoom: 10,
    maxZoom: 14,
    totalTiles: 124,
    category: 'cultural',
    icon: '🛕',
    poiHighlights: ['Trikut Pahar Peaks', 'Tapovan Cave Complex', 'Baidyanath Dham', 'Nandan Pahar Park', 'Naulakha Temple'],
    suggestedActivities: ['Ropeway Ride', 'Rock Climbing & Caving', 'Spiritual Heritage Walks'],
  },
  {
    id: 'region_hazaribagh_park',
    name: 'Hazaribagh National Park & Canary Hill',
    district: 'Hazaribagh',
    description: 'Sal tree wildlife sanctuary, Canary Hill observation tower, Konar dam, prehistoric Isko rock art caves.',
    bounds: {
      south: 23.94,
      west: 85.28,
      north: 24.16,
      east: 85.55,
    },
    minZoom: 10,
    maxZoom: 14,
    totalTiles: 130,
    category: 'national_park',
    icon: '🌲',
    poiHighlights: ['Canary Hill Tower', 'Hazaribagh Wildlife Core', 'Isko Rock Paintings', 'Surajkund Hot Springs', 'Konar Dam'],
    suggestedActivities: ['Sal Forest Safaris', 'Rock Art Exploration', 'Panoramic Tower Views'],
  },
  {
    id: 'region_statewide_base',
    name: 'Jharkhand Statewide Overview GIS',
    district: 'All 24 Districts',
    description: 'Overview base maps for the entire state of Jharkhand connecting Ranchi, Jamshedpur, Dhanbad, Bokaro, and Hazaribagh.',
    bounds: {
      south: 21.95,
      west: 83.30,
      north: 25.35,
      east: 87.95,
    },
    minZoom: 6,
    maxZoom: 9,
    totalTiles: 178,
    category: 'statewide',
    icon: '🗺️',
    poiHighlights: ['State Highways & National Corridors', 'District Headquarters', 'Major River Systems', 'Sanctuary Entry Gateways'],
    suggestedActivities: ['Inter-District Routing', 'State Highway Navigation', 'Offline Planning'],
  },
];

// Open IndexedDB instance
let dbPromise: Promise<IDBDatabase> | null = null;

export function openOfflineDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this platform.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Tiles Store
      if (!db.objectStoreNames.contains(STORE_TILES)) {
        const tileStore = db.createObjectStore(STORE_TILES, { keyPath: 'key' });
        tileStore.createIndex('regionId', 'regionId', { unique: false });
        tileStore.createIndex('layer', 'layer', { unique: false });
        tileStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 2. Regions Store
      if (!db.objectStoreNames.contains(STORE_REGIONS)) {
        const regionStore = db.createObjectStore(STORE_REGIONS, { keyPath: 'id' });
        regionStore.createIndex('status', 'status', { unique: false });
        regionStore.createIndex('category', 'category', { unique: false });
      }

      // 3. GIS POIs Store
      if (!db.objectStoreNames.contains(STORE_POIS)) {
        const poiStore = db.createObjectStore(STORE_POIS, { keyPath: 'id' });
        poiStore.createIndex('regionId', 'regionId', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB for offline maps.'));
    };
  });

  return dbPromise;
}

// Convert longitude to tile X coordinate
export function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

// Convert latitude to tile Y coordinate
export function lat2tile(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );
}

// Convert tile X to longitude
export function tile2lon(x: number, zoom: number): number {
  return (x / Math.pow(2, zoom)) * 360 - 180;
}

// Convert tile Y to latitude
export function tile2lat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

// Calculate tile grid coordinate list for a region bounds and zoom range
export function calculateTileList(
  bounds: MapBounds,
  minZoom: number,
  maxZoom: number
): { z: number; x: number; y: number }[] {
  const tiles: { z: number; x: number; y: number }[] = [];

  for (let z = minZoom; z <= maxZoom; z++) {
    const minX = Math.max(0, lon2tile(bounds.west, z));
    const maxX = Math.min(Math.pow(2, z) - 1, lon2tile(bounds.east, z));
    const minY = Math.max(0, lat2tile(bounds.north, z)); // North is smaller Y
    const maxY = Math.min(Math.pow(2, z) - 1, lat2tile(bounds.south, z)); // South is larger Y

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        tiles.push({ z, x, y });
      }
    }
  }

  return tiles;
}

// Format tile key: e.g. "carto_12_3012_1754"
export function formatTileKey(layer: string, z: number, x: number, y: number): string {
  return `${layer}_${z}_${x}_${y}`;
}

// Save single tile blob to IndexedDB
export async function storeTile(
  layer: string,
  z: number,
  x: number,
  y: number,
  blob: Blob,
  regionId?: string
): Promise<void> {
  const db = await openOfflineDB();
  const key = formatTileKey(layer, z, x, y);
  const tileRecord: StoredTile = {
    key,
    z,
    x,
    y,
    layer,
    blob,
    size: blob.size,
    timestamp: Date.now(),
    regionId,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TILES, 'readwrite');
    const store = tx.objectStore(STORE_TILES);
    const req = store.put(tileRecord);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Batch save tiles to IndexedDB for performance
export async function storeTilesBatch(tiles: StoredTile[]): Promise<void> {
  if (!tiles.length) return;
  const db = await openOfflineDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TILES, 'readwrite');
    const store = tx.objectStore(STORE_TILES);

    for (const t of tiles) {
      store.put(t);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Retrieve tile blob from IndexedDB
export async function getStoredTile(layer: string, z: number, x: number, y: number): Promise<Blob | null> {
  try {
    const db = await openOfflineDB();
    const key = formatTileKey(layer, z, x, y);

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_TILES, 'readonly');
      const store = tx.objectStore(STORE_TILES);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Check if a tile exists in storage
export async function hasStoredTile(layer: string, z: number, x: number, y: number): Promise<boolean> {
  try {
    const db = await openOfflineDB();
    const key = formatTileKey(layer, z, x, y);

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_TILES, 'readonly');
      const store = tx.objectStore(STORE_TILES);
      const req = store.count(key);

      req.onsuccess = () => resolve(req.result > 0);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// Save or Update Offline Region
export async function saveRegionRecord(region: OfflineRegion): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_REGIONS, 'readwrite');
    const store = tx.objectStore(STORE_REGIONS);
    const req = store.put(region);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Get all saved offline regions
export async function getAllRegions(): Promise<OfflineRegion[]> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_REGIONS, 'readonly');
      const store = tx.objectStore(STORE_REGIONS);
      const req = store.getAll();

      req.onsuccess = () => {
        const saved = (req.result || []) as OfflineRegion[];
        
        // Merge preset regions with saved state
        const merged: OfflineRegion[] = PRESET_OFFLINE_REGIONS.map((preset) => {
          const found = saved.find((r) => r.id === preset.id);
          if (found) return found;
          return {
            ...preset,
            status: 'available',
            downloadedTiles: 0,
            sizeBytes: 0,
          };
        });

        // Add any custom user-downloaded regions not in presets
        saved.forEach((r) => {
          if (!merged.some((m) => m.id === r.id)) {
            merged.push(r);
          }
        });

        resolve(merged);
      };

      req.onerror = () => {
        // Fallback to presets with available status
        resolve(
          PRESET_OFFLINE_REGIONS.map((p) => ({
            ...p,
            status: 'available',
            downloadedTiles: 0,
            sizeBytes: 0,
          }))
        );
      };
    });
  } catch {
    return PRESET_OFFLINE_REGIONS.map((p) => ({
      ...p,
      status: 'available',
      downloadedTiles: 0,
      sizeBytes: 0,
    }));
  }
}

// Delete offline region and its cached tiles
export async function deleteRegion(regionId: string): Promise<void> {
  const db = await openOfflineDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_REGIONS, STORE_TILES], 'readwrite');
    const regionStore = tx.objectStore(STORE_REGIONS);
    const tileStore = tx.objectStore(STORE_TILES);

    // 1. Delete region metadata
    regionStore.delete(regionId);

    // 2. Delete associated tiles via index
    const index = tileStore.index('regionId');
    const req = index.openCursor(IDBKeyRange.only(regionId));

    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Clear all offline tiles & regions
export async function clearAllOfflineData(): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_TILES, STORE_REGIONS, STORE_POIS], 'readwrite');
    tx.objectStore(STORE_TILES).clear();
    tx.objectStore(STORE_REGIONS).clear();
    tx.objectStore(STORE_POIS).clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Get aggregate offline storage stats
export async function getStorageStats(): Promise<StorageStats> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_REGIONS, STORE_TILES], 'readonly');
      const regionStore = tx.objectStore(STORE_REGIONS);
      const tileStore = tx.objectStore(STORE_TILES);

      const regionsReq = regionStore.getAll();
      const tilesReq = tileStore.getAll();

      let readyCount = 0;
      let totalBytes = 0;
      let totalTiles = 0;

      regionsReq.onsuccess = () => {
        const regions = (regionsReq.result || []) as OfflineRegion[];
        readyCount = regions.filter((r) => r.status === 'ready').length;
      };

      tilesReq.onsuccess = () => {
        const tiles = (tilesReq.result || []) as StoredTile[];
        totalTiles = tiles.length;
        totalBytes = tiles.reduce((acc, t) => acc + (t.size || 0), 0);

        const mb = (totalBytes / (1024 * 1024)).toFixed(1);
        resolve({
          regionCount: readyCount,
          totalTiles,
          totalSizeBytes: totalBytes,
          formattedSize: `${mb} MB`,
        });
      };

      tx.onerror = () => {
        resolve({
          regionCount: 0,
          totalTiles: 0,
          totalSizeBytes: 0,
          formattedSize: '0.0 MB',
        });
      };
    });
  } catch {
    return {
      regionCount: 0,
      totalTiles: 0,
      totalSizeBytes: 0,
      formattedSize: '0.0 MB',
    };
  }
}

// URL Tile Builder helper (Carto Voyager & OSM)
export function getTileUrl(layer: string, z: number, x: number, y: number): string {
  const subdomains = ['a', 'b', 'c', 'd'];
  const s = subdomains[(x + y) % subdomains.length];
  if (layer === 'osm') {
    return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }
  // Default: Carto Voyager
  return `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
}

// Download Region Engine with Progress Callback & AbortController
export async function downloadRegionTiles(
  region: OfflineRegion,
  options: {
    layer?: string;
    onProgress?: (downloaded: number, total: number, percent: number, bytesDownloaded: number) => void;
    signal?: AbortSignal;
  } = {}
): Promise<{ success: boolean; totalBytes: number; downloadedTiles: number }> {
  const layer = options.layer || 'carto';
  const tileCoords = calculateTileList(region.bounds, region.minZoom, region.maxZoom);
  const total = tileCoords.length;

  let downloadedCount = 0;
  let totalBytes = 0;
  const batchSize = 6; // Concurrent fetches
  const tilesToStore: StoredTile[] = [];

  // Update region status to downloading
  await saveRegionRecord({
    ...region,
    status: 'downloading',
    totalTiles: total,
    downloadedTiles: 0,
    sizeBytes: 0,
  });

  try {
    for (let i = 0; i < tileCoords.length; i += batchSize) {
      if (options.signal?.aborted) {
        throw new Error('Download aborted by user.');
      }

      const chunk = tileCoords.slice(i, i + batchSize);

      const promises = chunk.map(async ({ z, x, y }) => {
        if (options.signal?.aborted) return null;

        // Check if already stored to save bandwidth
        const existing = await getStoredTile(layer, z, x, y);
        if (existing) {
          downloadedCount++;
          totalBytes += existing.size;
          return null;
        }

        const url = getTileUrl(layer, z, x, y);
        try {
          const res = await fetch(url, {
            mode: 'cors',
            signal: options.signal,
            headers: {
              Accept: 'image/png,image/jpeg,image/*;q=0.9',
            },
          });

          if (!res.ok) {
            console.warn(`Tile fetch failed ${z}/${x}/${y}: ${res.status}`);
            return null;
          }

          const blob = await res.blob();
          downloadedCount++;
          totalBytes += blob.size;

          const key = formatTileKey(layer, z, x, y);
          return {
            key,
            z,
            x,
            y,
            layer,
            blob,
            size: blob.size,
            timestamp: Date.now(),
            regionId: region.id,
          } as StoredTile;
        } catch (err: any) {
          if (err.name === 'AbortError') throw err;
          console.warn(`Error downloading tile ${z}/${x}/${y}:`, err);
          return null;
        }
      });

      const results = await Promise.all(promises);

      for (const res of results) {
        if (res) tilesToStore.push(res);
      }

      // Write batch to IndexedDB every 18 tiles
      if (tilesToStore.length >= 18) {
        await storeTilesBatch([...tilesToStore]);
        tilesToStore.length = 0;
      }

      const percent = Math.min(100, Math.round((downloadedCount / total) * 100));
      if (options.onProgress) {
        options.onProgress(downloadedCount, total, percent, totalBytes);
      }

      // Small throttle to be courteous to open tile servers
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    // Flush any remaining tiles
    if (tilesToStore.length > 0) {
      await storeTilesBatch(tilesToStore);
    }

    // Mark as ready
    const readyRecord: OfflineRegion = {
      ...region,
      status: 'ready',
      totalTiles: total,
      downloadedTiles: downloadedCount,
      sizeBytes: totalBytes,
      downloadedAt: new Date().toISOString(),
    };
    await saveRegionRecord(readyRecord);

    if (options.onProgress) {
      options.onProgress(downloadedCount, total, 100, totalBytes);
    }

    return {
      success: true,
      totalBytes,
      downloadedTiles: downloadedCount,
    };
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message?.includes('aborted')) {
      await saveRegionRecord({
        ...region,
        status: 'paused',
        downloadedTiles: downloadedCount,
        sizeBytes: totalBytes,
      });
    } else {
      await saveRegionRecord({
        ...region,
        status: 'error',
        downloadedTiles: downloadedCount,
        sizeBytes: totalBytes,
      });
    }
    throw err;
  }
}
