import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbConnection } from '@pg-prepaid/db/connection';
import { Product } from '@pg-prepaid/db';

// GET all products for the organization
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnection.connect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const provider = searchParams.get('provider');

    let query: any = { orgId: session.orgId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { operatorName: { $regex: search, $options: 'i' } },
        { operatorCountry: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (provider) {
      query.provider = provider;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST - Create product
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      provider,
      providerProductId,
      operatorId,
      operatorName,
      operatorCountry,
      operatorLogo,
      costPrice,
      sellPrice,
      currency,
      denominationType,
      fixedAmount,
      minAmount,
      maxAmount,
      unit,
      status,
      category,
    } = body;

    // Validate required fields
    if (!name || !operatorName || !operatorCountry || !costPrice || !sellPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate sell price >= cost price
    if (sellPrice < costPrice) {
      return NextResponse.json({ error: 'Sell price must be greater than or equal to cost price' }, { status: 400 });
    }

    await dbConnection.connect();

    // Check for duplicate product
    const existing = await Product.findOne({
      orgId: session.orgId,
      name,
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A product with this name already exists' },
        { status: 409 }
      );
    }

    const product = await Product.create({
      orgId: session.orgId,
      name,
      description: description || '',
      provider: provider || 'dingconnect',
      providerProductId: providerProductId || `auto-${Date.now()}`,
      operatorId: operatorId || operatorName.toLowerCase().replace(/\s+/g, '-'),
      operatorName,
      operatorCountry,
      operatorLogo: operatorLogo || '',
      pricing: {
        costPrice: parseFloat(costPrice),
        sellPrice: parseFloat(sellPrice),
        currency: currency || 'USD',
        profitMargin: 0, // Will be calculated by pre-save hook
      },
      denomination: {
        type: denominationType || 'fixed',
        fixedAmount: fixedAmount ? parseFloat(fixedAmount) : 10,
        minAmount: minAmount ? parseFloat(minAmount) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
        unit: unit || 'USD',
      },
      status: status || 'active',
      metadata: {
        category: category || 'Mobile Top-up',
        tags: [],
        popularity: 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
