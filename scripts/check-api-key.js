const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Load environment variables
const envPath = path.join(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
envContent.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

const MONGODB_URI = envVars.MONGODB_URI;
const MONGODB_DB_NAME = envVars.MONGODB_DB_NAME;

async function checkApiKey() {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });

  const Integration = mongoose.model("Integration", new mongoose.Schema({}, { strict: false }));

  const primaryProvider = await Integration.findOne({
    isPrimaryEmail: true,
    status: 'active',
  });

  if (!primaryProvider) {
    console.error("No primary email provider found");
    await mongoose.connection.close();
    return;
  }

  const apiKey = primaryProvider.credentials.apiKey;

  console.log("API Key analysis:");
  console.log("Length:", apiKey.length);
  console.log("Full key:", apiKey);
  console.log("\nCharacter codes around position 48:");

  for (let i = 40; i < Math.min(60, apiKey.length); i++) {
    const char = apiKey[i];
    const code = apiKey.charCodeAt(i);
    console.log(`  [${i}]: '${char}' (code: ${code}) ${code > 127 ? '← NON-ASCII!' : ''}`);
  }

  console.log("\nChecking for problematic characters:");
  for (let i = 0; i < apiKey.length; i++) {
    const code = apiKey.charCodeAt(i);
    if (code > 127) {
      console.log(`  Position ${i}: '${apiKey[i]}' (code: ${code})`);
    }
  }

  await mongoose.connection.close();
}

checkApiKey().catch(console.error);
