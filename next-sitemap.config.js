module.exports = {
  // REQUIRED: add your own domain name here (e.g. https://shipfa.st),
  siteUrl: process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://shipfa.st",
  generateRobotsTxt: false, // We have a custom robots.txt
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  // use this to exclude routes from the sitemap (i.e. a user dashboard). By default, NextJS app router metadata files are excluded (https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
  exclude: [
    "/twitter-image.*", 
    "/opengraph-image.*", 
    "/icon.*",
    "/dashboard/*",
    "/api/*",
    "/admin/*",
    "/quiz-test/*",
    "/debug-components/*"
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/admin/']
      }
    ]
  }
};
