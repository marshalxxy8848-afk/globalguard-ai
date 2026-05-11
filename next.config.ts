import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [],
};

// Increase body size limit for image upload API
process.env.NEXT_BODY_SIZE_LIMIT = '5mb';

export default nextConfig;
