// Test ZeptoMail Send Mail Token
// Usage: node scripts/test-zeptomail-token.js

const readline = require('readline');
const { SendMailClient } = require('zeptomail');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function testZeptoMailToken() {
  console.log('\n=== ZeptoMail Token Tester ===\n');
  console.log('This script will test your ZeptoMail Send Mail Token.\n');

  const token = await question('Enter your ZeptoMail Send Mail Token: ');
  const fromEmail = await question('Enter your verified From Email: ');
  const testEmail = await question('Enter test email address to send to: ');

  console.log('\n--- Testing ZeptoMail API ---');
  console.log('Token length:', token.trim().length);
  console.log('From email:', fromEmail);
  console.log('Test email:', testEmail);
  console.log('\nSending test email...\n');

  try {
    // Initialize ZeptoMail client with API token
    const client = new SendMailClient({ url: 'api.zeptomail.com/', token: token.trim() });

    // Send email using the official SDK
    const response = await client.sendMail({
      from: {
        address: fromEmail,
        name: 'Test Sender',
      },
      to: [{
        email_address: {
          address: testEmail,
        },
      }],
      subject: 'ZeptoMail Token Test',
      htmlbody: '<h2>Success!</h2><p>Your ZeptoMail token is working correctly.</p>',
      textbody: 'Success! Your ZeptoMail token is working correctly.',
    });

    console.log('\n✅ SUCCESS! Token is valid and email was sent.');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('\nCheck your inbox at:', testEmail);
  } catch (error) {
    console.log('\n❌ FAILED! Token is invalid or there was an error.');
    console.log('Error:', error.message);

    console.log('\n⚠️  Troubleshooting steps:');
    console.log('1. Verify you copied the "Send Mail Token" from Mail Agent → SMTP/API');
    console.log('2. Generate a NEW token (old ones may be revoked)');
    console.log('3. Ensure your From Email domain is verified in ZeptoMail');
    console.log('4. Make sure you copied the entire token without extra spaces');
  }

  rl.close();
}

testZeptoMailToken();
