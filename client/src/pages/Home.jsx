import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import ListingCard from '../components/ListingCard.jsx';
import { CATEGORIES } from '../constants.js';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const location = params.get('location') || '';
  const category = params.get('category') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const sort = params.get('sort') || 'new';
  const page = Number(params.get('page') || 1);
  const queryString = params.toString();

  const [qInput, setQInput] = useState(q);
  const [locInput, setLocInput] = useState(location);
  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);
  const [showFilters, setShowFilters] = useState(false);

  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Keep the inputs in sync when the URL changes (e.g. "Clear all")
  useEffect(() => {
    setQInput(q);
    setLocInput(location);
    setMinInput(minPrice);
    setMaxInput(maxPrice);
  }, [q, location, minPrice, maxPrice]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .listings(queryString)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const goToPage = (p) => {
    update({ page: p > 1 ? String(p) : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFilters = q || location || category || minPrice || maxPrice;
  const clearAll = () => setParams({});

  const submitSearch = (e) => {
    e.preventDefault();
    update({ q: qInput.trim(), location: locInput.trim() });
  };

  const applyPrice = (e) => {
    e.preventDefault();
    update({ minPrice: minInput, maxPrice: maxInput });
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Buy and sell anything, right near you</h1>
          <p>Find great deals on phones, vehicles, furniture and more — or post your own ad in a minute.</p>
          <form className="search-bar" onSubmit={submitSearch} role="search">
            <div className="search-field">
              <span aria-hidden="true">🔍</span>
              <input
                type="text"
                placeholder="What are you looking for?"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                aria-label="Search ads"
              />
            </div>
            <div className="search-field search-loc">
              <span aria-hidden="true">📍</span>
              <input
                type="text"
                placeholder="Any location"
                value={locInput}
                onChange={(e) => setLocInput(e.target.value)}
                aria-label="Location"
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="container">
        <div className="chips" role="tablist" aria-label="Categories">
          <button className={`chip ${!category ? 'active' : ''}`} onClick={() => update({ category: '' })}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              className={`chip ${category === c.name ? 'active' : ''}`}
              onClick={() => update({ category: category === c.name ? '' : c.name })}
            >
              <span aria-hidden="true">{c.icon}</span> {c.name}
            </button>
          ))}
        </div>

        <div className="results-layout">
          <aside className={`filters card ${showFilters ? 'open' : ''}`}>
            <div className="filters-head">
              <h3>Filters</h3>
              {hasFilters && (
                <button className="link-btn" onClick={clearAll}>
                  Clear all
                </button>
              )}
            </div>

            <form onSubmit={applyPrice} className="filter-group">
              <label>Price (₹)</label>
              <div className="price-row">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value)}
                />
                <span>–</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                />
              </div>
              <button className="btn btn-soft btn-block" type="submit">
                Apply
              </button>
            </form>

            <div className="filter-group">
              <label>Sort by</label>
              <select value={sort} onChange={(e) => update({ sort: e.target.value === 'new' ? '' : e.target.value })}>
                <option value="new">Newest first</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </div>
          </aside>

          <section className="results">
            <div className="results-head">
              <div>
                <h2>{category || 'Fresh recommendations'}</h2>
                {!loading && !error && (
                  <span className="muted">
                    {data.total} {data.total === 1 ? 'ad' : 'ads'}
                    {q && <> for “{q}”</>}
                    {location && <> in {location}</>}
                  </span>
                )}
              </div>
              <button className="btn btn-soft filter-toggle" onClick={() => setShowFilters((s) => !s)}>
                ⚙️ Filters
              </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
              <div className="grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card skeleton-card">
                    <div className="skeleton skeleton-img" />
                    <div className="card-body">
                      <div className="skeleton skeleton-line" style={{ width: '40%' }} />
                      <div className="skeleton skeleton-line" style={{ width: '90%' }} />
                      <div className="skeleton skeleton-line" style={{ width: '60%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : data.items.length === 0 && !error ? (
              <div className="empty card">
                <div className="empty-icon">🔎</div>
                <h3>No ads found</h3>
                <p>Try different keywords or remove some filters.</p>
                {hasFilters && (
                  <button className="btn btn-primary" onClick={clearAll}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid">
                {data.items.map((item) => (
                  <ListingCard key={item._id} listing={item} />
                ))}
              </div>
            )}

            {!loading && data.pages > 1 && (
              <div className="pagination">
                <button className="btn btn-soft" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                  ← Previous
                </button>
                <span>
                  Page {data.page} of {data.pages}
                </span>
                <button className="btn btn-soft" disabled={page >= data.pages} onClick={() => goToPage(page + 1)}>
                  Next →
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
