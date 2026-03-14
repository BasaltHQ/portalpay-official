'use client';

import React, { useState, useMemo } from 'react';
import type { SectionRenderProps } from './SectionRenderProps';

/** ProductGridSection — Main product catalog with filtering, sorting, and pagination */
export default function ProductGridSection({ sectionConfig, items, theme, onAddToCart, onSelectItem }: SectionRenderProps) {
  const s = sectionConfig.settings;
  const heading = s.heading;
  const columns = s.columns || 3;
  const enableFilters = s.enableFilters !== false;
  const enableSort = s.enableSort !== false;
  const enableSearch = s.enableSearch !== false;
  const showPrice = s.showPrice !== false;
  const showRating = s.showRating !== false;
  const showAddToCart = s.showAddToCart !== false;
  const showDiscountBadge = s.showDiscountBadge !== false;
  const viewMode = s.viewMode || 'grid';
  const cardSize = s.cardSize || 'medium';
  const productsPerPage = parseInt(s.productsPerPage || '12');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [displayCount, setDisplayCount] = useState(productsPerPage);

  // Categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    items.forEach(item => { if (item.category) cats.add(item.category); });
    return Array.from(cats).sort();
  }, [items]);

  // Filter & sort
  const filteredItems = useMemo(() => {
    let result = [...items];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    if (selectedCategory) {
      result = result.filter(i => i.category === selectedCategory);
    }
    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => a.priceUsd - b.priceUsd); break;
      case 'price-desc': result.sort((a, b) => b.priceUsd - a.priceUsd); break;
      case 'name-asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'newest': result.sort((a, b) => b.createdAt - a.createdAt); break;
    }
    return result;
  }, [items, searchQuery, selectedCategory, sortBy]);

  const displayItems = filteredItems.slice(0, displayCount);
  const hasMore = displayCount < filteredItems.length;

  // Category groups for 'category' viewMode
  const groupedItems = useMemo(() => {
    if (viewMode !== 'category') return null;
    const groups: Record<string, typeof items> = {};
    filteredItems.forEach(item => {
      const cat = item.category || 'Other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [filteredItems, viewMode]);

  const cardPadding = cardSize === 'small' ? '0.75rem' : cardSize === 'large' ? '1.25rem' : '1rem';
  const imgHeight = cardSize === 'small' ? '140px' : cardSize === 'large' ? '260px' : '200px';

  function renderProductCard(item: any) {
    const hasDiscount = item.discountPrice && item.discountPrice < item.priceUsd;
    return (
      <div
        key={item.id}
        onClick={() => onSelectItem(item)}
        style={{
          backgroundColor: 'var(--tmpl-surface, #111)',
          borderRadius: 'var(--tmpl-border-radius, 8px)',
          border: theme.layout.cardStyle === 'bordered' ? '1px solid rgba(255,255,255,0.1)' : 'none',
          boxShadow: theme.layout.cardStyle === 'shadow' ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
          backdropFilter: theme.layout.cardStyle === 'glass' ? 'blur(16px)' : 'none',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
      >
        {/* Image */}
        {item.images?.[0] && (
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <img
              src={item.images[0]}
              alt={item.name}
              style={{ width: '100%', height: imgHeight, objectFit: 'cover', display: 'block' }}
            />
            {showDiscountBadge && hasDiscount && (
              <span style={{
                position: 'absolute', top: 8, right: 8,
                backgroundColor: '#ef4444', color: '#fff', padding: '2px 8px',
                borderRadius: '9999px', fontSize: '11px', fontWeight: 700,
              }}>
                {Math.round((1 - item.discountPrice / item.priceUsd) * 100)}% OFF
              </span>
            )}
          </div>
        )}
        <div style={{ padding: cardPadding }}>
          <h3 style={{
            fontFamily: 'var(--tmpl-heading-font, inherit)',
            fontWeight: 600, fontSize: cardSize === 'small' ? '0.85rem' : '1rem',
            marginBottom: '0.25rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.name}
          </h3>
          {showPrice && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--tmpl-primary, #0ea5e9)', fontSize: cardSize === 'small' ? '0.9rem' : '1.1rem' }}>
                ${(hasDiscount ? item.discountPrice : item.priceUsd).toFixed(2)}
              </span>
              {hasDiscount && (
                <span style={{ textDecoration: 'line-through', color: 'var(--tmpl-text-muted, #888)', fontSize: '0.85rem' }}>
                  ${item.priceUsd.toFixed(2)}
                </span>
              )}
            </div>
          )}
          {showAddToCart && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(item.id); }}
              style={{
                width: '100%', padding: '0.5rem',
                backgroundColor: 'var(--tmpl-primary, #0ea5e9)',
                color: '#fff', border: 'none',
                borderRadius: 'var(--tmpl-border-radius, 4px)',
                fontWeight: 600, fontSize: '0.8rem',
                cursor: 'pointer', transition: 'opacity 0.2s',
              }}
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderGrid(products: any[]) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '1rem',
      }}>
        {products.map(renderProductCard)}
      </div>
    );
  }

  return (
    <section
      id="products"
      style={{
        maxWidth: 'var(--tmpl-max-width, 1200px)',
        margin: '0 auto',
        padding: '3rem 1.5rem',
      }}
    >
      {heading && (
        <h2 style={{
          fontFamily: 'var(--tmpl-heading-font, inherit)',
          fontWeight: theme.typography.headingWeight,
          fontSize: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          {heading}
        </h2>
      )}

      {/* Controls bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        {enableSearch && (
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1, minWidth: 180, padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--tmpl-surface, #111)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--tmpl-border-radius, 4px)',
              color: 'var(--tmpl-text, #fff)', fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        )}
        {enableFilters && categories.length > 1 && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--tmpl-surface, #111)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--tmpl-border-radius, 4px)',
              color: 'var(--tmpl-text, #fff)', fontSize: '0.875rem',
            }}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {enableSort && (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--tmpl-surface, #111)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 'var(--tmpl-border-radius, 4px)',
              color: 'var(--tmpl-text, #fff)', fontSize: '0.875rem',
            }}
          >
            <option value="">Sort by</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="name-asc">Name: A → Z</option>
            <option value="name-desc">Name: Z → A</option>
            <option value="newest">Newest</option>
          </select>
        )}
        <span style={{ color: 'var(--tmpl-text-muted, #888)', fontSize: '0.8rem', marginLeft: 'auto' }}>
          {filteredItems.length} product{filteredItems.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Product display */}
      {viewMode === 'category' && groupedItems ? (
        Object.entries(groupedItems).map(([category, catItems]) => (
          <div key={category} style={{ marginBottom: '2.5rem' }}>
            <h3 style={{
              fontFamily: 'var(--tmpl-heading-font, inherit)',
              fontWeight: 600, fontSize: '1.2rem',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
              {category}
            </h3>
            {renderGrid(catItems)}
          </div>
        ))
      ) : (
        renderGrid(displayItems)
      )}

      {/* Load more */}
      {hasMore && viewMode !== 'category' && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={() => setDisplayCount(prev => prev + productsPerPage)}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--tmpl-primary, #0ea5e9)',
              color: 'var(--tmpl-primary, #0ea5e9)',
              borderRadius: 'var(--tmpl-border-radius, 4px)',
              fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
            }}
          >
            Load More ({filteredItems.length - displayCount} remaining)
          </button>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--tmpl-text-muted, #888)' }}>
          <p style={{ fontSize: '1.1rem' }}>No products found</p>
          {searchQuery && <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Try adjusting your search or filters</p>}
        </div>
      )}
    </section>
  );
}
