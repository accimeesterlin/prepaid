const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

const MONGODB_URI = envVars.MONGODB_URI;
const MONGODB_DB_NAME = envVars.MONGODB_DB_NAME;

async function check() {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  const Organization = mongoose.model("Organization", new mongoose.Schema({}, { strict: false }));
  const UserOrganization = mongoose.model("UserOrganization", new mongoose.Schema({}, { strict: false }));
  
  const orgs = await Organization.find({});
  console.log("Organizations:", orgs.length);
  orgs.forEach(o => console.log("  -", o._id.toString(), o.name));
  
  const userOrgs = await UserOrganization.find({});
  const uniqueOrgIds = [...new Set(userOrgs.map(uo => uo.orgId))];
  console.log("\nUserOrganization orgIds:", uniqueOrgIds.length);
  uniqueOrgIds.forEach(id => console.log("  -", id));
  
  await mongoose.connection.close();
}
check();
