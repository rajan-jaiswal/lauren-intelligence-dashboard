require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const PRODUCTS = require('./products');

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected:', process.env.MONGO_URI);

  let inserted = 0;
  let updated = 0;

  for (const productData of PRODUCTS) {
    const filter = { practice: productData.practice, product: productData.product };
    const result = await Product.updateOne(filter, { $set: productData }, { upsert: true });
    if (result.upsertedCount > 0) {
      console.log(`  ➕ Inserted: ${productData.practice}/${productData.product}`);
      inserted++;
    } else {
      console.log(`  🔄 Updated:  ${productData.practice}/${productData.product}`);
      updated++;
    }
  }

  console.log(`\n✅ Seed complete — ${inserted} inserted, ${updated} updated`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
