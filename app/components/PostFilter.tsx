'use client';

import { useState } from 'react';

type FilterType = 'oldest' | 'newest' | 'mostLiked';

type Props = {
  onFilterChange: (filter: FilterType) => void;
};

export default function PostFilter({ onFilterChange }: Props) {
  const [filter, setFilter] = useState<FilterType>('newest');

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedFilter = event.target.value as FilterType;
    console.log('PostFilter: Selected filter:', selectedFilter);
    setFilter(selectedFilter);
    onFilterChange(selectedFilter);
  };

  return (
    <div className="post-filter">
      <label htmlFor="filter" className="filter-label">
        Sort By
      </label>
      <select
        id="filter"
        value={filter}
        onChange={handleFilterChange}
        className="filter-select"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="mostLiked">Most Liked</option>
      </select>
    </div>
  );
}