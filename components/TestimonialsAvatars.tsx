"use client";

import Image from "next/image";
import { useResponsive } from "@/app/hooks/useResponsive";
import { ResponsiveContainer } from "@/app/components/ResponsiveComponents";
import { AnimatedElement, StaggeredContainer } from "@/app/components/ResponsiveAnimations";

const avatars: {
  alt: string;
  src: string;
}[] = [
  {
    alt: "User",
    // Ideally, load from a statically generated image for better SEO performance (import userImage from "@/public/userImage.png")
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3276&q=80",
  },
  {
    alt: "User",
    src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
  },
  {
    alt: "User",
    src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
  },
  {
    alt: "User",
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80",
  },
  {
    alt: "User",
    src: "https://images.unsplash.com/photo-1488161628813-04466f872be2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3376&q=80",
  },
];

const TestimonialsAvatars = ({ priority }: { priority?: boolean }) => {
  const { isMobile, isTablet, deviceType, isTouchDevice } = useResponsive();

  // Device-specific configurations
  const getAvatarConfig = () => {
    if (isMobile) {
      return {
        size: 'w-10 h-10',
        spacing: '-space-x-3',
        ratingSize: 'w-4 h-4',
        gap: 'gap-4'
      };
    } else if (isTablet) {
      return {
        size: 'w-11 h-11',
        spacing: '-space-x-4',
        ratingSize: 'w-5 h-5',
        gap: 'gap-5'
      };
    }
    return {
      size: 'w-12 h-12',
      spacing: '-space-x-5',
      ratingSize: 'w-5 h-5',
      gap: 'gap-6'
    };
  };

  const config = getAvatarConfig();

  return (
    <ResponsiveContainer>
      <AnimatedElement animation="fadeIn" delay={200}>
        <div className={`
          flex flex-col justify-center items-center
          ${isMobile ? 'md:flex-col md:items-center gap-3' : 'md:flex-row md:items-start'}
          ${config.gap}
        `}>
          {/* AVATARS with staggered animation */}
          <StaggeredContainer staggerDelay={80}>
            <div className={`
              ${config.spacing} avatar-group justify-center
              transition-transform duration-300
              ${isTouchDevice ? 'hover:scale-105' : 'hover:scale-110'}
            `}>
              {avatars.map((image, i) => (
                <AnimatedElement 
                  key={i} 
                  animation="scale" 
                  delay={i * 80}
                >
                  <div className={`
                    avatar ${config.size}
                    ring-2 ring-white ring-offset-2 ring-offset-base-200
                    transition-all duration-300
                    hover:ring-primary hover:ring-offset-primary/10 hover:z-10
                    ${isTouchDevice ? 'active:scale-95' : 'hover:scale-110'}
                  `}>
                    <Image
                      src={image.src}
                      alt={image.alt}
                      priority={priority}
                      width={isMobile ? 40 : isTablet ? 44 : 50}
                      height={isMobile ? 40 : isTablet ? 44 : 50}
                      className="rounded-full object-cover"
                    />
                  </div>
                </AnimatedElement>
              ))}
            </div>
          </StaggeredContainer>

          {/* RATING with enhanced animations */}
          <AnimatedElement animation="slideUp" delay={400}>
            <div className={`
              flex flex-col justify-center items-center
              ${isMobile ? 'md:items-center' : 'md:items-start'}
              ${isMobile ? 'gap-2' : 'gap-1'}
            `}>
              {/* Star Rating */}
              <div className={`
                rating transition-all duration-300
                ${isTouchDevice ? 'hover:scale-105' : 'hover:scale-110'}
              `}>
                {[...Array(5)].map((_, i) => (
                  <AnimatedElement 
                    key={i} 
                    animation="scale" 
                    delay={500 + (i * 50)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`
                        ${config.ratingSize} text-yellow-500
                        transition-all duration-300
                        hover:text-yellow-400 hover:drop-shadow-lg
                        ${isTouchDevice ? 'active:scale-75' : 'hover:scale-125'}
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
              </div>

              {/* Counter Text */}
              <div className={`
                text-base-content/80 transition-colors duration-300
                ${isMobile ? 'text-sm text-center' : isTablet ? 'text-base' : 'text-base'}
              `}>
                <span className="font-semibold text-base-content">32</span> makers
                ship faster
              </div>

              {/* Responsive indicator badge */}
              {process.env.NODE_ENV === 'development' && (
                <div className={`
                  mt-2 px-2 py-1 rounded-full text-xs bg-base-300 text-base-content/60
                  ${isMobile ? 'hidden' : ''}
                `}>
                  {deviceType}
                </div>
              )}
            </div>
          </AnimatedElement>
        </div>
      </AnimatedElement>
    </ResponsiveContainer>
  );
};

export default TestimonialsAvatars;
