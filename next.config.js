/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  images: {
    unoptimized: true
  },
  env: {
    SERVER: process.env.SERVER,
    MODE: process.env.MODE
  }
}

if(process.env.MODE === "dev"){
  nextConfig.env.SERVER = "localhost"
}

module.exports = nextConfig
