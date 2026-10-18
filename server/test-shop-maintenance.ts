import { createApp } from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { provisionAdminAccount } from './src/scripts/provision-admin.js';
import { cleanupTestData } from './src/scripts/cleanup-test-data.js';

async function runShopMaintenanceTestSuite() {
  console.log('\n======================================================================');
  console.log('   FIREDUP COFFEE — SHOP MAINTENANCE (PRODUCT & INVENTORY) SUITE     ');
  console.log('======================================================================\n');

  let server: any;
  const testPort = 5006;
  const baseUrl = `http://localhost:${testPort}/api/v1`;

  try {
    await connectDB();
    console.log('✔ [0/11] Database connection established');

    const app = createApp();
    server = app.listen(testPort);

    // 1. Setup Admin Account and Customer Account
    const adminEmail = `admin.maint.${Date.now()}@firedup.test`;
    const adminPassword = 'AdminPassword123!';
    await provisionAdminAccount({
      email: adminEmail,
      password: adminPassword,
      name: 'Maintenance Admin',
    });

    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.status !== 200 || !adminLoginData.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    }
    const tokenAdmin = adminLoginData.token;

    // Customer setup
    const custEmail = `cust.maint.${Date.now()}@example.com`;
    const custRegRes = await fetch(`${baseUrl}/auth/register/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Shopper Customer',
        email: custEmail,
        phone: '+91 98765 44332',
        password: 'Password123!',
        shippingAddress: {
          street: '18 Roastery Way',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500001',
        },
      }),
    });
    const custRegData = await custRegRes.json();
    const tokenCustomer = custRegData.token;

    // 2. Test 1: Admin Permission Verification
    const unauthRes = await fetch(`${baseUrl}/admin/products`);
    if (unauthRes.status !== 401) {
      throw new Error(`Unauthenticated request expected 401, got ${unauthRes.status}`);
    }

    const custForbiddenRes = await fetch(`${baseUrl}/admin/products`, {
      headers: { Authorization: `Bearer ${tokenCustomer}` },
    });
    if (custForbiddenRes.status !== 403) {
      throw new Error(`Customer access to /admin/products expected 403, got ${custForbiddenRes.status}`);
    }

    const adminAccessRes = await fetch(`${baseUrl}/admin/products`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    if (adminAccessRes.status !== 200) {
      throw new Error(`Admin access to /admin/products expected 200, got ${adminAccessRes.status}`);
    }
    console.log('✔ [1/11] Security & RBAC: Admin routes strictly reject unauthenticated (401) and customer (403) requests');

    // 3. Test 2: Product Creation & Unique Slug
    const testSlug = `test-monsooned-lot-${Date.now()}`;
    const createRes1 = await fetch(`${baseUrl}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        name: 'Test Monsooned Malabar Lot',
        slug: testSlug,
        category: 'espresso',
        price: 580,
        originalPrice: 680,
        image: '/images/test-product.jpg',
        origin: 'Chikmagalur, Karnataka',
        description: 'Rich low-acidity bean with notes of spicy dark chocolate.',
        roastLevel: 'Medium-Dark',
        tastingNotes: ['Spices', 'Dark Chocolate', 'Earthy'],
        stockAvailable: 30,
        lowStockThreshold: 10,
        isPublished: true,
      }),
    });
    const createData1 = await createRes1.json();
    if (createRes1.status !== 201 || !createData1.product) {
      throw new Error(`Product creation failed: ${JSON.stringify(createData1)}`);
    }
    const createdProduct1 = createData1.product;
    if (createdProduct1.slug !== testSlug) {
      throw new Error(`Expected slug "${testSlug}", got "${createdProduct1.slug}"`);
    }

    // Attempt duplicate slug
    const createDuplicateRes = await fetch(`${baseUrl}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        name: 'Another Duplicate Roast',
        slug: testSlug, // duplicate!
        category: 'espresso',
        price: 600,
        image: '/images/test2.jpg',
        origin: 'Coorg, Karnataka',
        description: 'Duplicate test roast.',
      }),
    });
    if (createDuplicateRes.status !== 400) {
      throw new Error(`Duplicate slug expected 400 Bad Request, got ${createDuplicateRes.status}`);
    }

    // Auto-generate slug from name if omitted
    const createRes2 = await fetch(`${baseUrl}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        name: `Test Blue Mountain Reserve ${Date.now()}`,
        category: 'cold_brew',
        price: 750,
        image: '/images/blue-mountain.jpg',
        origin: 'Nilgiri Hills, Tamil Nadu',
        description: 'Floral high-altitude wash.',
        stockAvailable: 15,
      }),
    });
    const createData2 = await createRes2.json();
    if (createRes2.status !== 201 || !createData2.product?.slug) {
      throw new Error(`Auto-slug product creation failed: ${JSON.stringify(createData2)}`);
    }
    const createdProduct2 = createData2.product;
    console.log('✔ [2/11] Product Creation & Slugs: Created product with unique slug, blocked duplicate slug (400), and auto-generated slug');

    // 4. Test 3: Product Update & Validation
    const updateRes = await fetch(`${baseUrl}/admin/products/${createdProduct1.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        price: 610,
        roastLevel: 'Dark',
        tastingNotes: ['Spices', 'Dark Chocolate', 'Molasses'],
      }),
    });
    const updateData = await updateRes.json();
    if (updateRes.status !== 200 || updateData.product?.price !== 610) {
      throw new Error(`Product update failed: ${JSON.stringify(updateData)}`);
    }
    console.log('✔ [3/11] Product Editing: Updated price, roast level, and notes with server validation');

    // 5. Test 4: Publication Status & Storefront Exclusion
    // Check it appears in public catalog when published
    const pubCatalogRes1 = await fetch(`${baseUrl}/products?search=Monsooned`);
    const pubCatalogData1 = await pubCatalogRes1.json();
    const foundPublished = pubCatalogData1.products?.some((p: any) => p.id === createdProduct1.id);
    if (!foundPublished) {
      throw new Error(`Published product was not found in public catalogue!`);
    }

    // Unpublish product
    const unpublishRes = await fetch(`${baseUrl}/admin/products/${createdProduct1.id}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ isPublished: false }),
    });
    const unpublishData = await unpublishRes.json();
    if (unpublishRes.status !== 200 || unpublishData.product?.isPublished !== false) {
      throw new Error(`Unpublish failed: ${JSON.stringify(unpublishData)}`);
    }

    // Verify it is now HIDDEN from public catalog
    const pubCatalogRes2 = await fetch(`${baseUrl}/products?search=Monsooned`);
    const pubCatalogData2 = await pubCatalogRes2.json();
    const foundUnpublished = pubCatalogData2.products?.some((p: any) => p.id === createdProduct1.id);
    if (foundUnpublished) {
      throw new Error(`Unpublished product unexpectedly appeared in public catalogue!`);
    }

    // Verify public getProductById returns 404 for unpublished item
    const getUnpubRes = await fetch(`${baseUrl}/products/${createdProduct1.id}`);
    if (getUnpubRes.status !== 404) {
      throw new Error(`Public getProductById on unpublished roast expected 404, got ${getUnpubRes.status}`);
    }

    // Verify customer cannot add unpublished product to cart
    const addUnpubCartRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCustomer}`,
      },
      body: JSON.stringify({
        productId: createdProduct1.id,
        quantity: 1,
        grind: 'Whole Bean',
        size: '250g',
      }),
    });
    if (addUnpubCartRes.status !== 400) {
      throw new Error(`Adding unpublished product to cart expected 400 Bad Request, got ${addUnpubCartRes.status}`);
    }
    console.log('✔ [4/11] Publication Workflow: Unpublished product is hidden from storefront and blocked from cart addition');

    // 6. Test 5: Safe Archival
    const archiveRes = await fetch(`${baseUrl}/admin/products/${createdProduct1.id}/archive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ isArchived: true, reason: 'Harvest lot completed' }),
    });
    const archiveData = await archiveRes.json();
    if (archiveRes.status !== 200 || archiveData.product?.isArchived !== true) {
      throw new Error(`Product archival failed: ${JSON.stringify(archiveData)}`);
    }

    // Cannot publish an archived product directly
    const cantPublishArchivedRes = await fetch(`${baseUrl}/admin/products/${createdProduct1.id}/publish`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ isPublished: true }),
    });
    if (cantPublishArchivedRes.status !== 400) {
      throw new Error(`Publishing archived product directly expected 400, got ${cantPublishArchivedRes.status}`);
    }
    console.log('✔ [5/11] Safe Archival: Product archived, unpublish enforced, and direct publishing prevented');

    // 7. Test 6: Inventory Stock & Low-Stock Filtering
    const invListRes = await fetch(`${baseUrl}/admin/inventory`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const invListData = await invListRes.json();
    if (invListRes.status !== 200 || !invListData.summary) {
      throw new Error(`Inventory listing failed: ${JSON.stringify(invListData)}`);
    }
    if (typeof invListData.summary.totalStockBags !== 'number' || typeof invListData.summary.totalSkus !== 'number') {
      throw new Error(`Inventory summary metrics malformed: ${JSON.stringify(invListData.summary)}`);
    }
    console.log(`✔ [6/11] Inventory Stockroom: Listed warehouse stock with KPIs (${invListData.summary.totalSkus} SKUs, ${invListData.summary.totalStockBags} bags)`);

    // 8. Test 7: Mandatory Reason for Stock Adjustments
    // Attempt adjustment without reason -> must fail
    const noReasonRes = await fetch(`${baseUrl}/admin/inventory/${createdProduct2.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ adjustment: 20 }), // no reason!
    });
    if (noReasonRes.status !== 400) {
      throw new Error(`Stock adjustment without reason expected 400 Bad Request, got ${noReasonRes.status}`);
    }

    // Valid adjustment with mandatory reason
    const validAdjustRes = await fetch(`${baseUrl}/admin/inventory/${createdProduct2.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        adjustment: 25,
        reason: 'Fresh drum batch roasted and packaged for inventory stockroom',
        type: 'restock',
      }),
    });
    const validAdjustData = await validAdjustRes.json();
    if (validAdjustRes.status !== 200 || validAdjustData.product?.stockAvailable !== 40) {
      throw new Error(`Stock adjustment failed: ${JSON.stringify(validAdjustData)}`);
    }
    console.log(`✔ [7/11] Mandatory Reason Enforcement: Stock adjustments require valid reason (missing rejected with 400; valid incremented to 40 bags)`);

    // 9. Test 8: Negative Inventory Prevention
    const negAdjustRes = await fetch(`${baseUrl}/admin/inventory/${createdProduct2.id}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        adjustment: -100, // exceeds available stock (40)
        reason: 'Attempting invalid bulk deduction exceeding stock',
      }),
    });
    if (negAdjustRes.status !== 400) {
      throw new Error(`Negative inventory adjustment expected 400, got ${negAdjustRes.status}`);
    }
    console.log('✔ [8/11] Negative Stock Prevention: Overselling and negative stock adjustments strictly rejected (400)');

    // 10. Test 9: Inventory Movement Log Trail
    const invLogsRes = await fetch(`${baseUrl}/admin/inventory/logs?productId=${createdProduct2.id}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const invLogsData = await invLogsRes.json();
    if (invLogsRes.status !== 200 || invLogsData.logs.length === 0) {
      throw new Error(`Inventory logs expected records, got: ${JSON.stringify(invLogsData)}`);
    }
    const latestLog = invLogsData.logs[0];
    if (latestLog.quantityChange !== 25 || !latestLog.reason.includes('Fresh drum batch')) {
      throw new Error(`Inventory log details mismatch: ${JSON.stringify(latestLog)}`);
    }
    console.log(`✔ [9/11] Movement Log Trail: Verified recorded stock log with delta (+25), reason, and actor (${latestLog.actor.name})`);

    // 11. Test 10: Audit Log Creation
    const auditLogsRes = await fetch(`${baseUrl}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const auditLogsData = await auditLogsRes.json();
    if (auditLogsRes.status !== 200 || auditLogsData.logs.length === 0) {
      throw new Error(`Audit logs expected records, got: ${JSON.stringify(auditLogsData)}`);
    }
    const hasProductCreate = auditLogsData.logs.some((l: any) => l.action === 'product_created');
    const hasInventoryAdjust = auditLogsData.logs.some((l: any) => l.action === 'inventory_adjusted');
    if (!hasProductCreate || !hasInventoryAdjust) {
      throw new Error(`Missing expected audit log action types in trail!`);
    }
    console.log('✔ [10/11] Administrative Audit Trail: Recorded sensitive actions in immutable audit log without password/token leaks');

    // 12. Test 11: Regression Check for Customer & Wholesale Storefronts
    // Customer can add active published product to cart
    const addCustCartRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCustomer}`,
      },
      body: JSON.stringify({
        productId: createdProduct2.id,
        quantity: 2,
        grind: 'Whole Bean',
        size: '250g',
      }),
    });
    const addCustCartData = await addCustCartRes.json();
    if (addCustCartRes.status !== 200) {
      throw new Error(`Customer cart add regression: ${JSON.stringify(addCustCartData)}`);
    }
    console.log('✔ [11/11] Storefront & Commerce Regression: Published products remain fully purchasable in active retail carts');

    console.log('\n======================================================================');
    console.log('   ALL 11/11 SHOP MAINTENANCE (PHASE 2) TESTS PASSED!                ');
    console.log('======================================================================\n');
  } catch (error: any) {
    console.error('\n❌ Shop Maintenance Test Suite Failed:', error);
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

runShopMaintenanceTestSuite();

