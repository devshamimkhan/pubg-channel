'use server';

import { connectDB } from '@/lib/db/mongoose';
import Post from '@/lib/db/models/Post';
import Channel from '@/lib/db/models/Channel';
import { revalidatePath } from 'next/cache';
import { sanitizeContent } from '@/lib/sanitize';
import { publishChannelsUpdate } from '@/lib/realtime/channelsHub';

const VALID_POST_TYPES = [
  'announcement',
  'uc-flash-sale',
  'royal-pass',
  'customer-review',
  'text',
  'media',
  'poll',
];

/**
 * Create a new post.
 */
export async function createPost(data) {
  try {
    await connectDB();

    if (!data.type || !VALID_POST_TYPES.includes(data.type)) {
      return {
        success: false,
        message: `Invalid post type. Must be one of: ${VALID_POST_TYPES.join(', ')}`,
      };
    }

    if (!data.channel) {
      return { success: false, message: 'Channel is required' };
    }

    if (!data.author) {
      return { success: false, message: 'Author is required' };
    }

    // Sanitize HTML content before persisting – blocks XSS while allowing rich formatting
    const safeContent = sanitizeContent(data.content || '');

    const post = await Post.create({
      channel: data.channel,
      author: data.author,
      type: data.type,
      title: sanitizeContent(data.title || ''),
      content: safeContent,
      media: data.media || [],
      templateData: data.templateData || {},
      isPinned: data.isPinned || false,
    });

    revalidatePath('/channels');
    const channelDoc = await Channel.findById(post.channel).select('slug').lean();
    if (channelDoc?.slug) revalidatePath(`/channels/${channelDoc.slug}`);
    publishChannelsUpdate({ channelId: String(post.channel) });
    return {
      success: true,
      message: 'Post created successfully',
      post: JSON.parse(JSON.stringify(post)),
    };
  } catch (error) {
    console.error('Create post error:', error);
    return { success: false, message: error.message || 'Failed to create post' };
  }
}

/**
 * Update an existing post.
 */
export async function updatePost(postId, data) {
  try {
    await connectDB();

    if (data.type && !VALID_POST_TYPES.includes(data.type)) {
      return {
        success: false,
        message: `Invalid post type. Must be one of: ${VALID_POST_TYPES.join(', ')}`,
      };
    }

    // Sanitize HTML fields before updating
    const updatePayload = { ...data };
    if (updatePayload.content) updatePayload.content = sanitizeContent(updatePayload.content);
    if (updatePayload.title)   updatePayload.title   = sanitizeContent(updatePayload.title);

    const post = await Post.findByIdAndUpdate(postId, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!post) {
      return { success: false, message: 'Post not found' };
    }

    revalidatePath('/channels');
    const channelDoc = await Channel.findById(post.channel).select('slug').lean();
    if (channelDoc?.slug) revalidatePath(`/channels/${channelDoc.slug}`);
    publishChannelsUpdate({ channelId: String(post.channel) });
    return {
      success: true,
      message: 'Post updated successfully',
      post: JSON.parse(JSON.stringify(post)),
    };
  } catch (error) {
    console.error('Update post error:', error);
    return { success: false, message: error.message || 'Failed to update post' };
  }
}

/**
 * Delete a post by ID.
 */
export async function deletePost(postId) {
  try {
    await connectDB();

    const post = await Post.findByIdAndDelete(postId);

    if (!post) {
      return { success: false, message: 'Post not found' };
    }

    revalidatePath('/channels');
    const channelDoc = await Channel.findById(post.channel).select('slug').lean();
    if (channelDoc?.slug) revalidatePath(`/channels/${channelDoc.slug}`);
    publishChannelsUpdate({ channelId: String(post.channel) });
    return { success: true, message: 'Post deleted successfully' };
  } catch (error) {
    console.error('Delete post error:', error);
    return { success: false, message: error.message || 'Failed to delete post' };
  }
}

/**
 * Toggle pin status of a post.
 */
export async function togglePinPost(postId) {
  try {
    await connectDB();

    const post = await Post.findById(postId);
    if (!post) {
      return { success: false, message: 'Post not found' };
    }

    post.isPinned = !post.isPinned;
    await post.save();

    revalidatePath('/channels');
    const channelDoc = await Channel.findById(post.channel).select('slug').lean();
    if (channelDoc?.slug) revalidatePath(`/channels/${channelDoc.slug}`);
    publishChannelsUpdate({ channelId: String(post.channel) });
    return {
      success: true,
      message: post.isPinned ? 'Post pinned' : 'Post unpinned',
      isPinned: post.isPinned,
    };
  } catch (error) {
    console.error('Toggle pin error:', error);
    return { success: false, message: error.message || 'Failed to toggle pin' };
  }
}
