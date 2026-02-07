import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbConnection } from '@pg-prepaid/db/connection';
import { Customer } from '@pg-prepaid/db';

// GET all customers for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnection.connect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const favoritesOnly = searchParams.get('favorites') === 'true';
    const groupId = searchParams.get('groupId');

    const query: any = { orgId: session.orgId };

    // Filter by favorites
    if (favoritesOnly) {
      query.isFavorite = true;
    }

    // Filter by group
    if (groupId) {
      query.groups = groupId;
    }

    // Search filter
    if (search) {
      query.$or = [
        { phoneNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

// POST - Create customer
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, email, name, country } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    await dbConnection.connect();

    // Check if customer already exists
    const existing = await Customer.findOne({
      orgId: session.orgId,
      phoneNumber,
    });

    if (existing) {
      return NextResponse.json({ error: 'Customer with this phone number already exists' }, { status: 409 });
    }

    const customer = await Customer.create({
      orgId: session.orgId,
      phoneNumber,
      email,
      name,
      country,
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
