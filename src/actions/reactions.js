'use server';

import { connectDB } from '@/lib/db/mongoose';
import Post from '@/lib/db/models/Post';
import { revalidatePath } from 'next/cache';

/**
 * Toggle a reaction emoji on a post for a given user.
 * If user already reacted with this emoji, remove them; otherwise add them.
 */
export async function toggleReaction(postId, emoji, userId) {
  try {
    await connectDB();

    const post = await Post.findById(postId);
    if (!post) {
      return { success: false, message: 'Post not found' };
    }

    // 1. Remove user from ALL other reactions on this post
    post.reactions.forEach((reaction) => {
      if (reaction.emoji !== emoji) {
        const userIndex = reaction.users.findIndex(
          (id) => id.toString() === userId
        );
        if (userIndex !== -1) {
          reaction.users.splice(userIndex, 1);
          reaction.count = Math.max(0, reaction.count - 1);
        }
      }
    });

    // Clean up empty reactions
    post.reactions = post.reactions.filter(r => r.users.length > 0 || r.emoji === emoji);

    // 2. Toggle the requested emoji
    const reactionIndex = post.reactions.findIndex(
      (r) => r.emoji === emoji
    );

    if (reactionIndex === -1) {
      // Emoji reaction doesn't exist yet — create it with this user
      post.reactions.push({
        emoji,
        users: [userId],
        count: 1,
      });
    } else {
      const reaction = post.reactions[reactionIndex];
      const userIndex = reaction.users.findIndex(
        (id) => id.toString() === userId
      );

      if (userIndex !== -1) {
        // User already reacted — remove them (toggle off)
        reaction.users.splice(userIndex, 1);
        reaction.count = Math.max(0, reaction.count - 1);

        // Remove reaction entry if no users left
        if (reaction.users.length === 0) {
          post.reactions.splice(reactionIndex, 1);
        }
      } else {
        // Add user to this reaction (toggle on)
        reaction.users.push(userId);
        reaction.count = reaction.users.length;
      }
    }

    await post.save();

    revalidatePath('/channels');
    return {
      success: true,
      message: 'Reaction toggled',
      reactions: JSON.parse(JSON.stringify(post.reactions)),
    };
  } catch (error) {
    console.error('Toggle reaction error:', error);
    return { success: false, message: error.message || 'Failed to toggle reaction' };
  }
}

/**
 * Vote on a poll option within a post.
 * Adds user to voters and increments the option's vote count.
 */
export async function votePoll(postId, optionIndex, userId) {
  try {
    await connectDB();

    const post = await Post.findById(postId);
    if (!post) {
      return { success: false, message: 'Post not found' };
    }

    if (post.type !== 'poll') {
      return { success: false, message: 'This post is not a poll' };
    }

    const templateData = post.templateData || {};
    const pollOptions = templateData.pollOptions || [];

    if (optionIndex < 0 || optionIndex >= pollOptions.length) {
      return { success: false, message: 'Invalid poll option index' };
    }

    // Check if user already voted on any option
    const alreadyVoted = pollOptions.some((option) =>
      (option.voters || []).some((id) => id.toString() === userId)
    );

    if (alreadyVoted) {
      return { success: false, message: 'You have already voted on this poll' };
    }

    // Add vote
    if (!pollOptions[optionIndex].voters) {
      pollOptions[optionIndex].voters = [];
    }
    pollOptions[optionIndex].voters.push(userId);
    pollOptions[optionIndex].votes =
      (pollOptions[optionIndex].votes || 0) + 1;

    post.templateData = { ...templateData, pollOptions };
    post.markModified('templateData');
    await post.save();

    revalidatePath('/channels');
    return {
      success: true,
      message: 'Vote recorded',
      templateData: JSON.parse(JSON.stringify(post.templateData)),
    };
  } catch (error) {
    console.error('Vote poll error:', error);
    return { success: false, message: error.message || 'Failed to vote' };
  }
}
