import { Link } from 'react-router-dom';
import { formatPrice, timeAgo } from '../utils.js';
import { categoryIcon } from '../constants.js';

export function Thumb({ listing, className = '' }) {
  const src = listing.images?.[0];
  return (
    <div className={`thumb ${className}`}>
      {src ? (
        <img src={src} alt={listing.title} loading="lazy" />
      ) : (
        <div className="thumb-placeholder" aria-hidden="true">
          {categoryIcon(listing.category)}
        </div>
      )}
      {listing.status === 'sold' && <span className="badge badge-sold">Sold</span>}
    </div>
  );
}

export default function ListingCard({ listing }) {
  return (
    <Link to={`/ad/${listing._id}`} className="card listing-card">
      <Thumb listing={listing} />
      <div className="card-body">
        <div className="card-price">{formatPrice(listing.price)}</div>
        <h3 className="card-title">{listing.title}</h3>
        <div className="card-meta">
          <span>📍 {listing.location}</span>
          <span>{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
