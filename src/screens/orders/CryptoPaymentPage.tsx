import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { ROUTES } from "../../constants/app";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/ui/Toast";
import { subscribeToOrder } from "../../services/orderService";
import type { Order } from "../../types/order";
import {
  CRYPTO_PAY_CURRENCY_OPTIONS,
  renewCryptoPayment,
  type CryptoPayCurrency,
} from "../../services/paymentService";

function formatPayAmount(
  amount: number | undefined,
  currency: string | undefined,
): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  const c = (currency || "").toLowerCase();
  if (c === "btc") return amount.toFixed(8);
  if (c.includes("usdt")) return amount.toFixed(6);
  return String(amount);
}

function currencyMeta(currency: string | undefined, network?: string | null) {
  const c = (currency || "").toLowerCase();
  const opt = CRYPTO_PAY_CURRENCY_OPTIONS.find((o) => o.id === c);
  const title =
    opt?.label ??
    (c === "btc" ? "Bitcoin" : (currency || "Crypto").toUpperCase());
  const net =
    network?.toUpperCase() ||
    (c === "btc" ? "BTC" : c === "usdttrc20" ? "TRC20" : "");
  return { title, net };
}

function buildQrPayload(
  currency: string | undefined,
  address: string,
  amount: number,
): string {
  const c = (currency || "").toLowerCase();
  if (c === "btc") return `bitcoin:${address}?amount=${amount}`;
  return address;
}

function useCountdown(expiresAt: string | undefined | null) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);
  return secondsLeft;
}

function formatCountdown(totalSeconds: number | null): string {
  if (totalSeconds == null) return "—";
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function goBackFromCryptoPay(
  navigate: ReturnType<typeof useNavigate>,
  order: Order | null,
) {
  if (window.history.length > 1) {
    navigate(-1);
    return;
  }
  if (order?.business_id) {
    navigate(ROUTES.RESTAURANT_MENU(order.business_id), { replace: true });
    return;
  }
  if (order?.orderId) {
    navigate(ROUTES.ORDER_TRACKING(order.orderId), { replace: true });
    return;
  }
  navigate(ROUTES.RESTAURANTS, { replace: true });
}

export function CryptoPaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const toast = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"amount" | "address" | null>(null);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    return subscribeToOrder(
      orderId,
      (o) => {
        setOrder(o);
        setLoading(false);
      },
      () => {
        setLoading(false);
        toast.error("לא ניתן לטעון את פרטי התשלום");
      },
    );
  }, [orderId, toast]);

  useEffect(() => {
    if (order?.payment_status === "paid" && orderId) {
      toast.success("התשלום אושר!");
      navigate(ROUTES.ORDER_TRACKING(orderId), { replace: true });
    }
  }, [order?.payment_status, orderId, navigate, toast]);

  const secondsLeft = useCountdown(order?.nowpayments_expiration_estimate_date);
  const payCurrency =
    order?.nowpayments_pay_currency || order?.crypto_pay_currency;
  const payAddress = order?.nowpayments_pay_address || "";
  const payAmount = order?.nowpayments_pay_amount;
  const actuallyPaid = order?.nowpayments_actually_paid ?? 0;
  const remaining =
    order?.nowpayments_remaining_amount ??
    (payAmount != null ? Math.max(0, payAmount - actuallyPaid) : null);
  const isPartial =
    order?.payment_status === "crypto_partially_paid" ||
    order?.nowpayments_payment_status === "partially_paid";
  const isExpired =
    order?.payment_status === "crypto_expired" ||
    order?.nowpayments_payment_status === "expired" ||
    (secondsLeft !== null && secondsLeft <= 0);
  const isFailed =
    order?.payment_status === "crypto_failed" ||
    order?.nowpayments_payment_status === "failed";
  const displayAmount =
    isPartial && remaining != null && remaining > 0 ? remaining : payAmount;
  const meta = currencyMeta(payCurrency, order?.nowpayments_network);

  const qrUrl = useMemo(() => {
    if (!payAddress || displayAmount == null || isExpired || isFailed)
      return null;
    const payload = buildQrPayload(payCurrency, payAddress, displayAmount);
    // ecc=H מאפשר לכסות את המרכז בלוגו ועדיין לסרוק
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&ecc=H&data=${encodeURIComponent(payload)}`;
  }, [payAddress, payCurrency, displayAmount, isExpired, isFailed]);

  const copyText = async (value: string, kind: "amount" | "address") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success(kind === "amount" ? "הסכום הועתק" : "הכתובת הועתקה");
      window.setTimeout(() => setCopied(null), 1400);
    } catch {
      toast.error("לא הצלחנו להעתיק");
    }
  };

  const handleRenew = async () => {
    if (!orderId || renewing) return;
    setRenewing(true);
    try {
      const currency =
        (payCurrency as CryptoPayCurrency | undefined) &&
        CRYPTO_PAY_CURRENCY_OPTIONS.some((o) => o.id === payCurrency)
          ? (payCurrency as CryptoPayCurrency)
          : undefined;
      await renewCryptoPayment(orderId, currency);
      toast.success("נוצר תשלום חדש — שלחו לפי הפרטים המעודכנים");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "שגיאה בחידוש התשלום");
    } finally {
      setRenewing(false);
    }
  };

  if (!user) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center px-4"
        dir="rtl"
      >
        <p className="text-vantix-fg-muted">יש להתחבר כדי להשלים תשלום</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center gap-2 text-vantix-fg-muted"
        dir="rtl"
      >
        <Loader2 className="h-5 w-5 animate-spin text-vantix-cyan" />
        טוען פרטי תשלום…
      </div>
    );
  }

  if (!order || !payAddress || displayAmount == null) {
    return (
      <div
        className="mx-auto max-w-md space-y-4 px-4 py-10 text-center"
        dir="rtl"
      >
        <AlertTriangle className="mx-auto h-10 w-10 text-vantix-fg-subtle" />
        <p className="text-vantix-fg">לא נמצאו פרטי תשלום קריפטו להזמנה זו</p>
        <button
          type="button"
          onClick={() => goBackFromCryptoPay(navigate, order)}
          className="vantix-btn-primary px-6 py-2.5 text-sm"
        >
          חזרה
        </button>
      </div>
    );
  }

  const amountText = formatPayAmount(displayAmount, payCurrency);
  const urgent = secondsLeft != null && secondsLeft > 0 && secondsLeft < 120;
  const showExpired = isExpired || isFailed;

  return (
    <div
      className="relative -mx-3 -mt-2 flex min-h-[calc(100dvh-7.25rem)] flex-col sm:-mx-6"
      dir="rtl"
    >
      {/* חזרה — עיגול כמו ביצירת משלוח ב-partners */}
      <div className="fixed right-4 z-[41] bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 sm:right-6">
        <button
          type="button"
          onClick={() => goBackFromCryptoPay(navigate, order)}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-vantix-line/10 bg-vantix-surface-raised/90 text-vantix-fg shadow-xl shadow-black/40 ring-1 ring-white/[0.04] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-vantix-surface-raised hover:shadow-2xl active:scale-95 dark:border-vantix-line/80"
          aria-label="חזרה"
        >
          <ArrowRight
            className="h-6 w-6 shrink-0"
            strokeWidth={2.25}
            aria-hidden
          />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex w-full max-w-sm flex-1 flex-col px-5 pb-20 pt-1 sm:pb-2"
      >
        {/* Title */}
        <div className="mb-5 text-center">
          <p className="text-[20px] font-semibold uppercase tracking-[0.22em] text-vantix-cyan">
            Vantix Pay
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-vantix-fg">
            {meta.title}
          </h1>
          {meta.net ? (
            <p className="mt-0.5 text-xs text-vantix-fg-subtle dark:text-vantix-fg-muted">
              רשת {meta.net}
            </p>
          ) : null}
        </div>

        {showExpired ? (
          <div className="mb-6 rounded-2xl border border-vantix-orange/25 bg-vantix-orange/5 px-4 py-5 text-center">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-vantix-orange" />
            <p className="text-sm font-semibold text-vantix-fg">
              {isFailed ? "יצירת התשלום נכשלה" : "תוקף התשלום פג"}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-vantix-fg-muted">
              אל תשלחו לכתובת או לסכום הישנים. לחצו לחידוש — ניצור כתובת וסכום
              מעודכנים לפי שער הדולר החי.
            </p>
            <button
              type="button"
              onClick={() => void handleRenew()}
              disabled={renewing}
              className="vantix-btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 py-3.5 text-sm disabled:opacity-60"
            >
              {renewing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {renewing ? "מחדש תשלום…" : "חדש תשלום"}
            </button>
          </div>
        ) : (
          <>
            {/* QR */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.08,
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative mx-auto mb-6 flex h-[200px] w-[200px] items-center justify-center bg-white p-3 dark:bg-white"
            >
              {qrUrl ? (
                <>
                  <img
                    src={qrUrl}
                    alt="QR לתשלום"
                    className="h-full w-full"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
              
                      <img
                        src={
                           "/assets/whitevantixicon.png"
                        }
                        alt=""
                        className="h-full w-full object-contain"
                        draggable={false}
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </motion.div>

            {/* Amount */}
            <div className="mb-1 text-center">
              <p
                className="font-mono text-[2.15rem] font-bold leading-none tracking-tight text-vantix-fg"
                dir="ltr"
              >
                {amountText}
              </p>
              <p
                className="mt-1 break-all text-center font-sans text-[15px] leading-relaxed text-vantix-fg-subtle dark:text-vantix-fg-muted"
                dir="ltr"
              >
                {payAddress}
              </p>
              {isPartial && actuallyPaid > 0 ? (
                <p className="mt-1 text-xs text-vantix-orange">
                  התקבל {formatPayAmount(actuallyPaid, payCurrency)}
                </p>
              ) : null}
            </div>

            {/* טיימר + סטטוס באותה שורה */}
            <div className=" mt-2 flex items-center justify-center gap-2 text-xs text-vantix-fg-muted">
              <span
                className={`font-mono tabular-nums tracking-wider font-bold dark:text-vantix-fg ${
                  showExpired || urgent
                    ? "text-vantix-orange"
                    : "text-vantix-fg-subtle dark:text-vantix-fg-muted"
                }`}
              >
                {formatCountdown(secondsLeft)}
              </span>
              <span className="text-vantix-line/30">·</span>
              {order.payment_status === "paid" ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  התשלום אושר
                </span>
              ) : showExpired ? (
                <span className="inline-flex items-center gap-1.5 text-vantix-orange">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {isFailed ? "התשלום נכשל" : "פג תוקף"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-vantix-cyan" />
                  ממתין לאישור
                  {order.total_charged != null ? (
                    <span className="text-vantix-fg-subtle dark:text-vantix-fg-muted">
                      · ₪{Number(order.total_charged).toFixed(2)}
                    </span>
                  ) : null}
                </span>
              )}
            </div>
            
            {/* Actions */}
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => void copyText(amountText, "amount")}
                className="vantix-btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-sm"
              >
                {copied === "amount" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied === "amount" ? "הסכום הועתק" : "העתק סכום"}
              </button>
              <button
                type="button"
                onClick={() => void copyText(payAddress, "address")}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-vantix-line/20 bg-transparent py-3.5 text-sm font-semibold text-vantix-fg transition hover:bg-vantix-surface-muted/60 active:scale-[0.98] dark:border-vantix-line/80"
              >
                {copied === "address" ? (
                  <Check className="h-4 w-4 text-vantix-cyan" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied === "address" ? "הכתובת הועתקה" : "העתק כתובת ארנק לשליחת התשלום"}
              </button>
            </div>
          </>
        )}

        {order.nowpayments_payin_extra_id && !showExpired ? (
          <p className="mt-2 text-center text-[11px] text-vantix-fg-muted">
            Memo:{" "}
            <span className="font-mono text-vantix-fg" dir="ltr">
              {order.nowpayments_payin_extra_id}
            </span>
          </p>
        ) : null}
      </motion.div>
    </div>
  );
}
