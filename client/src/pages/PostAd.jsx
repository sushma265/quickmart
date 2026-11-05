import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { CATEGORIES, CONDITIONS } from '../constants.js';

const MAX_PHOTOS = 5;

export default function PostAd() {
  const { id } = useParams(); // present when editing
  const editing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    category: '',
    condition: 'Good',
    price: '',
    location: '',
    description: '',
  });
  const [existing, setExisting] = useState([]); // images already saved on the server
  const [files, setFiles] = useState([]); // newly picked files
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);

  // Load the ad when editing
  useEffect(() => {
    if (!editing) return;
    api
      .listing(id)
      .then(({ listing }) => {
        if (!listing.isOwner) return navigate('/my-ads', { replace: true });
        setForm({
          title: listing.title,
          category: listing.category,
          condition: listing.condition,
          price: String(listing.price),
          location: listing.location,
          description: listing.description,
        });
        setExisting(listing.images || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, editing, navigate]);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const photoCount = existing.length + files.length;

  const addFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    const room = MAX_PHOTOS - photoCount;
    if (picked.length > room) setError(`You can add up to ${MAX_PHOTOS} photos.`);
    else setError('');
    const valid = picked.filter((f) => f.size <= 5 * 1024 * 1024);
    if (valid.length < picked.length) setError('Each photo must be under 5 MB.');
    setFiles((prev) => [...prev, ...valid.slice(0, Math.max(0, room))]);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category) return setError('Please choose a category.');

    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, v));
    files.forEach((f) => body.append('images', f));
    if (editing) body.append('keepImages', JSON.stringify(existing));

    setBusy(true);
    try {
      const { listing } = editing ? await api.updateListing(id, body) : await api.createListing(body);
      navigate(`/ad/${listing._id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (loading) return <div className="page-center">Loading…</div>;

  return (
    <div className="container narrow">
      <form className="card form-card" onSubmit={submit}>
        <h1>{editing ? 'Edit your ad' : 'Post a new ad'}</h1>
        <p className="muted">Clear photos and an honest description help you sell faster.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <label className="field">
          <span>Title</span>
          <input value={form.title} onChange={set('title')} maxLength={100} placeholder="e.g. iPhone 13, 128GB, like new" required />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Category</span>
            <select value={form.category} onChange={set('category')} required>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Condition</span>
            <select value={form.condition} onChange={set('condition')}>
              {CONDITIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Price (₹)</span>
            <input type="number" min="0" value={form.price} onChange={set('price')} placeholder="0" required />
          </label>
          <label className="field">
            <span>Location</span>
            <input value={form.location} onChange={set('location')} maxLength={80} placeholder="City or area" required />
          </label>
        </div>

        <label className="field">
          <span>Description</span>
          <textarea
            rows={6}
            value={form.description}
            onChange={set('description')}
            maxLength={3000}
            placeholder="Describe the item: age, condition, what's included, reason for selling…"
            required
          />
          <small className="muted">{form.description.length}/3000</small>
        </label>

        <div className="field">
          <span>
            Photos{' '}
            <em className="muted">
              ({photoCount}/{MAX_PHOTOS})
            </em>
          </span>
          <div className="photo-grid">
            {existing.map((src) => (
              <div className="photo" key={src}>
                <img src={src} alt="" />
                <button type="button" aria-label="Remove photo" onClick={() => setExisting(existing.filter((s) => s !== src))}>
                  ×
                </button>
              </div>
            ))}
            {previews.map((src, i) => (
              <div className="photo" key={src}>
                <img src={src} alt="" />
                <button type="button" aria-label="Remove photo" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>
                  ×
                </button>
              </div>
            ))}
            {photoCount < MAX_PHOTOS && (
              <label className="photo add">
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={addFiles} hidden />
                <span>＋</span>
                <small>Add photo</small>
              </label>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-soft" onClick={() => navigate(-1)} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Post ad'}
          </button>
        </div>
      </form>
    </div>
  );
}
