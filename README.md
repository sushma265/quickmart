# QuickMart

A simple OLX-style classifieds website built with the MERN stack (MongoDB, Express, React, Node).
Light theme, mobile friendly, and easy to extend.

## Features

- Sign up / log in (JWT, passwords hashed with bcrypt)
- Post an ad with up to 5 photos, category, condition, price and location
- Browse, search by keyword and location, filter by category and price, sort, paginate
- Ad page with photo gallery, seller info, "show phone number" (logged-in users only) and related ads
- My Ads: edit, mark as sold / available, delete
- Search and filters are stored in the URL, so results can be shared or bookmarked
- Loading skeletons, empty states, and clear error messages

## Project structure

```
quickmart/
├── server/            Express + MongoDB API
│   ├── config/        database connection
│   ├── middleware/    auth (JWT) and image upload (multer)
│   ├── models/        User, Listing
│   ├── routes/        auth.js, listings.js
│   ├── uploads/       uploaded photos (created automatically)
│   ├── seed.js        demo data
│   └── server.js
└── client/            React (Vite) app
    └── src/
        ├── components/  Navbar, Footer, ListingCard
        ├── context/     AuthContext
        ├── pages/       Home, ListingDetail, Login, Register, PostAd, MyAds
        ├── api.js       all API calls
        └── styles.css   light theme (colors are CSS variables at the top)
```

## Run it locally

You need **Node.js 18+** and **MongoDB** running locally (or a free MongoDB Atlas connection string).

```bash
# 1. Install everything
npm run install:all

# 2. Configure the server
cp server/.env.example server/.env
#    then edit server/.env  (set MONGO_URI and a long random JWT_SECRET)

# 3. (Optional) add demo ads
npm run seed
#    demo login:  demo@quickmart.com  /  demo1234

# 4. Start the API (terminal 1)
npm run dev:server        # http://localhost:5000

# 5. Start the website (terminal 2)
npm run dev:client        # http://localhost:5173
```

Open http://localhost:5173. The Vite dev server proxies `/api` and `/uploads` to the API.

### Single-server production build

```bash
npm run build     # builds the React app into client/dist
npm start         # Express serves the API, uploads and the built site on port 5000
```

## API overview

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | – | Create account |
| POST | `/api/auth/login` | – | Log in |
| GET | `/api/auth/me` | yes | Current user |
| GET | `/api/listings` | – | Browse. Query: `q`, `category`, `location`, `minPrice`, `maxPrice`, `sort` (`new`, `price-asc`, `price-desc`), `page`, `limit` |
| GET | `/api/listings/mine` | yes | Your ads |
| GET | `/api/listings/:id` | optional | Ad details + related ads (seller phone only for logged-in users) |
| POST | `/api/listings` | yes | Create ad (multipart form, `images` field) |
| PUT | `/api/listings/:id` | owner | Edit ad (send `keepImages` as a JSON array of photo URLs to keep) |
| PATCH | `/api/listings/:id/status` | owner | Toggle sold / active |
| DELETE | `/api/listings/:id` | owner | Delete ad and its photos |

## Notes before going live

- Uploaded photos are stored on the server's disk (`server/uploads`). On hosts with temporary disks
  (Render, Railway, Heroku) switch the multer storage to Cloudinary or S3.
- Set a strong `JWT_SECRET` and set `CLIENT_URL` to your real site address.
- Ideas to add next: favourites/wishlist, buyer–seller chat, ad reporting, email verification, an admin panel.

## Demo photos and credits

`npm run seed` links 9 of the 12 demo ads to photos on Wikimedia Commons (shown straight from Commons, so the
browser needs internet). Ads 5 (dining table), 9 (tutoring) and 12 (study table) have no photo by default.
To use your own pictures, put `N.jpg` in `server/seed-images/` (N = ad number, see the README.txt there) and re-run the seed.

Each Commons photo has its own author and license (mostly Creative Commons, which requires credit).
If you publish the site, check the license on each page and credit the authors:

1. [IPhone 13.jpg](https://commons.wikimedia.org/wiki/File:IPhone_13.jpg)
2. [Samsung Smart TV 2012 (E-Series).jpg](https://commons.wikimedia.org/wiki/File:Samsung_Smart_TV_2012_(E-Series).jpg)
3. [Honda Activa 6G.jpg](https://commons.wikimedia.org/wiki/File:Honda_Activa_6G.jpg)
4. [Empty apartment living room.jpg](https://commons.wikimedia.org/wiki/File:Empty_apartment_living_room.jpg)
6. [Nepal made Leather Jacket.jpg](https://commons.wikimedia.org/wiki/File:Nepal_made_Leather_Jacket.jpg)
7. [Stack of school books on top of a table.jpg](https://commons.wikimedia.org/wiki/File:Stack_of_school_books_on_top_of_a_table.jpg)
8. [Labrador Retriever yellow puppy.jpg](https://commons.wikimedia.org/wiki/File:Labrador_Retriever_yellow_puppy.jpg)
10. [Dell Inspiron 7472.jpg](https://commons.wikimedia.org/wiki/File:Dell_Inspiron_7472.jpg)
11. [Royal Enfield Classic 350 (2017 Model Year).jpg](https://commons.wikimedia.org/wiki/File:Royal_Enfield_Classic_350_(2017_Model_Year).jpg)

## Customising the look

All colors, radius and shadows are CSS variables at the top of `client/src/styles.css`.
Change `--primary` and `--accent` to rebrand the whole site.
