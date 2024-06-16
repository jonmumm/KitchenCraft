/** @type {import('next').NextConfig} */

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  customWorkerSrc: "src/service-worker",
  register: false,
  workboxOptions: {
    mode: "production",
  },
});

module.exports = withPWA({
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "replicate.delivery",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "hs3ly50cep4xikcx.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  productionBrowserSourceMaps: true,
  experimental: {
    instrumentationHook: true,
  },
});
