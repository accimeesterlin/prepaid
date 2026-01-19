const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { SendMailClient } = require("zeptomail");

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

async function testStoredCredentials() {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });

  const Integration = mongoose.model("Integration", new mongoose.Schema({}, { strict: false }));

  // Find ZeptoMail integration
  const zeptomail = await Integration.findOne({
    provider: 'zeptomail',
    status: 'active',
  });

  if (!zeptomail) {
    console.error("❌ No ZeptoMail integration found in database");
    await mongoose.connection.close();
    return;
  }

  console.log("\n=== ZeptoMail Integration Found ===");
  console.log("Organization ID:", zeptomail.orgId);
  console.log("Status:", zeptomail.status);
  console.log("Is Primary Email:", zeptomail.isPrimaryEmail);
  console.log("\n=== Credentials ===");
  console.log("From Email:", zeptomail.credentials.fromEmail);
  console.log("From Name:", zeptomail.credentials.fromName);
  console.log("API Key Length:", zeptomail.credentials.apiKey?.length);
  console.log("API Key (first 20 chars):", zeptomail.credentials.apiKey?.substring(0, 20) + '...');
  console.log("API Key (last 20 chars):", '...' + zeptomail.credentials.apiKey?.substring(zeptomail.credentials.apiKey.length - 20));

  // Check for invalid characters
  const apiKey = zeptomail.credentials.apiKey;
  let hasInvalidChars = false;
  for (let i = 0; i < apiKey.length; i++) {
    const code = apiKey.charCodeAt(i);
    if (code > 127) {
      console.log(`\n⚠️  Invalid character at position ${i}: '${apiKey[i]}' (code: ${code})`);
      hasInvalidChars = true;
    }
  }

  if (!hasInvalidChars) {
    console.log("\n✅ No invalid characters found in API key");
  }

  // Test with ZeptoMail API
  console.log("\n=== Testing with ZeptoMail API ===");
  console.log("Sending test email...\n");

  try {
    // Initialize ZeptoMail client with API token
    const client = new SendMailClient({ url: 'api.zeptomail.com/', token: apiKey.trim() });

    // Send email using the official SDK
    const response = await client.sendMail({
      from: {
        address: zeptomail.credentials.fromEmail,
        name: zeptomail.credentials.fromName || 'Test',
      },
      to: [{
        email_address: {
          address: 'test@example.com',
        },
      }],
      subject: 'Database Credentials Test',
      htmlbody: '<p>Testing stored credentials</p>',
      textbody: 'Testing stored credentials',
    });

    console.log("Response:", response);
    console.log("\n✅ SUCCESS! Stored credentials work correctly.");
  } catch (error) {
    console.error("\n❌ FAILED! Stored credentials are invalid.");
    console.error("Error:", error.message);
    console.log("\nThis means the credentials in the database are NOT the same as your working CRM credentials.");
    console.log("\nPlease:");
    console.log("1. Go to Dashboard → Integrations → ZeptoMail");
    console.log("2. Click 'Reconfigure'");
    console.log("3. Copy the EXACT token from your CRM settings");
    console.log("4. Paste it carefully (watch for extra spaces)");
    console.log("5. Click 'Save Configuration'");
  }

  await mongoose.connection.close();
}

testStoredCredentials().catch(console.error);
