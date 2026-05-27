import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
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
  authorName: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5,
  },
  text: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
