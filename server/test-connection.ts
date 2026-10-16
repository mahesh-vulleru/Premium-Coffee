import { createApp } from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { env } from './src/config/env.js';

async function runSelfTest() {
  console.log('\n======================================================');
  console.log('   FIREDUP SPECIALTY COFFEE — BACKEND SELF-TEST');
  console.log('======================================================\n');
  console.log(`Connecting to MongoDB URI: ${env.MONGODB_URI}`);
  console.log(`Target Database: ${env.DB_NAME}`);

  try {
    // 1. Connect to Database
    await connectDB();
    console.log('✔ [1/5] MongoDB connection established successfully');

    // 2. Start Express app on temporary test port or env.PORT
    const app = createApp();
    const testPort = 5001;
    const server = app.listen(testPort);
    console.log(`✔ [2/5] Express server listening on http://localhost:${testPort}`);

    // 3. Test Health Endpoint
    const healthRes = await fetch(`http://localhost:${testPort}/api/v1/health`);
    const healthJson = await healthRes.json();
    console.log('\n--- Health Endpoint Response (/api/v1/health) ---');
    console.log(JSON.stringify(healthJson, null, 2));

    if (healthRes.status === 200 && healthJson.status === 'healthy') {
      console.log('\n✔ [3/5] Health endpoint verified: status 200 & healthy');
    } else {
      throw new Error(`Health check failed with status ${healthRes.status}`);
    }

    // 4. Test Customer Registration API
    const testCustomerEmail = `test.customer.${Date.now()}@example.com`;
    const regRes = await fetch(`http://localhost:${testPort}/api/v1/auth/register/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Mercer',
        email: testCustomerEmail,
        phone: '555-019-2834',
        password: 'Password123!',
        shippingAddress: {
          street: '104 Highland Way',
          city: 'Seattle',
          state: 'WA',
          postalCode: '98101',
          country: 'USA',
        },
      }),
    });
    const regJson = await regRes.json();
    console.log('\n--- Customer Registration Response ---');
    console.log(JSON.stringify(regJson, null, 2));

    if (regRes.status === 201 && regJson.user?.role === 'customer') {
      console.log('✔ [4/5] Customer registration API verified (role strictly enforced)');
    } else {
      throw new Error(`Customer registration failed: ${JSON.stringify(regJson)}`);
    }

    // 5. Test Admin Token Security (Reject invalid token)
    const badAdminRes = await fetch(`http://localhost:${testPort}/api/v1/auth/register/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Attempt',
        email: 'hacker@unauthorized.com',
        password: 'Password123!',
        invitationToken: 'INVALID-TOKEN-ATTEMPT',
      }),
    });
    const _badAdminJson = await badAdminRes.json();
    if (badAdminRes.status === 403) {
      console.log('✔ [5/5] Admin security verified: unauthorized token attempt blocked with 403 Forbidden');
    } else {
      throw new Error(`Admin security gate failed: expected 403, got ${badAdminRes.status}`);
    }

    // Cleanup & Shutdown
    server.close();
    await disconnectDB();

    console.log('\n======================================================');
    console.log('   ALL BACKEND FOUNDATION TESTS PASSED CLEANLY!  ');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n✖ [TEST ERROR]', err);
    await disconnectDB();
    process.exit(1);
  }
}

runSelfTest();
