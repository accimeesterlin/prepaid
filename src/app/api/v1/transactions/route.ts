import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbConnection } from '@pg-prepaid/db/connection';
import { Transaction } from '@pg-prepaid/db';

/**
 * GET /api/v1/transactions
 * Get all transactions for the organization
 */
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
    const excludeTestMode = searchParams.get('excludeTestMode') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = { orgId: session.orgId };

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'recipient.phoneNumber': { $regex: search, $options: 'i' } },
        { 'recipient.email': { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (excludeTestMode) {
      // Exclude test mode transactions (both by metadata flag and TEST- prefix in provider ID)
      query.$and = query.$and || [];
      query.$and.push({
        'metadata.testMode': { $ne: true },
        providerTransactionId: { $not: /^TEST-/ }
      });
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
