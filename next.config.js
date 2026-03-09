/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ❗ Build succeeds even if there are TS errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // ❗ Build succeeds even if there are ESLint errors
    ignoreDuringBuilds: true,
  },
  output: "standalone",
};
module.exports = nextConfig;
