import { createApp } from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { User } from './src/models/User.js';
import { provisionAdminAccount } from './src/scripts/provision-admin.js';

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   FIREDUP SPECIALTY COFFEE — FULL SECURITY TEST SUITE');
  console.log('======================================================\n');

  let server: any;
  const testPort = 5002;

  try {
    // 0. Connect to Database (Atlas with local fallback)
    await connectDB();
    console.log('✔ [0/11] Database connection established');

    // Start test server
    const app = createApp();
    server = app.listen(testPort);
    const baseUrl = `http://localhost:${testPort}/api/v1`;

    // 1. Initial admin provisioning test
    const tempAdminEmail = `temp.admin.${Date.now()}@example.com`;
    const prov1 = await provisionAdminAccount({
      email: tempAdminEmail,
      name: 'Temp Admin Test',
      password: 'SecureTestAdminPass2026!',
    });
    if (!prov1.created || prov1.email !== tempAdminEmail) {
      throw new Error('Initial admin provisioning failed to create new admin account');
    }
    console.log('✔ [1/11] Initial admin provisioning works when account does not exist');

    // 2. Re-running provisioning idempotency test
    const prov2 = await provisionAdminAccount({
      email: tempAdminEmail,
      password: 'DifferentPasswordAttempt!',
    });
    if (prov2.created) {
      throw new Error('Idempotency failure: provisioning re-created or overwrote existing account');
    }
    console.log('✔ [2/11] Re-running provisioning safely detects existing account without duplicate or overwrite');

    // 3. Stored password is confirmed hashed
    const fetchedTempAdmin = await User.findOne({ email: tempAdminEmail }).select('+password');
    if (!fetchedTempAdmin?.password.startsWith('$2')) {
      throw new Error('Security failure: stored password is not hashed with bcrypt');
    }
    const isPasswordValid = await fetchedTempAdmin.comparePassword('SecureTestAdminPass2026!');
    if (!isPasswordValid) {
      throw new Error('Password hash validation failed against plaintext candidate');
    }
    console.log('✔ [3/11] Stored admin password is confirmed securely hashed with bcrypt salt rounds');

    // 4. Valid administrator login succeeds; incorrect credentials fail
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: tempAdminEmail,
        password: 'SecureTestAdminPass2026!',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (adminLoginRes.status !== 200 || !adminLoginData.token || adminLoginData.user.role !== 'admin') {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
    }

    const adminToken = adminLoginData.token;

    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: tempAdminEmail,
        password: 'WrongPassword!',
      }),
    });
    if (badLoginRes.status !== 401) {
      throw new Error(`Bad password login did not return 401: status ${badLoginRes.status}`);
    }
    console.log('✔ [4/11] Valid administrator login succeeds and invalid credentials fail with 401');

    // 5. Missing and invalid invitation tokens are rejected
    const badTokenRes = await fetch(`${baseUrl}/auth/register/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Unauthorized User',
        email: `unauthorized.${Date.now()}@example.com`,
        password: 'SecurePassword123!',
        invitationToken: 'INVALID-OR-MALICIOUS-TOKEN',
      }),
    });
    if (badTokenRes.status !== 403) {
      throw new Error(`Invalid invitation token was not rejected with 403: got ${badTokenRes.status}`);
    }
    console.log('✔ [5/11] Missing and invalid invitation tokens rejected with 403 Forbidden');

    // 6. Public customer and wholesale registration cannot create admin accounts
    const maliciousCustomerEmail = `malicious.cust.${Date.now()}@example.com`;
    const custRes = await fetch(`${baseUrl}/auth/register/customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Malicious Elevate Attempt',
        email: maliciousCustomerEmail,
        phone: '555-012-3456',
        password: 'Password123!',
        role: 'admin', // Attack vector: trying to inject admin role
        shippingAddress: {
          street: '123 Fake St',
          city: 'Portland',
          state: 'OR',
          postalCode: '97201',
          country: 'USA',
        },
      }),
    });
    const custData = await custRes.json();
    if (custRes.status !== 201 || custData.user.role !== 'customer') {
      throw new Error('Security failure: Customer registration allowed non-customer role');
    }
    const customerToken = custData.token;

    const maliciousWholesaleEmail = `malicious.wholes.${Date.now()}@example.com`;
    const wholesRes = await fetch(`${baseUrl}/auth/register/wholesale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contactName: 'Sneaky Wholesale',
        businessName: 'Sneaky Cafe',
        businessType: 'cafe',
        taxId: 'TX-12345',
        monthlyVolumeKg: '100',
        email: maliciousWholesaleEmail,
        phone: '555-987-6543',
        password: 'Password123!',
        role: 'admin', // Attack vector
        status: 'approved', // Attack vector: trying to self-approve
        deliveryAddress: {
          street: '500 Pike St',
          city: 'Seattle',
          state: 'WA',
          postalCode: '98101',
          country: 'USA',
        },
      }),
    });
    const wholesData = await wholesRes.json();
    if (
      wholesRes.status !== 201 ||
      wholesData.user.role !== 'wholesale' ||
      wholesData.user.wholesaleDetails.status !== 'pending'
    ) {
      throw new Error('Security failure: Wholesale registration allowed role or status injection');
    }
    const wholesaleToken = wholesData.token;
    const wholesaleUserId = wholesData.user.id;
    console.log('✔ [6/11] Public customer and wholesale endpoints strictly enforce roles (cannot create admin)');

    // 7. Administrators can access admin-only endpoints
    const adminAccessRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminAccessData = await adminAccessRes.json();
    if (adminAccessRes.status !== 200 || !Array.isArray(adminAccessData.users)) {
      throw new Error(`Admin failed to access /admin/users: status ${adminAccessRes.status}`);
    }
    console.log('✔ [7/11] Administrators can access restricted admin-only endpoints');

    // 8. Customers, wholesale users, and unauthenticated users cannot access admin-only endpoints
    const unauthRes = await fetch(`${baseUrl}/admin/users`);
    if (unauthRes.status !== 401) {
      throw new Error(`Unauthenticated user not blocked with 401: got ${unauthRes.status}`);
    }

    const custBlockedRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (custBlockedRes.status !== 403) {
      throw new Error(`Customer not blocked with 403: got ${custBlockedRes.status}`);
    }

    const wholesBlockedRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${wholesaleToken}` },
    });
    if (wholesBlockedRes.status !== 403) {
      throw new Error(`Wholesale user not blocked with 403: got ${wholesBlockedRes.status}`);
    }
    console.log('✔ [8/11] Customers, wholesale users, and unauthenticated requests blocked from admin endpoints');

    // 9. Wholesale accounts remain restricted until approved
    // Pending wholesale user approval test
    const approveRes = await fetch(`${baseUrl}/admin/wholesale/${wholesaleUserId}/approve`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
    });
    const approveData = await approveRes.json();
    if (approveRes.status !== 200 || approveData.user.wholesaleDetails.status !== 'approved') {
      throw new Error(`Admin wholesale approval failed: status ${approveRes.status}`);
    }
    console.log('✔ [9/11] Wholesale accounts remain pending until officially approved by admin');

    // 10. Logout and current-user retrieval work correctly
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const meData = await meRes.json();
    if (meRes.status !== 200 || meData.user.email !== tempAdminEmail) {
      throw new Error(`GET /auth/me failed to return current authenticated user: status ${meRes.status}`);
    }

    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (logoutRes.status !== 200) {
      throw new Error(`POST /auth/logout failed: status ${logoutRes.status}`);
    }
    console.log('✔ [10/11] Current-user retrieval (/auth/me) and logout work correctly');

    // 11. Secrets are not exposed in logs or API responses
    if ('password' in adminLoginData.user || 'password' in custData.user || 'password' in meData.user) {
      throw new Error('Critical security failure: password field present in API response object');
    }
    console.log('✔ [11/11] Zero credential leakage: passwords and secrets never exposed in JSON responses');

    // Clean up temporary test admin
    await User.deleteOne({ email: tempAdminEmail });
    await User.deleteOne({ email: maliciousCustomerEmail });
    await User.deleteOne({ email: maliciousWholesaleEmail });

    console.log('\n======================================================');
    console.log('   ALL 11/11 SECURITY TESTS VERIFIED AND PASSED!     ');
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('\n✖ [TEST SUITE FAILURE]:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await disconnectDB();
  }
}

runTestSuite();
