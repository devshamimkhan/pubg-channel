import mongoose from 'mongoose';

const ChannelReadStateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
    index: true,
  },
  lastSeenAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

ChannelReadStateSchema.index({ user: 1, channel: 1 }, { unique: true });

export default mongoose.models.ChannelReadState || mongoose.model('ChannelReadState', ChannelReadStateSchema);
