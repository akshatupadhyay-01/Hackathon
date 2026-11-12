={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Description, Highlights, Guides, & Reviews */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Story */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                About this Destination
              </h2>
              <p className="text-sm md:text-base text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                {destination.description}
              </p>
            </div>

            {/* Ecological Features & Sustainable Guidelines */}
            <Card className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-4">
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span>Responsible Eco-Tourism Guidelines</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-600 dark:text-stone-400">
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 space-y-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    Zero Single-Use Plastic
                  </span>
                  <span>
                    Carry refillable steel or glass water flasks. Forest checkpoints inspect single-use plastics.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 space-y-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    Native Guide Empowerment
                  </span>
                  <span>
                    100% of guide hiring fees directly benefit indigenous Munda, Oraon, and Santhal households.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 space-y-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    Quiet Zone & Wildlife Respect
                  </span>
                  <span>
                    Loud speakers and drone operations are strictly regulated to protect nesting birds and fauna.
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 space-y-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                    Verified Digital Eco-Pass
                  </span>
                  <span>
                    Instant QR generation upon reservation with direct forest ranger desk integration.
                  </span>
                </div>
              </div>
            </Card>

            {/* Verified Local Street Vendors & Stalls Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-amber-600" />
                    <span>Local Street Vendors & Stalls ({nearbyVendors.length})</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Authentic tribal cuisine, sweets, and indigenous handicrafts near {destination.name}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/map?destination=${destination.slug}`)}
                  className="text-xs border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100"
                >
                  View on Map
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nearbyVendors.slice(0, 4).map((vendor) => (
                  <Card
                    key={vendor.id}
                    className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3 bg-white dark:bg-stone-900 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300 font-bold">
                          {vendor.categoryIcon} {vendor.categoryLabel}
                        </Badge>
                        <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100 mt-1">
                          {vendor.name}
                        </h5>
                        <span className="text-[11px] text-stone-500">
                          {vendor.villageOrArea}
                        </span>
                      </div>
                      {vendor.distanceKm !== undefined && (
                        <span className="text-[10.5px] font-bold text-amber-700 dark:text-amber-400 shrink-0">
                          📍 {vendor.distanceKm} km
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                      {vendor.description}
                    </p>

                    <div className="flex flex-wrap gap-1">
                      {vendor.specialties.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-[10px] font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        {vendor.priceRange}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/map?destination=${destination.slug}`)}
                        className="text-xs bg-amber-700 hover:bg-amber-800 text-white h-7 gap-1"
                      >
                        <Navigation className="h-3 w-3" />
                        <span>Locate on Map</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Local Community Guides Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <span>Verified Native Eco-Guides ({guides.length})</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {guides.map((guide) => (
                  <Card
                    key={guide.id}
                    className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3 bg-white dark:bg-stone-900 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                        {guide.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                            {guide.name}
                          </h5>
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                          {guide.badge}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                      {guide.bio}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
                      <span className="font-bold text-stone-900 dark:text-stone-100">
                        ₹{guide.daily_rate_inr} / day
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleOpenBooking(guide)}
                        className="text-xs bg-emerald-700 hover:bg-emerald-800 h-7"
                      >
                        Book With Guide
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Public Tourist Reviews & Review Intelligence Display */}
            <div className="space-y-6 pt-6 border-t border-stone-200 dark:border-stone-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🗣️</span>
                    <h3 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                      Tourist Voice & Public Reviews
                    </h3>
                    <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
                      Approved Only
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Authentic visitor experiences, category-level ratings, and automated review intelligence.
                  </p>
                </div>

                <Button
                  onClick={handleOpenReviewModal}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs sm:text-sm font-bold gap-2 self-start sm:self-auto cursor-pointer shadow-md shrink-0 px-4 py-2 rounded-xl border border-amber-400"
                >
                  <Star className="h-4 w-4 fill-stone-950 text-stone-950" />
                  <span>⭐ Write a Review</span>
                </Button>
              </div>

              {/* Aggregated Score & Sentiment Breakdown Card */}
              {reviewSummary && (
                <Card className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    {/* Left: Overall Rating */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black text-stone-900 dark:text-stone-100">
                          {reviewSummary.overallRating}
                        </span>
                        <span className="text-stone-400 font-bold text-lg">/ 5</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(reviewSummary.overallRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-stone-300 dark:text-stone-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-stone-500 font-medium">
                        Based on {reviewSummary.totalApprovedReviews} approved tourist reviews
                      </span>
                    </div>

                    {/* Middle: Sentiment Ratio Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          🟢 Positive {reviewSummary.positivePercentage}%
                        </span>
                        <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          🟡 Neutral {reviewSummary.neutralPercentage}%
                        </span>
                        <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1">
                          🔴 Critical {reviewSummary.negativePercentage}%
                        </span>
                      </div>
                      <div className="h-3 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden flex shadow-inner">
                        <div
                          style={{ width: `${reviewSummary.positivePercentage}%` }}
                          className="bg-emerald-600 h-full transition-all"
                          title={`Positive: ${reviewSummary.positivePercentage}%`}
                        />
                        <div
                          style={{ width: `${reviewSummary.neutralPercentage}%` }}
                          className="bg-amber-500 h-full transition-all"
                          title={`Neutral: ${reviewSummary.neutralPercentage}%`}
                        />
                        <div
                          style={{ width: `${reviewSummary.negativePercentage}%` }}
                          className="bg-rose-500 h-full transition-all"
                          title={`Negative: ${reviewSummary.negativePercentage}%`}
                        />
                      </div>
                      <p className="text-[10px] text-stone-400 leading-tight">
                        Sentiment classified via automated NLP keyword and rating analysis.
                      </p>
                    </div>

                    {/* Right: Tourist Experience Score */}
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-center space-y-1">
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                        Tourist Experience Score
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                        {reviewSummary.touristExperienceScore}
                        <span className="text-xs font-bold text-emerald-600/80"> / 100</span>
                      </div>
                      <p className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80">
                        Deterministic composite of star rating, positive ratio & tag satisfaction
                      </p>
                    </div>
                  </div>

                  {/* Category Level Feedback Bars */}
                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-3">
                    <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block">
                      Category Insights & Experience Health:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {ALL_REVIEW_TAGS.slice(0, 5).map((tag) => {
                        const feedback = reviewSummary.categoryFeedback[tag] || { positiveRatio: 0.88, count: 5 };
                        const pct = Math.round(feedback.positiveRatio * 100);
                        return (
                          <div
                            key={tag}
                            className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-800 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-stone-700 dark:text-stone-300 truncate">
                                {tag}
                              </span>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                {pct}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className="bg-emerald-600 h-full rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              )}

              {/* Review Filters & Tag Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-bold text-stone-500 dark:text-stone-400 mr-1">Filter:</span>
                  <button
                    onClick={() => setReviewFilterRating('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      reviewFilterRating === 'all'
                        ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    All Ratings
                  </button>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => setReviewFilterRating(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        reviewFilterRating === r
                          ? 'bg-amber-500 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      <span>{r}</span>
                      <Star className="h-3 w-3 fill-current" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <select
                    value={reviewFilterTag}
                    onChange={(e) => setReviewFilterTag(e.target.value)}
                    className="bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Category Tags</option>
                    {ALL_REVIEW_TAGS.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* List of Approved Reviews */}
              {(() => {
                const approvedList = (reviewSummary?.recentReviews || []).filter((rev) => {
                  const matchRating = reviewFilterRating === 'all' || rev.rating === reviewFilterRating;
                  const matchTag = reviewFilterTag === 'all' || rev.tags.includes(reviewFilterTag as ReviewTag);
                  return matchRating && matchTag;
                });

                if (approvedList.length === 0) {
                  return (
                    <Card className="p-8 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-xl">
                        ✍️
                      </div>
                      <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">
                        No reviews match your selected filter
                      </h4>
                      <p className="text-xs text-stone-500 max-w-md mx-auto">
                        Be the first to share your firsthand experience visiting {destination.name}!
                      </p>
                      <Button
                        size="sm"
                        onClick={handleOpenReviewModal}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                      >
                        Share Your Experience
                      </Button>
                    </Card>
                  );
                }

                return (
                  <div className="space-y-3.5">
                    {approvedList.map((rev) => (
                      <Card
                        key={rev.id}
                        className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                              {rev.author_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-sm text-stone-900 dark:text-stone-100 block">
                                {rev.author_name}
                              </span>
                              <span className="text-[11px] text-stone-400">
                                {rev.visit_date ? `Visited ${rev.visit_date}` : 'Verified Traveler'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                rev.sentiment === 'POSITIVE'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                  : rev.sentiment === 'NEUTRAL'
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              }`}
                            >
                              {rev.sentiment === 'POSITIVE'
                                ? '🟢 Positive'
                                : rev.sentiment === 'NEUTRAL'
                                ? '🟡 Mixed'
                                : '🔴 Critical Issue'}
                            </Badge>

                            <div className="flex items-center gap-0.5 text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          "{rev.comment}"
                        </p>

                        {/* Category Tags */}
                        {rev.tags && rev.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {rev.tags.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-700"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right Column: Sticky Booking & Road Travel Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-5">
              <Card className="p-6 rounded-3xl border-2 border-emerald-600/30 shadow-xl bg-white dark:bg-stone-900 space-y-5">
                <div className="space-y-1">
                  <span className="text-xs text-stone-500 font-medium uppercase tracking-wider">
                    Digital Eco-Pass & Entry
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-stone-900 dark:text-stone-100">
                      {destination.entry_fee_inr === 0 ? 'Free' : `₹${destination.entry_fee_inr}`}
                    </span>
                    <span className="text-xs text-stone-500">per traveler</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500">Crowd Level:</span>
                    <Badge variant="emerald">{crowdLabels[destination.crowd_status]}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500">Plastic Policy:</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Strictly Prohibited
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500">Native Guide Support:</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      Gram Panchayat Certified
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handleOpenBooking(null)}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md"
                >
                  Book Digital Eco-Pass
                </Button>

                <p className="text-[11px] text-center text-stone-500">
                  Instant QR Confirmation • Supports local tribal self-help groups
                </p>
              </Card>

              {/* Road Directions & Travel Time Card */}
              <Card className="p-4 rounded-2xl bg-white dark:bg-stone-900 text-stone-900 dark:text-white space-y-3 border border-stone-200 dark:border-stone-800 shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold">
                      <Car className="h-3.5 w-3.5" />
                      <span>Road Travel & Directions</span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 font-medium">
                      {routeResult ? `${routeResult.durationFormatted} (${routeResult.distanceKm} km from ${originCoords?.name || 'Your Location'})` : 'Calculate road travel'}
                    </p>
                  </div>
                  {routeResult?.isLiveRouting && (
                    <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-[10px] py-0.5">
                      Live Route
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleOpenDirectionsModal}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1 shadow-sm"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Get Directions</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/map?destination=${destination.slug}`)}
                    className="text-xs text-stone-700 dark:text-white border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    View on Map
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Road Directions Dialog Modal */}
      <Dialog open={directionsModalOpen} onOpenChange={setDirectionsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onClose={() => setDirectionsModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
              <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Get Directions to {destination.name}</span>
            </DialogTitle>
            <DialogDescription>
              Calculate real road distance and estimated driving time from your GPS location or starting city.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Origin Input & GPS Location Action */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-stone-700 dark:text-stone-300 font-bold text-xs">
                  Starting Location / Origin
                </label>
                <button
                  type="button"
                  onClick={handleUseGpsLocation}
                  disabled={gpsStatus === 'locating'}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <LocateFixed className={`h-3.5 w-3.5 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
                  <span>{gpsStatus === 'locating' ? 'Finding your location…' : 'Use My Location'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  value={originInput}
                  onChange={(e) => {
                    setOriginInput(e.target.value);
                    setGpsStatus('idle');
                    setGpsErrorMessage(null);
                  }}
                  placeholder="Enter starting city (e.g. Ranchi, Jamshedpur, Deoghar)"
                  className="h-10 text-xs"
                />
                <Button
                  type="button"
                  onClick={() => handleCalculateDirections()}
                  disabled={calculatingRoute}
                  className="shrink-0 h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  {calculatingRoute ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Calculate'}
                </Button>
              </div>

              {/* Status & Feedback Messages */}
              {gpsStatus === 'locating' && (
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-200 flex items-center gap-2 text-[11px]">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600 shrink-0" />
                  <span>Finding your location…</span>
                </div>
              )}

              {gpsStatus === 'granted' && (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Your location found</span>
                </div>
              )}

              {(gpsStatus === 'denied' || gpsStatus === 'timeout') && gpsErrorMessage && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200 space-y-2 text-[11px]">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{gpsErrorMessage}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUseGpsLocation}
                      className="h-6 text-[10px] px-2 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 hover:bg-rose-100"
                    >
                      Try Again
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setOriginInput('Ranchi');
                        const resolved = resolveLocationCoords('Ranchi');
                        setOriginCoords(resolved);
                        handleCalculateDirections(resolved);
                        setGpsStatus('idle');
                        setGpsErrorMessage(null);
                      }}
                      className="text-[10px] text-stone-600 dark:text-stone-300 underline font-medium hover:text-stone-900"
                    >
                      Choose Starting Location (e.g. Ranchi)
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Hub Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-stone-500">Popular Hubs:</span>
                {['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh'].map((hub) => (
                  <button
                    key={hub}
                    type="button"
                    onClick={() => {
                      setOriginInput(hub);
                      setGpsStatus('idle');
                      setGpsErrorMessage(null);
                      const resolved = resolveLocationCoords(hub);
                      setOriginCoords(resolved);
                      handleCalculateDirections(resolved);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                      originInput.toLowerCase() === hub.toLowerCase()
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-400'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {hub}
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Journey Summary Card with Exact Flow Display */}
            {routeResult && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-stone-900 text-white space-y-3 shadow-md border border-blue-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300">
                    🛣️ Road Journey Summary
                  </span>
                  <Badge variant="outline" className="text-xs text-blue-200 border-blue-600 font-mono">
                    {routeResult.isLiveRouting ? 'Live Routing' : 'Regional Road Network'}
                  </Badge>
                </div>

                {/* Flow Display */}
                <div className="space-y-1.5 p-3 rounded-xl bg-black/40 border border-white/10 text-xs">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    <span>{originCoords?.name || originInput}</span>
                  </div>
                  <div className="pl-3 border-l-2 border-dashed border-blue-500/60 py-1 text-[11px] text-blue-300">
                    <span>↓ Road Route ({routeResult.distanceKm} km • {routeResult.durationFormatted})</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>{destination.name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-stone-400 block uppercase font-semibold">Distance</span>
                    <span className="text-lg font-black text-white">{routeResult.distanceKm} km</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                    <span className="text-[10px] text-stone-400 block uppercase font-semibold">Estimated Travel Time</span>
                    <span className="text-lg font-black text-amber-300">{routeResult.durationFormatted}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Route Highlights / Steps */}
            {routeResult?.steps && routeResult.steps.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="font-bold text-stone-700 dark:text-stone-300 block text-xs">
                  Route Highlights & Highway Segments:
                </span>
                <div className="space-y-1 text-stone-600 dark:text-stone-400 max-h-32 overflow-y-auto pr-1">
                  {routeResult.steps.map((step, idx) => (
                    <div key={idx} className="p-2 bg-stone-50 dark:bg-stone-800/60 rounded-lg border border-stone-200 dark:border-stone-800 flex items-start gap-2 text-[11px]">
                      <span className="text-blue-600 dark:text-blue-400 font-bold shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDirectionsModalOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleNavigateOnMap}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs gap-1.5 shadow-md"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Open Road Navigation on Map</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking & Eco-Pass Dialog Modal */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className={confirmedPass ? "max-w-xl max-h-[90vh] overflow-y-auto" : "max-w-md"} onClose={() => setBookingModalOpen(false)}>
          {confirmedPass ? (
            <div className="py-2">
              <DialogHeader className="sr-only">
                <DialogTitle>Digital Eco-Pass Confirmed</DialogTitle>
                <DialogDescription>Your travel permit is confirmed.</DialogDescription>
              </DialogHeader>

              <DigitalEcoPass
                bookingId={confirmedPass.bookingId}
                destination={destination}
                visitorName={confirmedPass.visitorName}
                numberOfGuests={confirmedPass.numberOfGuests}
                visitDate={confirmedPass.visitDate}
                guide={confirmedPass.guide}
                totalAmountInr={confirmedPass.totalAmountInr}
                status={confirmedPass.status}
                onClose={() => {
                  setBookingModalOpen(false);
                  setConfirmedPass(null);
                }}
              />
            </div>
          ) : (
            <form onSubmit={handleBookingSubmit}>
              <DialogHeader>
                <DialogTitle>Generate Digital Eco-Pass</DialogTitle>
                <DialogDescription>
                  {destination.name} • {destination.district?.name} District
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3 text-xs">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Primary Visitor Name
                  </label>
                  <Input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    required
                    placeholder="Enter full name (e.g. Akshat Kumar)"
                    className="h-10 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Date of Visit
                  </label>
                  <Input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                    className="h-10 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 font-semibold mb-1">
                    Number of Guests
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseInt(guestInput, 10) || 1;
                        const next = Math.max(1, cur - 1);
                        setGuestInput(next.toString());
                        if (guestError) setGuestError(null);
                      }}
                      aria-label="Decrease guests"
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 cursor-pointer shrink-0 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="relative flex-1">
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        value={guestInput}
                        onChange={(e) => {
                          setGuestInput(e.target.value);
                          if (guestError) setGuestError(null);
                        }}
                        onBlur={() => {
                          const parsed = parseInt(guestInput.trim(), 10);
                          if (!guestInput.trim() || isNaN(parsed) || parsed < 1) {
                            setGuestInput('1');
                          } else if (parsed > 50) {
                            setGuestInput('50');
                          } else {
                            setGuestInput(parsed.toString());
                          }
                          if (guestError) setGuestError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const parsed = parseInt(guestInput.trim(), 10);
                            if (!guestInput.trim() || isNaN(parsed) || parsed < 1) {
                              setGuestInput('1');
                            } else if (parsed > 50) {
                              setGuestInput('50');
                            } else {
                              setGuestInput(parsed.toString());
                            }
                            if (guestError) setGuestError(null);
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        placeholder="Enter number of guests (e.g. 1)"
                        className={`h-10 text-xs text-center font-semibold ${guestError ? 'border-rose-500 ring-rose-500' : ''}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseInt(guestInput, 10) || 1;
                        const next = Math.min(50, cur + 1);
                        setGuestInput(next.toString());
                        if (guestError) setGuestError(null);
                      }}
                      aria-label="Increase guests"
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 cursor-pointer shrink-0 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {guestError && (
                    <p className="text-xs text-rose-500 font-medium mt-1 animate-in fade-in-50">
                      {guestError}
                    </p>
                  )}
                </div>

                {selectedGuide && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                        Guide: {selectedGuide.name}
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        {selectedGuide.badge}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">
                      ₹{selectedGuide.daily_rate_inr}
                    </span>
                  </div>
                )}

                {(() => {
                  const parsedGuestsForCalc = parseInt(guestInput.trim(), 10);
                  const displayGuestCount =
                    !isNaN(parsedGuestsForCalc) && parsedGuestsForCalc > 0 ? parsedGuestsForCalc : 0;

                  return (
                    <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl space-y-1">
                      <div className="flex justify-between text-stone-600 dark:text-stone-400">
                        <span>Entry Fee ({displayGuestCount}x):</span>
                        <span>₹{destination.entry_fee_inr * displayGuestCount}</span>
                      </div>
                      {selectedGuide && (
                        <div className="flex justify-between text-stone-600 dark:text-stone-400">
                          <span>Guide Fee:</span>
                          <span>₹{selectedGuide.daily_rate_inr}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-stone-900 dark:text-stone-100 pt-1 border-t border-stone-200 dark:border-stone-700 text-sm">
                        <span>Total Amount:</span>
                        <span className="text-emerald-700 dark:text-emerald-400">
                          ₹{destination.entry_fee_inr * displayGuestCount + (selectedGuide?.daily_rate_inr || 0)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBookingModalOpen(false)}
                  disabled={bookingSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-800 font-bold"
                >
                  {bookingSubmitting ? 'Confirming...' : 'Confirm Reservation'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {/* Write a Review Dialog Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          onClose={() => setReviewModalOpen(false)}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
              <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
              <span>Write a Review — {destination.name}</span>
            </DialogTitle>
            <DialogDescription>
              Share your firsthand experience for {destination.name} ({destination.district?.name || 'Jharkhand'} District).
            </DialogDescription>
          </DialogHeader>

          {reviewSuccessMessage ? (
            <div className="py-6 space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-2xl font-bold">
                ✓
              </div>
              <div className="space-y-2">
                <h4 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                  Thanks for sharing your experience!
                </h4>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
                  Your review has been submitted for verification.
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
                  <span>⏳</span>
                  <span>Review Status: Pending</span>
                </div>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-stone-800/80 rounded-xl text-[11px] text-stone-500 max-w-xs mx-auto border border-stone-200 dark:border-stone-700">
                Destination: <strong className="text-stone-800 dark:text-stone-200">{destination.name}</strong> • Once approved by team moderation, your review will be published.
              </div>
              <Button
                onClick={() => setReviewModalOpen(false)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4 py-2 text-xs">
              {/* Star Rating Picker */}
              <div className="space-y-1.5">
                <label className="block text-stone-700 dark:text-stone-300 font-bold text-xs">
                  Star Rating (1–5) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHoverRating(star)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                        aria-label={`${star} star`}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= (reviewHoverRating || reviewRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300 dark:text-stone-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    {(reviewHoverRating || reviewRating) === 5
                      ? '5 ★ (Exceptional)'
                      : (reviewHoverRating || reviewRating) === 4
                      ? '4 ★ (Very Good)'
                      : (reviewHoverRating || reviewRating) === 3
                      ? '3 ★ (Average)'
                      : (reviewHoverRating || reviewRating) === 2
                      ? '2 ★ (Poor)'
                      : '1 ★ (Very Poor)'}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div className="space-y-1">
                <label className="block text-stone-700 dark:text-stone-300 font-bold text-xs">
                  Review Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about your visit, nature trail, guide helpfulness, approach roads, cleanliness, local food, or safety..."
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-3 text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category / Experience Aspect (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-stone-700 dark:text-stone-300 font-bold text-xs">
                  Category / Experience Tags <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_REVIEW_TAGS.map((tag) => {
                    const isSelected = reviewSelectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleReviewTag(tag)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Author Name and Visit Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-stone-700 dark:text-stone-300 font-bold text-xs">
                    Your Name / Pseudonym <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <Input
                    type="text"
                    value={reviewAuthorName}
                    onChange={(e) => setReviewAuthorName(e.target.value)}
                    placeholder="e.g. Priya S."
                    className="h-10 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-stone-700 dark:text-stone-300 font-bold text-xs">
                    Visit Date <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <Input
                    type="date"
                    value={reviewVisitDate}
                    onChange={(e) => setReviewVisitDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              {/* Privacy Safe Callout */}
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-[11px] text-stone-500 space-y-1">
                <p className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Privacy-Safe & Verified Process</span>
                </p>
                <p>
                  Review will be saved against <strong>{destination.name}</strong>. Reviews undergo automated verification and moderation before appearing publicly.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReviewModalOpen(false)}
                  disabled={reviewSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={reviewSubmitting || !reviewComment.trim()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
