import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Thumb } from '../components/ListingCard.jsx';
import { formatPrice, timeAgo } from '../utils.js';

export default function MyAds() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .myListings()
      .then((d) => setItems(d.items))
      .catch((e) => setError(e.message));
  }, []);

  const toggle = async (id) => {
    try {
      const { listing } = await api.toggleStatus(id);
      setItems((list) => list.map((a) => (a._id === id ? { ...a, status: listing.status } : a)));
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this ad permanently?')) return;
    try {
      await api.deleteListing(id);
      setItems((list) => list.filter((a) => a._id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="container narrow">
      <div className="page-head">
        <h1>My ads</h1>
        <Link to="/post" className="btn btn-primary">
          + Post new ad
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!items && !error ? (
        <div className="page-center">Loading…</div>
      ) : items && items.length === 0 ? (
        <div className="card empty">
          <div className="empty-icon">🛍️</div>
          <h3>You haven't posted any ads yet</h3>
          <p>Got something to sell? Post your first ad in under a minute.</p>
          <Link to="/post" className="btn btn-primary">
            Post an ad
          </Link>
        </div>
      ) : (
        <div className="my-list">
          {items?.map((ad) => (
            <div className="card my-ad" key={ad._id}>
              <Link to={`/ad/${ad._id}`} className="my-ad-thumb">
                <Thumb listing={ad} />
              </Link>
              <div className="my-ad-info">
                <Link to={`/ad/${ad._id}`} className="my-ad-title">
                  {ad.title}
                </Link>
                <div className="card-price">{formatPrice(ad.price)}</div>
                <div className="muted small">
                  {ad.category} · 📍 {ad.location} · {timeAgo(ad.createdAt)} · 👁 {ad.views} views
                </div>
                <span className={`status ${ad.status}`}>{ad.status === 'sold' ? 'Sold' : 'Active'}</span>
              </div>
              <div className="my-ad-actions">
                <Link to={`/edit/${ad._id}`} className="btn btn-soft">
                  Edit
                </Link>
                <button className="btn btn-soft" onClick={() => toggle(ad._id)}>
                  {ad.status === 'sold' ? 'Mark available' : 'Mark sold'}
                </button>
                <button className="btn btn-danger-soft" onClick={() => remove(ad._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
