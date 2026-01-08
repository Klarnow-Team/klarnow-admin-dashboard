const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'https://api.klarnow.co.uk/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

