import { connectDB } from '@/lib/db/mongoose';
import SiteSettings from '@/lib/db/models/SiteSettings';
import { resolveFaviconHref } from '@/lib/favicon';

const DEFAULT_SITE_TITLE = 'PUBG UC Store BD';
const DEFAULT_SITE_DESCRIPTION =
  'Official PUBG UC Store Bangladesh. Buy UC cheap & fast. WhatsApp Channel, Royal Pass, Flash Sales & more.';

function serialize(value) {
  return JSON.parse(JSON.stringify(value));
}

function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCanonicalUrl(value) {
  const trimmed = trimText(value);
  return trimmed || '';
}

function buildPageTitle(pageTitle, siteTitle) {
  const resolvedPageTitle = trimText(pageTitle);
  const resolvedSiteTitle = trimText(siteTitle) || DEFAULT_SITE_TITLE;

  if (!resolvedPageTitle) {
    return resolvedSiteTitle;
  }

  if (resolvedPageTitle.toLowerCase().includes(resolvedSiteTitle.toLowerCase())) {
    return resolvedPageTitle;
  }

  return `${resolvedPageTitle} | ${resolvedSiteTitle}`;
}

function buildDescription(settings, pageDescription = '') {
  const seoDescription = trimText(settings?.seo?.metaDescription);
  const siteDescription = trimText(settings?.siteDescription);
  const resolvedPageDescription = trimText(pageDescription);

  return resolvedPageDescription || seoDescription || siteDescription || DEFAULT_SITE_DESCRIPTION;
}

function buildKeywords(settings, pageKeywords = '') {
  const seoKeywords = trimText(settings?.seo?.keywords);
  const resolvedPageKeywords = trimText(pageKeywords);

  return resolvedPageKeywords || seoKeywords || '';
}

function buildOgImage(settings, pageOgImage = '') {
  const seoOgImage = trimText(settings?.seo?.ogImage);
  const logo = trimText(settings?.logo);

  return trimText(pageOgImage) || seoOgImage || logo || '';
}

function buildRobots(noIndex = false) {
  return noIndex
    ? { index: false, follow: false, nocache: true }
    : { index: true, follow: true };
}

function buildMetadataBase(settings) {
  const siteTitle = trimText(settings?.siteName) || DEFAULT_SITE_TITLE;
  const favicon = resolveFaviconHref(settings?.favicon || '/favicon.ico', settings?.updatedAt);

  return {
    siteTitle,
    favicon,
  };
}

export async function getSiteSettingsSnapshot() {
  try {
    await connectDB();
    const settings = await SiteSettings.findOne().lean();
    return settings ? serialize(settings) : null;
  } catch {
    return null;
  }
}

export function createSeoMetadata(settings, options = {}) {
  const { pageTitle = '', pageDescription = '', pageKeywords = '', pageOgImage = '', canonicalUrl = '', noIndex = false } = options;
  const { siteTitle, favicon } = buildMetadataBase(settings);
  const resolvedTitle = buildPageTitle(
    trimText(pageTitle) || trimText(settings?.seo?.metaTitle) || '',
    siteTitle
  );
  const resolvedDescription = buildDescription(settings, pageDescription);
  const resolvedKeywords = buildKeywords(settings, pageKeywords);
  const resolvedOgImage = buildOgImage(settings, pageOgImage);
  const resolvedCanonicalUrl = normalizeCanonicalUrl(canonicalUrl || settings?.seo?.canonicalUrl);

  const metadata = {
    title: resolvedTitle,
    description: resolvedDescription,
    robots: buildRobots(noIndex),
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
  };

  if (resolvedKeywords) {
    metadata.keywords = resolvedKeywords;
  }

  if (resolvedCanonicalUrl) {
    metadata.alternates = {
      canonical: resolvedCanonicalUrl,
    };
  }

  if (resolvedOgImage) {
    metadata.openGraph = {
      title: resolvedTitle,
      description: resolvedDescription,
      type: 'website',
      images: [resolvedOgImage],
    };

    metadata.twitter = {
      card: 'summary_large_image',
      title: resolvedTitle,
      description: resolvedDescription,
      images: [resolvedOgImage],
    };
  } else {
    metadata.openGraph = {
      title: resolvedTitle,
      description: resolvedDescription,
      type: 'website',
    };

    metadata.twitter = {
      card: 'summary',
      title: resolvedTitle,
      description: resolvedDescription,
    };
  }

  return metadata;
}

export async function getSeoMetadata(options = {}) {
  const settings = await getSiteSettingsSnapshot();
  return createSeoMetadata(settings, options);
}
