#!/usr/bin/env node

/**
 * Test script to debug primary email provider issue
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

const MONGODB_URI = envVars.MONGODB_URI;
const MONGODB_DB_NAME = envVars.MONGODB_DB_NAME;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// Integration Schema (simplified)
const IntegrationSchema = new mongoose.Schema(
  {
    orgId: String,
    provider: String,
    status: String,
    environment: String,
    isPrimaryEmail: { type: Boolean, default: false },
    credentials: {
      apiKey: { type: String, select: false },
      domain: String,
      fromEmail: String,
      fromName: String,
    },
    metadata: Object,
    settings: Object,
  },
  { timestamps: true }
);

const Integration = mongoose.model('Integration', IntegrationSchema);

async function testPrimaryEmail() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('   URI:', MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@'));
    console.log('   Database:', MONGODB_DB_NAME || 'default');

    await mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB_NAME,
    });

    console.log('✅ Connected to MongoDB\n');

    // 1. Find all integrations
    console.log('📋 All Integrations:');
    console.log('━'.repeat(80));
    const allIntegrations = await Integration.find({});

    if (allIntegrations.length === 0) {
      console.log('   ⚠️  No integrations found in database');
    } else {
      allIntegrations.forEach((integration) => {
        console.log(`   Provider: ${integration.provider}`);
        console.log(`   OrgID: ${integration.orgId}`);
        console.log(`   Status: ${integration.status}`);
        console.log(`   isPrimaryEmail: ${integration.isPrimaryEmail}`);
        console.log(`   ID: ${integration._id}`);
        console.log('   ' + '─'.repeat(76));
      });
    }

    console.log('\n📧 Email Providers Only:');
    console.log('━'.repeat(80));
    const emailProviders = await Integration.find({
      provider: { $in: ['zeptomail', 'mailgun', 'sendgrid', 'mailchimp'] },
    });

    if (emailProviders.length === 0) {
      console.log('   ⚠️  No email providers found');
    } else {
      emailProviders.forEach((integration) => {
        console.log(`   Provider: ${integration.provider}`);
        console.log(`   isPrimaryEmail: ${integration.isPrimaryEmail}`);
        console.log(`   Status: ${integration.status}`);
        console.log(`   From Email: ${integration.credentials?.fromEmail || 'N/A'}`);
        console.log(`   ID: ${integration._id}`);
        console.log('   ' + '─'.repeat(76));
      });
    }

    console.log('\n⭐ Primary Email Provider:');
    console.log('━'.repeat(80));
    const primaryProvider = await Integration.findOne({
      isPrimaryEmail: true,
    });

    if (!primaryProvider) {
      console.log('   ⚠️  No primary email provider set');
    } else {
      console.log(`   ✓ Provider: ${primaryProvider.provider}`);
      console.log(`   ✓ OrgID: ${primaryProvider.orgId}`);
      console.log(`   ✓ isPrimaryEmail: ${primaryProvider.isPrimaryEmail}`);
      console.log(`   ✓ Status: ${primaryProvider.status}`);
      console.log(`   ✓ ID: ${primaryProvider._id}`);
    }

    // 2. Test the exact query used by GET endpoint
    console.log('\n🔍 Simulating GET /api/v1/integrations query:');
    console.log('━'.repeat(80));

    // Get unique orgIds
    const orgIds = [...new Set(allIntegrations.map(i => i.orgId))];

    if (orgIds.length === 0) {
      console.log('   ⚠️  No organizations found');
    } else {
      for (const orgId of orgIds) {
        console.log(`\n   Organization: ${orgId}`);
        const orgIntegrations = await Integration.find({ orgId });

        orgIntegrations.forEach((integration) => {
          const safeIntegration = {
            id: integration._id,
            provider: integration.provider,
            status: integration.status,
            environment: integration.environment,
            isPrimaryEmail: integration.isPrimaryEmail || false,
            fromEmail: integration.credentials?.fromEmail,
            fromName: integration.credentials?.fromName,
          };

          console.log(`   → ${safeIntegration.provider}:`);
          console.log(`      isPrimaryEmail (raw): ${integration.isPrimaryEmail}`);
          console.log(`      isPrimaryEmail (|| false): ${safeIntegration.isPrimaryEmail}`);
          console.log(`      typeof: ${typeof integration.isPrimaryEmail}`);
          console.log(`      is undefined: ${integration.isPrimaryEmail === undefined}`);
          console.log(`      is null: ${integration.isPrimaryEmail === null}`);
        });
      }
    }

    // 3. Test if isPrimaryEmail field exists in schema
    console.log('\n📊 Schema Validation:');
    console.log('━'.repeat(80));
    const schemaFields = Object.keys(Integration.schema.paths);
    console.log(`   Total fields in schema: ${schemaFields.length}`);
    console.log(`   Has 'isPrimaryEmail' field: ${schemaFields.includes('isPrimaryEmail')}`);

    if (schemaFields.includes('isPrimaryEmail')) {
      const fieldDefinition = Integration.schema.paths.isPrimaryEmail;
      console.log(`   Field type: ${fieldDefinition.instance}`);
      console.log(`   Default value: ${fieldDefinition.defaultValue}`);
    }

    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testPrimaryEmail();
