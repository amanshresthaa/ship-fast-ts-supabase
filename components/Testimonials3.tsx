'use client';

import Image from "next/image";
import { StaticImageData } from "next/image";
import config from "@/config";
import { useResponsive } from "@/app/hooks/useResponsive";
import { ResponsiveContainer } from "@/app/components/ResponsiveComponents";
import { AnimatedElement } from "@/app/components/ResponsiveAnimations";

// The list of your testimonials. It needs 3 items to fill the row.
const list: {
  username?: string;
  name: string;
  text: string;
  img?: string | StaticImageData;
}[] = [
  {
    // Optional, use for social media like Twitter. Does not link anywhere but cool to display
    username: "marclou",
    // REQUIRED
    name: "Marc Lou",
    // REQUIRED
    text: "Really easy to use. The tutorials are really useful and explains how everything works. Hope to ship my next project really fast!",
    // Optional, a statically imported image (usually from your public folder—recommended) or a link to the person's avatar. Shows a fallback letter if not provided
    img: "https://pbs.twimg.com/profile_images/1514863683574599681/9k7PqDTA_400x400.jpg",
  },
  {
    username: "the_mcnaveen",
    name: "Naveen",
    text: "Setting up everything from the ground up is a really hard, and time consuming process. What you pay for will save your time for sure.",
  },
  {
    username: "wahab",
    name: "Wahab Shaikh",
    text: "Easily saves 15+ hrs for me setting up trivial stuff. Now, I can directly focus on shipping features rather than hours of setting up the same technologies from scratch. Feels like a super power! :D",
  },
];

// A single testimonial, to be rendered in  a list
const Testimonial = ({ i }: { i: number }) => {
  const testimonial = list[i];
  const { isMobile, isTablet, deviceType } = useResponsive();

  if (!testimonial) return null;

  return (
    <li className="h-full">
      <figure 
        className={`
          relative h-full flex flex-col
          ${isMobile 
            ? 'p-4 bg-base-200 rounded-xl text-sm' 
            : isTablet 
              ? 'p-6 bg-base-200 rounded-xl' 
              : 'p-8 bg-base-200 rounded-2xl'
          }
          transition-all duration-300 ease-in-out
          hover:bg-base-300 hover:shadow-lg hover:-translate-y-1
          group
        `}
      >
        <blockquote className="relative flex-1">
          <div className="absolute -top-2 -left-2 text-4xl text-primary/20 font-serif select-none group-hover:text-primary/40 transition-colors">
            &quot;
          </div>
          <p 
            className={`
              text-base-content/80 leading-relaxed relative z-10
              ${isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg'}
              group-hover:text-base-content transition-colors
            `}
          >
            {testimonial.text}
          </p>
        </blockquote>
        
        <figcaption 
          className={`
            relative flex items-center justify-between gap-4 border-t border-base-content/5
            ${isMobile ? 'pt-3 mt-3' : isTablet ? 'pt-4 mt-4' : 'pt-6 mt-6'}
          `}
        >
          <div className="flex-1 min-w-0">
            <div 
              className={`
                font-semibold text-base-content truncate
                ${isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg'}
              `}
            >
              {testimonial.name}
            </div>
            {testimonial.username && (
              <div 
                className={`
                  text-primary/70 font-medium
                  ${isMobile ? 'text-xs mt-0.5' : 'text-sm mt-1'}
                `}
              >
                @{testimonial.username}
              </div>
            )}
          </div>

          <div 
            className={`
              overflow-hidden rounded-full bg-base-300 shrink-0 ring-2 ring-transparent
              group-hover:ring-primary/20 transition-all duration-300
              ${isMobile ? 'w-10 h-10' : isTablet ? 'w-12 h-12' : 'w-14 h-14'}
            `}
          >
            {testimonial.img ? (
              <Image
                className="w-full h-full rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
                src={testimonial.img}
                alt={`${testimonial.name}'s testimonial for ${config.appName}`}
                width={isMobile ? 40 : isTablet ? 48 : 56}
                height={isMobile ? 40 : isTablet ? 48 : 56}
                loading="lazy"
              />
            ) : (
              <span 
                className={`
                  w-full h-full rounded-full flex justify-center items-center font-bold bg-gradient-to-br from-primary to-primary/70 text-white
                  ${isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'}
                `}
              >
                {testimonial.name.charAt(0)}
              </span>
            )}
          </div>
        </figcaption>
      </figure>
    </li>
  );
};

const Testimonials3 = () => {
  const { isMobile, isTablet, isDesktop, deviceType } = useResponsive();

  // Responsive grid configuration
  const gridConfig = {
    mobile: { columns: 1, gap: 'gap-4' },
    tablet: { columns: 2, gap: 'gap-6' }, 
    desktop: { columns: 3, gap: 'gap-8' }
  };

  const currentGrid = isMobile ? gridConfig.mobile : isTablet ? gridConfig.tablet : gridConfig.desktop;

  return (
    <section id="testimonials" className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-base-200/30 to-base-300/20 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
      
      <ResponsiveContainer className="relative z-10">
        <div className={`${isMobile ? 'py-16' : isTablet ? 'py-20' : 'py-24'}`}>
          {/* Header section */}
          <AnimatedElement animation="fadeIn" delay={0}>
            <div className="text-center mb-12 lg:mb-16">
              <div className={`mb-4 ${isMobile ? 'mb-6' : 'mb-8'}`}>
                <h2 
                  className={`
                    font-extrabold text-base-content
                    ${isMobile ? 'text-2xl' : isTablet ? 'text-3xl' : 'text-4xl lg:text-5xl'}
                  `}
                >
                  212 makers are already shipping faster!
                </h2>
              </div>
              <p 
                className={`
                  leading-relaxed text-base-content/70 mx-auto
                  ${isMobile ? 'text-sm px-4' : isTablet ? 'text-base lg:w-2/3' : 'text-lg lg:w-2/3'}
                `}
              >
                Don&apos;t take our word for it. Here&apos;s what they have to say about ShipFast.
              </p>
            </div>
          </AnimatedElement>

          {/* Testimonials grid */}
          <ul 
            role="list" 
            className={`
              grid grid-cols-${currentGrid.columns} ${currentGrid.gap} 
              ${isMobile ? 'px-4' : ''}
              items-stretch
            `}
          >
            {[...Array(3)].map((e, i) => (
              <AnimatedElement 
                key={i} 
                animation="slideUp" 
                delay={i * 150}
                className="h-full"
              >
                <Testimonial i={i} />
              </AnimatedElement>
            ))}
          </ul>

          {/* Call to action */}
          <AnimatedElement animation="fadeIn" delay={600}>
            <div className="text-center mt-12 lg:mt-16">
              <p className="text-base-content/60 text-sm">
                Join {list.length === 3 ? '200+' : '500+'} happy customers who chose our solution
              </p>
            </div>
          </AnimatedElement>

          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 pt-4 border-t border-base-300 text-center text-xs text-base-content/60">
              Layout: {currentGrid.columns} columns • Device: {deviceType} • Grid: {currentGrid.gap}
            </div>
          )}
        </div>
      </ResponsiveContainer>
    </section>
  );
};

export default Testimonials3;
