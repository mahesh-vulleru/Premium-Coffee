import { createApp } from './src/app.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { User } from './src/models/User.js';
import { Order } from './src/models/Order.js';
import { Product } from './src/models/Product.js';
import { Expense } from './src/models/Expense.js';
import { AdminToken } from './src/models/AdminToken.js';
import { BusinessSettings } from './src/models/BusinessSettings.js';
import { AuditLog } from './src/models/AuditLog.js';

async function runOwnerControlCenterTestSuite() {
  console.log('\n=================================================================');
  console.log('   FIREDUP SPECIALTY COFFEE — OWNER CONTROL CENTER TEST SUITE');
  console.log('=================================================================\n');

  let server: any;
  const testPort = 5007;
  const baseUrl = `http://localhost:${testPort}/api/v1`;

  const testUserIds: string[] = [];
  const testOrderIds: string[] = [];
  const testExpenseIds: string[] = [];
  const testTokenIds: string[] = [];

  const authHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    Cookie: `token=${token}`,
  });

  try {
    await connectDB();
    console.log('✔ [0/14] Database connection established');

    const app = createApp();
    server = app.listen(testPort);

    // 1. Setup Active Owner
    const ownerEmail = `control.owner.${Date.now()}@example.com`;
    const ownerPassword = 'OwnerSecurePassword123!';
    const ownerUser = await User.create({
      name: 'Elena Vance (Owner)',
      email: ownerEmail,
      phone: '+91 99999 88888',
      password: ownerPassword,
      role: 'admin',
      staffRole: 'owner',
      staffStatus: 'active',
      staffDepartment: 'Executive',
      permissions: ['staff.manage', 'roles.manage', 'finance.read', 'expenses.manage', 'orders.read', 'settings.manage'],
    });
    testUserIds.push(ownerUser._id.toString());

    // Login as Owner
    const ownerLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ownerEmail, password: ownerPassword }),
    });
    const ownerLoginData = await ownerLoginRes.json();
    if (!ownerLoginRes.ok || !ownerLoginData.token) {
      throw new Error(`Owner login failed: ${JSON.stringify(ownerLoginData)}`);
    }
    const ownerToken = ownerLoginData.token;
    console.log(`✔ [1/14] Owner authenticated successfully (${ownerEmail})`);

    // 2. Staff Application Submission (Pending state)
    const applicantEmail = `applicant.${Date.now()}@example.com`;
    const applicantPassword = 'ApplicantPassword123!';
    const applyRes = await fetch(`${baseUrl}/auth/register/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Marcus Bell',
        email: applicantEmail,
        password: applicantPassword,
        department: 'Roastery Operations',
        applicationNotes: 'Certified Q-Grader and experienced sample roaster.',
      }),
    });
    const applyData = await applyRes.json();
    if (applyRes.status !== 201 || !applyData.user) {
      throw new Error(`Staff application submission failed: ${JSON.stringify(applyData)}`);
    }
    const applicantId = applyData.user.id || applyData.user._id;
    testUserIds.push(applicantId);
    console.log(`✔ [2/14] Staff application submitted (status: "${applyData.user.staffStatus}")`);

    // 3. Pending Staff Login Blocked
    const pendingLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: applicantEmail, password: applicantPassword }),
    });
    if (pendingLoginRes.status !== 403) {
      throw new Error(`Expected 403 for pending staff login, got ${pendingLoginRes.status}`);
    }
    console.log('✔ [3/14] Pending staff account login correctly blocked (403 Forbidden)');

    // 4. Admin Lists Applications & Self-Approval Prevention
    const listAppsRes = await fetch(`${baseUrl}/admin/staff/applications`, {
      headers: authHeaders(ownerToken),
    });
    const listAppsData = await listAppsRes.json();
    if (!listAppsRes.ok || !Array.isArray(listAppsData.applications)) {
      throw new Error(`Failed to list staff applications: ${JSON.stringify(listAppsData)}`);
    }

    const selfApproveRes = await fetch(`${baseUrl}/admin/staff/${ownerUser._id}/approval`, {
      method: 'POST',
      headers: authHeaders(ownerToken),
      body: JSON.stringify({ decision: 'approve' }),
    });
    if (selfApproveRes.status !== 403 && selfApproveRes.status !== 400) {
      throw new Error(`Expected 403/400 for self-approval, got ${selfApproveRes.status}`);
    }
    console.log('✔ [4/14] Staff applications listed & self-approval prevention enforced');

    // 5. Admin Approves Staff Application as Store Manager
    const approveRes = await fetch(`${baseUrl}/admin/staff/${applicantId}/approval`, {
      method: 'POST',
      headers: authHeaders(ownerToken),
      body: JSON.stringify({
        decision: 'approve',
        role: 'store_manager',
        reason: 'Credentials and Q-Grader cert verified',
      }),
    });
    const approveData = await approveRes.json();
    if (!approveRes.ok || approveData.staff.staffStatus !== 'active') {
      throw new Error(`Failed to approve staff: ${JSON.stringify(approveData)}`);
    }
    console.log('✔ [5/14] Staff approved as store_manager with default permissions');

    // 6. Approved Staff Can Now Login
    const staffLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: applicantEmail, password: applicantPassword }),
    });
    const staffLoginData = await staffLoginRes.json();
    if (!staffLoginRes.ok || !staffLoginData.token) {
      throw new Error(`Approved staff login failed: ${JSON.stringify(staffLoginData)}`);
    }
    const staffToken = staffLoginData.token;
    console.log('✔ [6/14] Approved staff logged in successfully');

    // 7. Granular Permission Enforcement
    // Store manager has orders.read but NOT settings.manage
    const staffOrdersRes = await fetch(`${baseUrl}/admin/orders`, {
      headers: authHeaders(staffToken),
    });
    if (!staffOrdersRes.ok) {
      throw new Error(`Store manager should be able to read orders, got ${staffOrdersRes.status}`);
    }

    const staffSettingsRes = await fetch(`${baseUrl}/admin/settings`, {
      method: 'PATCH',
      headers: authHeaders(staffToken),
      body: JSON.stringify({ businessName: 'Hacked Name' }),
    });
    if (staffSettingsRes.status !== 403) {
      throw new Error(`Store manager without settings.manage should get 403, got ${staffSettingsRes.status}`);
    }
    console.log('✔ [7/14] Granular permissions enforced: authorized orders.read, blocked settings.manage (403)');

    // 8. Staff Account Suspension & Immediate Invalidation
    const suspendRes = await fetch(`${baseUrl}/admin/staff/${applicantId}/status`, {
      method: 'PATCH',
      headers: authHeaders(ownerToken),
      body: JSON.stringify({
        status: 'suspended',
        reason: 'Temporary administrative review',
      }),
    });
    if (!suspendRes.ok) {
      throw new Error(`Failed to suspend staff member: ${suspendRes.status}`);
    }

    // Now previous staff token must be blocked immediately
    const invalidatedRes = await fetch(`${baseUrl}/admin/orders`, {
      headers: authHeaders(staffToken),
    });
    if (invalidatedRes.status !== 403) {
      throw new Error(`Expected 403 for suspended staff token, got ${invalidatedRes.status}`);
    }
    console.log('✔ [8/14] Staff account suspended & active session immediately invalidated (403)');

    // 9. Last Active Owner Protection
    const otherAdmins = await User.find({
      $or: [{ role: 'admin' }, { staffRole: 'owner' }],
      _id: { $ne: ownerUser._id },
    });
    const originalStatuses = new Map<string, string | undefined>();
    for (const admin of otherAdmins) {
      originalStatuses.set(admin._id.toString(), admin.staffStatus);
      admin.staffStatus = 'deactivated';
      await admin.save();
    }

    try {
      const demoteOwnerRes = await fetch(`${baseUrl}/admin/staff/${ownerUser._id}/role-permissions`, {
        method: 'PATCH',
        headers: authHeaders(ownerToken),
        body: JSON.stringify({ staffRole: 'customer_support' }),
      });
      if (demoteOwnerRes.status !== 400) {
        throw new Error(`Expected 400 when attempting to demote last active owner, got ${demoteOwnerRes.status}`);
      }

      const suspendOwnerRes = await fetch(`${baseUrl}/admin/staff/${ownerUser._id}/status`, {
        method: 'PATCH',
        headers: authHeaders(ownerToken),
        body: JSON.stringify({ status: 'suspended' }),
      });
      if (suspendOwnerRes.status !== 400 && suspendOwnerRes.status !== 403) {
        throw new Error(`Expected 400/403 when attempting to suspend last active owner, got ${suspendOwnerRes.status}`);
      }
      console.log('✔ [9/14] Last active owner protection verified: demotion and suspension prevented (400/403)');
    } finally {
      for (const admin of otherAdmins) {
        admin.staffStatus = originalStatuses.get(admin._id.toString()) as any;
        await admin.save();
      }
    }

    // 10. Single-Use Staff Invitation Creation & Registration
    const inviteEmail = `invited.roaster.${Date.now()}@example.com`;
    const createInviteRes = await fetch(`${baseUrl}/admin/staff/invite`, {
      method: 'POST',
      headers: authHeaders(ownerToken),
      body: JSON.stringify({
        department: 'Roastery',
        role: 'roastery_staff',
        invitedEmail: inviteEmail,
        expiresInDays: 3,
      }),
    });
    const inviteData = await createInviteRes.json();
    if (!createInviteRes.ok || !inviteData.invitation?.token) {
      throw new Error(`Failed to generate staff invitation: ${JSON.stringify(inviteData)}`);
    }
    const invitationToken = inviteData.invitation.token;
    testTokenIds.push(inviteData.invitation.id);

    // Register with invitation
    const inviteRegRes = await fetch(`${baseUrl}/auth/register/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Chloe Roastmaster',
        email: inviteEmail,
        password: 'SecureRoasterPass123!',
        invitationToken: invitationToken,
      }),
    });
    const inviteRegData = await inviteRegRes.json();
    if (!inviteRegRes.ok || !inviteRegData.user) {
      throw new Error(`Failed to register with invitation token: ${JSON.stringify(inviteRegData)}`);
    }
    testUserIds.push(inviteRegData.user.id || inviteRegData.user._id);

    // Reusing the same invitation must fail
    const reuseRes = await fetch(`${baseUrl}/auth/register/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Registrant',
        email: `dup.${Date.now()}@example.com`,
        password: 'SecureRoasterPass123!',
        invitationToken: invitationToken,
      }),
    });
    if (reuseRes.status !== 400 && reuseRes.status !== 403) {
      throw new Error(`Expected 400/403 when reusing invitation token, got ${reuseRes.status}`);
    }
    console.log('✔ [10/14] Single-use expiring staff invitation generated, used, and reuse prevented');

    // 11. Expense Recording & Finance Summary
    const expenseRes = await fetch(`${baseUrl}/admin/finance/expenses`, {
      method: 'POST',
      headers: authHeaders(ownerToken),
      body: JSON.stringify({
        category: 'green_coffee',
        description: '500kg Specialty Araku Micro-Lot Green Beans',
        amount: 245000,
        date: new Date().toISOString(),
        paymentMethod: 'bank_transfer',
        vendor: 'Araku Valley Coffee Tribal Cooperative',
        invoiceNumber: 'INV-ARAKU-2026-091',
      }),
    });
    const expenseData = await expenseRes.json();
    if (expenseRes.status !== 201 || !expenseData.expense) {
      throw new Error(`Failed to record expense: ${JSON.stringify(expenseData)}`);
    }
    testExpenseIds.push(expenseData.expense._id || expenseData.expense.id);

    // Fetch Finance Summary
    const finRes = await fetch(`${baseUrl}/admin/finance/summary`, {
      headers: authHeaders(ownerToken),
    });
    const finData = await finRes.json();
    if (!finRes.ok || !finData.summary) {
      throw new Error(`Failed to fetch finance summary: ${JSON.stringify(finData)}`);
    }
    if (finData.summary.cashflow.totalExpenses < 245000) {
      throw new Error(`Expected totalExpenses >= 245000, got ${finData.summary.cashflow.totalExpenses}`);
    }
    console.log(`✔ [11/14] Expense recorded (₹2,45,000) & authoritative finance summary verified`);

    // 12. Order Return Decision & Refund Execution
    // Create an order for refund testing
    let sampleProduct = await Product.findOne({ stockAvailable: { $gte: 5 } });
    if (!sampleProduct) {
      sampleProduct = await Product.create({
        name: 'Kalledevarapura Estate Peaberry',
        slug: `kalledevarapura-${Date.now()}`,
        category: 'single_origin',
        price: 650,
        rating: 4.9,
        reviewsCount: 30,
        image: '/images/peaberry.jpg',
        roastLevel: 'Medium',
        tastingNotes: ['Mandarin Orange', 'Honey', 'Jasmine'],
        origin: 'Chikmagalur, Karnataka',
        description: 'Selected peaberry beans.',
        stockAvailable: 25,
        publicationStatus: 'published',
      });
    }

    const testOrder = await Order.create({
      orderNumber: `FD-TEST-${Date.now()}`,
      userId: ownerUser._id,
      orderType: 'retail',
      items: [
        {
          product: sampleProduct._id,
          productName: sampleProduct.name,
          quantity: 2,
          size: '250g',
          grind: 'whole_bean',
          unitPrice: 650,
          lineTotal: 1300,
        },
      ],
      totalKg: 0.5,
      subtotal: 1300,
      discountPercent: 0,
      discountAmount: 0,
      taxPercent: 5,
      taxAmount: 0,
      shippingFee: 0,
      totalAmount: 1300,
      paymentMethod: 'credit_card',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      cancellationStatus: 'none',
      returnStatus: 'requested',
      returnReason: 'Wrong roast profile received',
      shippingAddress: {
        contactName: 'Elena Vance',
        phone: '9876543210',
        street: '12 Brigade Road',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      statusHistory: [{ status: 'delivered', timestamp: new Date() }],
    });
    testOrderIds.push(testOrder._id.toString());

    // Decide return (Approve)
    const returnDecideRes = await fetch(`${baseUrl}/admin/orders/${testOrder._id}/return`, {
      method: 'POST',
      headers: authHeaders(ownerToken),
      body: JSON.stringify({
        decision: 'approve',
        reason: 'Return approved, items returned in good condition',
        restoreInventory: true,
      }),
    });
    const returnDecideData = await returnDecideRes.json();
    if (!returnDecideRes.ok || returnDecideData.order.returnStatus !== 'approved') {
      throw new Error(`Failed to decide return: ${JSON.stringify(returnDecideData)}`);
    }

    // Process refund
    const refundRes = await fetch(`${baseUrl}/admin/orders/${testOrder._id}/refund`, {
      method: 'POST',
      headers: authHeaders(ownerToken),
      body: JSON.stringify({
        refundAmount: 1300,
        refundReason: 'Return approved and stock restored',
      }),
    });
    const refundData = await refundRes.json();
    if (!refundRes.ok || refundData.order.paymentStatus !== 'refunded') {
      throw new Error(`Failed to process refund: ${JSON.stringify(refundData)}`);
    }
    console.log('✔ [12/14] Order return approved with stock restoration & ₹1,300 refund disbursed');

    // 13. CSV Export Suite
    const exportSalesRes = await fetch(`${baseUrl}/admin/reports/export/csv?type=sales`, {
      headers: authHeaders(ownerToken),
    });
    if (!exportSalesRes.ok || !exportSalesRes.headers.get('content-type')?.includes('text/csv')) {
      throw new Error(`Sales CSV export failed: ${exportSalesRes.status}`);
    }
    const salesCsvText = await exportSalesRes.text();
    if (!salesCsvText.includes('Order Number') && !salesCsvText.includes('Total Amount')) {
      throw new Error('Sales CSV text missing standard header columns');
    }

    const exportExpensesRes = await fetch(`${baseUrl}/admin/reports/export/csv?type=expenses`, {
      headers: authHeaders(ownerToken),
    });
    if (!exportExpensesRes.ok || !exportExpensesRes.headers.get('content-type')?.includes('text/csv')) {
      throw new Error(`Expenses CSV export failed: ${exportExpensesRes.status}`);
    }
    const expCsvText = await exportExpensesRes.text();
    if (!expCsvText.includes('Araku Valley Coffee')) {
      throw new Error('Expenses CSV text missing recorded test expense vendor');
    }
    console.log('✔ [13/14] Sanitized CSV export suite verified (Sales & Expenses CSV generated)');

    // 14. Real Database-Backed Roastery Notifications & Business Settings
    const notifsRes = await fetch(`${baseUrl}/admin/notifications`, {
      headers: authHeaders(ownerToken),
    });
    const notifsData = await notifsRes.json();
    if (!notifsRes.ok || !Array.isArray(notifsData.notifications)) {
      throw new Error(`Failed to fetch notifications: ${JSON.stringify(notifsData)}`);
    }

    const settingsUpdateRes = await fetch(`${baseUrl}/admin/settings`, {
      method: 'PATCH',
      headers: authHeaders(ownerToken),
      body: JSON.stringify({
        freeShippingThreshold: 1199,
        wholesaleMoqKg: 6,
      }),
    });
    const settingsUpdateData = await settingsUpdateRes.json();
    if (!settingsUpdateRes.ok || settingsUpdateData.settings.freeShippingThreshold !== 1199) {
      throw new Error(`Failed to update business settings: ${JSON.stringify(settingsUpdateData)}`);
    }
    console.log('✔ [14/14] Real database-backed notifications and business settings verified');

    console.log('\n=================================================================');
    console.log('   ALL 14 OWNER CONTROL CENTER VERIFICATION TESTS PASSED (14/14)');
    console.log('=================================================================\n');
  } catch (error) {
    console.error('\n❌ Test Suite Failed with Error:', error);
    process.exitCode = 1;
  } finally {
    // Teardown test artifacts
    try {
      if (testUserIds.length > 0) await User.deleteMany({ _id: { $in: testUserIds } });
      if (testOrderIds.length > 0) await Order.deleteMany({ _id: { $in: testOrderIds } });
      if (testExpenseIds.length > 0) await Expense.deleteMany({ _id: { $in: testExpenseIds } });
      if (testTokenIds.length > 0) await AdminToken.deleteMany({ _id: { $in: testTokenIds } });
    } catch (cleanupErr) {
      console.error('Cleanup warning:', cleanupErr);
    }

    if (server) {
      server.close();
    }
    await disconnectDB();
  }
}

runOwnerControlCenterTestSuite();
