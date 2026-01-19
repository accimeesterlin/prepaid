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

async function testEmailSend() {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });

  const Integration = mongoose.model("Integration", new mongoose.Schema({}, { strict: false }));

  // Find the primary email provider
  const primaryProvider = await Integration.findOne({
    isPrimaryEmail: true,
    status: 'active',
  });

  if (!primaryProvider) {
    console.error("No primary email provider found");
    await mongoose.connection.close();
    return;
  }

  console.log("\n=== Primary Email Provider ===");
  console.log("Provider:", primaryProvider.provider);
  console.log("From Email:", primaryProvider.credentials.fromEmail);
  console.log("From Name:", primaryProvider.credentials.fromName);
  console.log("Has API Key:", !!primaryProvider.credentials.apiKey);
  console.log("API Key length:", primaryProvider.credentials.apiKey?.length);

  // Test ZeptoMail API call
  console.log("\n=== Testing ZeptoMail API ===");
  console.log("Attempting to send test email...");

  const emailPayload = {
    from: {
      address: primaryProvider.credentials.fromEmail,
      name: primaryProvider.credentials.fromName || 'No Reply',
    },
    to: [{
      email_address: {
        address: 'tizely@forexzig.com',
      },
    }],
    subject: 'Test Email from PG Prepaid',
    htmlbody: '<html><body><h2>Test Email</h2><p>This is a test email to diagnose the email sending issue.</p></body></html>',
    textbody: 'Test Email\n\nThis is a test email to diagnose the email sending issue.',
  };

  console.log("\nEmail Payload:", JSON.stringify(emailPayload, null, 2));

  try {
    const response = await fetch('https://api.zeptomail.com/v1.1/email', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-enczapikey ${primaryProvider.credentials.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    console.log("\n=== ZeptoMail Response ===");
    console.log("Status:", response.status, response.statusText);

    const responseText = await response.text();
    console.log("Response Body:", responseText);

    if (!response.ok) {
      console.error("\n❌ Email sending FAILED");
      console.error("Error details:", responseText);
    } else {
      console.log("\n✅ Email sent successfully!");
      try {
        const responseData = JSON.parse(responseText);
        console.log("Response data:", JSON.stringify(responseData, null, 2));
      } catch (e) {
        // Response wasn't JSON
      }
    }
  } catch (error) {
    console.error("\n❌ Error calling ZeptoMail API:", error.message);
    console.error("Stack:", error.stack);
  }

  await mongoose.connection.close();
}

testEmailSend().catch(console.error);
