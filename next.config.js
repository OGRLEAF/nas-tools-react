/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: process.env.BASE_PATH,
    reactStrictMode: false,
    output: 'standalone',
    env: {
        BASE_PATH: process.env.BASE_PATH
    },
    
    rewrites: () => {
        return [
            {
                source: '/api/:path*',
                destination: 'http://127.0.0.1:3001/api/:path*',
                basePath: false
            },
            {
                source: '/static/:path*',
                destination: 'http://127.0.0.1:3001/static/:path*'
            },
            {
                source: '/imgx',
                destination: 'http://127.0.0.1:3001/imgx',
                basePath: false
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
