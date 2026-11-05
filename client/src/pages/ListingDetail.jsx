import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ListingCard from '../components/ListingCard.jsx';
import { categoryIcon } from '../constants.js';
import { formatPrice, memberSince, timeAgo } from '../utils.js';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError('');
    setActive(0);
    setShowPhone(false);
    api
      .listing(id)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message));
    window.scrollTo({ top: 0 });
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  if (error)
    return (
      <div className="page-center empty">
        <div className="empty-icon">😕</div>
        <h2>{error}</h2>
        <Link className="btn btn-primary" to="/">
          Browse ads
        </Link>
      </div>
    );
  if (!data) return <div className="page-center">Loading…</div>;

  const { listing, related } = data;
  const images = listing.images || [];

  const toggleSold = async () => {
    setBusy(true);
    try {
      const d = await api.toggleStatus(listing._id);
      setData({ ...data, listing: { ...listing, status: d.listing.status } });
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this ad permanently?')) return;
    setBusy(true);
    try {
      await api.deleteListing(listing._id);
      navigate('/my-ads');
    } catch (e) {
      alert(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="container detail-page">
      <nav className="breadcrumb">
        <Link to="/">Home</Link> <span>/</span>
        <Link to={`/?category=${encodeURIComponent(listing.category)}`}>{listing.category}</Link> <span>/</span>
        <span className="muted">{listing.title}</span>
      </nav>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="card gallery">
            <div className="gallery-main">
              {images.length ? (
                <img src={images[active]} alt={listing.title} />
              ) : (
                <div className="thumb-placeholder big" aria-hidden="true">
                  {categoryIcon(listing.category)}
                </div>
              )}
              {listing.status === 'sold' && <span className="badge badge-sold">Sold</span>}
            </div>
            {images.length > 1 && (
              <div className="gallery-thumbs">
                {images.map((src, i) => (
                  <button
                    key={src}
                    className={i === active ? 'active' : ''}
                    onClick={() => setActive(i)}
                    aria-label={`Show photo ${i + 1}`}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card detail-info">
            <h2>Description</h2>
            <p className="description">{listing.description}</p>
            <div className="facts">
              <div>
                <span className="muted">Category</span>
                <strong>
                  {categoryIcon(listing.category)} {listing.category}
                </strong>
              </div>
              <div>
                <span className="muted">Condition</span>
                <strong>{listing.condition}</strong>
              </div>
              <div>
                <span className="muted">Posted</span>
                <strong>{timeAgo(listing.createdAt)}</strong>
              </div>
              <div>
                <span className="muted">Views</span>
                <strong>{listing.views}</strong>
              </div>
            </div>
          </div>
        </div>

        <aside className="detail-side">
          <div className="card side-card">
            <div className="detail-price">{formatPrice(listing.price)}</div>
            <h1 className="detail-title">{listing.title}</h1>
            <div className="muted">📍 {listing.location}</div>
          </div>

          <div className="card side-card">
            <div className="seller">
              <span className="avatar big">{listing.seller.name.charAt(0).toUpperCase()}</span>
              <div>
                <strong>{listing.seller.name}</strong>
                <div className="muted small">Member since {memberSince(listing.seller.createdAt)}</div>
              </div>
            </div>

            {listing.isOwner ? (
              <div className="owner-actions">
                <Link className="btn btn-soft btn-block" to={`/edit/${listing._id}`}>
                  ✏️ Edit ad
                </Link>
                <button className="btn btn-soft btn-block" onClick={toggleSold} disabled={busy}>
                  {listing.status === 'sold' ? '↩️ Mark as available' : '✅ Mark as sold'}
                </button>
                <button className="btn btn-danger-soft btn-block" onClick={remove} disabled={busy}>
                  🗑️ Delete ad
                </button>
              </div>
            ) : user ? (
              showPhone ? (
                listing.seller.phone ? (
                  <a className="btn btn-primary btn-block" href={`tel:${listing.seller.phone}`}>
                    📞 {listing.seller.phone}
                  </a>
                ) : (
                  <div className="alert">This seller has not shared a phone number.</div>
                )
              ) : (
                <button className="btn btn-primary btn-block" onClick={() => setShowPhone(true)}>
                  📞 Show phone number
                </button>
              )
            ) : (
              <Link className="btn btn-primary btn-block" to="/login" state={{ from: `/ad/${listing._id}` }}>
                Log in to contact seller
              </Link>
            )}

            <p className="safety">
              <strong>Stay safe:</strong> meet in a public place, check the item first, and never pay in advance.
            </p>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="related">
          <h2>More in {listing.category}</h2>
          <div className="grid">
            {related.map((item) => (
              <ListingCard key={item._id} listing={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
