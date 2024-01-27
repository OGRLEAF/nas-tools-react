/** @type {import('next').NextConfig} */
const nextConfig = {
    basePath: "/ui",
    reactStrictMode: false,
    rewrites: () => {
        return [
            {
                source: '/proxy/:path*',
                destination: 'http://127.0.0.1:3001/:path*'
            }
        ]
    }
}

module.exports = nextConfig
