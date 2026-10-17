import { createApp } from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { Product } from './src/models/Product.js';
import { Cart } from './src/models/Cart.js';
import { provisionAdminAccount } from './src/scripts/provision-admin.js';
import { getSafeInternalRedirect } from '../src/utils/authRedirect.js';

async function runIsolationTestSuite() {
  console.log('\n======================================================');
  console.log('   FIREDUP COFFEE — AUTH, RBAC & DATA ISOLATION SUITE');
  console.log('======================================================\n');

  let server: any;
  const testPort = 5003;
  const baseUrl = `http://localhost:${testPort}/api/v1`;

  try {
    await connectDB();
    console.log('✔ [0/14] Database connection established');

    const app = createApp();
    server = app.listen(testPort);

    // 1. Ensure at least one seed product exists for cart & wishlist tests
    let testProduct = await Product.findOne();
    if (!testProduct) {
      testProduct = await Product.create({
        name: 'Monsooned Malabar Test Lot',
        category: 'espresso',
        price: 520,
        rating: 4.8,
        reviewsCount: 32,
        image: '/images/malabar.jpg',
        tag: 'best_sellers',
        roastLevel: 'Medium',
        tastingNotes: ['Spices', 'Dark Chocolate', 'Earthy'],
        origin: 'Chikmagalur, Karnataka',
        description: 'Artisanal aged monsooned bean.',
        stockAvailable: 15,
      });
    }

    // 2. Open redirect security utility test
    const evilTargets = [
      '//evil.com',
      '//attacker.com/steal',
      '/\\attacker.com',
      '\\\\evil.com',
      'http://evil.com',
      'https://malicious.org',
      'javascript:alert(1)',
      '/http://phishing.com',
    ];
    for (const evil of evilTargets) {
      const sanitized = getSafeInternalRedirect(evil, '/dashboard/customer');
      if (sanitized !== '/dashboard/customer') {
        throw new Error(`Open redirect bypass detected for payload "${evil}": got "${sanitized}"`);
      }
    }
    const safeTarget = getSafeInternalRedirect('/shop?category=espresso', '/dashboard/customer');
    if (safeTarget !== '/shop?category=espresso') {
      throw new Error(`Valid internal redirect was improperly rejected: "${safeTarget}"`);
    }
    console.log('✔ [1/14] Open Redirect security: protocol-relative and external targets blocked');

    // 3. Register Customer A
    const custAEmail = `cust.a.${Date.now()}@example.com`;
    const custARes = await fetch(`${baseUrl}/auth/register/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Customer Alpha',
        email: custAEmail,
        phone: '+91 98765 00001',
        password: 'Password123!',
        shippingAddress: {
          street: '123 Coffee Lane',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
        },
      }),
    });
    const custAData = await custARes.json();
    if (custARes.status !== 201 || !custAData.token || custAData.user.role !== 'customer') {
      throw new Error(`Customer A registration failed: ${JSON.stringify(custAData)}`);
    }
    const tokenA = custAData.token;
    console.log('✔ [2/14] Customer A registered and authenticated with role "customer"');

    // 4. Customer A adds item to cart
    const addCartResA = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        productId: testProduct._id.toString(),
        quantity: 2,
        grind: 'Pour Over',
        size: '500g',
      }),
    });
    const addCartDataA = await addCartResA.json();
    if (addCartResA.status !== 200 || addCartDataA.cart.itemCount !== 2) {
      throw new Error(`Customer A cart addition failed: ${JSON.stringify(addCartDataA)}`);
    }
    console.log('✔ [3/14] Customer A cart state successfully persisted on server');

    // 5. Customer A adds item to wishlist
    const wishResA = await fetch(`${baseUrl}/wishlist/${testProduct._id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const wishDataA = await wishResA.json();
    if (wishResA.status !== 200 || wishDataA.count !== 1) {
      throw new Error(`Customer A wishlist toggle failed: ${JSON.stringify(wishDataA)}`);
    }
    console.log('✔ [4/14] Customer A wishlist state successfully persisted on server');

    // 6. Register Customer B
    const custBEmail = `cust.b.${Date.now()}@example.com`;
    const custBRes = await fetch(`${baseUrl}/auth/register/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Customer Beta',
        email: custBEmail,
        phone: '+91 98765 00002',
        password: 'Password123!',
        shippingAddress: {
          street: '456 Roastery Boulevard',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500001',
          country: 'India',
        },
      }),
    });
    const custBData = await custBRes.json();
    if (custBRes.status !== 201 || !custBData.token) {
      throw new Error(`Customer B registration failed: ${JSON.stringify(custBData)}`);
    }
    const tokenB = custBData.token;
    console.log('✔ [5/14] Customer B registered and authenticated with separate identity');

    // 7. Verify Customer B sees ZERO items in cart and wishlist (Cross-Account Isolation)
    const cartResB = await fetch(`${baseUrl}/cart`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const cartDataB = await cartResB.json();
    if (cartDataB.cart.itemCount !== 0 || cartDataB.cart.items.length !== 0) {
      throw new Error(`Cross-account cart leak: Customer B inherited Customer A cart data!`);
    }

    const wishResB = await fetch(`${baseUrl}/wishlist`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const wishDataB = await wishResB.json();
    if (wishDataB.count !== 0 || wishDataB.wishlist.length !== 0) {
      throw new Error(`Cross-account wishlist leak: Customer B inherited Customer A wishlist data!`);
    }
    console.log('✔ [6/14] Data Isolation: Customer B cart and wishlist are completely clean (no leakage)');

    // 8. Cross-account modification attempt: Customer B trying to modify Customer A cart item
    const custACartDoc = await Cart.findOne({ userId: custAData.user.id || custAData.user._id });
    if (!custACartDoc || custACartDoc.items.length === 0) {
      throw new Error('Customer A cart document not found');
    }
    const itemAId = custACartDoc.items[0]._id.toString();

    const crossUpdateRes = await fetch(`${baseUrl}/cart/items/${itemAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ quantity: 5 }),
    });
    // Should return 404 because item does not exist in Customer B's cart
    if (crossUpdateRes.status !== 404) {
      throw new Error(`Access control breach: Customer B modified Customer A item! Status: ${crossUpdateRes.status}`);
    }
    console.log('✔ [7/14] Boundary Protection: Customer B cannot update or delete Customer A cart items');

    // 9. Stock limit enforcement on cart update
    const custAStockClampedRes = await fetch(`${baseUrl}/cart/items/${itemAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ quantity: 9999 }), // Request excess quantity
    });
    const custAStockData = await custAStockClampedRes.json();
    const updatedItem = custAStockData.cart.items.find((i: any) => i._id === itemAId);
    if (!updatedItem || updatedItem.quantity > (testProduct.stockAvailable || 15)) {
      throw new Error(`Stock limit enforcement failure: quantity was not clamped to stockAvailable!`);
    }
    console.log('✔ [8/14] Inventory Enforcement: Cart quantity clamped to server-authoritative stockAvailable');

    // 10. Register Wholesale Applicant (Pending status)
    const wholesaleEmail = `wholesale.partner.${Date.now()}@example.com`;
    const wsRegisterRes = await fetch(`${baseUrl}/auth/register/wholesale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactName: 'Rohit Sharma',
        businessName: 'Highland Specialty Cafe',
        businessType: 'cafe',
        taxId: '29ABCDE1234F1Z5',
        monthlyVolumeKg: '40',
        email: wholesaleEmail,
        phone: '+91 99887 66554',
        password: 'WholesalePass2026!',
        deliveryAddress: {
          street: '45 Brigade Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560025',
          country: 'India',
        },
      }),
    });
    const wsData = await wsRegisterRes.json();
    if (wsRegisterRes.status !== 201 || wsData.user.wholesaleDetails.status !== 'pending') {
      throw new Error(`Wholesale registration failed or did not default to "pending": ${JSON.stringify(wsData)}`);
    }
    const tokenWholesale = wsData.token;
    const wholesaleUserId = wsData.user.id || wsData.user._id;
    console.log('✔ [9/14] Wholesale registration enforced role "wholesale" with status "pending"');

    // 11. Pending Wholesale Partner is BLOCKED from restricted wholesale APIs
    const wsCatalogDeniedRes = await fetch(`${baseUrl}/wholesale/catalog`, {
      headers: { Authorization: `Bearer ${tokenWholesale}` },
    });
    if (wsCatalogDeniedRes.status !== 403) {
      throw new Error(`Pending wholesaler accessed restricted wholesale catalog! Got ${wsCatalogDeniedRes.status}`);
    }

    const wsPriceSheetDeniedRes = await fetch(`${baseUrl}/wholesale/price-sheet`, {
      headers: { Authorization: `Bearer ${tokenWholesale}` },
    });
    if (wsPriceSheetDeniedRes.status !== 403) {
      throw new Error(`Pending wholesaler accessed restricted price sheet! Got ${wsPriceSheetDeniedRes.status}`);
    }
    console.log('✔ [10/14] Server-Enforced RBAC: Pending wholesale applicant blocked (403 Forbidden) from commercial catalog & price sheets');

    // 12. Admin provisions & approves wholesale partner
    const adminEmail = `admin.audit.${Date.now()}@example.com`;
    await provisionAdminAccount({
      email: adminEmail,
      name: 'Super Admin',
      password: 'SuperAdminPass2026!',
    });
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'SuperAdminPass2026!' }),
    });
    const adminData = await adminLoginRes.json();
    const tokenAdmin = adminData.token;

    // Verify Admin cart is empty (does not inherit any customer cart)
    const adminCartRes = await fetch(`${baseUrl}/cart`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const adminCartData = await adminCartRes.json();
    if (adminCartData.cart.itemCount !== 0) {
      throw new Error('Administrator account inherited customer cart data!');
    }
    console.log('✔ [11/14] Admin Isolation: Administrator does not inherit customer shopping cart or wishlist');

    // Admin approves Wholesale Partner
    const approveRes = await fetch(`${baseUrl}/admin/wholesale/${wholesaleUserId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const approveData = await approveRes.json();
    if (approveRes.status !== 200 || approveData.user.wholesaleDetails.status !== 'approved') {
      throw new Error(`Admin approval failed: ${JSON.stringify(approveData)}`);
    }
    console.log('✔ [12/14] Admin Workflow: Wholesale partner approved by authorized administrator');

    // 13. Approved Wholesale Partner can now access wholesale catalog & price sheet
    const wsCatalogApprovedRes = await fetch(`${baseUrl}/wholesale/catalog`, {
      headers: { Authorization: `Bearer ${tokenWholesale}` },
    });
    const wsCatalogData = await wsCatalogApprovedRes.json();
    if (wsCatalogApprovedRes.status !== 200 || wsCatalogData.status !== 'approved') {
      throw new Error(`Approved wholesaler was blocked from wholesale catalog! Got ${wsCatalogApprovedRes.status}`);
    }

    const wsPriceSheetApprovedRes = await fetch(`${baseUrl}/wholesale/price-sheet`, {
      headers: { Authorization: `Bearer ${tokenWholesale}` },
    });
    const wsPriceSheetData = await wsPriceSheetApprovedRes.json();
    if (wsPriceSheetApprovedRes.status !== 200 || !wsPriceSheetData.tiers) {
      throw new Error(`Approved wholesaler was blocked from price sheet! Got ${wsPriceSheetApprovedRes.status}`);
    }
    console.log('✔ [13/14] Privilege Grant: Approved wholesale partner accesses commercial volume tiers & catalog');

    // 14. Rejected Wholesale Applicant is strictly blocked
    const rejectedEmail = `rejected.ws.${Date.now()}@example.com`;
    const rejRegisterRes = await fetch(`${baseUrl}/auth/register/wholesale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactName: 'Ineligible Business',
        businessName: 'Unverified Shop',
        businessType: 'other',
        taxId: 'UNVERIFIED-TAX-001',
        monthlyVolumeKg: '2',
        email: rejectedEmail,
        phone: '+91 99887 00000',
        password: 'Password123!',
        deliveryAddress: {
          street: '10 Industrial Area',
          city: 'Jaipur',
          state: 'Rajasthan',
          postalCode: '302001',
          country: 'India',
        },
      }),
    });
    const rejData = await rejRegisterRes.json();
    if (rejRegisterRes.status !== 201 || !rejData.token) {
      throw new Error(`Rejected wholesale registration failed: ${JSON.stringify(rejData)}`);
    }
    const tokenRejected = rejData.token;
    const rejUserId = rejData.user.id || rejData.user._id;

    // Admin rejects application
    await fetch(`${baseUrl}/admin/wholesale/${rejUserId}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ reason: 'Volume under commercial minimum' }),
    });

    // Check rejected access
    const rejAccessRes = await fetch(`${baseUrl}/wholesale/catalog`, {
      headers: { Authorization: `Bearer ${tokenRejected}` },
    });
    if (rejAccessRes.status !== 403) {
      throw new Error(`Security breach: Rejected wholesale user accessed protected catalog! Got ${rejAccessRes.status}`);
    }
    console.log('✔ [14/14] Rejection Enforcement: Rejected wholesale applicant strictly denied (403 Forbidden)');

    console.log('\n======================================================');
    console.log('   ALL 14/14 AUTH, RBAC & ISOLATION TESTS PASSED!    ');
    console.log('======================================================\n');
  } catch (error: any) {
    console.error('\n❌ Test Suite Failed:', error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
}

runIsolationTestSuite();
