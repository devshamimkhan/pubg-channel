import mongoose from 'mongoose';

const SocialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['facebook', 'youtube', 'whatsapp', 'telegram', 'twitter', 'instagram'],
      default: 'facebook',
    },
    url: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const HomePageLinkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['card', 'grid', 'row'],
      default: 'card',
    },
  },
  { _id: false }
);

const SiteSettingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: 'PUBG UC Store BD',
    },
    siteDescription: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    favicon: {
      type: String,
      default: '',
    },
    contactEmail: {
      type: String,
      default: '',
    },
    whatsappNumber: {
      type: String,
      default: '',
    },
    socialLinks: {
      type: [SocialLinkSchema],
      default: [],
    },
    homepageContent: {
      bio: {
        type: String,
        default: '',
      },
      links: {
        type: [HomePageLinkSchema],
        default: [],
      },
    },
    seo: {
      metaTitle: {
        type: String,
        default: '',
      },
      metaDescription: {
        type: String,
        default: '',
      },
      keywords: {
        type: String,
        default: '',
      },
      canonicalUrl: {
        type: String,
        default: '',
      },
      ogImage: {
        type: String,
        default: '',
      },
    },
    featuredChannels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Channel',
      },
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema);
