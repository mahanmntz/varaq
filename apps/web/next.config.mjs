/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @varaq/shared ships TypeScript sources.
  transpilePackages: ["@varaq/shared"],
};
export default nextConfig;
