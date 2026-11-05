const mongoose = require('mongoose');
const { CATEGORIES, CONDITIONS } = require('../constants');

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, enum: CATEGORIES },
    condition: { type: String, enum: CONDITIONS, default: 'Good' },
    location: { type: String, required: true, trim: true, maxlength: 80 },
    images: { type: [String], default: [] },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['active', 'sold'], default: 'active', index: true },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

listingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Listing', listingSchema);
