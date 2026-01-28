const mongoose = require("mongoose");

// Import models directly from source
const { Customer, CustomerBalanceHistory } = require("../packages/db/src");

// MongoDB URI from environment or default
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/pg-prepaid";

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

async function testBalanceHistory() {
  try {
    console.log("\n🔍 Testing balance history creation...\n");

    // Find a customer
    const customer = await Customer.findOne().sort({ createdAt: -1 });

    if (!customer) {
      console.log("❌ No customer found in database");
      process.exit(1);
    }

    console.log("📋 Customer found:");
    console.log(`   ID: ${customer._id}`);
    console.log(`   Phone: ${customer.phoneNumber}`);
    console.log(`   Current Balance: ${customer.currentBalance}`);
    console.log(`   Org ID: ${customer.orgId}\n`);

    // Check existing history
    const existingHistory = await CustomerBalanceHistory.find({
      customerId: customer._id,
    }).sort({ createdAt: -1 });

    console.log(`📚 Existing history records: ${existingHistory.length}`);
    if (existingHistory.length > 0) {
      console.log("   Latest record:");
      console.log(`   - Type: ${existingHistory[0].type}`);
      console.log(`   - Amount: ${existingHistory[0].amount}`);
      console.log(`   - Description: ${existingHistory[0].description}`);
      console.log(`   - Created: ${existingHistory[0].createdAt}\n`);
    } else {
      console.log("   No history records found\n");
    }

    // Test adding balance
    console.log("💰 Adding 100 units of balance...\n");
    await customer.addBalance(100, "Test balance addition", {
      adminId: "test-admin-id",
      notes: "Testing balance history creation",
    });

    // Check history again
    const newHistory = await CustomerBalanceHistory.find({
      customerId: customer._id,
    }).sort({ createdAt: -1 });

    console.log(
      `📚 History records after adding balance: ${newHistory.length}`,
    );
    if (newHistory.length > existingHistory.length) {
      console.log("✅ New history record created!");
      const latestRecord = newHistory[0];
      console.log("   - Type:", latestRecord.type);
      console.log("   - Amount:", latestRecord.amount);
      console.log("   - Previous Balance:", latestRecord.previousBalance);
      console.log("   - New Balance:", latestRecord.newBalance);
      console.log("   - Description:", latestRecord.description);
      console.log(
        "   - Metadata:",
        JSON.stringify(latestRecord.metadata, null, 2),
      );
    } else {
      console.log("❌ No new history record created!");
      console.log(
        "   This indicates the addBalance method is not creating history records.",
      );
    }

    // Verify customer balance was updated
    const updatedCustomer = await Customer.findById(customer._id);
    console.log(
      "\n💵 Updated customer balance:",
      updatedCustomer.currentBalance,
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

testBalanceHistory();
