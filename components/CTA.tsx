import Image from "next/image";
import Link from "next/link";
import config from "@/config";
import { ResponsiveContainer } from "@/app/components/ResponsiveComponents";

const CTA = () => {
  return (
    <section className="relative hero overflow-hidden min-h-[60vh] sm:min-h-[70vh] md:min-h-[80vh] lg:min-h-screen">
      <Image
        src="https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=3540&q=80"
        alt="Background"
        className="object-cover w-full"
        fill
        priority
        sizes="100vw"
      />
      <div className="relative hero-overlay bg-neutral bg-opacity-70"></div>
      <div className="relative hero-content text-center text-neutral-content p-4 sm:p-6 md:p-8">
        <ResponsiveContainer className="flex flex-col items-center max-w-2xl lg:max-w-4xl">
          <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight mb-6 sm:mb-8 md:mb-10 lg:mb-12">
            <span className="block sm:hidden">Unlock Your Knowledge</span>
            <span className="hidden sm:block md:hidden">Unlock Your Knowledge with Engaging Quizzes</span>
            <span className="hidden md:block">Unlock Your Knowledge with Engaging Learning Mode Quizzes</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl opacity-80 mb-8 sm:mb-10 md:mb-12 lg:mb-16 max-w-prose leading-relaxed">
            <span className="block sm:hidden">Interactive quizzes to boost retention and track progress.</span>
            <span className="hidden sm:block">
              Dive into interactive learning mode quizzes tailored to boost retention,
              sharpen your skills, and track your progress in real time.
            </span>
          </p>

          <Link href="/quizzes" className="w-full sm:w-auto">
            <button className="btn btn-primary w-full sm:btn-wide h-12 sm:h-auto text-base sm:text-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95">
              <span className="block sm:hidden">Browse Quizzes</span>
              <span className="hidden sm:block">Browse Learning Quizzes</span>
            </button>
          </Link>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default CTA;
