// Adds a demo user and some sample ads so the home page isn't empty.
// Usage: npm run seed   (from the project root or the server folder)
//
// Photos:
//  - Most ads use a photo hosted on Wikimedia Commons (needs internet when viewing the site).
//    Credits and licenses are listed in the README.
//  - To use your own photo for ad number N, drop a file named N.jpg (or .png/.webp) into
//    server/seed-images/ and run the seed again. Your file wins over the Commons photo.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Listing = require('./models/Listing');

const commons = (file) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=800`;

// [title, category, price, condition, location, description, commons file name (or null)]
const samples = [
  ['iPhone 13 128GB, mint condition', 'Mobiles', 38500, 'Like new', 'Hyderabad', 'Used for 8 months with a case and screen guard from day one. Battery health 92%. Box and charger included.', 'IPhone_13.jpg'],
  ['Samsung 43" 4K Smart TV', 'Electronics', 21000, 'Good', 'Bengaluru', 'Crystal 4K display, 2 years old, works perfectly. Remote and wall mount included.', 'Samsung_Smart_TV_2012_(E-Series).jpg'],
  ['Honda Activa 6G, 2021 model', 'Vehicles', 54000, 'Good', 'Kadapa', 'Single owner, 18,000 km driven, all papers clear. Recently serviced.', 'Honda_Activa_6G.jpg'],
  ['2 BHK flat for rent near bus stand', 'Property', 12000, 'Good', 'Kadapa', 'Semi-furnished, 2nd floor, 24h water, parking available. Family preferred.', 'Empty_apartment_living_room.jpg'],
  ['Solid teak wood dining table with 6 chairs', 'Furniture', 18500, 'Good', 'Vijayawada', 'Sturdy and well maintained. Selling because we are relocating. Pickup only.', null],
  ['Leather jacket, size M, barely worn', 'Fashion', 2200, 'Like new', 'Chennai', 'Genuine leather, worn only twice. Bought for 6,000.', 'Nepal_made_Leather_Jacket.jpg'],
  ['Engineering books combo (CSE 2nd year)', 'Books & Sports', 900, 'Good', 'Tirupati', 'Data Structures, DBMS, OS and Discrete Maths. Light highlighting only.', 'Stack_of_school_books_on_top_of_a_table.jpg'],
  ['Labrador puppy, 2 months, vaccinated', 'Pets', 15000, 'New', 'Hyderabad', 'Healthy and playful. First vaccination done. Kennel club papers available.', 'Labrador_Retriever_yellow_puppy.jpg'],
  ['Home tutoring - Maths & Physics (class 9-12)', 'Services', 500, 'New', 'Kadapa', 'Experienced teacher. Price shown is per hour. Demo class is free.', null],
  ['Dell Inspiron laptop i5 / 16GB / 512GB SSD', 'Electronics', 32500, 'Good', 'Bengaluru', 'Great for coding and office work. Battery backup around 4 hours. Charger included.', 'Dell_Inspiron_7472.jpg'],
  ['Royal Enfield Classic 350, 2019', 'Vehicles', 125000, 'Good', 'Nellore', 'Well maintained, new tyres, insurance valid till next year.', 'Royal_Enfield_Classic_350_(2017_Model_Year).jpg'],
  ['Study table with bookshelf', 'Furniture', 3500, 'Fair', 'Kurnool', 'Compact and sturdy. Some minor scratches on the side.', null],
];

const SEED_IMAGES = path.join(__dirname, 'seed-images');
const UPLOADS = path.join(__dirname, 'uploads');

// Returns a local /uploads/... URL if the user supplied N.jpg/.png/.webp, otherwise null
function localPhoto(n) {
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
    const src = path.join(SEED_IMAGES, `${n}${ext}`);
    if (fs.existsSync(src)) {
      fs.mkdirSync(UPLOADS, { recursive: true });
      const name = `seed-${n}${ext}`;
      fs.copyFileSync(src, path.join(UPLOADS, name));
      return `/uploads/${name}`;
    }
  }
  return null;
}

(async () => {
  await connectDB();

  let demo = await User.findOne({ email: 'demo@quickmart.com' });
  if (!demo) {
    demo = await User.create({
      name: 'Demo Seller',
      email: 'demo@quickmart.com',
      password: 'demo1234',
      phone: '9876543210',
    });
  }

  await Listing.deleteMany({ seller: demo._id });

  let withPhoto = 0;
  const docs = samples.map(([title, category, price, condition, location, description, file], i) => {
    const photo = localPhoto(i + 1) || (file ? commons(file) : null);
    if (photo) withPhoto++;
    return {
      title,
      category,
      price,
      condition,
      location,
      description,
      images: photo ? [photo] : [],
      seller: demo._id,
      createdAt: new Date(Date.now() - i * 3 * 60 * 60 * 1000),
    };
  });
  await Listing.insertMany(docs);

  console.log(`Seeded ${docs.length} ads (${withPhoto} with photos). Demo login: demo@quickmart.com / demo1234`);
  const missing = docs.map((d, i) => (d.images.length ? null : `${i + 1}. ${d.title}`)).filter(Boolean);
  if (missing.length) {
    console.log('No photo yet for:\n  ' + missing.join('\n  '));
    console.log('Add server/seed-images/<number>.jpg and run the seed again to give them one.');
  }
  await mongoose.disconnect();
})();
