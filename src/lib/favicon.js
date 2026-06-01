const DEFAULT_FAVICON_HREF = '/favicon.ico';
const FAVICON_VERSION_PARAM = 'v';

function normalizeFaviconHref(href) {
  if (typeof href !== 'string') {
    return DEFAULT_FAVICON_HREF;
  }

  const trimmedHref = href.trim();
  return trimmedHref || DEFAULT_FAVICON_HREF;
}

function getFaviconVersion(version) {
  if (!version) {
    return '';
  }

  if (version instanceof Date) {
    const timestamp = version.getTime();
    return Number.isNaN(timestamp) ? '' : String(timestamp);
  }

  if (typeof version === 'number') {
    return Number.isFinite(version) ? String(version) : '';
  }

  const parsedTimestamp = new Date(version).getTime();
  if (!Number.isNaN(parsedTimestamp)) {
    return String(parsedTimestamp);
  }

  return String(version).trim();
}

function withQueryParam(href, key, value) {
  const hashIndex = href.indexOf('#');
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;

  const queryIndex = withoutHash.indexOf('?');
  const pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const search = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : '';

  const params = new URLSearchParams(search);
  params.set(key, value);

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ''}${hash}`;
}

function resolveFaviconHref(href, version) {
  const normalizedHref = normalizeFaviconHref(href);
  const resolvedVersion = getFaviconVersion(version);

  return resolvedVersion ? withQueryParam(normalizedHref, FAVICON_VERSION_PARAM, resolvedVersion) : normalizedHref;
}

export {
  DEFAULT_FAVICON_HREF,
  FAVICON_VERSION_PARAM,
  getFaviconVersion,
  normalizeFaviconHref,
  resolveFaviconHref,
  withQueryParam,
};
