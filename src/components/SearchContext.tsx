import React from 'react';

interface SearchContextValue {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const SearchContext = React.createContext<SearchContextValue | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = React.useState<string>('');

  const value = React.useMemo(() => ({ searchQuery, setSearchQuery }), [searchQuery]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = (): SearchContextValue => {
  const ctx = React.useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within a SearchProvider');
  return ctx;
};


