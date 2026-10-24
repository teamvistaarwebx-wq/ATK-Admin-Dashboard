/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Lets `forbidden()` from next/navigation render `src/app/forbidden.jsx`.
    authInterrupts: true,
  },
};

export default nextConfig;
