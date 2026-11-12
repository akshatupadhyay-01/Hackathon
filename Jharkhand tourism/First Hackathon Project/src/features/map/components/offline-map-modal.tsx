import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Trash2,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Compass,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Layers,
  MapPin,
  Sparkles,
  Info,
  Play,
  Pause,
  Eye,
  ExternalLink,
  Shield,
} from 'lucide-react';
import {
  OfflineRegion,
  getAllRegions,
  downloadRegionTiles,
  deleteRegion,
  clearAllOfflineData,
  getStorageStats,
  StorageStats,
  saveRegionRecord,
  MapBounds,
} from '../services/offlineMapStorage';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { usePWA } from '../../../contexts/pwa-context';

interface OfflineMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRegion?: (bounds: MapBounds, name: string) => void;
  currentMapBounds?: MapBounds | null;
  currentMapCenter?: { lat: number; lng: number } | null;
}

export function OfflineMapModal({
  isOpen,
  onClose,
  onNavigateToRegion,
  currentMapBounds,
  currentMapCenter,
}: OfflineMapModalProps) {
  const { isOnline, triggerHaptic } = usePWA();
  const [regions, setRegions] = useState<OfflineRegion[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats>({
    regionCount: 0,
    totalTiles: 0,
    totalSizeBytes: 0,
    formattedSize: '0.0 MB',
  });
  const [activeTab, setActiveTab] = useState<'regions' | 'saved' | 'custom'>('regions');
  const [downloadingRegionId, setDownloadingRegionId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{
    downloaded: number;
    total: number;
    percent: number;
    bytes: number;
  }>({ downloaded: 0, total: 0, percent: 0, bytes: 0 });

  const [customRegionName, setCustomRegionName] = useState('');
  const [customDownloading, setCustomDownloading] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load Regions & Storage stats on modal open
  const refreshData = async () => {
    try {
      const [regionList, stats] = await Promise.all([getAllRegions(), getStorageStats()]);
      setRegions(regionList);
      setStorageStats(stats);
    } catch (err) {
      console.error('Failed to load offline regions:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      if (currentMapCenter) {
        setCustomRegionName(`Custom GIS Region (${currentMapCenter.lat.toFixed(2)}°N, ${currentMapCenter.lng.toFixed(2)}°E)`);
      } else {
        setCustomRegionName(`Custom Viewport Map`);
      }
    }
  }, [isOpen, currentMapCenter]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Start Downloading a Region
  const handleStartDownload = async (region: OfflineRegion) => {
    if (!isOnline) {
      setStatusMessage('Network connection required to download map tiles.');
      return;
    }

    triggerHaptic([15, 20]);
    setDownloadingRegionId(region.id);
    setDownloadProgress({ downloaded: 0, total: region.totalTiles || 100, percent: 0, bytes: 0 });
    setStatusMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await downloadRegionTiles(region, {
        signal: controller.signal,
        onProgress: (downloaded, total, percent, bytes) => {
          setDownloadProgress({ downloaded, total, percent, bytes });
        },
      });

      triggerHaptic([20, 15, 30]);
      setStatusMessage(`✓ "${region.name}" is now ready for 100% offline navigation!`);
      await refreshData();
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        setStatusMessage(`Download paused for "${region.name}".`);
      } else {
        console.error('Download failed:', err);
        setStatusMessage(`Failed to download tiles for "${region.name}". Please check network.`);
      }
      await refreshData();
    } finally {
      setDownloadingRegionId(null);
      abortControllerRef.current = null;
    }
  };

  // Cancel / Pause Active Download
  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      triggerHaptic(10);
    }
  };

  // Delete Region
  const handleDeleteRegion = async (regionId: string, regionName: string) => {
    triggerHaptic(10);
    try {
      await deleteRegion(regionId);
      setStatusMessage(`Removed offline data for "${regionName}".`);
      await refreshData();
    } catch (err) {
      console.error('Failed to delete region:', err);
    }
  };

  // Clear all data
  const handleClearAll = async () => {
    triggerHaptic([30, 20]);
    try {
      await clearAllOfflineData();
      setShowConfirmClear(false);
      setStatusMessage('All offline tile data cleared.');
      await refreshData();
    } catch (err) {
      console.error('Failed to clear offline storage:', err);
    }
  };

  // Download Current Viewport as Custom Region
  const handleDownloadCurrentViewport = async () => {
    if (!currentMapBounds) {
      setStatusMessage('No map viewport detected. Please move around the map first.');
      return;
    }

    const name = customRegionName.trim() || 'Custom Viewport';
    const customId = `custom_${Date.now()}`;

    const newRegion: OfflineRegion = {
      id: customId,
      name,
      district: 'Custom Viewport',
      description: 'User-selected viewport bounds for offline field exploration.',
      bounds: currentMapBounds,
      minZoom: 10,
      maxZoom: 14,
      totalTiles: 120,
      downloadedTiles: 0,
      sizeBytes: 0,
      status: 'available',
      category: 'custom',
      icon: '📍',
      poiHighlights: ['Current Visible Viewport', 'All Surrounding Forest Trails & Roads'],
      suggestedActivities: ['Offline Field Navigation'],
    };

    await saveRegionRecord(newRegion);
    setActiveTab('regions');
    await handleStartDownload(newRegion);
  };

  // Filter regions
  const filteredRegions = regions.filter((r) => {
    if (filterCategory === 'all') return true;
    return r.category === filterCategory;
  });

  const downloadedRegions = regions.filter((r) => r.status === 'ready');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden h-[100dvh] max-h-[100dvh] min-h-[100dvh] pt-[max(0.6rem,env(safe-area-inset-top,0px))] pb-[max(0.6rem,env(safe-area-inset-bottom,0px))] animate-in fade-in duration-200"
      style={{ height: '100dvh', maxHeight: '100dvh' }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-3xl max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] sm:max-h-[min(88dvh,calc(100dvh-2rem))] flex flex-col rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden transition-all my-auto"
        style={{
          maxHeight: 'calc(100dvh - 1.5rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-stone-900 text-white px-4 sm:px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 shadow-inner">
              <HardDrive className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg tracking-tight">
                  Download Offline GIS Maps
                </h3>
                <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 text-[10px] px-1.5 py-0">
                  IndexedDB Storage
                </Badge>
              </div>
              <p className="text-xs text-stone-200 line-clamp-1">
                Access full-resolution raster tiles, forest tracks & coordinates without internet.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status & Storage Stats Bar */}
        <div className="bg-stone-100 dark:bg-stone-950/90 border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <Wifi className="h-3.5 w-3.5" />
                  <span>Online</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <WifiOff className="h-3.5 w-3.5" />
                  <span>Offline Mode</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-stone-600 dark:text-stone-300">
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              <span>
                <strong>{storageStats.regionCount}</strong> Saved Region{storageStats.regionCount === 1 ? '' : 's'} (
                {storageStats.totalTiles} tiles)
              </span>
            </div>

            <div className="flex items-center gap-1 text-stone-600 dark:text-stone-300">
              <HardDrive className="h-3.5 w-3.5 text-blue-600" />
              <span>
                <strong>{storageStats.formattedSize}</strong> Cached
              </span>
            </div>
          </div>

          {downloadedRegions.length > 0 && (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear All Storage</span>
            </button>
          )}
        </div>

        {/* Status / Alert Banner if any */}
        {statusMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-900/60 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 bg-white dark:bg-stone-900 shrink-0 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('regions')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'regions'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Curated Eco-Regions ({regions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'saved'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Saved Offline Maps ({downloadedRegions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'custom'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Custom Viewport</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4"
          style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          {/* TAB 1: CURATED ECO-REGIONS */}
          {activeTab === 'regions' && (
            <div className="space-y-4">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'All Regions' },
                  { id: 'national_park', label: '🐅 National Parks & Tigers' },
                  { id: 'hills', label: '⛰️ Hills & Peaks' },
                  { id: 'waterfalls', label: '💧 Waterfalls' },
                  { id: 'wildlife', label: '🐘 Wildlife Sanctuaries' },
                  { id: 'valley', label: '🛣️ Valleys' },
                  { id: 'cultural', label: '🛕 Cultural Circuits' },
                  { id: 'statewide', label: '🗺️ Statewide Overview' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      filterCategory === cat.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Regions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredRegions.map((region) => {
                  const isDownloading = downloadingRegionId === region.id;
                  const isReady = region.status === 'ready';
                  const isPaused = region.status === 'paused';
                  const isError = region.status === 'error';

                  return (
                    <div
                      key={region.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isReady
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                          : isDownloading
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 shadow-md'
                          : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{region.icon}</span>
                            <div>
                              <h4 className="font-bold text-sm text-stone-900 dark:text-white leading-tight">
                                {region.name}
                              </h4>
                              <span className="text-[11px] text-stone-500 font-medium">
                                {region.district}
                              </span>
                            </div>
                          </div>

                          {isReady ? (
                            <Badge variant="emerald" className="text-[10px] shrink-0 gap-1 bg-emerald-600 text-white">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Ready Offline</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] shrink-0 text-stone-500 border-stone-300">
                              ~{(region.totalTiles * 0.024).toFixed(1)} MB
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2">
                          {region.description}
                        </p>

                        {/* POI Highlights Preview */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {region.poiHighlights.slice(0, 3).map((poi, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-md"
                            >
                              📍 {poi}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Download Status & Actions */}
                      <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 mt-3 space-y-2">
                        {isDownloading ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold text-amber-700 dark:text-amber-300">
                              <span className="flex items-center gap-1.5">
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                <span>
                                  Downloading: {downloadProgress.downloaded} / {downloadProgress.total} tiles
                                </span>
                              </span>
                              <span>{downloadProgress.percent}%</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2 bg-amber-100 dark:bg-amber-950 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 transition-all duration-200"
                                style={{ width: `${downloadProgress.percent}%` }}
                              />
                            </div>

                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelDownload}
                                className="h-6 text-[11px] px-2 text-rose-600 hover:text-rose-700 border-rose-300 cursor-pointer"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : isReady ? (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                              Saved ({(region.sizeBytes / (1024 * 1024)).toFixed(1)} MB • {region.totalTiles} tiles)
                            </span>

                            <div className="flex items-center gap-1.5">
                              {onNavigateToRegion && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    onNavigateToRegion(region.bounds, region.name);
                                    onClose();
                                  }}
                                  className="h-7 text-xs px-2.5 border-emerald-400 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer gap-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>View on Map</span>
                                </Button>
                              )}
                              <button
                                onClick={() => handleDeleteRegion(region.id, region.name)}
                                title="Delete offline package"
                                className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-stone-500">
                              Zooms 10-14 ({region.totalTiles} tiles)
                            </span>

                            <Button
                              size="sm"
                              onClick={() => handleStartDownload(region)}
                              disabled={downloadingRegionId !== null}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 rounded-xl gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>{isPaused ? 'Resume Download' : 'Download Offline'}</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SAVED OFFLINE MAPS */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              {downloadedRegions.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3 bg-stone-50 dark:bg-stone-950/60 rounded-3xl border border-stone-200 dark:border-stone-800">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <Download className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-stone-900 dark:text-white">
                    No Offline Regions Downloaded Yet
                  </h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Choose from curated Jharkhand sanctuaries (Betla Tiger Reserve, Netarhat Hills, Parasnath Peak) to navigate while offline.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setActiveTab('regions')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                  >
                    Browse Eco-Regions
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {downloadedRegions.map((region) => (
                    <div
                      key={region.id}
                      className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-800/80 shadow-xs flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{region.icon}</span>
                        <div>
                          <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                            {region.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-stone-500">
                            <span>{region.district}</span>
                            <span>•</span>
                            <span>{(region.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                            <span>•</span>
                            <span>{region.totalTiles} raster tiles</span>
                            {region.downloadedAt && (
                              <>
                                <span>•</span>
                                <span>Downloaded {new Date(region.downloadedAt).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {onNavigateToRegion && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onNavigateToRegion(region.bounds, region.name);
                              onClose();
                            }}
                            className="text-xs border-emerald-400 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 gap-1.5 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View on Map</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRegion(region.id, region.name)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM VIEWPORT DOWNLOAD */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white">
                      Download Current Map Viewport
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                      Save whichever portion of Jharkhand you currently have centered on the interactive map.
                    </p>
                  </div>
                </div>

                {currentMapBounds ? (
                  <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-stone-500 font-mono text-[11px]">
                      <span>North: {currentMapBounds.north.toFixed(4)}°N</span>
                      <span>South: {currentMapBounds.south.toFixed(4)}°N</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-500 font-mono text-[11px]">
                      <span>West: {currentMapBounds.west.toFixed(4)}°E</span>
                      <span>East: {currentMapBounds.east.toFixed(4)}°E</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 font-medium">
                    Please pan or zoom the map to select your target coordinates.
                  </p>
                )}

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Region Label / Package Name
                  </label>
                  <input
                    type="text"
                    value={customRegionName}
                    onChange={(e) => setCustomRegionName(e.target.value)}
                    placeholder="e.g. My Ranchi Trekking Camp"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <Button
                  onClick={handleDownloadCurrentViewport}
                  disabled={!currentMapBounds || downloadingRegionId !== null}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 py-2.5 rounded-xl shadow-md cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Viewport for Offline Use (~3.5 MB)</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-stone-50 dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-3 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span>IndexedDB persistent tile cache • Zero mobile data required when offline</span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="text-xs font-bold border-stone-300 dark:border-stone-700"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Storage */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
              <h4 className="font-bold text-stone-900 dark:text-white text-base">
                Clear Offline GIS Data?
              </h4>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300">
              This will remove all stored map tiles ({storageStats.totalTiles} tiles, {storageStats.formattedSize}) from your device. You can re-download them anytime.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfirmClear(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleClearAll}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Delete All Tiles
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
