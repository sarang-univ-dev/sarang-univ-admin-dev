/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ensure that alias resolution is consistent across environments
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": require("path").resolve(__dirname, "src"),
    };

    return config;
  },
  // Enable strict mode for better error reporting
  reactStrictMode: true,
  // Optimize for production builds
  swcMinify: true,
};

export default nextConfig;
