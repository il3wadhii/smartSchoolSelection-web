/** @type {import('next').NextConfig} */
// API_PROXY_TARGET lets the web server proxy /api and /uploads to the local API.
// This means a public tunnel only needs to expose the web (one origin) — the API
// is reached server-side, so there's no second tunnel and no CORS to configure.
const API_PROXY = process.env.API_PROXY_TARGET || 'http://localhost:3001'

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // The live parents site is the /preview design (Orbit hero). Bare / goes there.
  async redirects() {
    return [{ source: '/', destination: '/preview', permanent: false }]
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_PROXY}/api/:path*` },
      { source: '/uploads/:path*', destination: `${API_PROXY}/uploads/:path*` },
    ]
  },
}

module.exports = nextConfig
