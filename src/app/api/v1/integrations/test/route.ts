import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbConnection } from '@pg-prepaid/db/connection';
import { Integration } from '@pg-prepaid/db';

// POST - Test integration connection
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, credentials, environment } = body;

    if (!provider || !credentials) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnection.connect();

    // Test connection based on provider
    let testResult;
    try {
      if (provider === 'dingconnect') {
        testResult = await testDingConnect(credentials, environment);
      } else if (provider === 'reloadly') {
        testResult = await testReloadly(credentials, environment);
      } else if (provider === 'zeptomail') {
        testResult = await testZeptoMail(credentials);
      } else {
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
      }

      // Update integration metadata with test success
      await Integration.findOneAndUpdate(
        { orgId: session.orgId, provider },
        {
          $set: {
            'metadata.lastTestSuccess': new Date(),
            status: 'active',
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Connection successful',
        data: testResult,
      });
    } catch (testError: any) {
      // Update integration metadata with test error
      await Integration.findOneAndUpdate(
        { orgId: session.orgId, provider },
        {
          $set: {
            'metadata.lastTestError': testError.message || 'Connection failed',
            status: 'error',
          },
        }
      );

      return NextResponse.json(
        {
          success: false,
          error: testError.message || 'Connection test failed',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Test integration error:', error);
    return NextResponse.json(
      { error: 'Failed to test integration' },
      { status: 500 }
    );
  }
}

// Test DingConnect connection
async function testDingConnect(credentials: any, _environment?: string) {
  // DingConnect only has production API
  const baseUrl = 'https://api.dingconnect.com';

  // Test with GetBalance endpoint to verify credentials
  const response = await fetch(`${baseUrl}/api/V1/GetBalance`, {
    method: 'GET',
    headers: {
      'api_key': credentials.apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DingConnect API error: ${response.status} - ${errorText || response.statusText}`);
  }

  const data = await response.json();

  // GetBalance returns: { "Balance": 0, "CurrencyCode": "USD" }
  return {
    balance: data.Balance || 0,
    currency: data.CurrencyCode || 'USD',
  };
}

// Test Reloadly connection
async function testReloadly(credentials: any, environment: string) {
  const baseUrl = environment === 'sandbox'
    ? 'https://topups-sandbox.reloadly.com'
    : 'https://topups.reloadly.com';

  // Get OAuth token first
  const tokenResponse = await fetch('https://auth.reloadly.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: 'client_credentials',
      audience: baseUrl,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to authenticate with Reloadly');
  }

  const tokenData = await tokenResponse.json();

  // Test with account balance endpoint
  const balanceResponse = await fetch(`${baseUrl}/accounts/balance`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!balanceResponse.ok) {
    throw new Error(`Reloadly API error: ${balanceResponse.statusText}`);
  }

  const balanceData = await balanceResponse.json();

  return {
    balance: balanceData.balance,
    currency: balanceData.currencyCode,
  };
}

// Test ZeptoMail connection
async function testZeptoMail(credentials: any) {
  const baseUrl = 'https://api.zeptomail.com/v1.1';

  // Test with a simple API call to verify credentials
  // Using the email/template endpoint with a GET request to check authentication
  const response = await fetch(`${baseUrl}/email`, {
    method: 'GET',
    headers: {
      'Authorization': credentials.apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `ZeptoMail API error: ${response.status}`;

    try {
      const errorData = JSON.parse(errorText);
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // If parsing fails, use the raw text
      if (errorText) {
        errorMessage = errorText;
      }
    }

    throw new Error(errorMessage);
  }

  // If successful, return success info
  return {
    success: true,
    fromEmail: credentials.fromEmail,
    message: 'ZeptoMail credentials verified successfully',
  };
}
