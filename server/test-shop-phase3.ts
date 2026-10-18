import { createApp } from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { provisionAdminAccount } from './src/scripts/provision-admin.js';
import { cleanupTestData } from './src/scripts/cleanup-test-data.js';
import { AuditLog } from './src/models/AuditLog.js';
import { Product } from './src/models/Product.js';
import { Promotion } from './src/models/Promotion.js';
import { Category } from './src/models/Category.js';
import { StorefrontContent } from './src/models/StorefrontContent.js';

async function runPhase3TestSuite() {
  console.log('\n======================================================================');
  console.log('   FIREDUP COFFEE — PHASE 3 TEST SUITE                                ');
  console.log('   (Retail Pricing, Promotions, Categories & Storefront Content)      ');
  console.log('======================================================================\n');

  let server: any;
  const testPort = 5008;
  const baseUrl = `http://localhost:${testPort}/api/v1`;

  try {
    await connectDB();
    console.log('✔ [0/10] Database connection established');

    const app = createApp();
    server = app.listen(testPort);

    // 1. Setup Admin Account and Customer Account
    const adminEmail = `admin.p3.${Date.now()}@firedup.test`;
    const adminPassword = 'AdminPassword123!';
    await provisionAdminAccount({
      email: adminEmail,
      password: adminPassword,
      name: 'Phase 3 Admin',
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
    const custEmail = `cust.p3.${Date.now()}@example.com`;
    const custRegRes = await fetch(`${baseUrl}/auth/register/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Phase 3 Customer',
        email: custEmail,
        phone: '+91 99887 76655',
        password: 'Password123!',
        shippingAddress: {
          street: '42 Coffee Lane',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500001',
        },
      }),
    });
    const custRegData = await custRegRes.json();
    if (custRegRes.status !== 201 || !custRegData.token) {
      throw new Error(`Customer registration failed: ${JSON.stringify(custRegData)}`);
    }
    const tokenCust = custRegData.token;
    console.log('✔ [1/10] Admin & Customer accounts provisioned successfully');

    // 2. Create Base Product for Testing
    const productSlug = `phase3-espresso-${Date.now()}`;
    const createProdRes = await fetch(`${baseUrl}/admin/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        name: 'Phase 3 Test Espresso',
        slug: productSlug,
        description: 'Test coffee bean for Phase 3 pricing checks.',
        price: 500,
        originalPrice: 600,
        image: '/images/products/espresso.jpg',
        category: 'espresso',
        roastLevel: 'Medium',
        origin: 'Coorg, Karnataka',
        tastingNotes: ['Caramel', 'Chocolate'],
        stockAvailable: 50,
        lowStockThreshold: 10,
        isPublished: true,
      }),
    });
    const createProdData = await createProdRes.json();
    const testProductId = createProdData.product?._id || createProdData.product?.id;
    if (createProdRes.status !== 201 || !testProductId) {
      throw new Error(`Product creation failed: ${JSON.stringify(createProdData)}`);
    }
    console.log('✔ [2/10] Test product created with price ₹500');

    // 3. Retail Pricing Validations & Effective Pricing
    // 3a. Reject promotionPrice >= price
    const invalidPriceRes = await fetch(`${baseUrl}/admin/pricing/${testProductId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        price: 500,
        promotionPrice: 550, // Higher than price!
      }),
    });
    if (invalidPriceRes.status !== 400) {
      throw new Error(`Expected 400 for promotionPrice >= price, got ${invalidPriceRes.status}`);
    }

    // 3b. Reject invalid date ranges
    const invalidDateRes = await fetch(`${baseUrl}/admin/pricing/${testProductId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        promotionPrice: 420,
        promotionStartDate: new Date(Date.now() + 86400000).toISOString(),
        promotionEndDate: new Date(Date.now() - 86400000).toISOString(), // End before start
      }),
    });
    if (invalidDateRes.status !== 400) {
      throw new Error(`Expected 400 for end date before start date, got ${invalidDateRes.status}`);
    }

    // 3c. Valid promotion price update within active window
    const now = Date.now();
    const validPromoRes = await fetch(`${baseUrl}/admin/pricing/${testProductId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        promotionPrice: 420,
        promotionStartDate: new Date(now - 3600000).toISOString(), // 1 hour ago
        promotionEndDate: new Date(now + 86400000).toISOString(), // 24 hours later
      }),
    });
    if (validPromoRes.status !== 200) {
      throw new Error(`Valid promotion price update failed: ${JSON.stringify(await validPromoRes.json())}`);
    }

    // Verify audit log exists
    const priceAudit = await AuditLog.findOne({
      resource: 'product',
      resourceId: testProductId,
      action: 'product_pricing_updated',
    });
    if (!priceAudit) {
      throw new Error('Audit log for product_pricing_updated not found in database');
    }
    console.log('✔ [3/10] Retail pricing validations and AuditLog verified');

    // 4. Authoritative Pricing in Public Catalogue and Cart
    const pubProdRes = await fetch(`${baseUrl}/products/${testProductId}`);
    const pubProdData = await pubProdRes.json();
    if (pubProdRes.status !== 200 || pubProdData.product?.effectivePrice !== 420 || !pubProdData.product?.isSale) {
      throw new Error(`Expected effectivePrice 420 and isSale true, got: ${JSON.stringify(pubProdData)}`);
    }

    // Customer adds to cart
    const addCartRes = await fetch(`${baseUrl}/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCust}`,
      },
      body: JSON.stringify({
        productId: testProductId,
        quantity: 1,
      }),
    });
    const cartData = await addCartRes.json();
    if (addCartRes.status !== 200 || cartData.cart?.items[0]?.salePrice !== 420) {
      throw new Error(`Cart line item does not reflect salePrice 420: ${JSON.stringify(cartData)}`);
    }
    console.log('✔ [4/10] Authoritative effective pricing verified in public API and Cart line items');

    // 5. Order Snapshot Immutability
    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCust}`,
      },
      body: JSON.stringify({
        shippingAddress: {
          street: '42 Coffee Lane',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500001',
        },
      }),
    });
    const orderData = await orderRes.json();
    if (orderRes.status !== 201 || orderData.order?.items[0]?.unitPrice !== 420) {
      throw new Error(`Order line item unitPrice should be locked at 420: ${JSON.stringify(orderData)}`);
    }
    const placedOrderId = orderData.order?._id || orderData.order?.id;
    if (!placedOrderId) {
      throw new Error(`Order ID not found: ${JSON.stringify(orderData)}`);
    }

    // Admin now raises base price to 700 and clears promo
    await fetch(`${baseUrl}/admin/pricing/${testProductId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        price: 700,
        promotionPrice: null,
        promotionStartDate: null,
        promotionEndDate: null,
      }),
    });

    // Check order snapshot remains 420
    const checkOrderRes = await fetch(`${baseUrl}/orders/${placedOrderId}`, {
      headers: { Authorization: `Bearer ${tokenCust}` },
    });
    const checkOrderData = await checkOrderRes.json();
    if (checkOrderData.order?.items[0]?.unitPrice !== 420) {
      throw new Error(`Order snapshot was mutated! Expected 420, got: ${checkOrderData.order?.items[0]?.unitPrice}`);
    }
    console.log('✔ [5/10] Order snapshot immutability verified against price updates');

    // 6. Promotion / Coupon Engine
    const promoCode = `SAVE25_${Date.now()}`;
    const createPromoRes = await fetch(`${baseUrl}/admin/promotions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        code: promoCode,
        description: '25% off test coupon',
        discountType: 'percentage',
        discountValue: 25,
        minOrderAmount: 200,
        usageLimit: 5,
        isActive: true,
      }),
    });
    if (createPromoRes.status !== 201) {
      throw new Error(`Promotion creation failed: ${JSON.stringify(await createPromoRes.json())}`);
    }

    // Duplicate promotion code rejection
    const dupPromoRes = await fetch(`${baseUrl}/admin/promotions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        code: promoCode,
        description: 'Duplicate code',
        discountType: 'percentage',
        discountValue: 10,
      }),
    });
    if (dupPromoRes.status !== 400) {
      throw new Error(`Expected 400 for duplicate promo code, got ${dupPromoRes.status}`);
    }

    // Public / Order coupon validation endpoint
    const validateRes = await fetch(`${baseUrl}/orders/validate-coupon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCust}`,
      },
      body: JSON.stringify({
        code: promoCode,
        orderTotal: 400,
      }),
    });
    const validateData = await validateRes.json();
    if (validateRes.status !== 200 || !validateData.valid || validateData.discountAmount !== 100) {
      throw new Error(`Coupon validation failed: ${JSON.stringify(validateData)}`);
    }

    // Check minOrderAmount rejection
    const validateLowRes = await fetch(`${baseUrl}/orders/validate-coupon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCust}`,
      },
      body: JSON.stringify({
        code: promoCode,
        orderTotal: 100, // below minOrderAmount: 200
      }),
    });
    const validateLowData = await validateLowRes.json();
    if (validateLowRes.status !== 400 || validateLowData.valid !== false) {
      throw new Error(`Expected coupon validation to fail for orderTotal < minOrderAmount, got status ${validateLowRes.status}: ${JSON.stringify(validateLowData)}`);
    }

    // Check default FIREDUP15 compatibility
    const validateDefaultRes = await fetch(`${baseUrl}/orders/validate-coupon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenCust}`,
      },
      body: JSON.stringify({
        code: 'FIREDUP15',
        orderTotal: 1000,
      }),
    });
    const validateDefaultData = await validateDefaultRes.json();
    if (!validateDefaultData.valid || validateDefaultData.discountAmount !== 150) {
      throw new Error(`FIREDUP15 compatibility check failed: ${JSON.stringify(validateDefaultData)}`);
    }
    console.log('✔ [6/10] Promotion CRUD, coupon validation endpoint & FIREDUP15 compatibility verified');

    // 7. Category Management
    const catSlug = `test-cat-${Date.now()}`;
    const createCatRes = await fetch(`${baseUrl}/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        name: 'Single Origin Specials',
        slug: catSlug,
        description: 'Rare single origin coffees',
        order: 10,
        isActive: true,
      }),
    });
    if (createCatRes.status !== 201) {
      throw new Error(`Category creation failed: ${JSON.stringify(await createCatRes.json())}`);
    }

    // Duplicate slug rejection
    const dupCatRes = await fetch(`${baseUrl}/admin/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        name: 'Duplicate Category',
        slug: catSlug,
      }),
    });
    if (dupCatRes.status !== 400) {
      throw new Error(`Expected 400 for duplicate category slug, got ${dupCatRes.status}`);
    }

    // Assign test product to this new category
    await Product.findByIdAndUpdate(testProductId, { category: catSlug, isArchived: false });

    // 8. Safe Category Archival Protection
    const archiveCatRes = await fetch(`${baseUrl}/admin/categories/${catSlug}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const archiveCatData = await archiveCatRes.json();
    const errorMsg = archiveCatData.error || archiveCatData.message || '';
    if (archiveCatRes.status !== 400 || (!errorMsg.includes('active roast') && !errorMsg.includes('active products'))) {
      throw new Error(`Expected 400 with active products error when archiving category in use, got: ${JSON.stringify(archiveCatData)}`);
    }

    // Now reassign product category away to allow safe archival
    await Product.findByIdAndUpdate(testProductId, { category: 'espresso' });
    const archiveCatSuccessRes = await fetch(`${baseUrl}/admin/categories/${catSlug}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    if (archiveCatSuccessRes.status !== 200) {
      throw new Error(`Expected successful archival after product reassignment: ${JSON.stringify(await archiveCatSuccessRes.json())}`);
    }

    // Verify public category endpoint excludes archived
    const pubCatsRes = await fetch(`${baseUrl}/categories`);
    const pubCatsData = await pubCatsRes.json();
    const foundArchived = pubCatsData.categories?.some((c: any) => c.slug === catSlug);
    if (foundArchived) {
      throw new Error(`Public categories endpoint still returned archived category: ${catSlug}`);
    }
    console.log('✔ [7/10] Category CRUD, duplicate prevention, safe archival protection & public listing verified');

    // 9. Storefront Content Management
    const bannerKey = `phase3_announcement_${Date.now()}`;
    const promoCardKey = `phase3_promo_${Date.now()}`;

    const createBannerRes = await fetch(`${baseUrl}/admin/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        key: bannerKey,
        contentType: 'announcement',
        title: 'Phase 3 Seasonal Harvest',
        subtitle: 'Freshly roasted single origin beans available now',
        linkText: 'Shop Harvest',
        linkUrl: '/shop?origin=Coorg',
        isActive: true,
        displayOrder: 1,
      }),
    });
    const createBannerData = await createBannerRes.json();
    const bannerId = createBannerData.content?._id || createBannerData.content?.id;
    if (createBannerRes.status !== 201 || !bannerId) {
      throw new Error(`Storefront announcement creation failed: ${JSON.stringify(createBannerData)}`);
    }

    // Create promo card
    const createPromoCardRes = await fetch(`${baseUrl}/admin/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({
        key: promoCardKey,
        contentType: 'promo_card',
        title: 'Artisan Filter Roasts',
        subtitle: 'Experience floral and sweet notes',
        badge: 'Limited Edition',
        linkText: 'Discover',
        linkUrl: '/shop?category=filter',
        isActive: true,
        displayOrder: 2,
      }),
    });
    if (createPromoCardRes.status !== 201) {
      throw new Error(`Storefront promo card creation failed: ${JSON.stringify(await createPromoCardRes.json())}`);
    }

    // Toggle publication state to false
    const toggleRes = await fetch(`${baseUrl}/admin/content/${bannerId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const toggleData = await toggleRes.json();
    if (toggleRes.status !== 200 || toggleData.content?.isPublished !== false) {
      throw new Error(`Failed to toggle content publication state: ${JSON.stringify(toggleData)}`);
    }

    // Verify public endpoint does not return inactive announcement bar
    const pubContentRes = await fetch(`${baseUrl}/content?type=announcement`);
    const pubContentData = await pubContentRes.json();
    const bannerFound = pubContentData.content?.some((c: any) => (c._id || c.id) === bannerId);
    if (bannerFound) {
      throw new Error('Inactive announcement bar was returned by public content endpoint');
    }

    // Re-enable announcement bar
    await fetch(`${baseUrl}/admin/content/${bannerId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const pubContentRes2 = await fetch(`${baseUrl}/content?type=announcement`);
    const pubContentData2 = await pubContentRes2.json();
    const bannerFound2 = pubContentData2.content?.some((c: any) => (c._id || c.id) === bannerId);
    if (!bannerFound2) {
      throw new Error('Active announcement bar was not returned by public content endpoint');
    }
    console.log('✔ [8/10] Storefront content CRUD, publication toggling, and public filtering verified');

    // 10. Audit Logging Verification
    const contentAudit = await AuditLog.findOne({
      resource: 'content',
      action: 'storefront_content_created',
    });
    if (!contentAudit) {
      throw new Error('Audit log for storefront_content_created not found');
    }
    const catAudit = await AuditLog.findOne({
      resource: 'category',
      action: 'category_created',
    });
    if (!catAudit) {
      throw new Error('Audit log for category_created not found');
    }
    console.log('✔ [9/10] Comprehensive audit trail verified for Phase 3 entities');

    // Cleanup
    await cleanupTestData();
    // Also clean up any phase 3 specific test items
    await Product.deleteMany({ slug: productSlug });
    await Promotion.deleteMany({ code: promoCode });
    await Category.deleteMany({ slug: catSlug });
    await StorefrontContent.deleteMany({ key: { $regex: /^phase3_/ } });
    console.log('✔ [10/10] Test data cleaned safely');

    console.log('\n======================================================================');
    console.log('   🎉 ALL 10 PHASE 3 VERIFICATION TESTS PASSED SUCCESSFULLY!          ');
    console.log('======================================================================\n');
  } catch (error) {
    console.error('\n❌ PHASE 3 TEST FAILED:', error);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
}

runPhase3TestSuite();

