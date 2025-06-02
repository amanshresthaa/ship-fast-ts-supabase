"use client";

import Image from "next/image";
import { ResponsiveContainer } from '../app/components/ResponsiveComponents';
import { useResponsive } from '../app/hooks/useResponsive';

// A beautiful single testimonial with a user name and and company logo logo
const Testimonial = () => {
  const { isMobile, isTablet } = useResponsive();
  
  return (
    <section
      className="relative isolate overflow-hidden bg-base-100 py-16 md:py-20 lg:py-24 xl:py-32"
      id="testimonials"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.base-300),theme(colors.base-100))] opacity-20" />
      <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-base-100 shadow-lg ring-1 ring-base-content/10 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />
      
      <ResponsiveContainer>
        <div className="mx-auto max-w-5xl">
          <figure className={`${isMobile ? 'mt-6' : 'mt-10'}`}>
            <div className={`
              flex gap-8 md:gap-12 items-center
              ${isMobile ? 'flex-col text-center' : isTablet ? 'flex-col text-center' : 'lg:flex-row lg:text-left'}
            `}>
              <div className={`
                relative rounded-xl border border-base-content/5 bg-base-content/5 p-1.5 
                ${isMobile ? 'flex-shrink-0' : 'sm:-rotate-1'}
                transition-transform duration-300 hover:rotate-0 hover:scale-105
              `}>
                <Image
                  width={isMobile ? 250 : isTablet ? 280 : 320}
                  height={isMobile ? 250 : isTablet ? 280 : 320}
                  className={`
                    rounded-lg object-cover border-2 border-white/10 shadow-md
                    ${isMobile ? 'w-[250px] h-[250px]' : isTablet ? 'w-[280px] h-[280px]' : 'w-[320px] h-[320px]'}
                  `}
                  // Ideally, load from a statically generated image for better SEO performance (import userImage from "@/public/userImage.png")
                  // If you're using a static image, add placeholder="blur"
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2488&q=80"
                  alt="A testimonial from a happy customer"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                />
              </div>

              <div className="flex-1 space-y-6 md:space-y-8">
                <blockquote className={`
                  font-medium leading-relaxed text-base-content relative
                  ${isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-xl sm:text-2xl'}
                  before:content-['"'] before:text-6xl before:text-primary/20 before:absolute before:-top-4 before:-left-2
                  after:content-['"'] after:text-6xl after:text-primary/20 after:absolute after:-bottom-8 after:-right-2
                `}>
                  I got your boilerplate and having the payments setup with Stripe
                  + user auth is a blessing. This will save me like a week of work
                  for each new side project I spin up. I appreciate that is well
                  documented, as well. 100% worth it!
                </blockquote>
                
                <figcaption className={`
                  flex items-center gap-5
                  ${isMobile ? 'justify-center flex-col gap-4' : isTablet ? 'justify-center' : 'justify-start'}
                `}>
                  <div className="text-base">
                    <div className={`
                      font-semibold text-base-content mb-1
                      ${isMobile ? 'text-base' : 'text-lg'}
                    `}>
                      Amanda Lou
                    </div>
                    <div className={`
                      text-base-content/60
                      ${isMobile ? 'text-sm' : 'text-base'}
                    `}>
                      Indie Maker &amp; Developer
                    </div>
                  </div>

                  <Image
                    width={150}
                    height={50}
                    className={`
                      opacity-70 hover:opacity-100 transition-opacity duration-200
                      ${isMobile ? 'w-16' : isTablet ? 'w-20' : 'w-20 md:w-24'}
                    `}
                    // Ideally, load from a statically generated image for better SEO performance (import userImage from "@/public/userImage.png")
                    src="https://logos-world.net/wp-content/uploads/2020/10/Reddit-Logo.png"
                    alt="Reddit logo"
                    loading="lazy"
                  />
                </figcaption>
              </div>
            </div>
          </figure>
        </div>
      </ResponsiveContainer>
    </section>
  );
};

export default Testimonial;
