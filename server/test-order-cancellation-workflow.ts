import { createApp } from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { Product } from './src/models/Product.js';
import { Order } from './src/models/Order.js';
import { User } from './src/models/User.js';
import { InventoryLog } from './src/models/InventoryLog.js';
import { AuditLog } from './src/models/AuditLog.js';

async function runOrderCancellationWorkflowTestSuite() {
  console.log('\n=================================================================');
  console.log('   FIREDUP SPECIALTY COFFEE — ORDER WORKFLOW & CANCELLATION TESTS');
  console.log('=================================================================\n');

  let server: any;
  const testPort = 5006;
  const baseUrl = `http://localhost:${testPort}/api/v1`;

  const testUserIds: string[] = [];
  const testOrderIds: string[] = [];

  const authHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    Cookie: `token=${token}`,
  });

  try {
    await connectDB();
    console.log('✔ [0/12] Database connection established');

    const app = createApp();
    server = app.listen(testPort);

    // 1. Setup Test Product
    let testProduct = await Product.findOne({ stockAvailable: { $gte: 20 } });
    if (!testProduct) {
      testProduct = await Product.create({
        name: 'Monsooned Malabar AA Reserve',
        slug: `monsooned-malabar-${Date.now()}`,
        category: 'single_origin',
        price: 580,
        rating: 4.8,
        reviewsCount: 24,
        image: '/images/malabar.jpg',
        roastLevel: 'Medium-Dark',
        tastingNotes: ['Earth', 'Dark Cocoa', 'Spices'],
        origin: 'Malabar Coast, Kerala',
        description: 'Distinctive cured monsoon processed beans.',
        stockAvailable: 50,
        publicationStatus: 'published',
      });
    }

    const baselineStock = testProduct.stockAvailable;
    console.log(`✔ [1/12] Test product ready: "${testProduct.name}" (Initial stock: ${baselineStock})`);

    // 2. Register Customer A
    const custAEmail = `cust.a.cancel.${Date.now()}@example.com`;
    const regCustARes = await fetch(`${baseUrl}/auth/register/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Rohan Retail Buyer',
        email: custAEmail,
        phone: '+91 98765 11111',
        password: 'Password123!',
        shippingAddress: {
          street: '14 Coffee Board Lane',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      }),
    });
    const custAData = await regCustARes.json();
    const custAToken = custAData.token;
    testUserIds.push(custAData.user.id);
    console.log(`✔ [2/12] Customer A registered (${custAEmail})`);

    // 3. Register Customer B (for isolation testing)
    const custBEmail = `cust.b.cancel.${Date.now()}@example.com`;
    const regCustBRes = await fetch(`${baseUrl}/auth/register/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sneha Isolation Tester',
        email: custBEmail,
        phone: '+91 98765 22222',
        password: 'Password123!',
        shippingAddress: {
          street: '45 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560025',
          country: 'India',
        },
      }),
    });
    const custBData = await regCustBRes.json();
    const custBToken = custBData.token;
    testUserIds.push(custBData.user.id);
    console.log(`✔ [3/12] Customer B registered (${custBEmail})`);

    // 4. Create Staff Account
    const staffEmail = `staff.roaster.${Date.now()}@example.com`;
    const staffUser = await User.create({
      name: 'Praveen Roastery Master',
      email: staffEmail,
      phone: '+91 98765 33333',
      password: 'Password123!',
      role: 'staff',
    });
    testUserIds.push(staffUser._id.toString());

    const staffLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: staffEmail, password: 'Password123!' }),
    });
    const staffData = await staffLoginRes.json();
    if (!staffLoginRes.ok || !staffData.token) {
      throw new Error(`Staff login failed: ${JSON.stringify(staffData)}`);
    }
    const staffToken = staffData.token;
    console.log(`✔ [4/12] Roastery Staff account created and authenticated (${staffEmail})`);

    // 5. Create Admin Account
    const adminEmail = `admin.cancellation.${Date.now()}@example.com`;
    const adminUser = await User.create({
      name: 'Deepa Roastery Director',
      email: adminEmail,
      phone: '+91 98765 44444',
      password: 'Password123!',
      role: 'admin',
    });
    testUserIds.push(adminUser._id.toString());

    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'Password123!' }),
    });
    const adminData = await adminLoginRes.json();
    if (!adminLoginRes.ok || !adminData.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminData)}`);
    }
    const adminToken = adminData.token;
    console.log(`✔ [5/12] Admin account created and authenticated (${adminEmail})`);

    // 6. Customer A adds item to cart and places Order 1 (Retail, 2 bags)
    const addCartRes1 = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: authHeaders(custAToken),
      body: JSON.stringify({
        productId: testProduct._id.toString(),
        quantity: 2,
        grind: 'Espresso',
        size: '250g',
      }),
    });
    if (!addCartRes1.ok) {
      throw new Error(`Failed to add item to Customer A cart for Order 1: ${await addCartRes1.text()}`);
    }

    const placeOrderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: authHeaders(custAToken),
      body: JSON.stringify({
        shippingAddress: {
          contactName: 'Rohan Retail Buyer',
          street: '14 Coffee Board Lane',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
          phone: '+91 98765 11111',
        },
        paymentMethod: 'card',
      }),
    });
    const order1Data = await placeOrderRes.json();
    if (!order1Data.success || !order1Data.order) {
      throw new Error(`Failed to place order 1: ${JSON.stringify(order1Data)}`);
    }
    const order1Id = order1Data.order._id || order1Data.order.id;
    testOrderIds.push(order1Id);

    // Verify stock decremented by 2
    const productAfterOrder1 = await Product.findById(testProduct._id);
    if (!productAfterOrder1 || productAfterOrder1.stockAvailable !== baselineStock - 2) {
      throw new Error(`Expected stock ${baselineStock - 2}, got ${productAfterOrder1?.stockAvailable}`);
    }
    console.log(`✔ [6/12] Order 1 placed (#${order1Data.order.orderNumber}), stock decremented: ${baselineStock} -> ${productAfterOrder1.stockAvailable}`);

    // 7. Customer A requests cancellation on Order 1
    const cancelReq1Res = await fetch(`${baseUrl}/orders/${order1Id}/cancel`, {
      method: 'POST',
      headers: authHeaders(custAToken),
      body: JSON.stringify({ reason: 'Accidentally ordered Espresso grind instead of French Press' }),
    });
    const cancelReq1Data = await cancelReq1Res.json();
    if (!cancelReq1Data.success || cancelReq1Data.order.cancellationStatus !== 'requested') {
      throw new Error(`Cancellation request failed: ${JSON.stringify(cancelReq1Data)}`);
    }
    console.log(`✔ [7/12] Customer A submitted cancellation request on eligible Order 1 (cancellationStatus: "requested")`);

    // 8. Test Duplicate cancellation request
    const duplicateCancelRes = await fetch(`${baseUrl}/orders/${order1Id}/cancel`, {
      method: 'POST',
      headers: authHeaders(custAToken),
      body: JSON.stringify({ reason: 'Duplicate attempt' }),
    });
    if (duplicateCancelRes.status !== 400) {
      throw new Error(`Expected status 400 on duplicate cancellation request, got ${duplicateCancelRes.status}`);
    }
    console.log('✔ [8/12] Duplicate cancellation request correctly rejected (400 Bad Request)');

    // 9. Test Cross-account unauthorized cancellation (Customer B tries to cancel Order 1)
    const unauthorizedCancelRes = await fetch(`${baseUrl}/orders/${order1Id}/cancel`, {
      method: 'POST',
      headers: authHeaders(custBToken),
      body: JSON.stringify({ reason: 'Hacking attempt' }),
    });
    if (unauthorizedCancelRes.status !== 404 && unauthorizedCancelRes.status !== 403) {
      throw new Error(`Expected 404 or 403 on cross-account cancellation, got ${unauthorizedCancelRes.status}`);
    }
    console.log('✔ [9/12] Cross-account unauthorized cancellation blocked (404 Not Found / 403 Forbidden)');

    // 10. Admin approves cancellation on Order 1
    // Mark payment as 'paid' first to verify payment transition to 'refund_pending'
    await Order.findByIdAndUpdate(order1Id, { paymentStatus: 'paid' });

    const adminApproveRes = await fetch(`${baseUrl}/admin/orders/${order1Id}/cancellation`, {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({
        decision: 'approve',
        reason: 'Customer requested grind change before roast batch started. Restoring stock.',
      }),
    });
    const adminApproveData = await adminApproveRes.json();
    if (!adminApproveData.success) {
      throw new Error(`Admin approve cancellation failed: ${JSON.stringify(adminApproveData)}`);
    }

    // Verify Order 1 updated fields
    const updatedOrder1 = await Order.findById(order1Id);
    if (!updatedOrder1) throw new Error('Order 1 not found in DB');
    if (updatedOrder1.orderStatus !== 'cancelled') {
      throw new Error(`Expected orderStatus 'cancelled', got '${updatedOrder1.orderStatus}'`);
    }
    if (updatedOrder1.cancellationStatus !== 'approved') {
      throw new Error(`Expected cancellationStatus 'approved', got '${updatedOrder1.cancellationStatus}'`);
    }
    if (updatedOrder1.paymentStatus !== 'refund_pending') {
      throw new Error(`Expected paymentStatus 'refund_pending', got '${updatedOrder1.paymentStatus}'`);
    }
    if (updatedOrder1.inventoryRestored !== true) {
      throw new Error('Expected inventoryRestored to be true');
    }

    // Verify stock restored exactly once
    const productAfterRestore = await Product.findById(testProduct._id);
    if (!productAfterRestore || productAfterRestore.stockAvailable !== baselineStock) {
      throw new Error(`Expected stock restored to ${baselineStock}, got ${productAfterRestore?.stockAvailable}`);
    }

    // Verify InventoryLog was written
    const invLog = await InventoryLog.findOne({ orderId: updatedOrder1._id });
    if (!invLog) {
      throw new Error('Expected InventoryLog entry for cancellation restock');
    }

    // Verify AuditLog was written
    const auditLog = await AuditLog.findOne({ resourceId: updatedOrder1._id.toString() });
    if (!auditLog) {
      throw new Error('Expected AuditLog entry for admin cancellation decision');
    }

    console.log(`✔ [10/12] Admin approved cancellation: Order status="cancelled", payment="refund_pending", stock restored: ${baselineStock - 2} -> ${productAfterRestore.stockAvailable}, InventoryLog & AuditLog verified`);

    // 11. Test Order 2 Fulfillment Workflow & Ineligible Cancellation:
    // Customer A adds item to cart and places Order 2 (1 bag)
    const addCartRes2 = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: authHeaders(custAToken),
      body: JSON.stringify({
        productId: testProduct._id.toString(),
        quantity: 1,
        grind: 'Whole Bean',
        size: '250g',
      }),
    });
    if (!addCartRes2.ok) {
      throw new Error(`Failed to add item to Customer A cart for Order 2: ${await addCartRes2.text()}`);
    }

    const placeOrder2Res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: authHeaders(custAToken),
      body: JSON.stringify({
        shippingAddress: {
          contactName: 'Rohan Retail Buyer',
          street: '14 Coffee Board Lane',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      }),
    });
    const order2Data = await placeOrder2Res.json();
    const order2Id = order2Data.order._id || order2Data.order.id;
    testOrderIds.push(order2Id);

    // Staff advances Order 2: received -> processing
    const staffProcRes = await fetch(`${baseUrl}/staff/fulfillment/${order2Id}/status`, {
      method: 'PATCH',
      headers: authHeaders(staffToken),
      body: JSON.stringify({ status: 'processing', note: 'Allocated green beans' }),
    });
    if (!staffProcRes.ok) throw new Error('Staff failed to advance to processing');

    // Staff advances Order 2: processing -> roasting
    const staffRoastRes = await fetch(`${baseUrl}/staff/fulfillment/${order2Id}/status`, {
      method: 'PATCH',
      headers: authHeaders(staffToken),
      body: JSON.stringify({ status: 'roasting', note: 'Batch loaded into drum roaster' }),
    });
    if (!staffRoastRes.ok) throw new Error('Staff failed to advance to roasting');

    // Customer tries to cancel Order 2 while in 'roasting' -> must be rejected (400)
    const cancelIneligibleRes = await fetch(`${baseUrl}/orders/${order2Id}/cancel`, {
      method: 'POST',
      headers: authHeaders(custAToken),
      body: JSON.stringify({ reason: 'Changed my mind' }),
    });
    if (cancelIneligibleRes.status !== 400) {
      throw new Error(`Expected 400 when cancelling roasting order, got ${cancelIneligibleRes.status}`);
    }
    const cancelIneligibleData = await cancelIneligibleRes.json();
    console.log(`✔ [11/12] Ineligible cancellation correctly blocked in "roasting" state: "${cancelIneligibleData.error}"`);

    // Staff advances Order 2: roasting -> packed -> dispatched with tracking
    await fetch(`${baseUrl}/staff/fulfillment/${order2Id}/status`, {
      method: 'PATCH',
      headers: authHeaders(staffToken),
      body: JSON.stringify({ status: 'packed', note: 'Bags sealed and degassed' }),
    });

    const staffDispatchRes = await fetch(`${baseUrl}/staff/fulfillment/${order2Id}/status`, {
      method: 'PATCH',
      headers: authHeaders(staffToken),
      body: JSON.stringify({
        status: 'dispatched',
        courierName: 'BlueDart Express',
        trackingNumber: 'BLU-TEST-982173',
        trackingUrl: 'https://track.bluedart.com/awb=BLU-TEST-982173',
        estimatedDeliveryDate: '2026-10-22',
        note: 'Courier pickup confirmed',
      }),
    });
    const staffDispatchData = await staffDispatchRes.json();
    if (!staffDispatchData.success || staffDispatchData.order.orderStatus !== 'dispatched') {
      throw new Error('Staff dispatch with tracking failed');
    }

    // Verify staff role safety: Staff attempting to cancel or refund order directly returns 403 Forbidden
    const staffForbiddenCancelRes = await fetch(`${baseUrl}/admin/orders/${order2Id}/cancellation`, {
      method: 'POST',
      headers: authHeaders(staffToken),
      body: JSON.stringify({ decision: 'approve', reason: 'Staff unauthorized cancel' }),
    });
    if (staffForbiddenCancelRes.status !== 403) {
      throw new Error(`Expected 403 when staff attempts cancellation, got ${staffForbiddenCancelRes.status}`);
    }

    const staffForbiddenStatusRes = await fetch(`${baseUrl}/admin/orders/${order2Id}/status`, {
      method: 'PATCH',
      headers: authHeaders(staffToken),
      body: JSON.stringify({ orderStatus: 'cancelled' }),
    });
    if (staffForbiddenStatusRes.status !== 403) {
      throw new Error(`Expected 403 when staff attempts status update to cancelled, got ${staffForbiddenStatusRes.status}`);
    }

    // 12. Admin rejects cancellation request with reason on Order 3
    const addCartRes3 = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: authHeaders(custAToken),
      body: JSON.stringify({
        productId: testProduct._id.toString(),
        quantity: 1,
        grind: 'Pour Over',
        size: '500g',
      }),
    });
    if (!addCartRes3.ok) {
      throw new Error(`Failed to add item to Customer A cart for Order 3: ${await addCartRes3.text()}`);
    }

    const placeOrder3Res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: authHeaders(custAToken),
      body: JSON.stringify({
        shippingAddress: {
          contactName: 'Rohan Retail Buyer',
          street: '14 Coffee Board Lane',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      }),
    });
    const order3Data = await placeOrder3Res.json();
    const order3Id = order3Data.order._id || order3Data.order.id;
    testOrderIds.push(order3Id);

    // Customer requests cancellation
    await fetch(`${baseUrl}/orders/${order3Id}/cancel`, {
      method: 'POST',
      headers: authHeaders(custAToken),
      body: JSON.stringify({ reason: 'Requesting cancellation before shipment' }),
    });

    // Admin rejects cancellation
    const adminRejectRes = await fetch(`${baseUrl}/admin/orders/${order3Id}/cancellation`, {
      method: 'POST',
      headers: authHeaders(adminToken),
      body: JSON.stringify({
        decision: 'reject',
        reason: 'Specialty lot allocation has been committed to roaster cycle',
      }),
    });
    const adminRejectData = await adminRejectRes.json();
    if (!adminRejectData.success || adminRejectData.order.cancellationStatus !== 'rejected') {
      throw new Error('Admin cancellation rejection failed');
    }

    const order3AfterReject = await Order.findById(order3Id);
    if (!order3AfterReject || order3AfterReject.orderStatus === 'cancelled') {
      throw new Error('Order 3 should remain active in fulfillment pipeline, not cancelled');
    }

    console.log(`✔ [12/12] Staff role boundary strictly enforced (403 Forbidden for cancellation/refunds) & Admin rejection verified (order remains in fulfillment, cancellationStatus: "rejected")`);

    console.log('\n=================================================================');
    console.log('   ALL 12 ORDER WORKFLOW & CANCELLATION TESTS PASSED HONESTLY!  ');
    console.log('=================================================================\n');
  } finally {
    // Clean up test fixtures
    console.log('[Cleanup] Cleaning up created test users and orders...');
    if (testOrderIds.length > 0) {
      await Order.deleteMany({ _id: { $in: testOrderIds } });
      await InventoryLog.deleteMany({ orderId: { $in: testOrderIds } });
    }
    if (testUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: testUserIds } });
    }

    if (server) {
      server.close();
    }
    await disconnectDB();
    console.log('[Cleanup] Finished test cleanup.\n');
  }
}

runOrderCancellationWorkflowTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});

