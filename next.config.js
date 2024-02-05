/** @type {import('next').NextConfig} */

const backendApiHost = process.env.API_HOST

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
                destination: `${backendApiHost}/api/:path*`,
                basePath: false
            },
            {
                source: '/static/:path*',
                destination: `${backendApiHost}/static/:path*`
            },
            {
                source: '/imgx',
                destination: `${backendApiHost}/imgx`,
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
