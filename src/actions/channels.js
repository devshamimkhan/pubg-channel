'use server';

import { connectDB } from '@/lib/db/mongoose';
import Channel from '@/lib/db/models/Channel';
import User from '@/lib/db/models/User';
import Post from '@/lib/db/models/Post';
import ChannelReadState from '@/lib/db/models/ChannelReadState';
import { revalidatePath } from 'next/cache';
import { publishChannelsUpdate } from '@/lib/realtime/channelsHub';

/**
 * Generate a URL-friendly slug from a string.
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function serialize(doc) {
  return doc ? JSON.parse(JSON.stringify(doc)) : null;
}

function normalizeBoolean(value, defaultValue = false) {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0') return false;
  return defaultValue;
}

function normalizeChannelPayload(data = {}) {
  return {
    name: String(data.name || '').trim(),
    description: String(data.description || '').trim(),
    avatar: String(data.avatar || '').trim(),
    coverImage: String(data.coverImage || '').trim(),
    tickerText: String(data.tickerText || '').trim(),
    tickerEnabled: normalizeBoolean(data.tickerEnabled, true),
    isVerified: normalizeBoolean(data.isVerified, false),
    isPinned: normalizeBoolean(data.isPinned, false),
    isReviewEnabled: normalizeBoolean(data.isReviewEnabled, false),
  };
}

function getPostPreviewText(post) {
  const stripHtml = (text = '') => text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const shorten = (text = '', max = 60) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
  if (!post) return 'No posts yet';
  const cleanTitle = stripHtml(post.title || '');
  const cleanContent = stripHtml(post.content || '');
  if (post.type === 'uc-flash-sale') return `🔥 ${shorten(cleanTitle || 'Flash Sale')}`;
  if (post.type === 'royal-pass') return `👑 ${shorten(cleanTitle || 'Royal Pass')}`;
  if (post.type === 'announcement') return `📢 ${shorten(cleanTitle || 'Announcement')}`;
  if (post.type === 'poll') return `📊 ${shorten(cleanTitle || 'New poll')}`;
  if (post.type === 'media') return cleanContent ? `📷 ${shorten(cleanContent)}` : '📷 Media post';
  if (cleanTitle) return shorten(cleanTitle);
  if (cleanContent) return shorten(cleanContent);
  return 'New post available';
}

function revalidateChannels() {
  revalidatePath('/');
  revalidatePath('/channels');
  revalidatePath('/admin');
  revalidatePath('/admin/channels');
}

/**
 * Read all channels for the admin page.
 */
export async function getChannels() {
  try {
    await connectDB();

    const channels = await Channel.find().sort({ createdAt: -1 }).lean();

    return {
      success: true,
      channels: serialize(channels),
    };
  } catch (error) {
    console.error('Get channels error:', error);
    return { success: false, message: error.message || 'Failed to get channels', channels: [] };
  }
}

/**
 * Read a single channel for editing.
 */
export async function editChannel(channelId) {
  try {
    if (!channelId) {
      return { success: false, message: 'Channel id is required', channel: null };
    }

    await connectDB();

    const channel = await Channel.findById(channelId).lean();
    if (!channel) {
      return { success: false, message: 'Channel not found', channel: null };
    }

    return {
      success: true,
      channel: serialize(channel),
    };
  } catch (error) {
    console.error('Edit channel error:', error);
    return { success: false, message: error.message || 'Failed to load channel', channel: null };
  }
}

/**
 * Create a new channel.
 */
export async function createChannel(formData) {
  try {
    await connectDB();

    const payload = normalizeChannelPayload(formData);

    if (!payload.name) {
      return { success: false, message: 'Channel name is required' };
    }

    let slug = generateSlug(payload.name);
    const existingChannel = await Channel.findOne({ slug });
    if (existingChannel) {
      slug = `${slug}-${Date.now()}`;
    }

    const channel = await Channel.create({
      ...payload,
      slug,
      createdBy:
        typeof formData === 'object' && formData?.get
          ? formData.get('createdBy')
          : formData?.createdBy || undefined,
    });

    revalidateChannels();
    publishChannelsUpdate({ channelId: String(channel._id) });

    return {
      success: true,
      message: 'Channel created successfully',
      channel: serialize(channel),
    };
  } catch (error) {
    console.error('Create channel error:', error);
    return { success: false, message: error.message || 'Failed to create channel', channel: null };
  }
}

/**
 * Update an existing channel.
 */
export async function updateChannel(channelId, data) {
  try {
    if (!channelId) {
      return { success: false, message: 'Channel id is required', channel: null };
    }

    await connectDB();

    const existingChannel = await Channel.findById(channelId);
    if (!existingChannel) {
      return { success: false, message: 'Channel not found', channel: null };
    }

    const payload = normalizeChannelPayload(data);

    if (!payload.name) {
      return { success: false, message: 'Channel name is required', channel: null };
    }

    const nextSlug = payload.name !== existingChannel.name ? generateSlug(payload.name) : existingChannel.slug;
    if (nextSlug !== existingChannel.slug) {
      const slugExists = await Channel.findOne({ slug: nextSlug, _id: { $ne: channelId } });
      existingChannel.slug = slugExists ? `${nextSlug}-${Date.now()}` : nextSlug;
    }

    existingChannel.name = payload.name;
    existingChannel.description = payload.description;
    existingChannel.avatar = payload.avatar;
    existingChannel.coverImage = payload.coverImage;
    existingChannel.tickerText = payload.tickerText;
    existingChannel.tickerEnabled = payload.tickerEnabled;
    existingChannel.isVerified = payload.isVerified;
    existingChannel.isPinned = payload.isPinned;
    existingChannel.isReviewEnabled = payload.isReviewEnabled;

    await existingChannel.save();

    revalidateChannels();
    publishChannelsUpdate({ channelId: String(existingChannel._id) });

    return {
      success: true,
      message: 'Channel updated successfully',
      channel: serialize(existingChannel),
    };
  } catch (error) {
    console.error('Update channel error:', error);
    return { success: false, message: error.message || 'Failed to update channel', channel: null };
  }
}

/**
 * Delete a channel by ID.
 */
export async function deleteChannel(channelId) {
  try {
    if (!channelId) {
      return { success: false, message: 'Channel id is required' };
    }

    await connectDB();

    const channel = await Channel.findByIdAndDelete(channelId);

    if (!channel) {
      return { success: false, message: 'Channel not found' };
    }

    revalidateChannels();
    publishChannelsUpdate({ channelId: String(channelId) });

    return { success: true, message: 'Channel deleted successfully' };
  } catch (error) {
    console.error('Delete channel error:', error);
    return { success: false, message: error.message || 'Failed to delete channel' };
  }
}

/**
 * Toggle follow/unfollow a channel for a user.
 */
export async function toggleFollowChannel(channelId, userId) {
  try {
    await connectDB();

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return { success: false, message: 'Channel not found' };
    }

    const isFollowing = channel.followers.some((id) => id.toString() === userId);

    if (isFollowing) {
      await Channel.findByIdAndUpdate(channelId, {
        $pull: { followers: userId },
      });
    } else {
      await Channel.findByIdAndUpdate(channelId, {
        $addToSet: { followers: userId },
      });
    }

    const updatedChannel = await Channel.findById(channelId).lean();

    revalidatePath('/channels');
    revalidatePath('/admin/channels');
    return {
      success: true,
      message: isFollowing ? 'Unfollowed channel' : 'Followed channel',
      isFollowing: !isFollowing,
      followersCount: updatedChannel?.followers?.length ?? 0,
    };
  } catch (error) {
    console.error('Toggle follow error:', error);
    return { success: false, message: error.message || 'Failed to toggle follow' };
  }
}

/**
 * Live channel snapshot for client polling.
 */
export async function getChannelsLiveSnapshot(userId) {
  try {
    await connectDB();

    const channels = await Channel.find().lean();
    const onlineCutoff = new Date(Date.now() - 2 * 60 * 1000);

    const latestPosts = await Post.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$channel',
          latestPostId: { $first: '$_id' },
          latestTitle: { $first: '$title' },
          latestContent: { $first: '$content' },
          latestType: { $first: '$type' },
          latestCreatedAt: { $first: '$createdAt' },
        },
      },
    ]);
    const latestByChannel = new Map(
      latestPosts.map((p) => [
        p._id.toString(),
        {
          _id: p.latestPostId,
          title: p.latestTitle,
          content: p.latestContent,
          type: p.latestType,
          createdAt: p.latestCreatedAt,
        },
      ])
    );

    let readStateByChannel = new Map();
    if (userId) {
      const readStates = await ChannelReadState.find({ user: userId }).lean();
      readStateByChannel = new Map(readStates.map((r) => [r.channel.toString(), r.lastSeenAt]));
    }

    const channelsWithStats = await Promise.all(
      channels.map(async (channel) => {
        const followerIds = (channel.followers || []).map((id) => id.toString());
        const onlineFollowerCount = followerIds.length
          ? await User.countDocuments({
              _id: { $in: followerIds },
              lastSeenAt: { $gte: onlineCutoff },
            })
          : 0;

        const latestPost = latestByChannel.get(channel._id.toString());
        const latestPreview = getPostPreviewText(latestPost);
        const lastSeenAt = readStateByChannel.get(channel._id.toString());
        let unseenCount = 0;
        if (userId) {
          const unseenQuery = { channel: channel._id };
          if (lastSeenAt) unseenQuery.createdAt = { $gt: lastSeenAt };
          unseenCount = await Post.countDocuments(unseenQuery);
        }

        return {
          _id: channel._id.toString(),
          followersCount: followerIds.length,
          onlineCount: onlineFollowerCount,
          isFollowing: userId ? followerIds.includes(userId) : false,
          latestPostPreview: latestPreview,
          latestPostAt: latestPost?.createdAt || null,
          unseenCount,
        };
      })
    );

    return {
      success: true,
      channels: channelsWithStats,
    };
  } catch (error) {
    console.error('Get channels live snapshot error:', error);
    return { success: false, channels: [] };
  }
}

export async function markChannelSeen(channelId, userId) {
  try {
    if (!channelId || !userId) return { success: false };
    await connectDB();
    await ChannelReadState.findOneAndUpdate(
      { channel: channelId, user: userId },
      { $set: { lastSeenAt: new Date() } },
      { upsert: true, new: true }
    );
    publishChannelsUpdate({ channelId: String(channelId), userId: String(userId) });
    return { success: true };
  } catch (error) {
    console.error('Mark channel seen error:', error);
    return { success: false };
  }
}

/**
 * Update current user's presence heartbeat.
 */
export async function updateUserPresence(userId) {
  try {
    if (!userId) return { success: false };
    await connectDB();
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeenAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Update user presence error:', error);
    return { success: false };
  }
}
