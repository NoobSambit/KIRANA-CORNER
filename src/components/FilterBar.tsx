import React from 'react';
import { Grid, List, SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const SORT_OPTS = [
  { value: 'popularity', label: 'Nearest' },
  { value: 'price-low',  label: 'Price ↑' },
  { value: 'price-high', label: 'Price ↓' },
  { value: 'rating',     label: 'Rating'  },
];

const FilterBar: React.FC<FilterBarProps> = ({
  categories, selectedCategory, onCategoryChange,
  sortBy, onSortChange, viewMode, onViewModeChange,
}) => (
  <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
    {/* Category pills */}
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none px-4 py-3"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      {['all', ...categories].map((cat) => {
        const active = selectedCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className="flex-none px-4 py-2 rounded-full text-[12px] font-bold transition-all duration-200 whitespace-nowrap tap-transparent"
            style={active ? {
              background: 'var(--brand)',
              color: '#fff',
              border: '1px solid var(--brand)',
            } : {
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        );
      })}
    </div>

    {/* Sort + view row */}
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="flex items-center gap-1.5 text-[12px] font-semibold flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}>
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>Sort:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto scrollbar-none">
        {SORT_OPTS.map((o) => (
          <button key={o.value} onClick={() => onSortChange(o.value)}
            className="flex-none text-[12px] font-bold px-3 py-1.5 rounded-lg transition-all"
            style={sortBy === o.value ? {
              background: 'var(--text-primary)',
              color: 'var(--bg-card)',
            } : {
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex rounded-lg p-0.5 gap-0.5 flex-shrink-0"
        style={{ background: 'var(--bg-elevated)' }}>
        {([{ mode: 'grid', Icon: Grid }, { mode: 'list', Icon: List }] as const).map(({ mode, Icon }) => (
          <button key={mode} onClick={() => onViewModeChange(mode)}
            aria-label={`${mode} view`}
            className="p-1.5 rounded-md transition-all"
            style={viewMode === mode ? {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-card)',
            } : {
              color: 'var(--text-muted)',
            }}>
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default FilterBar;