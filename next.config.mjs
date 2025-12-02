import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ensure that alias resolution is consistent across environments
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
    };

    return config;
  },
  // Enable strict mode for better error reporting
  reactStrictMode: true,
  // Optimize for production builds
  swcMinify: true,
};

export default nextConfig;
