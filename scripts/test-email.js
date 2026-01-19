const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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

async function testEmail() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
    console.log('Connected to MongoDB\n');

    // Get the primary email integration
    const Integration = mongoose.model('Integration', new mongoose.Schema({}, { strict: false, collection: 'integrations' }));
    
    const primaryEmail = await Integration.findOne({ isPrimaryEmail: true, status: 'active' });
    
    if (!primaryEmail) {
      console.log('No primary email provider found!');
      await mongoose.connection.close();
      return;
    }

    console.log('Primary email provider:', primaryEmail.provider);
    console.log('From email:', primaryEmail.credentials?.fromEmail);
    console.log('API key exists:', !!primaryEmail.credentials?.apiKey);
    console.log('');

    if (primaryEmail.provider === 'zeptomail') {
      console.log('Testing ZeptoMail API...');
      
      const emailData = {
        from: {
          address: primaryEmail.credentials.fromEmail,
          name: primaryEmail.credentials.fromName || 'No Reply',
        },
        to: [
          {
            email_address: {
              address: 'tizely@forexzig.com',
            },
          },
        ],
        subject: 'Test Email from PG Prepaid',
        htmlbody: '<h1>Test Email</h1><p>This is a test email from your prepaid minutes platform.</p>',
        textbody: 'This is a test email from your prepaid minutes platform.',
      };

      console.log('Sending email to tizely@forexzig.com...');
      
      const response = await fetch('https://api.zeptomail.com/v1.1/email', {
        method: 'POST',
        headers: {
          'Authorization': primaryEmail.credentials.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('SUCCESS! Email sent:', result);
      } else {
        const error = await response.text();
        console.log('ERROR:', error);
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEmail();
