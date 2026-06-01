import { Link } from "react-router-dom";
import { MapPin, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useDiscoveryData } from "../../modules/discovery/hooks/useDiscoveryData";
import { useAuth } from "../../context/AuthContext";
import { BusinessPartnersCTA } from "../../components/partners/BusinessPartnersCTA";
import { PartnersCarousel } from "../../components/partners/PartnersCarousel";
import { Logo } from "../../components/branding/Logo";
import { ROUTES } from "../../constants/app";

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
                className="flex flex-col items-center gap-2 [&>div]:flex-col [&>div]:gap-2 [&_span]:text-2xl [&_span]:sm:text-3xl [&_span]:tracking-[0.2em]"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: 360 }}
                transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
              >
                <Logo size={112} withWordmark />
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

          <div className="mt-6 flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-vantix-cyan/20 bg-vantix-surface-raised p-3 shadow-vantix sm:mt-8 sm:flex-row sm:items-center sm:gap-4 sm:rounded-3xl sm:p-5">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-vantix-cyan/25 bg-vantix-surface px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
              <MapPin className="h-4 w-4 shrink-0 text-vantix-cyan sm:h-5 sm:w-5" />
              <input
                className="w-full min-w-0 bg-transparent text-sm font-medium text-vantix-fg placeholder:text-vantix-fg-subtle focus:outline-none"
                placeholder="לאן לשלוח לך עכשיו?"
              />
            </div>
            <Link
              to={user ? ROUTES.RESTAURANTS : ROUTES.AUTH_LOGIN}
              className="vantix-btn-primary flex min-h-[44px] items-center justify-center rounded-xl px-5 py-3 text-sm sm:min-h-0 sm:rounded-2xl sm:px-6"
            >
              {user ? "מצא לי את המנה המושלמת" : "התחבר כדי לצפות במסעדות ולהזמין"}
            </Link>
          </div>

          {isLoading ? (
            <FiltersSkeleton />
          ) : (
            <div className="mt-6 flex flex-wrap justify-center gap-2 sm:mt-8">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  className="rounded-full border border-vantix-cyan/20 bg-vantix-surface-raised px-4 py-2 text-xs font-semibold text-vantix-fg-muted transition hover:border-vantix-cyan/40 hover:text-vantix-fg"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <PartnersCarousel />
      </section>

      {spotlight && (
        <section
          id="smart-handoff"
          className="vantix-soft-card p-4 sm:p-6"
        >
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-vantix-cyan sm:text-xs sm:tracking-[0.35em]">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> smart handoff
              </p>
              <h2 className="mt-2 font-display text-xl text-vantix-fg sm:text-2xl sm:text-3xl">
                {spotlight.title}
              </h2>
              <p className="mt-2 max-w-2xl text-xs text-vantix-fg-muted sm:mt-3 sm:text-sm">
                {spotlight.description}
              </p>
            </div>
            <a
              className="vantix-btn-primary w-full shrink-0 px-5 py-3 text-center text-sm sm:w-auto sm:px-6"
              href={spotlight.href}
            >
              {spotlight.ctaLabel}
            </a>
          </div>
        </section>
      )}
      <BusinessPartnersCTA />
    </>
  );
};
