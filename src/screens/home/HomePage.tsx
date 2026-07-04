import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDiscoveryData } from "../../modules/discovery/hooks/useDiscoveryData";
import { useAuth } from "../../context/AuthContext";
import { BusinessPartnersCTA } from "../../components/partners/BusinessPartnersCTA";
import { SpotlightCta } from "../../components/partners/SpotlightCta";
import { PartnersCarousel } from "../../components/partners/PartnersCarousel";
import { ROUTES } from "../../constants/app";
import { haptic } from "../../lib/native";

const filtersSkeleton = new Array(6).fill(null);

const HEADLINE_TEXT = "מה נאכל היום?";
const bounceEase: [number, number, number, number] = [0.34, 1.56, 0.64, 1];

const FiltersSkeleton = () => (
  <div className="flex flex-wrap gap-2">
    {filtersSkeleton.map((_, index) => (
      <span
        key={index}
        className="h-9 w-24 animate-pulse rounded-full bg-vantix-overlay/5"
      />
    ))}
  </div>
);

export const HomePage = () => {
  const { user } = useAuth();
  const { data, isLoading } = useDiscoveryData();
  const filters = data?.filters ?? [];
  const spotlight = data?.spotlight;

  return (
    <>
      <section className="">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="vantix-soft-card flex flex-col items-center p-6 sm:rounded-[40px] sm:p-8 md:p-10"
        >
          {/* פתיח משעשע – לוגו כמטבע נוצץ מסתובב + אותיות קופצות */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-4 sm:gap-5"
          >
            <div className="flex flex-col items-center" style={{ perspective: '1000px' }}>
              <motion.div
                className="flex flex-col items-center"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: 360 }}
                transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
              >
                <img
                  src="/assets/logo-white.jpeg"
                  alt="VANTIX"
                  className="w-56 rounded-2xl object-contain sm:w-72 dark:hidden"
                />
                <img
                  src="/assets/logo-dark.png"
                  alt="VANTIX"
                  className="hidden w-56 object-contain sm:w-72 dark:block"
                />
              </motion.div>
            </div>

            {/* כותרת – אותיות קופצות אחת אחרי השנייה */}
            <h1 className="flex flex-wrap justify-center text-center font-display text-2xl font-bold text-vantix-fg sm:text-4xl lg:text-5xl">
              {[...HEADLINE_TEXT].map((char, i) => (
                <motion.span
                  key={`${char}-${i}`}
                  initial={{ y: -24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: 0.3 + i * 0.1,
                    duration: 0.6,
                    ease: bounceEase,
                  }}
                  className="inline-block"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </h1>
          </motion.div>

          <div className="mt-6 mx-auto flex w-fit items-center justify-center rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-2 shadow-vantix sm:mt-8 sm:rounded-3xl">
            <Link
              to={user ? ROUTES.RESTAURANTS : ROUTES.AUTH_LOGIN}
              className="vantix-btn-primary flex min-h-[44px] items-center justify-center rounded-xl bg-none bg-vantix-cyan px-5 py-3 text-sm shadow-vantix-cyan/40 sm:min-h-0 sm:rounded-2xl sm:px-6"
            >
              {user ? "מצא לי את המנה המושלמת" : "התחבר כדי לצפות במסעדות ולהזמין"}
            </Link>
          </div>

          {isLoading ? (
            <FiltersSkeleton />
          ) : (
            <div className="mt-6 flex flex-wrap justify-center gap-2 sm:mt-8">
              {filters.map((filter) => (
                <Link
                  key={filter.id}
                  to={`${ROUTES.SEARCH}?q=${encodeURIComponent(filter.label)}`}
                  onClick={() => void haptic.light()}
                  className="rounded-full border border-vantix-cyan/20 bg-vantix-surface-raised px-4 py-2 text-xs font-semibold text-vantix-fg-muted transition hover:border-vantix-cyan/40 hover:text-vantix-fg"
                >
                  {filter.label}
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        <PartnersCarousel />
      </section>

      {spotlight && <SpotlightCta campaign={spotlight} />}
      <BusinessPartnersCTA />
    </>
  );
};
