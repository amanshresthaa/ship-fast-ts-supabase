"use client";

import Image from "next/image";
import { useResponsive } from "@/app/hooks/useResponsive";
import { ResponsiveContainer } from "@/app/components/ResponsiveComponents";
import { AnimatedElement, StaggeredContainer } from "@/app/components/ResponsiveAnimations";

// A one or two sentences testimonial from a customer.
// Highlight the outcome for your customer (how did your product changed her/his life?) or the pain it's removing — Use <span className="bg-warning/25 px-1.5"> to highlight a part of the sentence
const Testimonial1Small = () => {
  const { isMobile, isTablet, deviceType, isTouchDevice } = useResponsive();

  // Device-specific configurations
  const getTestimonialConfig = () => {
    if (isMobile) {
      return {
        padding: 'px-4 py-12',
        starSize: 'w-4 h-4',
        textSize: 'text-sm',
        avatarSize: 'w-10 h-10',
        gap: 'space-y-4',
        maxWidth: 'max-w-sm'
      };
    } else if (isTablet) {
      return {
        padding: 'px-6 py-20',
        starSize: 'w-5 h-5',
        textSize: 'text-base',
        avatarSize: 'w-11 h-11',
        gap: 'space-y-6',
        maxWidth: 'max-w-md'
      };
    }
    return {
      padding: 'px-8 py-16 md:py-32',
      starSize: 'w-5 h-5',
      textSize: 'text-base',
      avatarSize: 'w-12 h-12',
      gap: 'space-y-6 md:space-y-8',
      maxWidth: 'max-w-lg'
    };
  };

  const config = getTestimonialConfig();

  return (
    <section className="bg-base-100">
      <ResponsiveContainer>
        <div className={`
          ${config.gap} ${config.maxWidth} mx-auto ${config.padding}
          transition-all duration-300
        `}>
          {/* Star Rating with staggered animation */}
          <AnimatedElement animation="fadeIn" delay={100}>
            <div className="rating !flex justify-center">
              <StaggeredContainer staggerDelay={100}>
                {[...Array(5)].map((_, i) => (
                  <AnimatedElement 
                    key={i} 
                    animation="scale" 
                    delay={i * 100}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`
                        ${config.starSize} text-warning
                        transition-all duration-300
                        hover:text-warning/80 hover:scale-125
                        ${isTouchDevice() ? 'active:scale-75' : ''}
                      `}
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </AnimatedElement>
                ))}
              </StaggeredContainer>
            </div>
          </AnimatedElement>

          {/* Testimonial Text */}
          <AnimatedElement animation="slideUp" delay={300}>
            <div className={`
              ${config.textSize} leading-relaxed space-y-2 
              ${config.maxWidth} mx-auto text-center
              text-base-content transition-colors duration-300
            `}>
              <p>
                <span className={`
                  bg-warning/25 px-1.5 rounded-sm
                  transition-all duration-300
                  hover:bg-warning/35 hover:px-2
                `}>
                  I don&apos;t want to pay Stripe $2 for every invoice.
                </span>{" "}
                I don&apos;t want to spend 10 minutes manually crafting every
                invoice either.
              </p>
              <p>
                Zenvoice solved this problem once and for all. The app is simple,
                but it nails the job perfectly.
              </p>
            </div>
          </AnimatedElement>

          {/* Author Info */}
          <AnimatedElement animation="slideUp" delay={500}>
            <div className={`
              flex justify-center items-center 
              ${isMobile ? 'gap-3' : 'gap-3 md:gap-4'}
              transition-all duration-300
              ${isTouchDevice() ? 'hover:scale-105' : 'hover:scale-110'}
            `}>
              <div className={`
                ${config.avatarSize} rounded-full overflow-hidden
                ring-2 ring-warning/20 ring-offset-2 ring-offset-base-100
                transition-all duration-300
                hover:ring-warning/40 hover:ring-offset-4
                ${isTouchDevice() ? 'active:scale-95' : 'hover:scale-110'}
              `}>
                <Image
                  className="w-full h-full object-cover"
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=4140&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt={`XYZ feedback for ZenVoice`}
                  width={isMobile ? 40 : isTablet ? 44 : 48}
                  height={isMobile ? 40 : isTablet ? 44 : 48}
                />
              </div>
              <div className="text-left">
                <p className={`
                  font-semibold text-base-content
                  ${isMobile ? 'text-sm' : 'text-base'}
                `}>
                  Someone Nice
                </p>
                <p className={`
                  text-base-content/80 
                  ${isMobile ? 'text-xs' : 'text-sm'}
                `}>
                  23.1K followers on 𝕏
                </p>
              </div>
            </div>
          </AnimatedElement>

          {/* Development indicator */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 text-center">
              <div className="inline-block px-3 py-1 rounded-full text-xs bg-base-300 text-base-content/60">
                Layout: {deviceType} • Touch: {isTouchDevice() ? 'Yes' : 'No'}
              </div>
            </div>
          )}
        </div>
      </ResponsiveContainer>
    </section>
  );
};

export default Testimonial1Small;
