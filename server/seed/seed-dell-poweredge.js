/**
 * Standalone seed script — inserts/updates Dell PowerEdge battle card only.
 *
 * Usage (from the server/ directory):
 *   node seed/seed-dell-poweredge.js
 *
 * Or from repo root:
 *   node server/seed/seed-dell-poweredge.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const DELL_POWEREDGE = require('./dell-poweredge');

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected:', process.env.MONGO_URI);

  const filter = { practice: DELL_POWEREDGE.practice, product: DELL_POWEREDGE.product };
  const result = await Product.updateOne(filter, { $set: DELL_POWEREDGE }, { upsert: true });

  if (result.upsertedCount > 0) {
    console.log(`✅ Inserted: ${DELL_POWEREDGE.practice}/${DELL_POWEREDGE.product}`);
  } else {
    console.log(`🔄 Updated:  ${DELL_POWEREDGE.practice}/${DELL_POWEREDGE.product}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
