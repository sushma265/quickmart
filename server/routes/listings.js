const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { CATEGORIES, CONDITIONS } = require('../constants');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------- helpers ----------
function deleteImageFiles(urls = []) {
  urls.forEach((url) => {
    const file = path.join(UPLOAD_DIR, path.basename(url));
    fs.unlink(file, () => {});
  });
}

function validateBody(body) {
  const { title, description, price, category, location, condition } = body;
  if (!title || !title.trim()) return 'Title is required';
  if (title.trim().length < 5) return 'Title should be at least 5 characters';
  if (!description || description.trim().length < 10) return 'Description should be at least 10 characters';
  if (price === undefined || price === '' || isNaN(Number(price)) || Number(price) < 0)
    return 'Enter a valid price';
  if (!CATEGORIES.includes(category)) return 'Choose a category';
  if (condition && !CONDITIONS.includes(condition)) return 'Invalid condition';
  if (!location || !location.trim()) return 'Location is required';
  return null;
}

const fail = (req, res, status, message) => {
  deleteImageFiles((req.files || []).map((f) => f.filename));
  return res.status(status).json({ message });
};

// ---------- browse / search ----------
router.get('/', async (req, res, next) => {
  try {
    const { q, category, location, minPrice, maxPrice, sort = 'new' } = req.query;
    const filter = { status: 'active' };

    if (q && q.trim()) {
      const rx = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [{ title: rx }, { description: rx }];
    }
    if (category && CATEGORIES.includes(category)) filter.category = category;
    if (location && location.trim()) filter.location = new RegExp(escapeRegex(location.trim()), 'i');

    const price = {};
    if (minPrice !== undefined && minPrice !== '' && !isNaN(Number(minPrice))) price.$gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== '' && !isNaN(Number(maxPrice))) price.$lte = Number(maxPrice);
    if (Object.keys(price).length) filter.price = price;

    const sortMap = {
      new: { createdAt: -1 },
      'price-asc': { price: 1, createdAt: -1 },
      'price-desc': { price: -1, createdAt: -1 },
    };

    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const [items, total] = await Promise.all([
      Listing.find(filter)
        .sort(sortMap[sort] || sortMap.new)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('seller', 'name'),
      Listing.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (err) {
    next(err);
  }
});

// ---------- my ads ----------
router.get('/mine', protect, async (req, res, next) => {
  try {
    const items = await Listing.find({ seller: req.user.id }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

// ---------- single listing ----------
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Ad not found' });

    const listing = await Listing.findById(req.params.id).populate('seller', 'name phone createdAt');
    if (!listing) return res.status(404).json({ message: 'Ad not found' });

    const isOwner = req.user && String(listing.seller._id) === req.user.id;
    if (!isOwner) Listing.updateOne({ _id: listing._id }, { $inc: { views: 1 } }).exec();

    const data = listing.toObject();
    data.isOwner = Boolean(isOwner);
    // Seller phone is only shared with logged-in users
    if (!req.user) data.seller.phone = '';

    const related = await Listing.find({
      category: listing.category,
      status: 'active',
      _id: { $ne: listing._id },
    })
      .sort({ createdAt: -1 })
      .limit(4)
      .populate('seller', 'name');

    res.json({ listing: data, related });
  } catch (err) {
    next(err);
  }
});

// ---------- create ----------
router.post('/', protect, upload.array('images', 5), async (req, res, next) => {
  try {
    const error = validateBody(req.body);
    if (error) return fail(req, res, 400, error);

    const listing = await Listing.create({
      title: req.body.title,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      condition: req.body.condition || 'Good',
      location: req.body.location,
      images: (req.files || []).map((f) => `/uploads/${f.filename}`),
      seller: req.user.id,
    });
    res.status(201).json({ listing });
  } catch (err) {
    deleteImageFiles((req.files || []).map((f) => f.filename));
    next(err);
  }
});

// ---------- update ----------
router.put('/:id', protect, upload.array('images', 5), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(req, res, 404, 'Ad not found');
    const listing = await Listing.findById(req.params.id);
    if (!listing) return fail(req, res, 404, 'Ad not found');
    if (String(listing.seller) !== req.user.id) return fail(req, res, 403, 'You can only edit your own ads');

    const error = validateBody(req.body);
    if (error) return fail(req, res, 400, error);

    let keep = [];
    try {
      keep = JSON.parse(req.body.keepImages || '[]');
    } catch {
      keep = [];
    }
    keep = keep.filter((url) => listing.images.includes(url));
    const added = (req.files || []).map((f) => `/uploads/${f.filename}`);
    if (keep.length + added.length > 5) return fail(req, res, 400, 'You can have at most 5 photos');

    deleteImageFiles(listing.images.filter((url) => !keep.includes(url)));

    listing.title = req.body.title;
    listing.description = req.body.description;
    listing.price = Number(req.body.price);
    listing.category = req.body.category;
    listing.condition = req.body.condition || listing.condition;
    listing.location = req.body.location;
    listing.images = [...keep, ...added];
    await listing.save();

    res.json({ listing });
  } catch (err) {
    deleteImageFiles((req.files || []).map((f) => f.filename));
    next(err);
  }
});

// ---------- mark sold / re-activate ----------
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Ad not found' });
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Ad not found' });
    if (String(listing.seller) !== req.user.id) return res.status(403).json({ message: 'Not your ad' });

    listing.status = listing.status === 'active' ? 'sold' : 'active';
    await listing.save();
    res.json({ listing });
  } catch (err) {
    next(err);
  }
});

// ---------- delete ----------
router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Ad not found' });
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Ad not found' });
    if (String(listing.seller) !== req.user.id) return res.status(403).json({ message: 'Not your ad' });

    deleteImageFiles(listing.images);
    await listing.deleteOne();
    res.json({ message: 'Ad deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
