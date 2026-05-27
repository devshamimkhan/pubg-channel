import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
const match = envContent.match(/MONGODB_URI=(.*)/);
if (match) {
  process.env.MONGODB_URI = match[1].trim();
}

import Channel from './src/lib/db/models/Channel.js';
import Post from './src/lib/db/models/Post.js';
import User from './src/lib/db/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing channels and posts
    await Channel.deleteMany({});
    await Post.deleteMany({});
    console.log('Cleared existing Channels and Posts');

    // 1. Create Channels
    const channelsData = [
      { name: 'PUBG UC Store', slug: 'pubg-uc-store', isPinned: true, isVerified: true, followersCount: 50200, onlineCount: 2400 },
      { name: 'BGMI UC Deals', slug: 'bgmi-uc-deals', isPinned: true, isVerified: true, followersCount: 12000, onlineCount: 847 },
      { name: 'Royal Pass Hub', slug: 'royal-pass-hub', isPinned: false, isVerified: false, followersCount: 8400, onlineCount: 312 },
      { name: 'Flash UC Deals', slug: 'flash-uc-deals', isPinned: false, isVerified: true, followersCount: 15600, onlineCount: 521 },
      { name: 'Safe Top-Up BD', slug: 'safe-topup-bd', isPinned: false, isVerified: false, followersCount: 3200, onlineCount: 198, description: '100% safe & verified ✅' },
    ];

    const createdChannels = await Channel.insertMany(channelsData);
    console.log('Created Channels');

    const safeTopUpChannel = createdChannels.find(c => c.slug === 'safe-topup-bd');

    // We need a dummy user for the post author
    let adminUser = await User.findOne({ email: 'admin@pubgucstore.test' });
    if (!adminUser) {
        adminUser = await User.create({
            fullName: 'Admin',
            whatsappNumber: '+8801234567890',
            password: 'hashed-password',
            email: 'admin@pubgucstore.test'
        });
    }

    // 2. Create Posts for 'safe-topup-bd'
    const postsData = [
      {
        channel: safeTopUpChannel._id,
        author: adminUser._id,
        type: 'announcement',
        isPinned: true,
        title: 'How to Order UC using Player ID',
        content: 'Please follow these simple steps to get your UC instantly.',
        templateData: {
          steps: [
            'Select your desired UC pack from the flash sale below',
            'Copy your PUBG Mobile Player ID (e.g. 5123456789)',
            'Click the "Buy UC Now" button',
            'Send us the ID and payment screenshot on WhatsApp'
          ]
        },
        viewCount: 15400,
        reactions: [
          { emoji: '👍', count: 1240 },
          { emoji: '❤️', count: 850 },
          { emoji: '🔥', count: 420 },
        ],
        createdAt: new Date('2026-05-22T10:30:00Z')
      },
      {
        channel: safeTopUpChannel._id,
        author: adminUser._id,
        type: 'uc-flash-sale',
        isPinned: false,
        title: '⚡ MIDDAY FLASH SALE',
        content: 'Biggest discount of the day! Valid for the next 2 hours only. Instant delivery via Player ID.',
        templateData: {
          ucPacks: [
            { uc: 60, price: '115', oldPrice: '130', amount: 60 },
            { uc: 325, price: '560', oldPrice: '620', amount: 325, isPopular: true },
            { uc: 660, price: '1120', oldPrice: '1250', amount: 660 }
          ]
        },
        viewCount: 8200,
        reactions: [
          { emoji: '⚡', count: 540 },
          { emoji: '😍', count: 210 }
        ],
        createdAt: new Date('2026-05-22T12:00:00Z')
      }
    ];

    await Post.insertMany(postsData);
    console.log('Created Posts');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
