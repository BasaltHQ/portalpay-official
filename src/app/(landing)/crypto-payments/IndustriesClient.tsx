'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getAllIndustries } from '@/lib/landing-pages/industries';
import { IndustryLandingData } from '@/lib/landing-pages/types';
import { Search, X, List, Grid, Layers } from 'lucide-react';

// Category mapping based on industry bundles
const CATEGORY_MAPPING: Record<string, string[]> = {
  'all': [],
  'hospitality-retail': [
    'restaurants', 'hotels', 'cafes', 'bars', 'retail', 'bakeries', 
    'salons', 'gyms', 'food-trucks'
  ],
  'blue-collar': [
    'plumbing-services', 'hvac-services', 'electrical-contractors', 
    'roofing-contractors', 'landscaping-services', 'general-contractors',
    'carpentry', 'painters', 'pest-control', 'locksmiths', 
    'appliance-repair', 'cleaning-services'
  ],
  'high-risk': [
    'cannabis-dispensaries', 'liquor-stores', 'vape-tobacco-shops', 
    'adult-entertainment', 'casinos-gambling', 'firearms-gun-shops',
    'cbd-hemp-products', 'kratom-sellers', 'supplements-nutraceuticals',
    'payday-loans', 'check-cashing-money-services', 'bail-bonds',
    'debt-collection', 'credit-repair', 'ticket-brokers', 'travel-agencies',
    'fantasy-sports', 'timeshares', 'high-ticket-coaching', 'online-gaming'
  ],
  'transportation': [
    'food-trucks', 'boda-boda-operators', 'matatu-operators', 
    'tuk-tuk-operators', 'small-ferry-operators'
  ],
  'professional': [
    'freelancers', 'ecommerce', 'medical', 'auto-repair', 'veterinarians'
  ],
  'informal-economy': [
    'kirana-stores', 'sari-sari-stores', 'street-food-vendors', 
    'market-stall-vendors', 'water-kiosk-operators', 'community-tailors',
    'fisherfolk-cooperatives', 'smallholder-farmers', 'street-musicians',
    'community-pharmacies', 'hardware-shops', 'street-barbers', 
    'waste-pickers', 'butcher-shops', 'mobile-money-agents',
    'mobile-phone-repair', 'community-radio-stations', 'micro-grid-operators',
    'internet-cafes', 'artisan-potters', 'village-savings-groups'
  ],
  'luxury-investment': [
    'real-estate', 'venture-capital', 'investment-funds', 'private-equity',
    'luxury-real-estate', 'aircraft-sales', 'yacht-brokers', 'art-galleries',
    'rare-collectibles', 'jewelry-diamonds'
  ],
  'edgy': [
    'lube-manufacturers', 'adult-novelty-retailers', 'tattoo-piercing-studios', 'nightclubs'
  ],
  'unique': ['cryptid-tour-operators']
};

const CATEGORY_LABELS: Record<string, string> = {
  'all': 'All Industries',
  'hospitality-retail': 'Hospitality & Retail',
  'blue-collar': 'Blue-Collar Services',
  'high-risk': 'High-Risk',
  'transportation': 'Transportation',
  'professional': 'Professional Services',
  'informal-economy': 'Informal Economy',
  'luxury-investment': 'Luxury & Investment',
  'edgy': 'Edgy',
  'unique': 'Unique'
};

type SortOption = 'name-asc' | 'name-desc' | 'volume-desc';
type ViewMode = 'list' | 'details' | 'categories';

const ITEMS_PER_PAGE = 50;

export default function IndustriesClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageStatuses, setPageStatuses] = useState<Record<string, { enabled: boolean }>>({});

  // Load SEO page statuses to filter enabled pages only
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

  const allIndustries = useMemo(() => getAllIndustries(), []);

  // Filtering and sorting logic
  const filteredAndSorted = useMemo(() => {
    let results = allIndustries.filter(ind => (pageStatuses[`industry-${ind.slug}`]?.enabled ?? true));

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(ind =>
        ind.name.toLowerCase().includes(query) ||
        ind.heroSubheadline.toLowerCase().includes(query) ||
        ind.keywords.some(k => k.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      const categoryIds = CATEGORY_MAPPING[selectedCategory] || [];
      results = results.filter(ind => categoryIds.includes(ind.slug));
    }

    // Sort
    results = [...results].sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'volume-desc') return (b.avgMonthlyVolume || 0) - (a.avgMonthlyVolume || 0);
      return 0;
    });

    return results;
  }, [allIndustries, pageStatuses, searchQuery, selectedCategory, sortBy]);

  // Group by category for categories view
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, IndustryLandingData[]> = {};
    
    Object.entries(CATEGORY_MAPPING).forEach(([category, slugs]) => {
      if (category === 'all') return;
      
      const categoryIndustries = filteredAndSorted.filter(ind => 
        slugs.includes(ind.slug)
      );
      
      if (categoryIndustries.length > 0) {
        groups[category] = categoryIndustries;
      }
    });
    
    return groups;
  }, [filteredAndSorted]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedResults = useMemo(() => {
    if (viewMode === 'categories') return filteredAndSorted;
    
    return filteredAndSorted.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredAndSorted, currentPage, viewMode]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const renderIndustryCard = (industry: IndustryLandingData, mode: ViewMode) => {
    if (mode === 'list') {
      return (
        <Link
          key={industry.slug}
          href={`/crypto-payments/${industry.slug}`}
          className="flex items-center gap-4 p-4 rounded-lg border hover:border-[var(--primary)] transition-colors group"
        >
          <div className="text-2xl flex-shrink-0">{industry.icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold group-hover:text-[var(--primary)] transition-colors truncate">
              {industry.name}
            </h3>
          </div>
          <div className="text-[var(--primary)] text-sm font-medium group-hover:translate-x-1 transition-transform flex-shrink-0">
            →
          </div>
        </Link>
      );
    }

    return (
      <Link
        key={industry.slug}
        href={`/crypto-payments/${industry.slug}`}
        className="glass-pane rounded-xl border p-6 hover:border-[var(--primary)] transition-colors group"
      >
        <div className="text-3xl mb-3">{industry.icon}</div>
        <h3 className="text-xl font-semibold mb-2">{industry.name}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {industry.heroSubheadline}
        </p>
        <div className="flex items-center text-[var(--primary)] text-sm font-medium group-hover:translate-x-1 transition-transform">
          Learn more →
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="space-y-4">
        {/* Search & Controls Row */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search industries..."
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
              <option value="volume-desc">Volume High-Low</option>
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

        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === key
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'bg-accent hover:bg-accent/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          Showing {viewMode === 'categories' ? filteredAndSorted.length : paginatedResults.length} of {filteredAndSorted.length} results
        </div>
      </div>

      {/* Results */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No industries found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : viewMode === 'categories' ? (
        <div className="space-y-12">
          {Object.entries(groupedByCategory).map(([category, industries]) => (
            <section key={category}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="h-1 w-12 bg-[var(--primary)] rounded-full"></span>
                {CATEGORY_LABELS[category]}
                <span className="text-sm font-normal text-muted-foreground">
                  ({industries.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {industries.map((industry) => renderIndustryCard(industry, 'details'))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={
          viewMode === 'list'
            ? 'space-y-3'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        }>
          {paginatedResults.map((industry) => renderIndustryCard(industry, viewMode))}
        </div>
      )}

      {/* Pagination */}
      {viewMode !== 'categories' && totalPages > 1 && (
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
    </div>
  );
}
