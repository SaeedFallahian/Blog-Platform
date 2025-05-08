'use client';

import { useState } from 'react';

type Props = {
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  formAction?: string; // URL پایه برای ریدایرکت
};

export default function SearchBox({
  defaultValue = '',
  placeholder = 'Searching...',
  className = '',
  formAction = '/', // به طور پیش‌فرض به صفحه اصلی
}: Props) {
  const [searchQuery, setSearchQuery] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ریدایرکت به URL پایه با کوئری جستجو
    window.location.href = `${formAction}?q=${encodeURIComponent(searchQuery)}`;
  };

  const handleClear = () => {
    setSearchQuery('');
    // ریدایرکت به URL پایه بدون کوئری
    window.location.href = formAction;
  };

  return (
    <div style={{ marginBottom: '24px' }} className={className}>
      <form onSubmit={handleSubmit} action={formAction} method="GET" style={{ position: 'relative' }}>
        <input
          type="text"
          name="q"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 40px 12px 12px', // فضای کافی برای آیکون‌ها
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '1rem',
          }}
        />
        {/* آیکون ضربدر برای پاک کردن */}
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '40px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Clear Searching..."
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4b5563"
              strokeWidth="2"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {/* آیکون ذره‌بین برای جستجو */}
        <button
          type="submit"
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Search"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4b5563"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
      </form>
    </div>
  );
}