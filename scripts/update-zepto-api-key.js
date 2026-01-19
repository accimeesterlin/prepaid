const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const readline = require('readline');

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

function validateApiKey(apiKey) {
  const issues = [];

  // Check for non-ASCII characters
  for (let i = 0; i < apiKey.length; i++) {
    const code = apiKey.charCodeAt(i);
    if (code > 127) {
      issues.push(`Non-ASCII character at position ${i}: '${apiKey[i]}' (code: ${code})`);
    }
  }

  // Check for spaces
  if (apiKey.includes(' ')) {
    issues.push('Contains spaces (API keys typically should not have spaces)');
  }

  // Check for brackets or other suspicious characters
  if (/[{}\[\]()<>]/.test(apiKey)) {
    issues.push('Contains brackets or special characters that suggest it might be console output');
  }

  // Check minimum length (ZeptoMail keys are typically long)
  if (apiKey.length < 50) {
    issues.push(`Too short (${apiKey.length} characters) - ZeptoMail API keys are typically longer`);
  }

  return issues;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateApiKey() {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });

  const Integration = mongoose.model("Integration", new mongoose.Schema({}, { strict: false }));

  const primaryProvider = await Integration.findOne({
    isPrimaryEmail: true,
    status: 'active',
  });

  if (!primaryProvider) {
    console.error("❌ No primary email provider found");
    await mongoose.connection.close();
    rl.close();
    return;
  }

  console.log("\n=== Current ZeptoMail Integration ===");
  console.log("Provider:", primaryProvider.provider);
  console.log("From Email:", primaryProvider.credentials.fromEmail);
  console.log("From Name:", primaryProvider.credentials.fromName);
  console.log("\n⚠️  Current API Key (INVALID):");
  console.log(primaryProvider.credentials.apiKey);

  console.log("\n=== API Key Issues Detected ===");
  const issues = validateApiKey(primaryProvider.credentials.apiKey);
  issues.forEach(issue => console.log(`  ❌ ${issue}`));

  console.log("\n");
  console.log("To fix this, you need to:");
  console.log("1. Go to your ZeptoMail dashboard: https://www.zoho.com/zeptomail/");
  console.log("2. Navigate to Settings → Mail Agents → View");
  console.log("3. Copy your SMTP Password (this is your API key)");
  console.log("4. Paste it below\n");

  const newApiKey = await question("Enter your ZeptoMail API key (or 'cancel' to exit): ");

  if (newApiKey.toLowerCase() === 'cancel' || !newApiKey.trim()) {
    console.log("Operation cancelled.");
    await mongoose.connection.close();
    rl.close();
    return;
  }

  // Validate the new API key
  const newIssues = validateApiKey(newApiKey.trim());
  if (newIssues.length > 0) {
    console.log("\n⚠️  Warning: The new API key has potential issues:");
    newIssues.forEach(issue => console.log(`  ⚠️  ${issue}`));
    const confirm = await question("\nContinue anyway? (yes/no): ");
    if (confirm.toLowerCase() !== 'yes') {
      console.log("Operation cancelled.");
      await mongoose.connection.close();
      rl.close();
      return;
    }
  }

  // Update the API key
  primaryProvider.credentials.apiKey = newApiKey.trim();
  await primaryProvider.save();

  console.log("\n✅ API key updated successfully!");
  console.log("\nTesting the new API key...\n");

  // Test the new API key
  try {
    const response = await fetch('https://api.zeptomail.com/v1.1/email', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-enczapikey ${newApiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          address: primaryProvider.credentials.fromEmail,
          name: primaryProvider.credentials.fromName || 'No Reply',
        },
        to: [{
          email_address: {
            address: 'test@example.com',
          },
        }],
        subject: 'Test Email',
        htmlbody: '<p>Test</p>',
        textbody: 'Test',
      }),
    });

    console.log("=== Test Result ===");
    console.log("Status:", response.status, response.statusText);

    const responseText = await response.text();

    if (response.status === 400 && responseText.includes('Invalid recipient')) {
      console.log("✅ API key is valid! (The 400 error is expected because test@example.com is not a valid recipient)");
    } else if (!response.ok) {
      console.log("❌ API key test failed:");
      console.log(responseText);
    } else {
      console.log("✅ API key is valid and working!");
    }

  } catch (error) {
    console.error("❌ Error testing API key:", error.message);
  }

  await mongoose.connection.close();
  rl.close();

  console.log("\n✨ Done! You can now try inviting team members again.");
}

updateApiKey().catch(console.error);
