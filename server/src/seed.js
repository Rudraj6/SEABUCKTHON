import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Product, Admin, Setting } from './models.js';
import { catalogue } from './data.js';
if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI before seeding.');
await mongoose.connect(process.env.MONGO_URI);
for (const p of catalogue)
  await Product.updateOne(
    { slug: p.slug },
    { $setOnInsert: p },
    { upsert: true }
  );
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  await Admin.updateOne(
    { email: process.env.ADMIN_EMAIL.toLowerCase() },
    {
      $setOnInsert: {
        name: process.env.ADMIN_NAME || 'Store Admin',
        email: process.env.ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        role: 'admin',
        active: true,
      },
    },
    { upsert: true }
  );
}
await Setting.updateOne(
  { key: 'shipping' },
  {
    $setOnInsert: {
      value: {
        standardFee: 0,
        freeShippingThreshold: null,
        codAdvanceFee: 0,
        codEnabled: false,
      },
    },
  },
  { upsert: true }
);
console.log('Seeded six launch products and initial settings.');
await mongoose.disconnect();
