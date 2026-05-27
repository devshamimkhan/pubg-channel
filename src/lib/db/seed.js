import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ---- Inline model imports (for standalone script execution) ----
// We re-import models here so the seed can run with `node --experimental-modules`
// or via a bundler without needing the @/ alias.

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/pubg-community';

// ---------- Schemas ----------

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, required: true, unique: true, trim: true },
    password: { type: String },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    avatar: { type: String },
  },
  { timestamps: true }
);

const ChannelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, required: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    avatar: { type: String },
    coverImage: { type: String },
    isVerified: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    followersCount: { type: Number, default: 0 },
    onlineCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const PostSchema = new mongoose.Schema(
  {
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['announcement', 'uc-flash-sale', 'royal-pass', 'customer-review', 'text', 'media', 'poll'],
      required: true,
    },
    title: { type: String, trim: true },
    content: { type: String },
    media: [{ url: String, type: { type: String, enum: ['image', 'video'] }, thumbnail: String }],
    isPinned: { type: Boolean, default: false },
    templateData: { type: mongoose.Schema.Types.Mixed },
    reactions: [
      {
        emoji: String,
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        count: { type: Number, default: 0 },
      },
    ],
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const SiteSettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'PUBG UC Store BD' },
    siteDescription: { type: String, default: '' },
    logo: { type: String },
    socialLinks: {
      whatsapp: { type: String, default: '' },
      youtube: { type: String, default: '' },
      facebook: { type: String, default: '' },
      telegram: { type: String, default: '' },
    },
    homepageContent: {
      bio: { type: String, default: '' },
      links: [
        {
          title: String,
          url: String,
          image: String,
          type: { type: String, enum: ['card', 'grid', 'row'], default: 'card' },
        },
      ],
    },
    featuredChannels: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Channel' }],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// ---------- Models ----------

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Channel = mongoose.models.Channel || mongoose.model('Channel', ChannelSchema);
const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
const SiteSettings =
  mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);

// ---------- Seed Function ----------

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Channel.deleteMany({});
  await Post.deleteMany({});
  await SiteSettings.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // ---------- 1. Create Admin User ----------
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await User.create({
    fullName: 'Admin',
    whatsappNumber: '01700000000',
    password: hashedPassword,
    role: 'admin',
  });
  console.log('👤 Admin user created:', admin.fullName);

  // ---------- 2. Create Sample Channels ----------
  const channelsData = [
    {
      name: 'PUBG UC Store',
      slug: 'pubg-uc-store',
      description: 'Official PUBG UC Store — Buy UC at the lowest prices with instant delivery.',
      isVerified: true,
      isPinned: true,
      followersCount: 15200,
      onlineCount: 342,
    },
    {
      name: 'BGMI UC Deals',
      slug: 'bgmi-uc-deals',
      description: 'Best BGMI UC deals and offers. Trusted by thousands of players.',
      isVerified: true,
      isPinned: false,
      followersCount: 8900,
      onlineCount: 156,
    },
    {
      name: 'Royal Pass Hub',
      slug: 'royal-pass-hub',
      description: 'Royal Pass giveaways, reviews, and upgrade deals.',
      isVerified: true,
      isPinned: false,
      followersCount: 12400,
      onlineCount: 278,
    },
    {
      name: 'Flash UC Deals',
      slug: 'flash-uc-deals',
      description: 'Flash sales and limited-time UC offers. Act fast!',
      isVerified: false,
      isPinned: false,
      followersCount: 5600,
      onlineCount: 89,
    },
    {
      name: 'Safe Top-Up BD',
      slug: 'safe-top-up-bd',
      description: 'Safe and verified top-up service for Bangladesh players.',
      isVerified: true,
      isPinned: false,
      followersCount: 9800,
      onlineCount: 201,
    },
  ];

  const channels = await Channel.insertMany(
    channelsData.map((ch) => ({ ...ch, createdBy: admin._id }))
  );
  console.log(`📢 ${channels.length} channels created`);

  const pubgUcStore = channels[0];

  // ---------- 3. Create Sample Posts for PUBG UC Store ----------
  const postsData = [
    {
      channel: pubgUcStore._id,
      author: admin._id,
      type: 'announcement',
      title: '🎉 Welcome to PUBG UC Store!',
      content:
        'Welcome to the official PUBG UC Store channel. Here you will find the best UC deals, flash sales, royal pass upgrades, and customer reviews. Stay tuned for daily offers!',
      isPinned: true,
      templateData: {
        priority: 'high',
        badge: 'Official',
      },
    },
    {
      channel: pubgUcStore._id,
      author: admin._id,
      type: 'uc-flash-sale',
      title: '⚡ Flash Sale — 660 UC at ৳520!',
      content: 'Limited time offer! Get 660 UC for only ৳520. Regular price ৳650. Offer valid for next 24 hours.',
      templateData: {
        ucAmount: 660,
        originalPrice: 650,
        salePrice: 520,
        currency: 'BDT',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        badge: 'FLASH SALE',
      },
    },
    {
      channel: pubgUcStore._id,
      author: admin._id,
      type: 'royal-pass',
      title: '👑 Royal Pass Month 24 — Upgrade Now!',
      content:
        'Royal Pass Month 24 is here! Upgrade your Royal Pass through us and save up to 20%. DM us on WhatsApp to order.',
      templateData: {
        season: 'Month 24',
        rpPrice: 600,
        elitePrice: 1800,
        currency: 'BDT',
        features: ['Exclusive outfits', 'Weapon skins', 'Emotes', 'RP badges'],
      },
    },
    {
      channel: pubgUcStore._id,
      author: admin._id,
      type: 'customer-review',
      title: '⭐ Customer Review — Rakib from Dhaka',
      content: '"Super fast delivery! Got my UC within 5 minutes. Totally recommended. Will buy again." — Rakib',
      templateData: {
        customerName: 'Rakib',
        location: 'Dhaka',
        rating: 5,
        ucPurchased: 1800,
        deliveryTime: '5 minutes',
      },
      reactions: [
        { emoji: '👍', users: [], count: 24 },
        { emoji: '❤️', users: [], count: 12 },
      ],
      viewCount: 156,
    },
  ];

  const posts = await Post.insertMany(postsData);
  console.log(`📝 ${posts.length} posts created for "${pubgUcStore.name}"`);

  // ---------- 4. Create Default Site Settings ----------
  const settings = await SiteSettings.create({
    siteName: 'PUBG UC Store BD',
    siteDescription:
      'Your trusted source for PUBG UC, Royal Pass, and gaming top-ups in Bangladesh.',
    socialLinks: {
      whatsapp: 'https://wa.me/8801700000000',
      youtube: 'https://youtube.com/@pubgucstorebd',
      facebook: 'https://facebook.com/pubgucstorebd',
      telegram: 'https://t.me/pubgucstorebd',
    },
    homepageContent: {
      bio: 'PUBG UC Store BD — Trusted by 15,000+ gamers. Fast delivery, best prices.',
      links: [
        {
          title: 'Buy UC Now',
          url: '/channels/pubg-uc-store',
          image: '',
          type: 'card',
        },
        {
          title: 'Royal Pass',
          url: '/channels/royal-pass-hub',
          image: '',
          type: 'card',
        },
        {
          title: 'Flash Deals',
          url: '/channels/flash-uc-deals',
          image: '',
          type: 'grid',
        },
      ],
    },
    featuredChannels: channels.map((ch) => ch._id),
    updatedBy: admin._id,
  });
  console.log('⚙️  Site settings created:', settings.siteName);

  // ---------- Summary ----------
  console.log('\n========================================');
  console.log('🌱 Seed completed successfully!');
  console.log('========================================');
  console.log(`👤 Admin: whatsappNumber=01700000000, password=admin123`);
  console.log(`📢 Channels: ${channels.length}`);
  console.log(`📝 Posts: ${posts.length}`);
  console.log(`⚙️  Site Settings: created`);
  console.log('========================================\n');

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
