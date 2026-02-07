/**
 * Migration script to add twoFactorEnabled field to existing customers
 * Run with: node scripts/migrate-2fa-field.js
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'pg-prepaid';

async function migrateTwoFactorField() {
  try {
    await mongoose.connect(`${MONGODB_URI}/${MONGODB_DB_NAME}`);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const customersCollection = db.collection('customers');

    // Find all customers without the twoFactorEnabled field
    const customersWithoutField = await customersCollection.countDocuments({
      twoFactorEnabled: { $exists: false }
    });

    console.log(`\nFound ${customersWithoutField} customers without twoFactorEnabled field`);

    if (customersWithoutField === 0) {
      console.log('All customers already have the twoFactorEnabled field. No migration needed.');
      process.exit(0);
    }

    console.log('Adding twoFactorEnabled field to customers...');

    // Update all customers to have twoFactorEnabled: false by default
    const result = await customersCollection.updateMany(
      { twoFactorEnabled: { $exists: false } },
      {
        $set: {
          twoFactorEnabled: false
        }
      }
    );

    console.log(`\n✓ Migration completed successfully!`);
    console.log(`  - Matched: ${result.matchedCount} customers`);
    console.log(`  - Modified: ${result.modifiedCount} customers`);
    console.log(`  - All customers now have twoFactorEnabled field set to false\n`);

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

migrateTwoFactorField();
