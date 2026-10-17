import readline from 'node:readline';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

interface ProvisionOptions {
  email?: string;
  name?: string;
  password?: string;
  department?: string;
}

export async function provisionAdminAccount(options: ProvisionOptions = {}): Promise<{
  created: boolean;
  message: string;
  email: string;
  userId?: string;
}> {
  const targetEmail = (options.email || env.ADMIN_INITIAL_EMAIL || 'vullerumahesh14@gmail.com').trim().toLowerCase();
  const targetName = options.name || 'Mahesh Vulleru (Administrator)';
  const targetDepartment = options.department || 'Root Operations';

  // 1. Check if account already exists
  const existingUser = await User.findOne({ email: targetEmail });
  if (existingUser) {
    return {
      created: false,
      message: `Admin account "${targetEmail}" already exists. Provisioning skipped safely to preserve existing credentials.`,
      email: targetEmail,
      userId: existingUser._id.toString(),
    };
  }

  // 2. Resolve password securely (never hardcoded)
  let password = options.password || env.ADMIN_INITIAL_PASSWORD;

  if (!password && process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    password = await new Promise<string>((resolve) => {
      rl.question(`Enter secure password for administrator [${targetEmail}]: `, (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    });
  }

  if (!password || password.length < 8) {
    throw new Error(
      'Provisioning failed: A secure password of at least 8 characters is required. Set ADMIN_INITIAL_PASSWORD in server/.env or pass securely.'
    );
  }

  // 3. Create administrator account — Mongoose pre('save') hook hashes password with bcrypt
  const newAdmin = await User.create({
    name: targetName,
    email: targetEmail,
    phone: 'HQ Staff Internal',
    password, // Handled by pre('save') bcrypt hashing
    role: 'admin',
    adminSecurityBadge: `${targetDepartment} — Staff Provisioned`,
  });

  return {
    created: true,
    message: `Administrator "${targetEmail}" provisioned successfully with role: admin.`,
    email: targetEmail,
    userId: newAdmin._id.toString(),
  };
}

async function runCli() {
  console.log('======================================================');
  console.log('   FIREDUP SPECIALTY COFFEE — ADMIN PROVISIONING');
  console.log('======================================================\n');

  try {
    await connectDB();
    const result = await provisionAdminAccount();

    if (result.created) {
      console.log(`✔ [SUCCESS] ${result.message}`);
      console.log(`  User ID: ${result.userId}`);
      console.log('  Security Note: Plaintext password was hashed with bcrypt salt rounds.');
    } else {
      console.log(`ℹ [IDEMPOTENT] ${result.message}`);
      console.log(`  User ID: ${result.userId}`);
    }
  } catch (err: any) {
    console.error(`✖ [ERROR] ${err.message}`);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

// Run CLI when executed directly
if (process.argv[1]?.endsWith('provision-admin.ts') || process.argv[1]?.endsWith('provision-admin.js')) {
  runCli();
}

