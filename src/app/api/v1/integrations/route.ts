import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbConnection } from '@pg-prepaid/db/connection';
import { Integration } from '@pg-prepaid/db';

// GET all integrations for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnection.connect();

    const integrations = await Integration.find({ orgId: session.orgId });

    // Don't return credentials for security (but baseUrl is okay as it's not sensitive)
    const safeIntegrations = integrations.map((integration) => ({
      id: integration._id,
      provider: integration.provider,
      status: integration.status,
      environment: integration.environment,
      baseUrl: integration.credentials?.baseUrl,
      metadata: integration.metadata,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    }));

    return NextResponse.json(safeIntegrations);
  } catch (error) {
    console.error('Get integrations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

// POST - Create or update integration
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, environment, credentials } = body;

    if (!provider || !environment || !credentials) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnection.connect();

    // Check if integration already exists
    let integration = await Integration.findOne({
      orgId: session.orgId,
      provider,
    }).select('+credentials.apiKey +credentials.apiSecret +credentials.clientId +credentials.clientSecret +credentials.baseUrl');

    if (integration) {
      // Update existing
      integration.environment = environment;
      integration.credentials = credentials;
      integration.status = 'active'; // Mark as active when saved
      await integration.save();
    } else {
      // Create new
      integration = await Integration.create({
        orgId: session.orgId,
        provider,
        environment,
        credentials,
        status: 'active', // Mark as active when saved
      });
    }

    return NextResponse.json({
      success: true,
      integration: {
        id: integration._id,
        provider: integration.provider,
        status: integration.status,
        environment: integration.environment,
      },
    });
  } catch (error) {
    console.error('Save integration error:', error);
    return NextResponse.json(
      { error: 'Failed to save integration' },
      { status: 500 }
    );
  }
}
