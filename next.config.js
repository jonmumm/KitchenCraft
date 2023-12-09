/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa")({
  customWorkerDir: "src/serviceWorker",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = withPWA({
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hs3ly50cep4xikcx.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
});

module.exports = nextConfig;
