"use client";

import { useRef, useState } from "react";
import type { JSX } from "react";
import { useResponsive } from "@/app/hooks/useResponsive";
import { ResponsiveContainer } from "@/app/components/ResponsiveComponents";

// <FAQ> component is a lsit of <Item> component
// Just import the FAQ & add your FAQ content to the const faqList arrayy below.

interface FAQItemProps {
  question: string;
  answer: JSX.Element;
}

const faqList: FAQItemProps[] = [
  {
    question: "What do I get exactly?",
    answer: <div className="space-y-2 leading-relaxed">Loreum Ipseum</div>,
  },
  {
    question: "Can I get a refund?",
    answer: (
      <p>
        Yes! You can request a refund within 7 days of your purchase. Reach out
        by email.
      </p>
    ),
  },
  {
    question: "I have another question",
    answer: (
      <div className="space-y-2 leading-relaxed">Cool, contact us by email</div>
    ),
  },
];

const FaqItem = ({ item }: { item: FAQItemProps }) => {
  const accordion = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile } = useResponsive();

  return (
    <li>
      <button
        className="relative flex gap-3 sm:gap-4 items-center w-full py-4 sm:py-5 text-sm sm:text-base md:text-lg font-semibold text-left border-t border-base-content/10 touch-target-min"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span
          className={`flex-1 text-base-content ${isOpen ? "text-primary" : ""}`}
        >
          {item?.question}
        </span>
        <svg
          className={`flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 ml-auto fill-current transition-transform duration-200 ease-out ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center transition duration-200 ease-out ${
              isOpen && "rotate-180"
            }`}
          />
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center rotate-90 transition duration-200 ease-out ${
              isOpen && "rotate-180 hidden"
            }`}
          />
        </svg>
      </button>

      <div
        ref={accordion}
        className={`transition-all duration-300 ease-in-out opacity-80 overflow-hidden`}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="pb-4 sm:pb-5 leading-relaxed text-sm sm:text-base text-base-content/90">
          {item?.answer}
        </div>
      </div>
    </li>
  );
};

const FAQ = () => {
  const { isMobile, isTablet } = useResponsive();

  return (
    <section className="bg-base-200" id="faq">
      <ResponsiveContainer className={`py-12 sm:py-16 md:py-20 lg:py-24 flex flex-col ${isMobile ? 'gap-8' : 'md:flex-row gap-12'}`}>
        <div className={`flex flex-col text-left ${isMobile ? 'basis-full' : 'basis-1/2'}`}>
          <p className="inline-block font-semibold text-primary mb-3 sm:mb-4 text-sm sm:text-base">FAQ</p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-base-content leading-tight">
            Frequently Asked Questions
          </p>
        </div>

        <ul className={`${isMobile ? 'basis-full' : 'basis-1/2'} space-y-1`}>
          {faqList.map((item, i) => (
            <FaqItem key={i} item={item} />
          ))}
        </ul>
      </ResponsiveContainer>
    </section>
  );
};

export default FAQ;
