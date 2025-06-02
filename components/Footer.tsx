import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import logo from "@/app/icon.png";
import { ResponsiveContainer, ResponsiveGrid } from "@/app/components/ResponsiveComponents";

// Add the Footer to the bottom of your landing page and more.
// The support link is connected to the config.js file. If there's no config.mailgun.supportEmail, the link won't be displayed.

const Footer = () => {
  return (
    <footer className="bg-base-200 border-t border-base-content/10">
      <ResponsiveContainer className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="w-full lg:w-80 lg:flex-shrink-0 text-center lg:text-left">
            <Link
              href="/#"
              aria-current="page"
              className="inline-flex gap-2 items-center mb-4 hover:opacity-80 transition-opacity"
            >
              <Image
                src={logo}
                alt={`${config.appName} logo`}
                priority={true}
                className="w-6 h-6 sm:w-7 sm:h-7"
                width={28}
                height={28}
              />
              <strong className="font-extrabold tracking-tight text-lg sm:text-xl">
                {config.appName}
              </strong>
            </Link>

            <p className="text-sm sm:text-base text-base-content/80 mb-4 max-w-sm mx-auto lg:mx-0">
              {config.appDescription}
            </p>
            <p className="text-xs sm:text-sm text-base-content/60">
              Copyright © {new Date().getFullYear()} - All rights reserved
            </p>
          </div>

          {/* Links Section */}
          <div className="flex-grow">
            <ResponsiveGrid 
              mobileCols={1}
              tabletCols={2}
              desktopCols={2}
              gap="gap-8 sm:gap-12"
              className="text-center lg:text-left"
            >
              {/* Links Column */}
              <div>
                <h3 className="footer-title font-semibold text-base-content tracking-widest text-sm mb-4 sm:mb-6">
                  LINKS
                </h3>
                <nav className="flex flex-col gap-3 sm:gap-4">
                  {config.mailgun.supportEmail && (
                    <a
                      href={`mailto:${config.mailgun.supportEmail}`}
                      target="_blank"
                      className="link link-hover text-sm sm:text-base transition-colors hover:text-primary"
                      aria-label="Contact Support"
                    >
                      Support
                    </a>
                  )}
                  <Link href="/#pricing" className="link link-hover text-sm sm:text-base transition-colors hover:text-primary">
                    Pricing
                  </Link>
                  <Link href="/blog" className="link link-hover text-sm sm:text-base transition-colors hover:text-primary">
                    Blog
                  </Link>
                  <a href="/#" target="_blank" className="link link-hover text-sm sm:text-base transition-colors hover:text-primary">
                    Affiliates
                  </a>
                </nav>
              </div>

              {/* Legal Column */}
              <div>
                <h3 className="footer-title font-semibold text-base-content tracking-widest text-sm mb-4 sm:mb-6">
                  LEGAL
                </h3>
                <nav className="flex flex-col gap-3 sm:gap-4">
                  <Link href="/tos" className="link link-hover text-sm sm:text-base transition-colors hover:text-primary">
                    Terms of Service
                  </Link>
                  <Link href="/privacy-policy" className="link link-hover text-sm sm:text-base transition-colors hover:text-primary">
                    Privacy Policy
                  </Link>
                </nav>
              </div>
            </ResponsiveGrid>
          </div>
        </div>
      </ResponsiveContainer>
    </footer>
  );
};

export default Footer;
