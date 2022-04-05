/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL: process.env.API_URL,
    MQTT_URL: process.env.MQTT_URL,
  },
}

module.exports = nextConfig
