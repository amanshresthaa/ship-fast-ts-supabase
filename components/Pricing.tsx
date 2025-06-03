'use client';

import config from "@/config";
import ButtonCheckout from "./ButtonCheckout";
import { useResponsive } from "@/app/hooks/useResponsive";
import { ResponsiveContainer, ResponsiveGrid, MobileOnly, DesktopOnly } from "@/app/components/ResponsiveComponents";

// <Pricing/> displays the pricing plans for your app
// It's your Stripe config in config.js.stripe.plans[] that will be used to display the plans
// <ButtonCheckout /> renders a button that will redirect the user to Stripe checkout called the /api/stripe/create-checkout API endpoint with the correct priceId

const Pricing = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <section className="bg-base-200 overflow-hidden" id="pricing">
      <ResponsiveContainer className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="flex flex-col text-center w-full mb-12 sm:mb-16 md:mb-20">
          <p className="font-medium text-primary mb-4 sm:mb-6 md:mb-8 text-sm sm:text-base">Pricing</p>
          <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight">
            Flexible Plans to Fit Every Learner
          </h2>
        </div>

        <ResponsiveGrid 
          mobileCols={1} 
          tabletCols={2} 
          desktopCols={3}
          className="gap-6 sm:gap-8 items-stretch"
        >
          {config.stripe.plans.map((plan) => (
            <div key={plan.priceId} className="relative w-full">
              {plan.isFeatured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <span
                    className={`badge text-xs text-primary-content font-semibold border-0 bg-primary px-3 py-1`}
                  >
                    POPULAR
                  </span>
                </div>
              )}

              {plan.isFeatured && (
                <div
                  className={`absolute -inset-[1px] rounded-[9px] bg-primary z-10`}
                ></div>
              )}

              <div className="relative flex flex-col h-full gap-4 sm:gap-5 lg:gap-8 z-10 bg-base-100 p-6 sm:p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <p className="text-base sm:text-lg lg:text-xl font-bold">{plan.name}</p>
                    {plan.description && (
                      <p className="text-base-content/80 mt-2 text-sm sm:text-base">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 items-end">
                  {plan.priceAnchor && (
                    <div className="flex flex-col justify-end mb-[4px] text-base sm:text-lg">
                      <p className="relative">
                        <span className="absolute bg-base-content h-[1.5px] inset-x-0 top-[53%]"></span>
                        <span className="text-base-content/80">
                          ${plan.priceAnchor}
                        </span>
                      </p>
                    </div>
                  )}
                  <p className={`text-3xl sm:text-4xl lg:text-5xl tracking-tight font-extrabold`}>
                    ${plan.price}
                  </p>
                  <div className="flex flex-col justify-end mb-[4px]">
                    <p className="text-xs text-base-content/60 uppercase font-semibold">
                      USD
                    </p>
                  </div>
                </div>
                
                {plan.features && (
                  <ul className="space-y-2 sm:space-y-2.5 leading-relaxed text-sm sm:text-base flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4 sm:w-[18px] sm:h-[18px] opacity-80 shrink-0 text-primary"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{feature.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                <div className="space-y-2 mt-auto">
                  <ButtonCheckout priceId={plan.priceId} />
                  <p className="flex items-center justify-center gap-2 text-xs sm:text-sm text-center text-base-content/80 font-medium relative">
                    Pay once. Access forever.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </ResponsiveGrid>
      </ResponsiveContainer>
    </section>
  );
};

export default Pricing;
