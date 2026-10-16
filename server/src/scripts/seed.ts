import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { AdminToken } from '../models/AdminToken.js';

async function seed() {
  console.log('--- Seeding Firedup Specialty Coffee MongoDB Atlas Database ---');
  await connectDB();

  try {
    // 1. Seed Default Admin Invitation Token
    const defaultToken = 'FIREDUP-ADMIN-SECURE-2026';
    const existingToken = await AdminToken.findOne({ token: defaultToken });
    if (!existingToken) {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 2); // 2 years expiry for demo/staging
      await AdminToken.create({
        token: defaultToken,
        department: 'Operations',
        expiresAt,
      });
      console.log(`✔ Seeded Admin Token: ${defaultToken}`);
    } else {
      console.log(`ℹ Admin Token "${defaultToken}" already provisioned`);
    }

    // 2. Seed Customer Account
    const customerEmail = 'sarah@example.com';
    const existingCustomer = await User.findOne({ email: customerEmail });
    if (!existingCustomer) {
      await User.create({
        name: 'Sarah Jenkins',
        email: customerEmail,
        phone: '555-123-4567',
        password: 'password123',
        role: 'customer',
        shippingAddress: {
          street: '742 Evergreen Terrace',
          apartment: 'Apt 4B',
          city: 'Portland',
          state: 'OR',
          postalCode: '97201',
          country: 'USA',
        },
      });
      console.log(`✔ Seeded Customer: ${customerEmail}`);
    } else {
      console.log(`ℹ Customer "${customerEmail}" already exists`);
    }

    // 3. Seed Approved Wholesale Partner
    const wholesaleApprovedEmail = 'orders@artisanroasters.com';
    const existingApproved = await User.findOne({ email: wholesaleApprovedEmail });
    if (!existingApproved) {
      await User.create({
        name: 'Marcus Sterling',
        email: wholesaleApprovedEmail,
        phone: '555-987-6543',
        password: 'password123',
        role: 'wholesale',
        wholesaleDetails: {
          businessName: 'Artisan Roasters Collective',
          taxId: 'EIN-84-9201948',
          businessType: 'cafe',
          monthlyVolumeKg: '120',
          deliveryAddress: {
            street: '120 Market St',
            city: 'Seattle',
            state: 'WA',
            postalCode: '98101',
            country: 'USA',
          },
          status: 'approved',
          submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          reviewedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
        },
      });
      console.log(`✔ Seeded Wholesale Partner (Approved): ${wholesaleApprovedEmail}`);
    } else {
      console.log(`ℹ Wholesale "${wholesaleApprovedEmail}" already exists`);
    }

    // 4. Seed Pending Wholesale Applicant
    const wholesalePendingEmail = 'cafe@highlandbrew.com';
    const existingPending = await User.findOne({ email: wholesalePendingEmail });
    if (!existingPending) {
      await User.create({
        name: 'Elena Rostova',
        email: wholesalePendingEmail,
        phone: '555-345-6789',
        password: 'password123',
        role: 'wholesale',
        wholesaleDetails: {
          businessName: 'Highland Espresso Bar',
          taxId: 'EIN-91-3847291',
          businessType: 'cafe',
          monthlyVolumeKg: '45',
          deliveryAddress: {
            street: '408 Alpine Way',
            city: 'Denver',
            state: 'CO',
            postalCode: '80202',
            country: 'USA',
          },
          status: 'pending',
          submittedAt: new Date(),
        },
      });
      console.log(`✔ Seeded Wholesale Applicant (Pending): ${wholesalePendingEmail}`);
    } else {
      console.log(`ℹ Wholesale "${wholesalePendingEmail}" already exists`);
    }

    // 5. Seed Staff Admin
    const adminEmail = 'admin@firedupcoffee.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await User.create({
        name: 'Christopher Vance',
        email: adminEmail,
        phone: 'HQ Staff Direct',
        password: 'password123',
        role: 'admin',
        adminSecurityBadge: 'Operations & Roastery Master — Staff Verified',
      });
      console.log(`✔ Seeded Staff Admin: ${adminEmail}`);
    } else {
      console.log(`ℹ Staff Admin "${adminEmail}" already exists`);
    }

    console.log('\n--- Seeding Completed Successfully ---');
  } catch (error) {
    console.error('✖ Seeding Error:', error);
  } finally {
    await disconnectDB();
  }
}

seed();

