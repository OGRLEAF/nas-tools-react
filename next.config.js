/** @type {import('next').NextConfig} */
const { readFileSync } = require("fs")
const backendApiHost = process.env.API_HOST

const version = readFileSync("./VERSION", "utf8");
const buildTime = new Date().toISOString();


const nextConfig = {
    basePath: process.env.BASE_PATH,
    reactStrictMode: false,
    output: 'standalone',
    
    env: {
        BASE_PATH: process.env.BASE_PATH,
        NEXT_PUBLIC_PACKAGE_VERSION: version,
        NEXT_PUBLIC_BUILD_TIME: buildTime,
        NEXT_PUBLIC_API_HOST: backendApiHost
    },
    rewrites: () => {
        return [
            {
                source: '/api/:path*',
                destination: `${backendApiHost}/api/:path*`,
                basePath: false
            },
            {
                source: '/socket.io/:path*',
                destination: `${backendApiHost}/socket.io/:path*/`,
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
    },
}

module.exports = nextConfig
