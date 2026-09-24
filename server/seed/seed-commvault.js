require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const data = require('./commvault-backup');

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected');

  const filter = { practice: data.practice, product: data.product };
  const result = await Product.updateOne(filter, { $set: data }, { upsert: true });

  if (result.upsertedCount > 0) {
    console.log(`  ➕ Inserted: ${data.practice}/${data.product}`);
  } else {
    console.log(`  🔄 Updated:  ${data.practice}/${data.product}`);
  }

  console.log('✅ Done');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
