import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,

  // Add rewrites to handle the subdomain mapping
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: 'docs.centroid.run',
            },
          ],
          destination: '/docs/:path*',
        }
      ]
    };
  },
};

export default withMDX(config);
