/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    webpackDevMiddleware: config => {
        config.watchOptions = {
            poll: 1000,
            aggregateTimeout: 300,
        };
        return config;
    },
    async rewrites() {
        return [
            {
                source: '/scm/:path*',
                destination: `${process.env.NEXT_PUBLIC_BACKEND}/scm/:path*`,
            },
            {
                source: '/healthz',
                destination: '/api/health',
            },
        ];
    },
};

module.exports = nextConfig;
