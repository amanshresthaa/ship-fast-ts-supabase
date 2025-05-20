```javascript
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      // NextJS <Image> component needs to whitelist domains for src={}
      "lh3.googleusercontent.com",
      "pbs.twimg.com",
      "images.unsplash.com",
      "logos-world.net",
    ],
  },

  async redirects() {
    return [
      {
        source: '/quiz-optimized/:quizId',
        destination: '/quizzes/:quizId',
        permanent: true,
      },
      {
        source: '/quiz-cached/:quizId',
        destination: '/quizzes/:quizId', // Standardizing to the main quiz path
        permanent: true,
      },
      {
        source: '/debug-components',
        destination: '/dev/debug-components',
        permanent: true,
      },
      {
        source: '/test-order-questions',
        destination: '/dev/test-order-questions',
        permanent: true,
      },
      {
        source: '/quiz-test/:quizId',
        destination: '/dev/quiz-test/:quizId',
        permanent: true,
      },
      {
        source: '/quiz-test/:quizId/:questionType',
        destination: '/dev/quiz-test/:quizId/:questionType',
        permanent: true,
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
```
