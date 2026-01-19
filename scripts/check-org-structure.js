const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

const MONGODB_URI = envVars.MONGODB_URI;
const MONGODB_DB_NAME = envVars.MONGODB_DB_NAME;

// Schemas
const UserSchema = new mongoose.Schema({
  email: String,
  orgId: String,
  roles: [String],
}, { timestamps: true });

const OrganizationSchema = new mongoose.Schema({
  name: String,
  slug: String,
}, { timestamps: true });

const UserOrganizationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  orgId: String,
  roles: [String],
  isActive: Boolean,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Organization = mongoose.model('Organization', OrganizationSchema);
const UserOrganization = mongoose.model('UserOrganization', UserOrganizationSchema);

async function checkStructure() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
    console.log('✅ Connected to MongoDB\n');

    // Get all organizations
    const orgs = await Organization.find({});
    console.log('📊 Organizations Collection:');
    console.log('━'.repeat(80));
    orgs.forEach(org => {
      console.log(`  Name: ${org.name}`);
      console.log(`  ID: ${org._id}`);
      console.log(`  Slug: ${org.slug || 'N/A'}`);
      console.log('  ' + '─'.repeat(76));
    });

    // Get all UserOrganization records
    const userOrgs = await UserOrganization.find({});
    console.log('\n👥 UserOrganization Collection:');
    console.log('━'.repeat(80));
    
    const uniqueOrgIds = [...new Set(userOrgs.map(uo => uo.orgId))];
    console.log(`Found ${uniqueOrgIds.length} unique orgId values:\n`);
    
    uniqueOrgIds.forEach(orgId => {
      const count = userOrgs.filter(uo => uo.orgId === orgId).length;
      console.log(`  OrgID: ${orgId}`);
      console.log(`  Members: ${count}`);
      
      // Check if this orgId exists in Organizations collection
      const orgExists = orgs.find(o => o._id.toString() === orgId);
      console.log(`  Exists in Organizations: ${!!orgExists}`);
      if (orgExists) {
        console.log(`  Organization Name: ${orgExists.name}`);
      }
      console.log('  ' + '─'.repeat(76));
    });

    // Check current user session
    console.log('\n🔍 Sample Session Check:');
    console.log('━'.repeat(80));
    const sampleUser = await User.findOne({});
    if (sampleUser) {
      console.log(`  User Email: ${sampleUser.email}`);
      console.log(`  User.orgId: ${sampleUser.orgId}`);
      
      // Check if user.orgId points to Organization
      const org = await Organization.findById(sampleUser.orgId);
      console.log(`  Organization.findById(user.orgId): ${org ? 'FOUND ✓' : 'NOT FOUND ✗'}`);
      if (org) {
        console.log(`  Organization Name: ${org.name}`);
      }
      
      // Check UserOrganization for this user
      const userOrgRecords = await UserOrganization.find({ userId: sampleUser._id });
      console.log(`  UserOrganization records: ${userOrgRecords.length}`);
      userOrgRecords.forEach(uo => {
        console.log(`    - orgId: ${uo.orgId}, roles: ${uo.roles.join(', ')}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n🔌 Disconnected');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStructure();
