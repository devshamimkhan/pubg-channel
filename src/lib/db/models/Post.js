import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['announcement', 'uc-flash-sale', 'royal-pass', 'customer-review', 'text', 'media'],
    required: true,
  },
  title: String,
  content: String,
  media: [{
    url: String,
    type: { type: String, enum: ['image', 'video'] },
    thumbnail: String,
  }],
  isPinned: {
    type: Boolean,
    default: false,
  },
  templateData: mongoose.Schema.Types.Mixed,
  reactions: [{
    emoji: String,
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    count: { type: Number, default: 0 },
  }],
  viewCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

export default mongoose.models.Post || mongoose.model('Post', PostSchema);
