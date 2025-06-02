"use client";

import { useState, useRef } from "react";
import type { JSX } from "react";
import Image from "next/image";
import { ResponsiveContainer } from '../app/components/ResponsiveComponents';
import { useResponsive } from '../app/hooks/useResponsive';

interface Feature {
  title: string;
  description: string;
  type?: "video" | "image";
  path?: string;
  format?: string;
  alt?: string;
  svg?: JSX.Element;
}

// The features array is a list of features that will be displayed in the accordion.
// - title: The title of the feature
// - description: The description of the feature (when clicked)
// - type: The type of media (video or image)
// - path: The path to the media (for better SEO, try to use a local path)
// - format: The format of the media (if type is 'video')
// - alt: The alt text of the image (if type is 'image')
const features = [
  {
    title: "Adaptive Learning",
    description:
      "Learning mode quiz difficulty adjusts in real time based on your performance, ensuring you stay challenged but not overwhelmed.",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    title: "Instant Feedback",
    description:
      "Get immediate, detailed explanations after each question to reinforce learning and correct misconceptions.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
        />
      </svg>
    ),
  },
  {
    title: "Progress Tracking",
    description:
      "Monitor your strengths, weaknesses, and improvements over time with visual performance analytics.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    title: "Diverse Question Types",
    description:
      "Practice with multiple formats—single choice, multiple choice, drag & drop, and more—for a well-rounded learning experience.",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
        />
      </svg>
    ),
  },
] as Feature[];

// An SEO-friendly accordion component including the title and a description (when clicked.)
const Item = ({
  feature,
  isOpen,
  setFeatureSelected,
}: {
  index: number;
  feature: Feature;
  isOpen: boolean;
  setFeatureSelected: () => void;
}) => {
  const accordion = useRef(null);
  const { title, description, svg } = feature;
  const { isMobile, isTablet } = useResponsive();

  return (
    <li>
      <button
        className={`
          relative flex gap-3 items-center w-full 
          ${isMobile ? 'py-4 text-sm' : isTablet ? 'py-4 text-base' : 'py-5 text-lg'}
          font-medium text-left transition-all duration-200
          hover:bg-base-200/50 hover:px-4 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-primary/20
          active:scale-[0.98]
        `}
        onClick={(e) => {
          e.preventDefault();
          setFeatureSelected();
        }}
        aria-expanded={isOpen}
      >
        <span className={`
          duration-200 transition-all flex-shrink-0
          ${isOpen ? "text-primary scale-110" : "text-base-content/70"}
          ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}
        `}>
          {svg}
        </span>
        <span
          className={`flex-1 text-base-content transition-all duration-200 ${
            isOpen ? "text-primary font-semibold" : ""
          }`}
        >
          <h3 className={`inline ${isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg'}`}>
            {title}
          </h3>
        </span>
        <span className={`
          transition-transform duration-200 flex-shrink-0
          ${isOpen ? 'rotate-180' : 'rotate-0'}
          ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}
          text-base-content/50
        `}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </button>

      <div
        ref={accordion}
        className={`
          transition-all duration-300 ease-in-out text-base-content-secondary overflow-hidden
          ${isOpen ? 'mb-2' : ''}
        `}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className={`
          ${isMobile ? 'pb-4 pl-8 text-sm' : isTablet ? 'pb-4 pl-9 text-sm' : 'pb-5 pl-9 text-base'}
          leading-relaxed text-base-content/80
        `}>
          {description}
        </div>
      </div>
    </li>
  );
};

// A component to display the media (video or image) of the feature. If the type is not specified, it will display an empty div.
// Video are set to autoplay for best UX.
const Media = ({ feature }: { feature: Feature }) => {
  const { type, path, format, alt } = feature;
  const { isMobile, isTablet } = useResponsive();
  
  const getMediaSize = () => {
    if (isMobile) return { width: 320, height: 320 };
    if (isTablet) return { width: 400, height: 400 };
    return { width: 500, height: 500 };
  };
  
  const size = getMediaSize();
  const style = `
    rounded-2xl aspect-square w-full 
    ${isMobile ? 'max-w-sm mx-auto' : isTablet ? 'max-w-md' : 'sm:w-[26rem]'}
    shadow-lg transition-all duration-300 hover:shadow-xl
  `;

  if (type === "video") {
    return (
      <div className="relative group">
        <video
          className={style}
          autoPlay
          muted
          loop
          playsInline
          controls
          width={size.width}
          height={size.height}
        >
          <source src={path} type={format} />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    );
  } else if (type === "image") {
    return (
      <div className="relative group">
        <Image
          src={path}
          alt={alt}
          className={`${style} object-cover object-center`}
          width={size.width}
          height={size.height}
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    );
  } else {
    return (
      <div className={`${style} !border-none bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center`}>
        <div className="text-base-content/30 text-center">
          <svg className={`mx-auto mb-2 ${isMobile ? 'w-8 h-8' : 'w-12 h-12'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Media Preview</span>
        </div>
      </div>
    );
  }
};

// A component to display 2 to 5 features in an accordion.
// By default, the first feature is selected. When a feature is clicked, the others are closed.
const FeaturesAccordion = () => {
  const [featureSelected, setFeatureSelected] = useState<number>(0);
  const { isMobile, isTablet } = useResponsive();

  return (
    <section
      className="py-16 md:py-24 lg:py-32 space-y-16 md:space-y-24 lg:space-y-32 max-w-7xl mx-auto bg-base-100"
      id="features"
    >
      <ResponsiveContainer>
        <div className="text-center mb-12 md:mb-16 lg:mb-20">
          <h2 className={`
            font-extrabold tracking-tight mb-4 md:mb-6
            ${isMobile ? 'text-2xl' : isTablet ? 'text-3xl' : 'text-4xl lg:text-6xl'}
            bg-gradient-to-r from-base-content to-base-content/80 bg-clip-text text-transparent
          `}>
            All you need to ship your startup fast
            <span className={`
              bg-neutral text-neutral-content rounded-lg inline-block
              ${isMobile ? 'px-2 py-1 ml-1 text-xl' : isTablet ? 'px-3 py-1 ml-1 text-2xl' : 'px-4 py-1 ml-1.5 text-4xl lg:text-6xl'}
              leading-tight whitespace-nowrap
            `}>
              and get profitable
            </span>
          </h2>
          <p className={`
            text-base-content/70 max-w-2xl mx-auto
            ${isMobile ? 'text-sm px-4' : isTablet ? 'text-base px-6' : 'text-lg px-8'}
          `}>
            Everything you need to validate, build, and grow your startup with confidence
          </p>
        </div>
        
        <div className={`
          flex gap-8 md:gap-12 lg:gap-20
          ${isMobile ? 'flex-col' : isTablet ? 'flex-col' : 'lg:flex-row lg:items-start'}
        `}>
          <div className="flex-1">
            <ul className={`
              w-full space-y-1 md:space-y-2
              ${isMobile ? 'bg-base-200/30 rounded-xl p-4' : 'bg-base-200/20 rounded-2xl p-6'}
            `}>
              {features.map((feature, i) => (
                <Item
                  key={feature.title}
                  index={i}
                  feature={feature}
                  isOpen={featureSelected === i}
                  setFeatureSelected={() => setFeatureSelected(i)}
                />
              ))}
            </ul>
          </div>

          <div className={`
            flex-shrink-0 
            ${isMobile ? 'w-full' : isTablet ? 'w-full max-w-md mx-auto' : 'w-auto'}
          `}>
            <div className="sticky top-8">
              <Media feature={features[featureSelected]} key={featureSelected} />
              
              {/* Feature indicators */}
              <div className="flex justify-center mt-6 gap-2">
                {features.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setFeatureSelected(i)}
                    className={`
                      w-2 h-2 rounded-full transition-all duration-200
                      ${featureSelected === i 
                        ? 'bg-primary w-8' 
                        : 'bg-base-content/20 hover:bg-base-content/40'
                      }
                    `}
                    aria-label={`Select feature ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </section>
  );
};

export default FeaturesAccordion;
