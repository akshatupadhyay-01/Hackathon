r ${
              crowdFilter !== 'ALL'
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Crowd:</span>
            <span>{crowdFilter === 'ALL' ? 'Filter' : crowdFilter}</span>
          </button>

          {/* Crowd Zones Toggle */}
          <button
            onClick={() => setShowCrowdZones(!showCrowdZones)}
            aria-label="Toggle crowd zones"
            title="Toggle crowd density zones"
            className={`h-9 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
              showCrowdZones
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
            }`}
          >
            {showCrowdZones ? (
              <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
            <span className="hidden md:inline">{showCrowdZones ? 'Zones ON' : 'Zones OFF'}</span>
          </button>
        </div>

        {/* Second Row: Mode Tabs & GPS Action Button */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-0.5">
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl shrink-0">
            <button
              onClick={() => {
                setActiveTab('explore');
                setShowCrowdZones(true);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'explore'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('crowd');
                setShowCrowdZones(true);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'crowd'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Crowd</span>
            </button>

            {/* Local Street Vendors Tab */}
            <button
              onClick={() => {
                setActiveTab('vendors');
                setShowVendorsLayer(true);
                setDrawerState('expanded');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'vendors'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60'
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5 text-amber-500" />
              <span>Local Vendors ({vendors.length})</span>
            </button>

            {/* My Location / GPS discovery button */}
            <button
              onClick={handleRequestUserGpsLocation}
              disabled={gpsStatus === 'locating'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'nearby' || userGpsCoords
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60'
              }`}
            >
              <LocateFixed className={`h-3.5 w-3.5 ${gpsStatus === 'locating' ? 'animate-spin text-white' : ''}`} />
              <span>{gpsStatus === 'locating' ? 'Locating…' : userGpsCoords ? 'GPS Active' : 'My Location'}</span>
            </button>

            {directionsDestination && (
              <button
                onClick={() => setActiveTab('directions')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'directions'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Car className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Directions</span>
              </button>
            )}
          </div>

          {/* District Selector Trigger */}
          <div className="flex items-center gap-1.5 shrink-0 text-xs">
            <button
              onClick={() => setShowDistrictSheet(true)}
              className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-medium border border-stone-200/60 dark:border-stone-700/60 flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="h-3 w-3 text-emerald-600" />
              <span className="truncate max-w-[90px]">
                {selectedDistrict === 'all'
                  ? 'All Districts'
                  : districts.find((d) => d.id === selectedDistrict)?.name || 'District'}
              </span>
            </button>
          </div>
        </div>

        {/* GPS Status / Error Notification Alert Banner */}
        {gpsErrorMessage && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2 animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{gpsErrorMessage}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRequestUserGpsLocation}
                className="h-6 px-2 text-[11px] border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900"
              >
                Try Again
              </Button>
              <button
                onClick={() => setGpsErrorMessage(null)}
                className="p-0.5 text-amber-600 hover:text-amber-800 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN MAP CANVAS CONTAINER                                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-3 sm:p-5 text-stone-900 dark:text-white shadow-xl overflow-hidden relative">
        {/* Map Canvas Section */}
        <div className="lg:col-span-2 relative h-[520px] sm:h-[620px] rounded-2xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 overflow-hidden">
          {/* Leaflet Map Root */}
          <div
            ref={mapContainerRef}
            className="absolute inset-0 w-full h-full z-0 rounded-2xl"
            style={{ background: '#e2e8f0' }}
          />

          {/* TOP-LEFT STATUS BADGES */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 max-w-[80%] pointer-events-none">
            {directionsMode ? (
              <Badge variant="outline" className="pointer-events-auto bg-blue-600/90 text-white border-blue-400 text-[11px] gap-1 shadow-md py-0.5">
                <Car className="h-3 w-3 animate-pulse" />
                <span>Road Route Active</span>
                {onClearDirections && (
                  <button
                    onClick={onClearDirections}
                    className="ml-1 hover:text-rose-200 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ) : activeItinerary ? (
              <Badge variant="emerald" className="pointer-events-auto bg-emerald-700/90 text-white border-emerald-400 text-[11px] gap-1 shadow-md py-0.5">
                <Route className="h-3 w-3 text-amber-300" />
                <span>Itinerary ({itineraryDaysWithDest.length} Stops)</span>
                {onClearItinerary && (
                  <button
                    onClick={onClearItinerary}
                    className="ml-1 hover:text-rose-200 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 text-[11px] shadow-sm">
                <span>{filteredDestinations.length} Sites</span>
              </Badge>
            )}

            {userGpsCoords && (
              <Badge variant="outline" className="pointer-events-auto bg-blue-600 text-white border-blue-400 text-[10px] gap-1 shadow-xs">
                <span>📍 GPS Active</span>
              </Badge>
            )}

            {activeTab === 'vendors' && (
              <Badge variant="outline" className="pointer-events-auto bg-amber-600 text-white border-amber-400 text-[10px] gap-1 shadow-xs">
                <span>🛍️ {vendors.length} Vendors</span>
              </Badge>
            )}
          </div>

          {/* TOP-RIGHT MAP CONTROLS */}
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
            <div className="flex flex-col bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-xl border border-stone-200 dark:border-stone-800 shadow-md overflow-hidden">
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                aria-label="Zoom In"
                className="p-2 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border-b border-stone-100 dark:border-stone-800 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                aria-label="Zoom Out"
                className="p-2 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border-b border-stone-100 dark:border-stone-800 cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={handleRecenter}
                title="Recenter Map"
                aria-label="Recenter Map"
                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <Compass className="h-4 w-4" />
              </button>
            </div>

            {/* Collapsible Crowd Legend */}
            {!showLegend ? (
              <button
                onClick={() => setShowLegend(true)}
                className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-md text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 hover:bg-stone-50 cursor-pointer"
              >
                <Users className="h-3.5 w-3.5 text-emerald-600" />
                <span>Legend</span>
              </button>
            ) : (
              <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl text-xs space-y-2 max-w-[200px] animate-in fade-in-50">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-1.5">
                  <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Map Markers</span>
                  </span>
                  <button
                    onClick={() => setShowLegend(false)}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-0.5 cursor-pointer"
                    aria-label="Collapse Legend"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                      <span className="text-emerald-500 text-xs">🟢</span>
                      <span>High Crowd</span>
                    </div>
                    <span className="text-[10px] text-stone-500">Green</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                      <span className="text-amber-500 text-xs">🟡</span>
                      <span>Medium</span>
                    </div>
                    <span className="text-[10px] text-stone-500">Yellow</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                      <span>🛍️</span>
                      <span>Local Vendor</span>
                    </div>
                    <span className="text-[10px] text-amber-600">Orange</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                      <span>📍</span>
                      <span>My Location</span>
                    </div>
                    <span className="text-[10px] text-blue-600">Blue</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* MOBILE SWIPEABLE BOTTOM SHEET DRAWER                                    */}
          {/* ========================================================================= */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`lg:hidden absolute left-2 right-2 bottom-2 z-20 transition-all duration-300 ease-out shadow-2xl rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 ${
              drawerState === 'hidden'
                ? 'translate-y-[120%] pointer-events-none opacity-0'
                : drawerState === 'collapsed'
                ? 'max-h-[170px] translate-y-0'
                : 'max-h-[85%] translate-y-0'
            }`}
          >
            {/* Drag Handle */}
            <div
              onClick={() =>
                setDrawerState(drawerState === 'collapsed' ? 'expanded' : 'collapsed')
              }
              className="py-2 flex flex-col items-center justify-center cursor-pointer border-b border-stone-100 dark:border-stone-800/80 select-none"
            >
              <div className="w-10 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 mb-1" />
              <div className="flex items-center gap-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <span>{drawerState === 'collapsed' ? 'Swipe Up for Details' : 'Swipe Down to Collapse'}</span>
                {drawerState === 'collapsed' ? (
                  <ChevronUp className="h-3 w-3 text-stone-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-stone-400" />
                )}
              </div>
            </div>

            {/* Mobile Sheet Content */}
            <div className="p-3.5 overflow-y-auto max-h-[calc(80vh-50px)] space-y-3">
              {/* If a vendor is selected */}
              {selectedVendor ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300">
                        {selectedVendor.categoryIcon} {selectedVendor.categoryLabel}
                      </Badge>
                      <h4 className="font-extrabold text-sm text-stone-900 dark:text-white mt-1">
                        {selectedVendor.name}
                      </h4>
                      <p className="text-[11px] text-stone-500">{selectedVendor.villageOrArea}, {selectedVendor.district}</p>
                    </div>
                    <button
                      onClick={() => setSelectedVendor(null)}
                      className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    {selectedVendor.description}
                  </p>

                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Specialties:</span>
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        {selectedVendor.specialties.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Price Range:</span>
                      <span className="font-bold text-stone-900 dark:text-white">{selectedVendor.priceRange}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Hours:</span>
                      <span>{selectedVendor.openingHours}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {selectedVendor.contactPhone && (
                      <a
                        href={`tel:${selectedVendor.contactPhone}`}
                        className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>Call Vendor</span>
                      </a>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleStartDirectionsToVendor(selectedVendor)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 gap-1.5 rounded-xl"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>Get Directions</span>
                    </Button>
                  </div>
                </div>
              ) : displayedDest ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                        <img
                          src={displayedDest.featured_image}
                          alt={displayedDest.name}
                          onError={handleImageError}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-stone-900 dark:text-white truncate">
                          {displayedDest.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                          <span>{displayedDest.district?.name || 'Jharkhand'}</span>
                          {activeCrowdInfo && (
                            <Badge
                              variant="outline"
                              className={`text-[9.5px] py-0 px-1.5 font-bold ${activeCrowdInfo.tagColor}`}
                            >
                              {activeCrowdInfo.level === 'HIGH' ? '🟢' : '🟡'} {activeCrowdInfo.level}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {drawerState === 'collapsed' ? (
                        <Button
                          size="sm"
                          onClick={() => setDrawerState('expanded')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-xl shadow-xs"
                        >
                          Details
                        </Button>
                      ) : (
                        <button
                          onClick={() => setDrawerState('collapsed')}
                          className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          <ChevronDown className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {drawerState === 'expanded' && (
                    <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800 animate-in fade-in-50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {displayedDest.rating} ({displayedDest.review_count} reviews)
                        </span>
                        <Badge variant="emerald" className="text-[10px]">
                          {displayedDest.category?.name || 'Eco Destination'}
                        </Badge>
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {displayedDest.description}
                      </p>

                      {/* Nearby Vendors Section inside mobile drawer */}
                      <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                            <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
                            <span>Local Street Vendors & Stalls ({vendors.length})</span>
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {vendors.slice(0, 4).map((v) => (
                            <button
                              key={v.id}
                              onClick={() => {
                                setSelectedVendor(v);
                                if (mapInstanceRef.current) {
                                  mapInstanceRef.current.flyTo([v.latitude, v.longitude], 14, { duration: 0.8 });
                                }
                              }}
                              className="w-full p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-left flex items-center justify-between text-xs hover:border-amber-400 transition-colors"
                            >
                              <div className="truncate pr-2">
                                <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1 truncate">
                                  <span>{v.categoryIcon}</span>
                                  <span className="truncate">{v.name}</span>
                                </div>
                                <div className="text-[10px] text-stone-500 truncate">{v.villageOrArea}</div>
                              </div>
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 shrink-0">
                                {v.distanceKm !== undefined ? `${v.distanceKm} km` : 'Near'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Road Directions Action */}
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                            <Navigation className="h-3.5 w-3.5 text-blue-600" />
                            <span>Road Directions</span>
                          </span>
                          {activeRouteResult && (
                            <span className="font-mono text-[11px] text-blue-700 dark:text-blue-300 font-bold">
                              {activeRouteResult.distanceKm} km · {activeRouteResult.durationFormatted}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleStartDirectionsWithGps(displayedDest)}
                            disabled={gpsStatus === 'locating'}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 gap-1 rounded-xl shadow-xs"
                          >
                            <LocateFixed className="h-3.5 w-3.5" />
                            <span>{gpsStatus === 'locating' ? 'Locating...' : 'Use My GPS'}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowChooseHub(true)}
                            className="text-xs h-8 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-xl"
                          >
                            Choose Hub
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={() => onSelectDestination(displayedDest.slug)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5"
                      >
                        <span>View Full Destination Guide</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-2 text-xs text-stone-500">
                  Tap any destination or vendor marker on the map to view details.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. DESKTOP SIDE PANEL (Full Details, Vendors & Directions)               */}
        {/* ========================================================================= */}
        <div className="hidden lg:flex flex-col justify-between h-[520px] sm:h-[620px] bg-stone-50/90 dark:bg-stone-950/90 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 overflow-y-auto">
          {/* Selected Vendor Detail View */}
          {selectedVendor ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-amber-600" />
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white">Local Street Vendor</h3>
                  </div>
                  <button
                    onClick={() => setSelectedVendor(null)}
                    className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Close</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300">
                    {selectedVendor.categoryIcon} {selectedVendor.categoryLabel}
                  </Badge>
                  <h4 className="font-extrabold text-base text-stone-900 dark:text-white">
                    {selectedVendor.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span>{selectedVendor.villageOrArea}, {selectedVendor.district}</span>
                    {selectedVendor.distanceKm !== undefined && (
                      <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-900 border-amber-300 font-bold">
                        📍 {selectedVendor.distanceKm} km away
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {selectedVendor.description}
                </p>

                <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Authentic Specialties
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedVendor.specialties.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-[11px] font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Price Range</span>
                      <span className="font-bold text-stone-900 dark:text-white">{selectedVendor.priceRange}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">Timings</span>
                      <span className="text-stone-700 dark:text-stone-300 text-[11px] font-medium">{selectedVendor.openingHours}</span>
                    </div>
                  </div>
                </div>

                {selectedVendor.contactPhone && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-semibold text-emerald-950 dark:text-emerald-200">{selectedVendor.contactPhone}</span>
                    </div>
                    <a
                      href={`tel:${selectedVendor.contactPhone}`}
                      className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold text-[11px] hover:bg-emerald-800 cursor-pointer"
                    >
                      Call
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
                <Button
                  onClick={() => handleStartDirectionsToVendor(selectedVendor)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 shadow-md flex items-center justify-center gap-1.5"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Get Driving Directions to Vendor</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVendor(null)}
                  className="w-full text-xs text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700"
                >
                  Back to All Vendors
                </Button>
              </div>
            </div>
          ) : directionsMode && directionsDestination ? (
            /* Directions Mode View */
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white">Driving Directions</h3>
                  </div>
                  {onClearDirections && (
                    <button
                      onClick={onClearDirections}
                      className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Close</span>
                    </button>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 space-y-3">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20 mt-1 shrink-0" />
                      <div>
                        <span className="text-stone-500 dark:text-stone-400 text-[10px] block uppercase font-bold tracking-wider">
                          {directionsOrigin?.isGps ? 'Your Real GPS Location' : 'Starting Location'}
                        </span>
                        <span className="font-bold text-stone-900 dark:text-white text-sm">
                          {directionsOrigin?.name || 'Your Location'}
                        </span>
                      </div>
                    </div>

                    <div className="ml-1 pl-4 border-l-2 border-dashed border-blue-500/50 py-2 flex flex-col gap-1 text-[11px] text-blue-800 dark:text-blue-300">
                      <div className="flex items-center justify-between font-semibold">
                        <span>↓ Road Route</span>
                        {activeRouteResult?.isLiveRouting && (
                          <span className="text-[9px] bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200">
                            Live Route
                          </span>
                        )}
                      </div>
                      {loadingRoute ? (
                        <span className="text-stone-500 italic">Calculating road travel time…</span>
                      ) : activeRouteResult ? (
                        <div className="space-y-1 pt-1">
                          <div className="text-xs text-stone-800 dark:text-stone-200">
                            <strong>Distance:</strong> {activeRouteResult.distanceKm} km
                          </div>
                          <div className="text-xs text-amber-700 dark:text-amber-300">
                            <strong>Estimated travel time:</strong> {activeRouteResult.durationFormatted}
                          </div>
                        </div>
                      ) : (
                        <span className="text-stone-400">Loading travel estimates...</span>
                      )}
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 mt-1 shrink-0" />
                      <div>
                        <span className="text-stone-500 dark:text-stone-400 text-[10px] block uppercase font-bold tracking-wider">
                          Destination
                        </span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                          {directionsDestination.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRequestUserGpsLocation()}
                    className="flex-1 text-xs border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 gap-1.5"
                  >
                    <LocateFixed className="h-3.5 w-3.5 text-blue-600" />
                    <span>Update with My Location</span>
                  </Button>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-800">
                <Button
                  onClick={() => onSelectDestination(directionsDestination.slug)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>View {directionsDestination.name} Guide</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : activeTab === 'vendors' ? (
            /* Vendors Tab Dedicated View */
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-amber-600" />
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                      Nearby Street Vendors ({vendors.length})
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300">
                    Verified Stalls
                  </Badge>
                </div>

                <p className="text-[11px] text-stone-500">
                  Authentic tribal snacks, handicrafts, and delicacies near {vendorSearchCenter?.label || 'destination'}
                </p>

                {/* Category filter pills */}
                <div className="flex flex-wrap gap-1 pb-1">
                  {VENDOR_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedVendorCategory(cat.id)}
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer ${
                        selectedVendorCategory === cat.id
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      <span>{cat.icon} {cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Vendor List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {loadingVendors ? (
                    <div className="py-8 text-center text-xs text-stone-500">
                      <RefreshCw className="h-4 w-4 animate-spin text-amber-600 mx-auto mb-1" />
                      Discovering authentic local street vendors…
                    </div>
                  ) : vendors.length === 0 ? (
                    <div className="py-6 text-center text-xs text-stone-500">
                      No vendors found for this category.
                    </div>
                  ) : (
                    vendors.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVendor(v);
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.flyTo([v.latitude, v.longitude], 14, { duration: 0.8 });
                          }
                        }}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500/60 transition-all text-left shadow-xs flex items-start justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 text-xs font-bold text-stone-900 dark:text-white">
                            <span>{v.categoryIcon}</span>
                            <span className="truncate">{v.name}</span>
                          </div>
                          <p className="text-[10.5px] text-stone-500 line-clamp-1 mt-0.5">{v.villageOrArea}</p>
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                            {v.specialties.slice(0, 2).join(' • ')}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-[10.5px] font-bold text-amber-700 dark:text-amber-400 block">
                            {v.distanceKm !== undefined ? `${v.distanceKm} km` : ''}
                          </span>
                          <span className="text-[9.5px] text-stone-400">{v.priceRange}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
                <Button
                  onClick={() => setActiveTab('explore')}
                  variant="outline"
                  className="w-full text-xs"
                >
                  Back to Destination Map
                </Button>
              </div>
            </div>
          ) : displayedDest ? (
            /* Standard Destination Detail View */
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="relative h-36 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md">
                  <img
                    src={displayedDest.featured_image}
                    alt={displayedDest.name}
                    onError={handleImageError}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <Badge variant="emerald" className="text-[10px] py-0.5 px-2 bg-emerald-900/90 border-emerald-600 text-emerald-200">
                      {displayedDest.category?.name || 'Eco Destination'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
                    <span className="font-semibold">{displayedDest.district?.name || 'Jharkhand'}</span>
                    <span className="flex items-center gap-1 text-amber-300 font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {displayedDest.rating} ({displayedDest.review_count})
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-white line-clamp-1">
                    {displayedDest.name}
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium line-clamp-1 mt-0.5">
                    {displayedDest.tagline || displayedDest.best_time_to_visit}
                  </p>
                </div>

                {/* Local Street Vendors Quick Access Card */}
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
                      <span>Nearby Street Vendors ({vendors.length})</span>
                    </span>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Authentic tribal crafts, sweets & snacks
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveTab('vendors');
                      setShowVendorsLayer(true);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] h-7 px-2.5 rounded-lg font-bold shadow-xs"
                  >
                    View Vendors
                  </Button>
                </div>

                {activeCrowdInfo && (
                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200">
                        <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Crowd Level:</span>
                      </div>
                      <Badge variant="outline" className={`font-extrabold text-xs px-2.5 py-0.5 ${activeCrowdInfo.tagColor}`}>
                        {activeCrowdInfo.level === 'HIGH' ? '🟢' : '🟡'} {activeCrowdInfo.level}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Desktop Get Directions Actions */}
                <div className="p-3 bg-white dark:bg-stone-900/90 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
                  <span className="font-bold text-stone-800 dark:text-stone-300 flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Get Directions & Travel Time</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleStartDirectionsWithGps(displayedDest)}
                      disabled={gpsStatus === 'locating'}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] gap-1.5 h-8 shadow-sm cursor-pointer"
                    >
                      <LocateFixed className="h-3.5 w-3.5" />
                      <span>Use My Location</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowChooseHub(true)}
                      className="border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 font-medium text-[11px] h-8 cursor-pointer"
                    >
                      Choose Hub
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
                <Button
                  onClick={() => onSelectDestination(displayedDest.slug)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View Full Details & Passes</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-stone-500 space-y-3">
              <div className="h-12 w-12 rounded-full bg-stone-100 dark:bg-stone-900 flex items-center justify-center text-stone-600">
                <MapPin className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-[200px]">
                Click on any destination or vendor marker on the map to explore its coordinates and get directions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: CROWD FILTER SHEET                                             */}
      {/* ========================================================================= */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in-50">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">Filter by Crowd Density</h3>
              </div>
              <button
                onClick={() => setShowFilterSheet(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {(
                [
                  { id: 'ALL', label: 'All Crowd Levels', desc: 'Display all mapped eco destinations' },
                  { id: 'HIGH', label: '🟢 High Crowd', desc: 'Peak destinations with high visitor volume' },
                  { id: 'MEDIUM', label: '🟡 Medium Crowd', desc: 'Comfortable & steady visitor flow' },
                  { id: 'LOW', label: '🟡 Low Crowd', desc: 'Quiet, secluded, and peaceful nature sites' },
                ] as const
              ).map((opt) => {
                const count =
                  opt.id === 'ALL'
                    ? destinations.length
                    : destinations.filter((d) => getCrowdInfo(d.crowd_status).level === opt.id).length;
                const isSelected = crowdFilter === opt.id;

                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setCrowdFilter(opt.id);
                      setShowFilterSheet(false);
                    }}
                    className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 font-normal">
                        {opt.desc}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: DISTRICT SELECTOR                                              */}
      {/* ========================================================================= */}
      {showDistrictSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in-50">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">Filter by District</h3>
              </div>
              <button
                onClick={() => setShowDistrictSheet(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              <button
                onClick={() => {
                  onSelectDistrict('all');
                  setShowDistrictSheet(false);
                }}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
                  selectedDistrict === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                }`}
              >
                All Districts ({destinations.length} sites)
              </button>
              {districts.map((dist) => {
                const count = destinations.filter((d) => d.district_id === dist.id).length;
                return (
                  <button
                    key={dist.id}
                    onClick={() => {
                      onSelectDistrict(dist.id);
                      setShowDistrictSheet(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-medium border flex items-center justify-between transition-all cursor-pointer ${
                      selectedDistrict === dist.id
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                        : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>{dist.name}</span>
                    <span className="text-[10px] opacity-75">{count} sites</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: CHOOSE STARTING TRANSIT HUB                                   */}
      {/* ========================================================================= */}
      {showChooseHub && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in-50">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">Choose Starting Location</h3>
              </div>
              <button
                onClick={() => setShowChooseHub(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto flex-1 pr-1">
              {hubNames.map((hub) => (
                <button
                  key={hub}
                  onClick={() => handleSelectStartingHub(hub)}
                  className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-emerald-600 hover:text-white text-stone-800 dark:text-stone-200 text-xs font-semibold border border-stone-200 dark:border-stone-700 transition-all text-left cursor-pointer"
                >
                  📍 {hub}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
