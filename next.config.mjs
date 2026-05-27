/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  experimental: {
    proxyClientMaxBodySize: '200mb',
  },

  // Allow <img> tags (via dangerouslySetInnerHTML) to load from any external domain.
  // Note: This config applies to next/image; plain <img> tags are unrestricted by Next.js.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }, // allow all HTTPS image hosts
      { protocol: 'http',  hostname: '**' }, // allow all HTTP  image hosts (dev/intranet)
    ],
    // Opt-out of Next.js image optimization for externally-hosted images
    // so raw <img src="https://..."> tags in rich HTML content always render.
    unoptimized: false,
  },

  // Security headers — allow images from any origin, block dangerous content
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",    // Next.js & intl-tel-input needs these
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com https://ka-f.fontawesome.com data:",
              "img-src 'self' data: blob: https: http:",             // allow all image sources
              "media-src 'self' https: http:",                       // allow external video/audio
              "connect-src 'self' https: http: ws: wss:",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
