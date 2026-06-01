'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { connectDB } from '@/lib/db/mongoose';
import SiteSettings from '@/lib/db/models/SiteSettings';
import User from '@/lib/db/models/User';
import Channel from '@/lib/db/models/Channel';
import Post from '@/lib/db/models/Post';

function serialize(doc) {
  return JSON.parse(JSON.stringify(doc));
}

function normalizeLinks(links = []) {
  return Array.isArray(links)
    ? links
        .map((link) => ({
          title: link?.title || '',
          url: link?.url || '',
          image: link?.image || '',
          type: ['card', 'grid', 'row'].includes(link?.type) ? link.type : 'card',
        }))
        .filter((link) => link.title || link.url || link.image)
    : [];
}

function normalizeSocialLinks(socialLinks = []) {
  const allowedPlatforms = new Set(['facebook', 'youtube', 'whatsapp', 'telegram', 'twitter', 'instagram']);

  if (Array.isArray(socialLinks)) {
    return socialLinks
      .map((link, index) => ({
        id: String(link?.id || link?._id || `${link?.platform || 'link'}-${index}`),
        platform: allowedPlatforms.has(link?.platform) ? link.platform : 'facebook',
        url: String(link?.url || '').trim(),
      }))
      .filter((link) => link.url);
  }

  if (socialLinks && typeof socialLinks === 'object') {
    return Object.entries(socialLinks)
      .map(([platform, url], index) => ({
        id: `${platform}-${index}`,
        platform: allowedPlatforms.has(platform) ? platform : 'facebook',
        url: String(url || '').trim(),
      }))
      .filter((link) => link.url);
  }

  return [];
}

function normalizeSeo(seo = {}) {
  return {
    metaTitle: seo?.metaTitle || '',
    metaDescription: seo?.metaDescription || '',
    keywords: seo?.keywords || '',
    canonicalUrl: seo?.canonicalUrl || '',
    ogImage: seo?.ogImage || '',
  };
}

function normalizeFeaturedChannels(featuredChannels = []) {
  return Array.isArray(featuredChannels)
    ? featuredChannels
        .map((channel) => channel?._id || channel)
        .filter(Boolean)
    : [];
}

function normalizeSettingsPayload(data = {}) {
  return {
    siteName: data?.siteName || '',
    siteDescription: data?.siteDescription || '',
    logo: data?.logo || '',
    favicon: data?.favicon || '',
    contactEmail: data?.contactEmail || '',
    whatsappNumber: data?.whatsappNumber || '',
    socialLinks: normalizeSocialLinks(data?.socialLinks),
    homepageContent: {
      bio: data?.homepageContent?.bio || '',
      links: normalizeLinks(data?.homepageContent?.links),
    },
    seo: normalizeSeo(data?.seo),
    featuredChannels: normalizeFeaturedChannels(data?.featuredChannels),
  };
}

function buildDefaultSettings() {
  return normalizeSettingsPayload({
    siteName: 'PUBG UC Store BD',
    siteDescription: 'Your trusted source for PUBG UC, Royal Pass, and more.',
    logo: '',
    favicon: '',
    contactEmail: '',
    whatsappNumber: '',
    socialLinks: [],
    homepageContent: { bio: '', links: [] },
    seo: {},
    featuredChannels: [],
  });
}

function revalidateAdminSettings() {
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/settings');
}

async function getSingletonSettings() {
  await connectDB();
  return SiteSettings.findOne().populate('featuredChannels');
}

/**
 * Read the site settings document.
 */
export async function getSiteSettings() {
  try {
    const settings = await getSingletonSettings();

    return {
      success: true,
      settings: settings ? serialize(settings) : null,
    };
  } catch (error) {
    console.error('Get site settings error:', error);
    return { success: false, message: error.message || 'Failed to get settings' };
  }
}

/**
 * Read settings in edit mode.
 */
export async function editSiteSettings(settingsId) {
  try {
    await connectDB();

    const settings = settingsId
      ? await SiteSettings.findById(settingsId).populate('featuredChannels')
      : await getSingletonSettings();

    if (!settings) {
      return { success: true, settings: null };
    }

    return {
      success: true,
      settings: serialize(settings),
    };
  } catch (error) {
    console.error('Edit site settings error:', error);
    return { success: false, message: error.message || 'Failed to load settings for editing' };
  }
}

/**
 * Create the singleton settings document.
 */
export async function createSiteSettings(data) {
  try {
    await connectDB();

    const existing = await SiteSettings.findOne();
    if (existing) {
      return updateSiteSettings(existing._id.toString(), data);
    }

    const settings = await SiteSettings.create(buildDefaultSettings());
    Object.assign(settings, normalizeSettingsPayload(data));
    await settings.save();

    revalidateAdminSettings();
    return {
      success: true,
      message: 'Settings created successfully',
      settings: serialize(settings),
    };
  } catch (error) {
    console.error('Create site settings error:', error);
    return { success: false, message: error.message || 'Failed to create settings' };
  }
}

/**
 * Update the singleton settings document or update a specific settings id.
 * Supports both updateSiteSettings(data) and updateSiteSettings(id, data).
 */
export async function updateSiteSettings(settingsIdOrData, maybeData) {
  try {
    await connectDB();

    const hasId = typeof settingsIdOrData === 'string' || typeof settingsIdOrData === 'object' && settingsIdOrData && settingsIdOrData._id;
    const settingsId = typeof settingsIdOrData === 'string' ? settingsIdOrData : settingsIdOrData?._id?.toString?.();
    const data = typeof settingsIdOrData === 'string' ? maybeData : settingsIdOrData;

    const payload = normalizeSettingsPayload(data);

    const settings = hasId && settingsId
      ? await SiteSettings.findByIdAndUpdate(
          settingsId,
          { $set: payload },
          { new: true, runValidators: true }
        )
      : await SiteSettings.findOneAndUpdate(
          {},
          { $set: payload, $setOnInsert: buildDefaultSettings() },
          { new: true, upsert: true, runValidators: true }
        );

    if (!settings) {
      return { success: false, message: 'Settings not found' };
    }

    revalidateAdminSettings();
    return {
      success: true,
      message: 'Settings updated successfully',
      settings: serialize(await settings.populate('featuredChannels')),
    };
  } catch (error) {
    console.error('Update site settings error:', error);
    return { success: false, message: error.message || 'Failed to update settings' };
  }
}

export async function updateSocialLinks(settingsIdOrData, maybeSocialLinks) {
  try {
    await connectDB();

    const hasId = typeof settingsIdOrData === 'string' || typeof settingsIdOrData === 'object' && settingsIdOrData && settingsIdOrData._id;
    const settingsId = typeof settingsIdOrData === 'string' ? settingsIdOrData : settingsIdOrData?._id?.toString?.();
    const socialLinks = normalizeSocialLinks(typeof settingsIdOrData === 'string' ? maybeSocialLinks : settingsIdOrData);

    const settings = hasId && settingsId
      ? await SiteSettings.findByIdAndUpdate(
          settingsId,
          { $set: { socialLinks } },
          { new: true, runValidators: true }
        )
      : await SiteSettings.findOneAndUpdate(
          {},
          { $set: { socialLinks }, $setOnInsert: buildDefaultSettings() },
          { new: true, upsert: true, runValidators: true }
        );

    if (!settings) {
      return { success: false, message: 'Settings not found' };
    }

    revalidateAdminSettings();
    return {
      success: true,
      message: 'Social links saved successfully',
      settings: serialize(await settings.populate('featuredChannels')),
    };
  } catch (error) {
    console.error('Update social links error:', error);
    return { success: false, message: error.message || 'Failed to update social links' };
  }
}

export async function getAdminDashboardData() {
  try {
    await connectDB();

    const [settings, users, channels, posts] = await Promise.all([
      SiteSettings.findOne().populate('featuredChannels').lean(),
      User.find().sort({ createdAt: -1 }).lean(),
      Channel.find().sort({ createdAt: -1 }).lean(),
      Post.find().sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    return {
      success: true,
      settings: settings ? serialize(settings) : null,
      users: serialize(users),
      channels: serialize(channels),
      posts: serialize(posts),
    };
  } catch (error) {
    console.error('Get admin dashboard data error:', error);
    return { success: false, message: error.message || 'Failed to load dashboard data' };
  }
}

export async function createUserAccount(data) {
  try {
    await connectDB();

    if (!data?.fullName || !data?.whatsappNumber || !data?.password) {
      return { success: false, message: 'Full name, WhatsApp number, and password are required' };
    }

    const existing = await User.findOne({ whatsappNumber: data.whatsappNumber });
    if (existing) return { success: false, message: 'A user with this WhatsApp number already exists' };

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await User.create({
      fullName: data.fullName,
      displayName: data.displayName || '',
      email: data.email || '',
      whatsappNumber: data.whatsappNumber,
      password: hashedPassword,
      role: 'user',
      avatar: data.avatar || '',
      bio: data.bio || '',
    });

    revalidatePath('/admin');
    return { success: true, message: 'User created successfully', user: serialize(user) };
  } catch (error) {
    console.error('Create user error:', error);
    return { success: false, message: error.message || 'Failed to create user' };
  }
}

export async function createAdminAccount(data) {
  try {
    await connectDB();

    const fullName = String(data?.fullName || '').trim();
    const whatsappNumber = String(data?.whatsappNumber || '').trim();
    const password = String(data?.password || '');

    if (!fullName || !whatsappNumber || !password) {
      return { success: false, message: 'Full name, WhatsApp number, and password are required' };
    }

    const existing = await User.findOne({ whatsappNumber });
    if (existing) return { success: false, message: 'A user with this WhatsApp number already exists' };

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      fullName,
      whatsappNumber,
      password: hashedPassword,
      role: 'admin',
    });

    revalidatePath('/admin');
    return { success: true, message: 'Admin account created successfully', user: serialize(admin) };
  } catch (error) {
    console.error('Create admin error:', error);
    return { success: false, message: error.message || 'Failed to create admin account' };
  }
}

export async function banUser(userId, reason = '') {
  try {
    await connectDB();

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isBanned: true,
        banReason: reason || '',
        bannedAt: new Date(),
      },
      { new: true }
    );

    if (!user) return { success: false, message: 'User not found' };

    revalidatePath('/admin');
    return { success: true, message: 'User banned successfully', user: serialize(user) };
  } catch (error) {
    console.error('Ban user error:', error);
    return { success: false, message: error.message || 'Failed to ban user' };
  }
}

export async function unbanUser(userId) {
  try {
    await connectDB();

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isBanned: false,
        banReason: '',
        bannedAt: null,
      },
      { new: true }
    );

    if (!user) return { success: false, message: 'User not found' };

    revalidatePath('/admin');
    return { success: true, message: 'User unbanned successfully', user: serialize(user) };
  } catch (error) {
    console.error('Unban user error:', error);
    return { success: false, message: error.message || 'Failed to unban user' };
  }
}

function normalizeWhatsappNumber(value = '') {
  return String(value || '').trim();
}

async function persistAdminAccount(userId, data = {}) {
  const user = await User.findById(userId);
  if (!user) return { success: false, message: 'Admin user not found' };

  const fullName = String(data.fullName || '').trim();
  const whatsappNumber = normalizeWhatsappNumber(data.whatsappNumber);
  const passwordInput = String(data.password || '');

  if (!fullName || !whatsappNumber || !passwordInput) {
    return { success: false, message: 'Full name, WhatsApp number, and password are required' };
  }

  const duplicate = await User.findOne({
    whatsappNumber,
    _id: { $ne: userId },
  });

  if (duplicate) {
    return { success: false, message: 'A user with this WhatsApp number already exists' };
  }

  const passwordMatches = await bcrypt.compare(passwordInput, user.password);
  if (passwordMatches) {
    user.fullName = fullName;
    user.whatsappNumber = whatsappNumber;
  } else {
    if (passwordInput.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    user.fullName = fullName;
    user.whatsappNumber = whatsappNumber;
    user.password = await bcrypt.hash(passwordInput, 10);
  }

  await user.save();

  revalidatePath('/admin');
  revalidatePath('/admin/account');
  revalidatePath('/admin/users');

  return {
    success: true,
    message: 'Account updated successfully',
    user: serialize(user),
  };
}

export async function updateAdminAccount(userId, data) {
  try {
    await connectDB();
    return await persistAdminAccount(userId, data);
  } catch (error) {
    console.error('Update admin account error:', error);
    return { success: false, message: error.message || 'Failed to update account' };
  }
}

export async function updateAdminProfile(userId, data) {
  return updateAdminAccount(userId, {
    fullName: data?.fullName,
    whatsappNumber: data?.whatsappNumber,
    password: data?.password || data?.currentPassword || data?.newPassword || '',
  });
}

export async function updateAdminCredentials(userId, data) {
  return updateAdminAccount(userId, {
    fullName: data?.fullName || data?.displayName || '',
    whatsappNumber: data?.whatsappNumber || '',
    password: data?.password || data?.currentPassword || data?.newPassword || '',
  });
}
