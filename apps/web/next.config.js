/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@rxvault/shared"],
  experimental: { typedRoutes: false },
  images: { domains: ["localhost"] },
};

module.exports = nextConfig;
