'use server';

import { connectDB } from '@/lib/db/mongoose';
import Review from '@/lib/db/models/Review';
import User from '@/lib/db/models/User';
import { revalidatePath } from 'next/cache';
import { sanitizeContent } from '@/lib/sanitize';

/**
 * Submit a new review.
 */
export async function submitReview(data) {
  try {
    await connectDB();

    if (!data.channel || !data.author || !data.authorName || !data.text) {
      return { success: false, message: 'Missing required fields' };
    }

    // Check if the user is an admin
    const user = await User.findById(data.author);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.role === 'admin') {
      return { success: false, message: 'Admins cannot submit reviews' };
    }

    // Enforce one review per user per channel
    const existingReview = await Review.findOne({
      channel: data.channel,
      author: data.author,
    }).lean();
    if (existingReview) {
      return { success: false, message: 'You have already submitted a review' };
    }

    const safeText = sanitizeContent(data.text);

    const review = await Review.create({
      channel: data.channel,
      author: data.author,
      authorName: data.authorName,
      rating: data.rating || 5,
      text: safeText,
    });

    revalidatePath('/channels');
    return {
      success: true,
      message: 'Review submitted successfully',
      review: JSON.parse(JSON.stringify(review)),
    };
  } catch (error) {
    console.error('Submit review error:', error);
    return { success: false, message: error.message || 'Failed to submit review' };
  }
}

/**
 * Check if a user already reviewed a channel.
 */
export async function hasUserReviewed(channelId, userId) {
  try {
    if (!channelId || !userId) return false;
    await connectDB();
    const existing = await Review.exists({ channel: channelId, author: userId });
    return Boolean(existing);
  } catch (error) {
    console.error('Has user reviewed error:', error);
    return false;
  }
}

/**
 * Get reviews for a channel.
 */
export async function getReviews(channelId, limit = 2) {
  try {
    await connectDB();
    const reviews = await Review.find({ channel: channelId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'avatar')
      .lean();
    
    return JSON.parse(JSON.stringify(reviews));
  } catch (error) {
    console.error('Get reviews error:', error);
    return [];
  }
}

/**
 * Get total review count for a channel.
 */
export async function getReviewCount(channelId) {
  try {
    await connectDB();
    const count = await Review.countDocuments({ channel: channelId });
    return count;
  } catch (error) {
    console.error('Get review count error:', error);
    return 0;
  }
}
