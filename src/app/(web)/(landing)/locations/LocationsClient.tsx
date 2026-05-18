'use client';

import { useState, useMemo, useEffect } from 'react';
import { getAllLocations } from '@/lib/landing-pages/locations';
import { getFlagColors } from '@/lib/flags';
import { getCountryRegion, getRegionLabel } from '@/lib/region-mapping';
import LocationFlagThumbnail from '@/components/landing/LocationFlagThumbnail';
import WorldRegionMap, { WorldRegion, ALL_MAP_COUNTRY_NAMES } from '@/components/landing/WorldRegionMap';
import { Search, X, List, Grid, Layers } from 'lucide-react';

type SortOption = 'name-asc' | 'name-desc' | 'city-asc' | 'city-desc';
type ViewMode = 'list' | 'details' | 'categories';

const ITEMS_PER_PAGE = 50;

export default function LocationsClient() {
  const [selectedRegion, setSelectedRegion] = useState<WorldRegion>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUserInteraction, setIsUserInteraction] = useState(false);
  const [pageStatuses, setPageStatuses] = useState<Record<string, { enabled: boolean }>>({});

  // Load SEO page statuses (enabled/disabled) for locations
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/seo-pages', { cache: 'no-store', headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.ok && data?.settings?.pageStatuses) {
          setPageStatuses(data.settings.pageStatuses as Record<string, { enabled: boolean }>);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const handleRegionSelect = (region: WorldRegion) => {
    // Hierarchical toggling:
    // - Click region to enter region view
    // - Click same region again (with no country selected) to return to All
    if (region === null) {
      setSelectedRegion(null);
      setSelectedCountry(null);
      return;
    }
    if (selectedRegion === region && selectedCountry === null) {
      setSelectedRegion(null);
      setSelectedCountry(null);
      return;
    }
    setSelectedRegion(region);
    setSelectedCountry(null);
  };

  const handleCountrySelect = (country: string | null) => {
    // Hierarchical toggling:
    // - If no region selected, clicking a country sets its region (no country filter yet)
    // - If different region selected, switch to that region (no country filter yet)
    // - If same region and no country selected, set the country
    // - If same region and same country selected, clear country (back to region)
    if (!country) return;
    const region = getCountryRegion(country);
    if (!selectedRegion) {
      setSelectedRegion(region);
      setSelectedCountry(null);
      return;
    }
    if (selectedRegion !== region) {
      setSelectedRegion(region);
      setSelectedCountry(null);
      return;
    }
    if (!selectedCountry) {
      setSelectedCountry(country);
      return;
    }
    if (selectedCountry === country) {
      setSelectedCountry(null);
      return;
    }
    setSelectedCountry(country);
  };
  
  const allLocations = useMemo(() => {
    return getAllLocations().map(loc => ({
      ...loc,
      region: getCountryRegion(loc.country)
    }));
  }, []);

  // Only use enabled locations (default enabled unless explicitly disabled)
  const enabledLocations = useMemo(() => {
    return allLocations.filter(loc => (pageStatuses[`location-${loc.slug}`]?.enabled ?? true));
  }, [allLocations, pageStatuses]);

  // Countries with no enabled locations should be disabled on the map
  const disabledCountries = useMemo(() => {
    const enabledCountries = new Set(enabledLocations.map(l => l.country));
    return ALL_MAP_COUNTRY_NAMES.filter(name => !enabledCountries.has(name));
  }, [enabledLocations]);
  
  // Filter locations based on search, region, and country
  const filteredLocations = useMemo(() => {
    let results = enabledLocations;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(loc =>
        loc.name.toLowerCase().includes(query) ||
        loc.city.toLowerCase().includes(query) ||
        loc.country.toLowerCase().includes(query) ||
        (loc.localContext && loc.localContext.toLowerCase().includes(query)) ||
        loc.popularIndustries.some(ind => ind.toLowerCase().includes(query))
      );
    }

    // Region/Country filter (from map interaction)
    if (selectedCountry) {
      results = results.filter(loc => loc.country === selectedCountry);
    } else if (selectedRegion) {
      results = results.filter(loc => loc.region === selectedRegion);
    }

    // Sort
    results = [...results].sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'city-asc') return (a.city || '').localeCompare(b.city || '');
      if (sortBy === 'city-desc') return (b.city || '').localeCompare(a.city || '');
      return 0;
    });

    return results;
  }, [enabledLocations, searchQuery, selectedRegion, selectedCountry, sortBy]);

  // Auto-select region/country based on search results (seamless map integration)
  useEffect(() => {
    if (!searchQuery || isUserInteraction) {
      // No search or user manually interacted with map: don't auto-select
      return;
    }

    const uniqueRegions = new Set(filteredLocations.map(l => l.region));
    const uniqueCountries = new Set(filteredLocations.map(l => l.country));

    if (uniqueCountries.size === 1) {
      // All results in one country: select it (triggers dimming)
      const country = Array.from(uniqueCountries)[0];
      setSelectedCountry(country);
      setSelectedRegion(getCountryRegion(country));
    } else if (uniqueRegions.size === 1) {
      // All results in one region: select it (triggers dimming)
      setSelectedRegion(Array.from(uniqueRegions)[0]);
      setSelectedCountry(null);
    } else {
      // Multiple regions: clear selections (no dimming)
      setSelectedRegion(null);
      setSelectedCountry(null);
    }
  }, [searchQuery, filteredLocations, isUserInteraction]);

  // Group by region for categories view
  const groupedLocations = useMemo(() => {
    let filtered = filteredLocations;
    
    // Group by region (already sorted by filteredLocations)
    const groups: Record<string, typeof filteredLocations> = {};
    const regionOrder: Exclude<WorldRegion, null>[] = [
      'north-america',
      'south-america',
      'europe',
      'africa',
      'middle-east',
      'asia',
      'oceania'
    ];

    filtered.forEach(loc => {
      const region = loc.region || 'other';
      if (!groups[region]) {
        groups[region] = [];
      }
      groups[region].push(loc);
    });

    // Return in order
    return regionOrder
      .filter(region => groups[region] && groups[region].length > 0)
      .map(region => ({
        region,
        label: getRegionLabel(region),
        locations: groups[region]
      }));
  }, [filteredLocations]);

  // Pagination for list/details views
  const totalPages = Math.ceil(filteredLocations.length / ITEMS_PER_PAGE);
  const paginatedLocations = useMemo(() => {
    if (viewMode === 'categories') return filteredLocations;

    return filteredLocations.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredLocations, currentPage, viewMode]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    setIsUserInteraction(false); // Allow auto-selection
  };

  const handleRegionSelectWithFlag = (region: WorldRegion) => {
    setIsUserInteraction(true); // User manually clicked map
    handleRegionSelect(region);
  };

  const handleCountrySelectWithFlag = (country: string | null) => {
    setIsUserInteraction(true); // User manually clicked map
    handleCountrySelect(country);
  };
  
  const renderLocationCard = (loc: typeof filteredLocations[number], mode: ViewMode) => {
    const flagColors = getFlagColors(loc.country);

    if (mode === 'list') {
      return (
        <li key={loc.slug}>
          <a
            className="flex items-center gap-4 p-4 rounded-lg border hover:border-[var(--primary)] transition-colors group"
            href={`/locations/${loc.slug}`}
          >
            <div className="flex-shrink-0">
              <LocationFlagThumbnail colors={flagColors} size={60} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold group-hover:text-[var(--primary)] transition-colors truncate">
                {loc.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {loc.country}
              </div>
            </div>
            <div className="text-[var(--primary)] text-sm font-medium group-hover:translate-x-1 transition-transform flex-shrink-0">
              →
            </div>
          </a>
        </li>
      );
    }

    return (
      <li key={loc.slug}>
        <a
          className="flex gap-4 rounded-lg border p-4 hover:border-[var(--primary)] transition-all group h-full"
          href={`/locations/${loc.slug}`}
        >
          <div className="flex-shrink-0">
            <LocationFlagThumbnail colors={flagColors} size={80} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base mb-1 group-hover:text-[var(--primary)] transition-colors">
              {loc.name}
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              {loc.country}
            </div>
            {loc.localContext ? (
              <div className="text-xs text-muted-foreground line-clamp-2">
                {loc.localContext}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground line-clamp-2">
                {loc.popularIndustries.slice(0, 2).join(', ').replace(/-/g, ' ')}
              </div>
            )}
          </div>
        </a>
      </li>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6 text-muted-foreground">
        <a href="/" className="hover:text-foreground">
          Home
        </a>{' '}
        {' / '}
        <span className="text-foreground">Locations</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Locations</h1>
        <p className="text-muted-foreground">
          Explore city-focused landing pages with local context and popular industries.
        </p>
      </div>

      {/* Interactive World Map */}
      <div className="mb-6 glass-pane rounded-xl border p-6">
        <h2 className="text-xl font-semibold mb-4">Select a Region</h2>
        <WorldRegionMap 
          selectedRegion={selectedRegion}
          selectedCountry={selectedCountry}
          onRegionSelect={handleRegionSelectWithFlag}
          onCountrySelect={handleCountrySelectWithFlag}
          disabledCountries={disabledCountries}
        />
      </div>

      {/* Control Bar */}
      <div className="mb-6 space-y-4">
        {/* Search & Controls Row */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort & View Controls */}
          <div className="flex gap-2 items-center flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="city-asc">City A-Z</option>
              <option value="city-desc">City Z-A</option>
            </select>

            <div className="flex gap-1 border rounded-lg p-1 bg-background">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('details')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'details' ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
                title="Details view"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('categories')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'categories' ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
                title="Categories view"
              >
                <Layers className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          {searchQuery && (
            <span>Search results: </span>
          )}
          Showing {viewMode === 'categories' ? filteredLocations.length : paginatedLocations.length} of {filteredLocations.length} locations
          {selectedRegion && ` in ${getRegionLabel(selectedRegion)}`}
          {selectedCountry && ` (${selectedCountry})`}
        </div>
      </div>

      {/* Results */}
      {filteredLocations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No locations found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : viewMode === 'categories' ? (
        <div className="space-y-12">
          {groupedLocations.map(group => (
            <section key={group.region || 'other'}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="h-1 w-12 bg-[var(--primary)] rounded-full"></span>
                {group.label}
                <span className="text-sm font-normal text-muted-foreground">
                  ({group.locations.length})
                </span>
              </h2>
              
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.locations.map((loc) => renderLocationCard(loc, 'details'))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <>
          <ul className={
            viewMode === 'list'
              ? 'space-y-3'
              : 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4'
          }>
            {paginatedLocations.map((loc) => renderLocationCard(loc, viewMode))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-4 py-2 rounded-lg border bg-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
              >
                Previous
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 rounded-lg border transition-colors ${
                        currentPage === pageNum
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                          : 'bg-background hover:bg-accent'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-4 py-2 rounded-lg border bg-background disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
