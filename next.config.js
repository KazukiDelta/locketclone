/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // We render direct Cloudinary URLs with <img>, so optimization is disabled.
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

module.exports = nextConfig;
