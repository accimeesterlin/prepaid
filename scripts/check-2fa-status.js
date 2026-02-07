/**
 * Quick script to check 2FA status in database
 * Run with: node scripts/check-2fa-status.js <customer-email>
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'pg-prepaid';

const CustomerSchema = new mongoose.Schema({
  email: String,
  twoFactorEnabled: Boolean,
  name: String,
}, { collection: 'customers' });

const Customer = mongoose.model('Customer', CustomerSchema);

async function checkTwoFactorStatus(email) {
  try {
    await mongoose.connect(`${MONGODB_URI}/${MONGODB_DB_NAME}`);
    console.log('Connected to MongoDB');

    const customer = await Customer.findOne({ email });

    if (!customer) {
      console.log(`Customer not found: ${email}`);
      process.exit(1);
    }

    console.log('\n=== Customer 2FA Status ===');
    console.log('Email:', customer.email);
    console.log('Name:', customer.name || 'N/A');
    console.log('2FA Enabled:', customer.twoFactorEnabled);
    console.log('Customer ID:', customer._id);
    console.log('===========================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/check-2fa-status.js <customer-email>');
  process.exit(1);
}

checkTwoFactorStatus(email);
