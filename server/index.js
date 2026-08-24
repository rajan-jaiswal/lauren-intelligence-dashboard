require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const https = require('https');

const productsRouter = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,           // set this on Render → your Vercel URL
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // allow server-to-server / curl (no origin) and whitelisted origins
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    // allow any Vercel preview/production deployment automatically
    if (/\.vercel\.app$/.test(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', productsRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState, // 0=disconnected,1=connected,2=connecting
    timestamp: new Date().toISOString(),
  });
});

// ─── MongoDB Connection ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected:', process.env.MONGO_URI);
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      // ── Keep-alive self-ping — prevents Render free tier cold starts ──────────
      // Render spins down the server after 15 min of inactivity.
      // Pinging ourselves every 10 min keeps the process warm so the first
      // request after a long idle period doesn't take 30+ seconds.
      if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
        const pingUrl = `${process.env.RENDER_EXTERNAL_URL}/api/health`;
        const transport = pingUrl.startsWith('https') ? https : http;
        setInterval(() => {
          transport.get(pingUrl, (res) => {
            console.log(`[keep-alive] ping → ${res.statusCode}`);
          }).on('error', (err) => {
            console.warn('[keep-alive] ping failed:', err.message);
          });
        }, 10 * 60 * 1000); // every 10 minutes
        console.log(`[keep-alive] self-ping active → ${pingUrl}`);
      }
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
