/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  staticPageGenerationTimeout: 3600,
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
    MQTT_URL: process.env.NEXT_PUBLIC_MQTT_URL
  },
  images: {
    loader: 'custom'
  }
}

module.exports = nextConfig
