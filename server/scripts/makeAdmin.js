/**
 * One-time admin promotion script
 * Run: node scripts/makeAdmin.js your@email.com
 */
require('dotenv').config();
const mongoose = require('mongoose');

const email = process.argv[2];
if (!email) {
  console.error('❌ Usage: node scripts/makeAdmin.js <email>');
  process.exit(1);
}

async function main() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected');

    const User = require('../models/User');
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    ).select('-password');

    if (!user) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    console.log('\n🎉 SUCCESS! User promoted to admin:');
    console.log(`   Name  : ${user.name}`);
    console.log(`   Email : ${user.email}`);
    console.log(`   Role  : ${user.role}`);
    console.log('\n👉 Now log in at http://localhost:5173/login and visit /admin\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
