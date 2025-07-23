import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

 serverExternalPackages:['firebase-admin'],
  
  // Prevent prerender manifest issues
  trailingSlash: false,
  poweredByHeader: false,
};

export default nextConfig;
