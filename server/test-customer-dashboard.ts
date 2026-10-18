import { createApp } from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { Product } from './src/models/Product.js';
import { cleanupTestData } from './src/scripts/cleanup-test-data.js';

async function runCustomerDashboardTestSuite() {
  console.log('\n=================================================================');
  console.log('   FIREDUP COFFEE — CUSTOMER DASHBOARD & COMMERCE TEST SUITE    ');
  console.log('=================================================================\n');

  let server: any;
  const testPort = 5005;
  const baseUrl = `http://localhost:${testPort}/api/v1`;

  try {
    await connectDB();
    console.log('✔ [0/10] Database connection established');

    const app = createApp();
    server = app.listen(testPort);

    // 1. Ensure test product exists
    let testProduct = await Product.findOne({ stockAvailable: { $gte: 20 } });
    if (!testProduct) {
      testProduct = await Product.create({
        name: 'Estate Arabica Reserve Lot',
        category: 'pour_over',
        price: 620,
        rating: 4.8,
        reviewsCount: 32,
        image: '/images/pour-over.jpg',
        tag: 'best_sellers',
        roastLevel: 'Medium',
        tastingNotes: ['Bergamot', 'Jasmine', 'Cane Sugar'],
        origin: 'Araku Valley, Andhra Pradesh',
        description: 'Delicate high-altitude single origin washed Arabica.',
        stockAvailable: 50,
      });
    }

    const initialStock = testProduct.stockAvailable;

    // 2. Register Customer A and verify default country is India
    const custAEmail = `cust.a.dashboard.${Date.now()}@example.com`;
    const regResA = await fetch(`${baseUrl}/auth/register/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Mahesh Retail Customer',
        email: custAEmail,
        phone: '+91 98765 00001',
        password: 'Password123!',
        shippingAddress: {
          street: '12 Plantation Way',
          city: 'Chikmagalur',
          state: 'Karnataka',
          postalCode: '577101',
        },
      }),
    });
    const regDataA = await regResA.json();
    if (regResA.status !== 201 || !regDataA.token) {
      throw new Error(`Customer A registration failed: ${JSON.stringify(regDataA)}`);
    }
    const tokenA = regDataA.token;
    if (regDataA.user.shippingAddress?.country !== 'India') {
      throw new Error(`Expected default country to be India, got: ${regDataA.user.shippingAddress?.country}`);
    }
    console.log('✔ [1/10] Registration & Country Default: Customer created with verified India default country');

    // 3. Profile update & delivery address validation
    // Test invalid address rejection
    const invalidProfileRes = await fetch(`${baseUrl}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        shippingAddress: {
          street: 'A', // too short (< 2)
          city: '',
          state: '',
          postalCode: '1',
          country: 'India',
        },
      }),
    });
    if (invalidProfileRes.status !== 400) {
      throw new Error(`Profile update with invalid address should return 400, got: ${invalidProfileRes.status}`);
    }

    // Test valid Andhra Pradesh address update
    const validProfileRes = await fetch(`${baseUrl}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Mahesh Vulleru',
        phone: '+91 9876543210',
        shippingAddress: {
          street: 'pulipadu village gurazala mandal palnadu district',
          city: 'Gurzala',
          state: 'Andhra Pradesh',
          postalCode: '522415',
          country: 'India',
        },
      }),
    });
    const validProfileData = await validProfileRes.json();
    if (validProfileRes.status !== 200 || validProfileData.user.shippingAddress.state !== 'Andhra Pradesh') {
      throw new Error(`Valid address update failed: ${JSON.stringify(validProfileData)}`);
    }
    if (validProfileData.user.shippingAddress.country !== 'India') {
      throw new Error(`Address country mismatch: expected India, got ${validProfileData.user.shippingAddress.country}`);
    }
    console.log('✔ [2/10] Delivery Address Validation: Profile and Andhra Pradesh address persisted with country "India"');

    // 4. Cart Add & Server Calculation
    const addCartRes = await fetch(`${baseUrl}/cart/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        productId: testProduct._id.toString(),
        quantity: 2,
        grind: 'Whole Bean',
        size: '250g',
      }),
    });
    const addCartData = await addCartRes.json();
    if (addCartRes.status !== 200) {
      throw new Error(`Failed to add item to Customer A cart: ${JSON.stringify(addCartData)}`);
    }

    const getCartResA = await fetch(`${baseUrl}/cart`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const cartDataA = await getCartResA.json();
    const expectedSubtotalA = testProduct.price * 2;
    if (cartDataA.cart?.subtotal !== expectedSubtotalA || cartDataA.cart?.items.length !== 1) {
      throw new Error(`Cart total calculation mismatch: expected subtotal ${expectedSubtotalA}, got ${cartDataA.cart?.subtotal}`);
    }
    console.log(`✔ [3/10] Authoritative Cart Calculation: 2x items calculated server-side to ₹${cartDataA.cart.subtotal}`);

    // 5. Account Isolation: Register Customer B and verify cart is empty
    const custBEmail = `cust.b.dashboard.${Date.now()}@example.com`;
    const regResB = await fetch(`${baseUrl}/auth/register/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Retail Customer',
        email: custBEmail,
        phone: '+91 98765 00002',
        password: 'Password123!',
        shippingAddress: {
          street: '55 Brigade Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560025',
        },
      }),
    });
    const regDataB = await regResB.json();
    if (regResB.status !== 201 || !regDataB.token) {
      throw new Error(`Customer B registration failed: ${JSON.stringify(regDataB)}`);
    }
    const tokenB = regDataB.token;

    const getCartResB = await fetch(`${baseUrl}/cart`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const cartDataB = await getCartResB.json();
    if (cartDataB.cart?.items.length !== 0 || cartDataB.cart?.subtotal !== 0) {
      throw new Error(`Cart data leaked from Customer A to Customer B! Items: ${cartDataB.cart?.items.length}`);
    }
    console.log('✔ [4/10] Cart Data Isolation: Customer B cart is strictly empty; zero cross-account leakage');

    // 6. Wishlist Isolation
    const wishRes = await fetch(`${baseUrl}/wishlist/${testProduct._id.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
    });
    if (wishRes.status !== 200) {
      throw new Error(`Customer A toggle wishlist failed: ${wishRes.status}`);
    }

    const wishResA = await fetch(`${baseUrl}/wishlist`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const wishDataA = await wishResA.json();
    if (wishDataA.count !== 1) {
      throw new Error(`Customer A wishlist expected 1 item, got ${wishDataA.count}`);
    }

    const wishResB = await fetch(`${baseUrl}/wishlist`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const wishDataB = await wishResB.json();
    if (wishDataB.count !== 0) {
      throw new Error(`Wishlist data leaked from Customer A to Customer B!`);
    }
    console.log('✔ [5/10] Wishlist Data Isolation: Customer A wishlist has 1 item, Customer B has 0 items');

    // 7. Retail Order Placement with Promo Code & Stock Deduction
    const orderItems = [
      {
        productId: testProduct._id.toString(),
        name: testProduct.name,
        price: testProduct.price,
        quantity: 2,
        grind: 'Whole Bean',
        packageSize: '250g',
        image: testProduct.image,
      },
    ];

    const placeOrderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        items: orderItems,
        shippingAddress: {
          street: 'pulipadu village gurazala mandal palnadu district',
          city: 'Gurzala',
          state: 'Andhra Pradesh',
          postalCode: '522415',
          country: 'India',
        },
        paymentMethod: 'credit_card',
        promoCode: 'FIREDUP15',
      }),
    });
    const placeOrderData = await placeOrderRes.json();
    if (placeOrderRes.status !== 201 || !placeOrderData.order) {
      throw new Error(`Customer order placement failed: ${JSON.stringify(placeOrderData)}`);
    }

    const createdOrder = placeOrderData.order;
    if (!createdOrder.orderNumber.startsWith('FD-')) {
      throw new Error(`Expected order number prefix 'FD-', got ${createdOrder.orderNumber}`);
    }
    if (createdOrder.discountAmount !== Math.round(expectedSubtotalA * 0.15)) {
      throw new Error(`Promo FIREDUP15 discount mismatch: expected ${Math.round(expectedSubtotalA * 0.15)}, got ${createdOrder.discountAmount}`);
    }
    console.log(`✔ [6/10] Order Placement & Promo: Order ${createdOrder.orderNumber} created with 15% discount (₹${createdOrder.discountAmount})`);

    // Verify stock deduction
    const updatedProduct = await Product.findById(testProduct._id);
    if (!updatedProduct || updatedProduct.stockAvailable !== initialStock - 2) {
      throw new Error(`Inventory deduction failed: initial=${initialStock}, remaining=${updatedProduct?.stockAvailable}`);
    }
    console.log(`✔ [7/10] Inventory Deduction: Product stock accurately decremented by 2 bags (${updatedProduct.stockAvailable} remaining)`);

    // Verify cart cleared after order
    const postOrderCartRes = await fetch(`${baseUrl}/cart`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const postOrderCartData = await postOrderCartRes.json();
    if (postOrderCartData.cart?.items.length !== 0) {
      throw new Error(`Customer A cart was not cleared after order placement!`);
    }
    console.log('✔ [8/10] Post-Order State: Customer A active cart automatically cleared after order placement');

    // 8. Customer Order History & Boundary Enforcement
    const orderHistoryResA = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const orderHistoryDataA = await orderHistoryResA.json();
    if (orderHistoryDataA.orders.length !== 1 || orderHistoryDataA.orders[0].id !== createdOrder.id) {
      throw new Error(`Customer A order history mismatch: ${JSON.stringify(orderHistoryDataA)}`);
    }

    const orderHistoryResB = await fetch(`${baseUrl}/orders`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const orderHistoryDataB = await orderHistoryResB.json();
    if (orderHistoryDataB.orders.length !== 0) {
      throw new Error(`Customer B can see Customer A orders! Count: ${orderHistoryDataB.orders.length}`);
    }

    // Customer B attempts to fetch Customer A's order by ID
    const crossOrderAccessRes = await fetch(`${baseUrl}/orders/${createdOrder.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    if (crossOrderAccessRes.status !== 403 && crossOrderAccessRes.status !== 404) {
      throw new Error(`Cross-customer order access was not blocked! Status: ${crossOrderAccessRes.status}`);
    }
    console.log('✔ [9/10] Order Privacy Boundary: Customer A sees their order; Customer B gets 0 orders and is blocked (403/404) from Customer A order');

    // 9. Newsletter Subscription & Duplicate Handling
    const newsRes = await fetch(`${baseUrl}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: custAEmail, source: 'customer_dashboard' }),
    });
    const newsData = await newsRes.json();
    if (newsRes.status !== 201 || !newsData.isSubscribed) {
      throw new Error(`Newsletter subscription failed: ${JSON.stringify(newsData)}`);
    }

    const dupNewsRes = await fetch(`${baseUrl}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: custAEmail, source: 'customer_dashboard' }),
    });
    if (dupNewsRes.status !== 409) {
      throw new Error(`Duplicate newsletter subscription expected 409 Conflict, got ${dupNewsRes.status}`);
    }

    const newsStatusRes = await fetch(`${baseUrl}/newsletter/status?email=${encodeURIComponent(custAEmail)}`);
    const newsStatusData = await newsStatusRes.json();
    if (!newsStatusData.isSubscribed) {
      throw new Error(`Newsletter status expected isSubscribed=true, got ${JSON.stringify(newsStatusData)}`);
    }
    console.log('✔ [10/10] Newsletter Lifecycle: Subscription created (201), duplicate gracefully handled (409), and status confirmed');

    console.log('\n=================================================================');
    console.log('   ALL 10/10 CUSTOMER DASHBOARD FUNCTIONAL TESTS PASSED!        ');
    console.log('=================================================================\n');
  } catch (error: any) {
    console.error('\n❌ Customer Dashboard Test Suite Failed:', error);
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

runCustomerDashboardTestSuite();

