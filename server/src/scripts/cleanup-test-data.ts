import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Wishlist } from '../models/Wishlist.js';
import { Newsletter } from '../models/Newsletter.js';
import { Product } from '../models/Product.js';
import { InventoryLog } from '../models/InventoryLog.js';
import { AuditLog } from '../models/AuditLog.js';
import { env } from '../config/env.js';

export const GENUINE_EMAILS = new Set([
  'vullerumahesh14@gmail.com',
  'admin@firedupcoffee.com',
  'customer@gmail.com',
  'wholesale@gmail.com',
  'sarah@example.com',
  'orders@artisanroasters.com',
  'cafe@highlandbrew.com',
]);

const TEST_EMAIL_PATTERNS = [
  /cust\.a\./i,
  /cust\.b\./i,
  /cafe\.apex\./i,
  /admin\.ws\./i,
  /rejected\.ws\./i,
  /ineligible\./i,
  /unauthorized\./i,
  /temp\.admin\./i,
  /malicious\./i,
  /test\./i,
  /\.\d{10,}@/i,
];

export async function cleanupTestData() {
  if (env.NODE_ENV === 'production') {
    throw new Error('FATAL: Test cleanup script cannot run in production environment!');
  }

  console.log('\n--- FIREDUP COFFEE: SAFE DEVELOPMENT TEST DATA CLEANUP ---');

  const allUsers = await User.find();
  const genuineUsers: string[] = [];
  const testUserIds: any[] = [];
  const testUserEmails: string[] = [];

  for (const user of allUsers) {
    const emailLower = user.email.toLowerCase();
    if (GENUINE_EMAILS.has(emailLower)) {
      genuineUsers.push(emailLower);
      continue;
    }

    const isTestAccount = TEST_EMAIL_PATTERNS.some((pattern) => pattern.test(emailLower));
    if (isTestAccount) {
      testUserIds.push(user._id);
      testUserEmails.push(emailLower);
    } else {
      // Unrecognized accounts are preserved by default for safety
      genuineUsers.push(emailLower);
    }
  }

  console.log(`Preserved Genuine Accounts (${genuineUsers.length}):\n  - ${genuineUsers.join('\n  - ')}`);
  console.log(`Identified Test Fixture Accounts to Clean (${testUserEmails.length}):\n  - ${testUserEmails.join('\n  - ')}`);

  if (testUserIds.length > 0) {
    // 1. Delete associated orders
    const deletedOrdersResult = await Order.deleteMany({ userId: { $in: testUserIds } });
    console.log(`✔ Cleaned ${deletedOrdersResult.deletedCount} test orders associated with test fixtures`);

    // 2. Delete associated carts
    const deletedCartsResult = await Cart.deleteMany({ userId: { $in: testUserIds } });
    console.log(`✔ Cleaned ${deletedCartsResult.deletedCount} test carts associated with test fixtures`);

    // 3. Delete associated wishlists
    const deletedWishlistsResult = await Wishlist.deleteMany({ userId: { $in: testUserIds } });
    console.log(`✔ Cleaned ${deletedWishlistsResult.deletedCount} test wishlists associated with test fixtures`);

    // 4. Delete test users
    const deletedUsersResult = await User.deleteMany({ _id: { $in: testUserIds } });
    console.log(`✔ Cleaned ${deletedUsersResult.deletedCount} test fixture user accounts`);

    // 5. Delete test newsletter subscriptions
    if (testUserEmails.length > 0) {
      const deletedNewsletterResult = await Newsletter.deleteMany({
        $or: [
          { email: { $in: testUserEmails } },
          { email: { $regex: /(?:cust\.|test\.|cafe\.apex|\.\d{10,}@)/i } }
        ]
      });
      console.log(`✔ Cleaned ${deletedNewsletterResult.deletedCount} test newsletter subscriptions`);
    }

    // 6. Delete test products
    const deletedProductsResult = await Product.deleteMany({
      $or: [
        { name: { $regex: /^test\s+/i } },
        { slug: { $regex: /^test-/i } },
      ],
    });
    if (deletedProductsResult.deletedCount > 0) {
      console.log(`✔ Cleaned ${deletedProductsResult.deletedCount} test products`);
    }

    // 7. Delete test inventory and audit logs
    const deletedInvLogs = await InventoryLog.deleteMany({
      $or: [
        { productName: { $regex: /^test\s+/i } },
        { 'actor.email': { $regex: /(?:cust\.|test\.|admin\.ws|temp\.admin|\.\d{10,}@)/i } },
      ],
    });
    if (deletedInvLogs.deletedCount > 0) {
      console.log(`✔ Cleaned ${deletedInvLogs.deletedCount} test inventory movement logs`);
    }

    const deletedAuditLogs = await AuditLog.deleteMany({
      'actor.email': { $regex: /(?:cust\.|test\.|admin\.ws|temp\.admin|\.\d{10,}@)/i },
    });
    if (deletedAuditLogs.deletedCount > 0) {
      console.log(`✔ Cleaned ${deletedAuditLogs.deletedCount} test audit logs`);
    }
  } else {
    console.log('✔ No test fixtures found. Database already clean.');
  }

  console.log('--- TEST DATA CLEANUP COMPLETE ---\n');
}

// Standalone execution
if (process.argv[1]?.endsWith('cleanup-test-data.ts') || process.argv[1]?.endsWith('cleanup-test-data.js')) {
  (async () => {
    try {
      await connectDB();
      await cleanupTestData();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('Error executing test cleanup:', err);
      process.exit(1);
    }
  })();
}

