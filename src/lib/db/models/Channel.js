import mongoose from 'mongoose';

const ChannelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  avatar: String,
  coverImage: String,
  isVerified: {
    type: Boolean,
    default: false,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  followersCount: {
    type: Number,
    default: 0,
  },
  onlineCount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isReviewEnabled: {
    type: Boolean,
    default: false,
  },
  tickerEnabled: {
    type: Boolean,
    default: true,
  },
  tickerText: {
    type: String,
    default: 'FLASH SALE: 60 UC @ ৳45 | 325 UC @ ৳235 | 660 UC @ ৳450 | 1800 UC @ ৳1,150   ✅ Instant Delivery via UID   🏆 10,000+ Happy Customers   💳 bKash · Nagad · Rocket Accepted',
  },
}, { timestamps: true });

export default mongoose.models.Channel || mongoose.model('Channel', ChannelSchema);
