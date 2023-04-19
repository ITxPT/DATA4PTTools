/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  staticPageGenerationTimeout: 3600,
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL
  },
  images: {
    loader: 'custom'
  }
}

module.exports = nextConfig
