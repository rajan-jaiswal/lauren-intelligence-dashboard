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
  process.env.FRONTEND_URL,  // set this on Render → your Vercel URL
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server / curl (no origin header)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    // Allow any Vercel deployment automatically
    if (/\.vercel\.app$/.test(origin)) return cb(null, true);
    // Allow Render's own health-check pings
    if (/\.onrender\.com$/.test(origin)) return cb(null, true);
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
// Use Google DNS (8.8.8.8) to resolve SRV records — bypasses corporate DNS
// that may block _mongodb._tcp SRV lookups on port 53.
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    family: 4, // Force IPv4
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      // ── Keep-alive self-ping — prevents Render free tier cold starts ──────────
      const renderUrl = process.env.RENDER_EXTERNAL_URL;
      if (process.env.NODE_ENV === 'production' && renderUrl) {
        const pingUrl = renderUrl.startsWith('http') ? `${renderUrl}/api/health` : `https://${renderUrl}/api/health`;
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
