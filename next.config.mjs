/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Lets `forbidden()` from next/navigation render `src/app/forbidden.jsx`.
    authInterrupts: true,
    // `npm run demo` stores photos inline in the database, so its product
    // saves carry them in the request. Real deployments keep the 1MB default.
    ...(process.env.DEMO_MODE === "1"
      ? { serverActions: { bodySizeLimit: "8mb" } }
      : {}),
  },
};

export default nextConfig;
