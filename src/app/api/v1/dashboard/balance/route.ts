import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbConnection } from "@pg-prepaid/db/connection";
import { Integration } from "@pg-prepaid/db";
import { DingConnectService } from "@/lib/services/dingconnect.service";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnection.connect();

    // Find active provider integration (DingConnect or Reloadly)
    const integration = await Integration.findOne({
      orgId: session.orgId,
      provider: { $in: ["dingconnect", "reloadly"] },
      status: "active",
    }).select(
      "+credentials.apiKey +credentials.apiSecret +credentials.clientId +credentials.clientSecret",
    );

    if (!integration) {
      return NextResponse.json({
        provider: null,
        balance: null,
        currency: null,
        message: "No active provider integration found",
      });
    }

    let balance = null;
    let currency = null;
    let error = null;

    try {
      if (integration.provider === "dingconnect") {
        const dingService = new DingConnectService({
          apiKey: integration.credentials.apiKey!,
          baseUrl:
            integration.credentials.baseUrl || "https://api.dingconnect.com",
        });

        const balanceData = await dingService.getBalance();
        balance = balanceData.AccountBalance;
        currency = balanceData.CurrencyCode;

        // Update integration metadata with latest balance
        integration.metadata.accountBalance = balance;
        integration.metadata.accountCurrency = currency;
        integration.metadata.lastSync = new Date();
        await integration.save();

        logger.info("DingConnect balance fetched", {
          orgId: session.orgId,
          balance,
          currency,
        });
      } else if (integration.provider === "reloadly") {
        // Reloadly balance endpoint would go here
        // For now, return cached balance if available
        balance = integration.metadata.accountBalance || null;
        currency = integration.metadata.accountCurrency || "USD";
      }
    } catch (err: any) {
      error = err.message;
      logger.error("Failed to fetch provider balance", {
        orgId: session.orgId,
        provider: integration.provider,
        error: err.message,
      });

      // Return cached balance if available
      balance = integration.metadata.accountBalance || null;
      currency = integration.metadata.accountCurrency || null;
    }

    return NextResponse.json({
      provider: integration.provider,
      balance,
      currency,
      environment: integration.environment,
      lastSync: integration.metadata.lastSync,
      error,
    });
  } catch (error: any) {
    logger.error("Dashboard balance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance", details: error.message },
      { status: 500 },
    );
  }
}
