const mongoose = require("mongoose");

// Import models directly from source
const { CustomerBalanceHistory } = require("../packages/db/src");

// MongoDB URI
const MONGODB_URI = "mongodb://localhost:27017/pg-prepaid";

async function testHistoryQuery() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find a customer ID that has history
    const historyRecords = await CustomerBalanceHistory.find().limit(1).lean();

    if (historyRecords.length === 0) {
      console.log("❌ No balance history records found");
      process.exit(1);
    }

    const customerId = historyRecords[0].customerId;
    console.log(`📋 Testing with customer ID: ${customerId}\n`);

    // Test 1: Query without populate
    console.log("Test 1: Query without populate");
    const historyWithoutPopulate = await CustomerBalanceHistory.find({
      customerId,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    console.log(`✅ Found ${historyWithoutPopulate.length} records`);
    if (historyWithoutPopulate.length > 0) {
      console.log("   Sample record:", {
        type: historyWithoutPopulate[0].type,
        amount: historyWithoutPopulate[0].amount,
        description: historyWithoutPopulate[0].description,
        metadata: historyWithoutPopulate[0].metadata,
      });
    }

    // Test 2: Try query with populate (might fail silently)
    console.log("\nTest 2: Query with populate on adminId");
    try {
      const historyWithPopulate = await CustomerBalanceHistory.find({
        customerId,
      })
        .populate("adminId", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      console.log(`✅ Found ${historyWithPopulate.length} records`);
      if (historyWithPopulate.length > 0) {
        console.log("   Sample record:", {
          type: historyWithPopulate[0].type,
          amount: historyWithPopulate[0].amount,
          adminId: historyWithPopulate[0].adminId,
        });
      }
    } catch (error) {
      console.log("❌ Populate failed:", error.message);
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

testHistoryQuery();
