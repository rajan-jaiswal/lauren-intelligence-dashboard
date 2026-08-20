/**
 * migrate-to-atlas.js
 * -------------------
 * Copies ALL documents from local MongoDB → MongoDB Atlas.
 *
 * Usage:
 *   node migrate-to-atlas.js
 *
 * Requirements:
 *   - MONGO_URI in server/.env must point to your Atlas cluster
 *   - Local MongoDB must be running on mongodb://localhost:27017
 *
 * The script will:
 *   1. Connect to local MongoDB (source)
 *   2. Connect to Atlas (destination, from MONGO_URI in .env)
 *   3. Export all documents from the 'products' collection
 *   4. Upsert them into Atlas (safe — won't create duplicates)
 *   5. Print a summary and disconnect
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');

const LOCAL_URI  = 'mongodb://localhost:27017/lauren-dashboard';
const ATLAS_URI  = process.env.MONGO_URI;

if (!ATLAS_URI || ATLAS_URI.includes('<db_password>') || ATLAS_URI === 'mongodb://localhost:27017/lauren-dashboard') {
  console.error('\n❌  ERROR: Set MONGO_URI in server/.env to your Atlas connection string first.');
  console.error('    It should look like:');
  console.error('    MONGO_URI=mongodb+srv://jaiswalvk88:YOUR_PASSWORD@cluster0.wd5rkwk.mongodb.net/lauren-dashboard?retryWrites=true&w=majority\n');
  process.exit(1);
}

async function migrate() {
  console.log('\n🔌 Connecting to local MongoDB...');
  const localConn  = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('✅  Local connected:', LOCAL_URI);

  console.log('\n🔌 Connecting to Atlas...');
  const atlasConn  = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log('✅  Atlas connected\n');

  // ── Get raw collection handles (bypass schema validation for a clean copy) ──
  const localCol  = localConn.collection('products');
  const atlasCol  = atlasConn.collection('products');

  const total = await localCol.countDocuments();
  console.log(`📦  Found ${total} document(s) in local 'products' collection\n`);

  if (total === 0) {
    console.log('ℹ️   Nothing to migrate. Is your local server running and does it have data?');
    await localConn.close();
    await atlasConn.close();
    process.exit(0);
  }

  const docs = await localCol.find({}).toArray();

  let upserted = 0;
  let updated  = 0;
  let errors   = 0;

  for (const doc of docs) {
    try {
      const filter = { practice: doc.practice, product: doc.product };
      const result = await atlasCol.updateOne(filter, { $set: doc }, { upsert: true });
      if (result.upsertedCount > 0) {
        console.log(`  ➕ Migrated (new):     ${doc.practice} / ${doc.product}`);
        upserted++;
      } else {
        console.log(`  🔄 Migrated (updated): ${doc.practice} / ${doc.product}`);
        updated++;
      }
    } catch (err) {
      console.error(`  ❌ Failed: ${doc.practice} / ${doc.product} — ${err.message}`);
      errors++;
    }
  }

  console.log('\n─────────────────────────────────────────────');
  console.log(`✅  Migration complete`);
  console.log(`    ➕ New documents inserted : ${upserted}`);
  console.log(`    🔄 Existing docs updated  : ${updated}`);
  if (errors > 0) console.log(`    ❌ Errors                 : ${errors}`);
  console.log('─────────────────────────────────────────────\n');

  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('\n❌  Migration failed:', err.message);
  console.error('\nCommon causes:');
  console.error('  • Wrong password in MONGO_URI');
  console.error('  • Your IP is not whitelisted on Atlas (Network Access → Add IP)');
  console.error('  • Local MongoDB is not running\n');
  process.exit(1);
});
