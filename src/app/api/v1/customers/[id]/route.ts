import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbConnection } from '@pg-prepaid/db/connection';
import { Customer } from '@pg-prepaid/db';

// GET single customer
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnection.connect();

    const customer = await Customer.findOne({
      _id: id,
      orgId: session.orgId,
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

// PUT - Update customer
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { phoneNumber, email, name, country } = body;

    await dbConnection.connect();

    const customer = await Customer.findOne({
      _id: id,
      orgId: session.orgId,
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (phoneNumber) customer.phoneNumber = phoneNumber;
    if (email !== undefined) customer.email = email;
    if (name !== undefined) customer.name = name;
    if (country !== undefined) customer.country = country;

    await customer.save();

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

// DELETE customer
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnection.connect();

    const customer = await Customer.findOneAndDelete({
      _id: id,
      orgId: session.orgId,
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
