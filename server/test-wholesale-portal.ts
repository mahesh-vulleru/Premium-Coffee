import { createApp } from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { Product } from './src/models/Product.js';
import { provisionAdminAccount } from './src/scripts/provision-admin.js';
import { cleanupTestData } from './src/scripts/cleanup-test-data.js';

async function runWholesalePortalTestSuite() {
  console.log('\n======================================================');
  console.log('   FIREDUP COFFEE — WHOLESALE B2B FUNCTIONAL SUITE    ');
  console.log('======================================================\n');

  let server: any;
  const testPort = 5004;
  const baseUrl = `http://localhost:${testPort}/api/v1`;

  try {
    await connectDB();
    console.log('✔ [0/15] Database connection established');

    const app = createApp();
    server = app.listen(testPort);

    // Ensure a seed product with adequate inventory exists
    let testProduct = await Product.findOne({ stockAvailable: { $gte: 50 } });
    if (!testProduct) {
      testProduct = await Product.create({
        name: 'Monsooned Malabar Commercial Lot',
        category: 'espresso',
        price: 500, // 250g retail base price: ₹500. 1kg retail = ₹500 * 3.4 = ₹1,700
        rating: 4.9,
        reviewsCount: 45,
        image: '/images/malabar.jpg',
        tag: 'best_sellers',
        roastLevel: 'Medium',
        tastingNotes: ['Spices', 'Dark Chocolate', 'Earthy'],
        origin: 'Chikmagalur, Karnataka',
        description: 'Single-estate monsooned bean for commercial cafe espresso.',
        stockAvailable: 100, // 100 bags stock
      });
    }

    // 1. Register Wholesale Partner A
    const partnerEmail = `cafe.apex.${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/auth/register/wholesale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactName: 'Elena Rostova',
        businessName: 'Apex Roasters & Cafe',
        businessType: 'cafe',
        taxId: '29ABCDE1234F1Z5',
        monthlyVolumeKg: '50-100',
        email: partnerEmail,
        phone: '+91 98765 11223',
        password: 'Password123!',
        deliveryAddress: {
          street: '42 Commercial Boulevard, Dock 3',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      }),
    });
    const regData = await regRes.json();
    if (regRes.status !== 201 || !regData.token || regData.user.role !== 'wholesale') {
      throw new Error(`Wholesale registration failed: ${JSON.stringify(regData)}`);
    }
    const tokenPartner = regData.token;
    const partnerUserId = regData.user.id || regData.user._id;

    if (regData.user.wholesaleDetails?.status !== 'pending') {
      throw new Error(`Security breach: Wholesale user status defaulted to "${regData.user.wholesaleDetails?.status}" instead of "pending"!`);
    }
    console.log('✔ [1/15] Wholesale Registration: Successfully created account with role "wholesale" and status "pending"');

    // 2. Pending Applicant Access Block
    const pendingCatRes = await fetch(`${baseUrl}/wholesale/catalog`, {
      headers: { Authorization: `Bearer ${tokenPartner}` },
    });
    if (pendingCatRes.status !== 403) {
      throw new Error(`Security violation: Pending applicant accessed catalog! Got ${pendingCatRes.status}`);
    }

    const pendingCartRes = await fetch(`${baseUrl}/wholesale/cart`, {
      headers: { Authorization: `Bearer ${tokenPartner}` },
    });
    if (pendingCartRes.status !== 403) {
      throw new Error(`Security violation: Pending applicant accessed wholesale cart! Got ${pendingCartRes.status}`);
    }
    console.log('✔ [2/15] Pending Security: Commercial catalog and bulk cart strictly return 403 Forbidden for pending partners');

    // 3. Provision Admin and Approve Partner
    const adminEmail = `admin.ws.${Date.now()}@firedup.test`;
    await provisionAdminAccount({
      email: adminEmail,
      password: 'AdminPassword2026!',
      name: 'Operations Director',
      badge: 'Head of Commercial Roasting',
    });

    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'AdminPassword2026!' }),
    });
    const adminLoginData = await adminLoginRes.json();
    const tokenAdmin = adminLoginData.token;

    const approveRes = await fetch(`${baseUrl}/admin/wholesale/${partnerUserId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const approveData = await approveRes.json();
    if (approveRes.status !== 200 || approveData.user.wholesaleDetails.status !== 'approved') {
      throw new Error(`Admin approval failed: ${JSON.stringify(approveData)}`);
    }
    console.log('✔ [3/15] Admin Approval: Authorized administrator approved wholesale application');

    // 4. Approved Partner Fetches Commercial Catalog
    const catalogRes = await fetch(`${baseUrl}/wholesale/catalog`, {
      headers: { Authorization: `Bearer ${tokenPartner}` },
    });
    const catalogData = await catalogRes.json();
    if (catalogRes.status !== 200 || !Array.isArray(catalogData.items) || catalogData.items.length === 0) {
      throw new Error(`Catalog load failed: ${JSON.stringify(catalogData)}`);
    }

    const testItem = catalogData.items.find((i: any) => i._id === testProduct._id.toString());
    if (!testItem) {
      throw new Error(`Test product not found in wholesale catalog`);
    }
    // Retail kg = 500 * 3.4 = 1700. Wholesale 35% off = 1700 * 0.65 = 1105
    if (testItem.wholesalePricePerKg !== 1105) {
      throw new Error(`Wholesale price mismatch: expected 1105, got ${testItem.wholesalePricePerKg}`);
    }
    console.log(`✔ [4/15] Commercial Catalog: Returned verified products with 35% wholesale price (₹${testItem.wholesalePricePerKg}/kg)`);

    // 5. Volume Tier Calculations & Cart Operations
    // Add 1x 1kg bag (1kg total) -> Below 5kg MOQ
    const add1kgRes = await fetch(`${baseUrl}/wholesale/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenPartner}`,
      },
      body: JSON.stringify({
        productId: testProduct._id.toString(),
        size: '1kg',
        grind: 'Espresso',
        quantity: 1,
      }),
    });
    const add1kgData = await add1kgRes.json();
    if (add1kgRes.status !== 200 || add1kgData.cart.totalKg !== 1 || add1kgData.cart.isMoqMet !== false) {
      throw new Error(`1kg cart addition failed: ${JSON.stringify(add1kgData)}`);
    }
    console.log('✔ [5/15] Cart Operations: 1kg added; server correctly flags MOQ not met (total: 1kg / 5kg required)');

    // 6. Enforce MOQ on Order Placement (Cannot order < 5kg)
    const prematureOrderRes = await fetch(`${baseUrl}/wholesale/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenPartner}`,
      },
      body: JSON.stringify({
        paymentMethod: 'net_terms',
      }),
    });
    const prematureOrderData = await prematureOrderRes.json();
    if (prematureOrderRes.status !== 400 || !prematureOrderData.error.includes('minimum commercial volume')) {
      throw new Error(`MOQ violation bypass! Order under 5kg succeeded: ${JSON.stringify(prematureOrderData)}`);
    }
    console.log('✔ [6/15] Server-Enforced MOQ: Order submission rejected with 400 Bad Request when volume < 5kg');

    // 7. Update Cart to Meet Tier 2 (25kg: 5x 5kg bags)
    // 25kg unlocks: Tier 2 (35% off) and FREE Freight (25kg+ threshold)
    const cartItemId = add1kgData.cart.items[0]._id;
    // Remove 1kg item
    await fetch(`${baseUrl}/wholesale/cart/items/${cartItemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenPartner}` },
    });

    // Add 5x 5kg bags (25kg total)
    const add25kgRes = await fetch(`${baseUrl}/wholesale/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenPartner}`,
      },
      body: JSON.stringify({
        productId: testProduct._id.toString(),
        size: '5kg',
        grind: 'Commercial Bulk Grind',
        quantity: 5,
      }),
    });
    const add25kgData = await add25kgRes.json();
    if (add25kgRes.status !== 200 || add25kgData.cart.totalKg !== 25) {
      throw new Error(`25kg cart addition failed: ${JSON.stringify(add25kgData)}`);
    }

    if (!add25kgData.cart.freeShippingQualified || add25kgData.cart.shippingFee !== 0) {
      throw new Error(`Freight policy failure: 25kg order was charged shipping: ${add25kgData.cart.shippingFee}`);
    }
    if (add25kgData.cart.discountPercent !== 35) {
      throw new Error(`Volume tier error: 25kg should receive 35% discount, got ${add25kgData.cart.discountPercent}%`);
    }
    console.log('✔ [7/15] Volume Tier Engine: 25kg order unlocks Tier 2 (35% off) and FREE commercial freight (₹0)');

    // 8. Place Commercial Order with Net 15 Terms
    const stockBeforeOrder = (await Product.findById(testProduct._id))?.stockAvailable || 0;

    const orderRes = await fetch(`${baseUrl}/wholesale/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenPartner}`,
      },
      body: JSON.stringify({
        paymentMethod: 'net_terms',
        notes: 'Deliver to rear loading bay. Forklift on site.',
      }),
    });
    const orderData = await orderRes.json();
    if (orderRes.status !== 201 || !orderData.order.orderNumber) {
      throw new Error(`Wholesale order placement failed: ${JSON.stringify(orderData)}`);
    }
    const createdOrder = orderData.order;
    const orderId = createdOrder.id || createdOrder._id;

    if (createdOrder.paymentStatus !== 'terms_approved') {
      throw new Error(`Honest payment status failed: expected "terms_approved" for net terms, got "${createdOrder.paymentStatus}"`);
    }
    if (createdOrder.orderStatus !== 'received') {
      throw new Error(`Expected initial order status "received", got "${createdOrder.orderStatus}"`);
    }

    // Verify inventory deduction
    const stockAfterOrder = (await Product.findById(testProduct._id))?.stockAvailable || 0;
    if (stockAfterOrder !== stockBeforeOrder - 5) {
      throw new Error(`Inventory deduction failed: stock before was ${stockBeforeOrder}, stock after is ${stockAfterOrder}`);
    }

    // Verify cart was cleared
    const postOrderCartRes = await fetch(`${baseUrl}/wholesale/cart`, {
      headers: { Authorization: `Bearer ${tokenPartner}` },
    });
    const postOrderCartData = await postOrderCartRes.json();
    if (postOrderCartData.cart.items.length !== 0) {
      throw new Error(`Wholesale cart was not cleared after order placement!`);
    }
    console.log(`✔ [8/15] Wholesale Checkout: Order ${createdOrder.orderNumber} created under Net 15 terms with stock deduction and cart reset`);

    // 9. Official Tax Invoice Generation
    const invoiceRes = await fetch(`${baseUrl}/wholesale/orders/${orderId}/invoice`, {
      headers: { Authorization: `Bearer ${tokenPartner}` },
    });
    if (invoiceRes.status !== 200) {
      throw new Error(`Invoice generation failed with status ${invoiceRes.status}`);
    }
    const invoiceHtml = await invoiceRes.text();
    if (
      !invoiceHtml.includes('TAX INVOICE') ||
      !invoiceHtml.includes(createdOrder.orderNumber) ||
      !invoiceHtml.includes('29ABCDE1234F1Z5') ||
      !invoiceHtml.includes('Apex Roasters & Cafe')
    ) {
      throw new Error(`Invoice missing required tax and business elements!`);
    }
    console.log('✔ [9/15] Tax Invoices: Official printable Tax Invoice generated with correct order number, GSTIN, and line items');

    // 10. Cross-Account Order Protection
    const unauthorizedEmail = `cust.other.${Date.now()}@example.com`;
    const regCustRes = await fetch(`${baseUrl}/auth/register/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Third Party User',
        email: unauthorizedEmail,
        phone: '+91 91111 22222',
        password: 'Password123!',
        shippingAddress: {
          street: '99 Side St',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
        },
      }),
    });
    const regCustData = await regCustRes.json();
    if (regCustRes.status !== 201 || !regCustData.token) {
      throw new Error(`Customer registration failed: ${JSON.stringify(regCustData)}`);
    }
    const tokenOther = regCustData.token;

    const stealInvoiceRes = await fetch(`${baseUrl}/wholesale/orders/${orderId}/invoice`, {
      headers: { Authorization: `Bearer ${tokenOther}` },
    });
    if (stealInvoiceRes.status !== 403) {
      throw new Error(`Security breach: Unauthorized user accessed wholesale invoice! Got ${stealInvoiceRes.status}`);
    }
    console.log('✔ [10/15] Data Isolation: Cross-account invoice download strictly blocked (403 Forbidden)');

    // 11. Profile Update & Role Protection
    const profileUpdateRes = await fetch(`${baseUrl}/wholesale/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenPartner}`,
      },
      body: JSON.stringify({
        businessName: 'Apex Roasters Global Hub',
        phone: '+91 98765 99999',
        monthlyVolumeKg: '150',
        role: 'admin', // Malicious attempt to elevate role
        status: 'approved', // Malicious attempt to manipulate status
      }),
    });
    const profileUpdateData = await profileUpdateRes.json();
    if (profileUpdateRes.status !== 200 || profileUpdateData.user.wholesaleDetails.businessName !== 'Apex Roasters Global Hub') {
      throw new Error(`Profile update failed: ${JSON.stringify(profileUpdateData)}`);
    }
    if (profileUpdateData.user.role !== 'wholesale') {
      throw new Error(`Security exploit: User successfully escalated role via profile update!`);
    }
    console.log('✔ [11/15] Business Profile: Saved facility details while strictly preventing role and status tampering');

    // 12. Real Dashboard Aggregates Verification
    const dashRes = await fetch(`${baseUrl}/wholesale/dashboard`, {
      headers: { Authorization: `Bearer ${tokenPartner}` },
    });
    const dashData = await dashRes.json();
    if (dashRes.status !== 200 || !dashData.stats) {
      throw new Error(`Dashboard retrieval failed: ${JSON.stringify(dashData)}`);
    }
    if (dashData.stats.totalOrders !== 1 || dashData.stats.totalVolumeOrderedKg !== 25) {
      throw new Error(`Dashboard aggregate mismatch: expected 1 order with 25kg, got ${JSON.stringify(dashData.stats)}`);
    }
    console.log(`✔ [12/15] Real Backend Dashboard: Returned real order counts (1 order, ${dashData.stats.totalVolumeOrderedKg}kg, ₹${dashData.stats.totalSpent})`);

    // 13. Reorder Workflow
    const reorderRes = await fetch(`${baseUrl}/wholesale/orders/${orderId}/reorder`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenPartner}` },
    });
    const reorderData = await reorderRes.json();
    if (reorderRes.status !== 200 || reorderData.cart.items.length === 0) {
      throw new Error(`Reorder failed: ${JSON.stringify(reorderData)}`);
    }
    console.log('✔ [13/15] Reorder Engine: Re-validated stock and populated wholesale cart with previous order specifications');

    // 14. Admin Rejection with Recorded Operational Reason
    const applicant2Email = `ineligible.${Date.now()}@example.com`;
    const app2Res = await fetch(`${baseUrl}/auth/register/wholesale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactName: 'Samir Rao',
        businessName: 'Corner Coffee Kiosk',
        businessType: 'other',
        taxId: 'INVALID-TAX-ID',
        monthlyVolumeKg: '2',
        email: applicant2Email,
        phone: '+91 98888 77777',
        password: 'Password123!',
        deliveryAddress: {
          street: '10 Kiosk Street',
          city: 'Jaipur',
          state: 'Rajasthan',
          postalCode: '302001',
          country: 'India',
        },
      }),
    });
    const app2Data = await app2Res.json();
    if (app2Res.status !== 201 || !app2Data.user) {
      throw new Error(`Applicant 2 registration failed: ${JSON.stringify(app2Data)}`);
    }
    const app2UserId = app2Data.user.id || app2Data.user._id;
    const tokenApp2 = app2Data.token;

    const rejectRes = await fetch(`${baseUrl}/admin/wholesale/${app2UserId}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        reason: 'Monthly volume projection (2kg) does not satisfy the 5kg roastery minimum.',
      }),
    });
    const rejectData = await rejectRes.json();
    if (rejectRes.status !== 200 || rejectData.user.wholesaleDetails.status !== 'rejected') {
      throw new Error(`Admin rejection failed: ${JSON.stringify(rejectData)}`);
    }
    if (!rejectData.user.wholesaleDetails.rejectionReason.includes('5kg roastery minimum')) {
      throw new Error(`Rejection reason was not properly recorded!`);
    }

    const rejAccessRes = await fetch(`${baseUrl}/wholesale/catalog`, {
      headers: { Authorization: `Bearer ${tokenApp2}` },
    });
    if (rejAccessRes.status !== 403) {
      throw new Error(`Rejected user accessed commercial catalog! Got ${rejAccessRes.status}`);
    }
    console.log('✔ [14/15] Admin Rejection: Recorded custom rejection reason and strictly blocked commercial access (403)');

    // 15. Admin Status Progression on Wholesale Order
    const statusProgRes = await fetch(`${baseUrl}/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ orderStatus: 'roasting' }),
    });
    const statusProgData = await statusProgRes.json();
    if (statusProgRes.status !== 200 || statusProgData.order.orderStatus !== 'roasting') {
      throw new Error(`Order status update failed: ${JSON.stringify(statusProgData)}`);
    }
    console.log('✔ [15/15] Roastery Workflow: Order transitioned from "received" to "roasting" schedule by administrator');

    console.log('\n======================================================');
    console.log('   ALL 15/15 WHOLESALE FUNCTIONAL TESTS PASSED!       ');
    console.log('======================================================\n');
  } catch (error: any) {
    console.error('\n❌ Wholesale Test Suite Failed:', error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    try {
      await cleanupTestData();
    } catch (e) {
      console.warn('Test cleanup warning:', e);
    }
    await disconnectDB();
  }
}

runWholesalePortalTestSuite();
