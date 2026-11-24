require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const { MONGODB_URI, PORT = 5000, ALLOWED_ORIGINS = "*" } = process.env;
if (!MONGODB_URI) { console.error("Missing MONGODB_URI in .env"); process.exit(1); }

/* ---------- schema ---------- */
const enquirySchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true, maxlength: 120 },
  company: { type: String, trim: true, maxlength: 160, default: "" },
  city:    { type: String, trim: true, maxlength: 80,  default: "" },
  state:   { type: String, trim: true, maxlength: 80,  default: "" },
  country: { type: String, trim: true, maxlength: 80,  default: "" },
  email:   { type: String, required: true, trim: true, lowercase: true, maxlength: 160,
             match: [/^\S+@\S+\.\S+$/, "Invalid email"] },
  phone:   { type: String, trim: true, maxlength: 40,  default: "" },
  product: { type: String, trim: true, maxlength: 160, default: "" },
  message: { type: String, trim: true, maxlength: 3000, default: "" },
  ip:      { type: String, default: "" }
}, { timestamps: true });
const Enquiry = mongoose.model("Enquiry", enquirySchema);

/* ---------- app ---------- */
const app = express();
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));

const origins = ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean);
app.use("/api", cors({ origin: origins.includes("*") ? true : origins, methods: ["POST"] }));

// serve the website from /public (same origin = no CORS needed)
app.use(express.static(path.join(__dirname, "public")));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { ok: false, error: "Too many requests. Try again later." } });

app.post("/api/contact", limiter, async (req, res) => {
  try {
    const b = req.body || {};
    if (b.website) return res.status(201).json({ ok: true });          // honeypot: bots fill it, silently drop
    const doc = await Enquiry.create({
      name: String(b.name || ""), company: String(b.company || ""),
      city: String(b.city || ""), state: String(b.state || ""),
      country: String(b.country || ""), email: String(b.email || ""),
      phone: String(b.phone || ""), product: String(b.product || ""),
      message: String(b.message || ""), ip: req.ip
    });
    res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    if (err.name === "ValidationError")
      return res.status(400).json({ ok: false, error: Object.values(err.errors)[0].message });
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error. Please try again." });
  }
});

app.use((req, res) => res.status(404).json({ ok: false, error: "Not found" }));

mongoose.connect(MONGODB_URI)
  .then(() => { console.log("MongoDB connected"); app.listen(PORT, () => console.log("Server on http://localhost:" + PORT)); })
  .catch(err => { console.error("MongoDB connection failed:", err.message); process.exit(1); });
