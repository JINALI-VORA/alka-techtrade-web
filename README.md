# Alka TechTrade – Contact form to MongoDB

1. Install Node 18+.
2. `npm install`
3. Copy `.env.example` to `.env`, set `MONGODB_URI` (MongoDB Atlas or local).
4. `npm start`, open http://localhost:5000
5. Submit the form. Data lands in database `alka_techtrade`, collection `enquiries`.

Site hosted elsewhere (Netlify, GitHub Pages)? Deploy this API (Render, Railway),
set `API_URL` in `public/index.html` to its full URL, and add the site address to `ALLOWED_ORIGINS`.
