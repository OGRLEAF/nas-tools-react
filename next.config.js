/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: process.env.BASE_PATH,
    reactStrictMode: false,
    env: {
        BASE_PATH: process.env.BASE_PATH
    },
    rewrites: () => {
        return [
            {
                source: '/proxy/:path*',
                destination: 'http://127.0.0.1:3001/:path*'
            },
            {
                source: '/static/:path*',
                destination: 'http://127.0.0.1:3001/static/:path*'
            }
        ]
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'assets.fanart.tv',
                port: '',
                pathname: '/fanart/**',
            },
            {
                protocol: 'https',
                hostname: 'image.tmdb.org',
                port: '',
            },
        ],
    }
}

module.exports = nextConfig
