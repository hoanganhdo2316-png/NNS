"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, animate, useInView, useReducedMotion } from "motion/react";
import { ArrowUp, ArrowDown, Minus, ArrowClockwise } from "@phosphor-icons/react";

type ApiAgent = { price: number; change: number };

type PriceData = {
  avgPrice: number;
  avgChange: number;
  count: number;
  fetchedAt: Date;
};

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; data: PriceData };

/* Counts up from a lower value when the element enters the viewport */
function CountUp({ value, delay = 0 }: { value: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const animated = useRef(false);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!isInView || animated.current) return;
    animated.current = true;
    if (reduce) return;

    const from = Math.max(0, value - 1500);
    setDisplay(from);

    const timeout = setTimeout(() => {
      const controls = animate(from, value, {
        duration: 1.0,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (v) => setDisplay(Math.round(v)),
      });
      return () => controls.stop();
    }, delay * 1000 + 80);

    return () => clearTimeout(timeout);
  }, [isInView, reduce, value, delay]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString("vi-VN")}
    </span>
  );
}

export default function PriceBoard() {
  const [state, setState] = useState<State>({ status: "loading" });
  const reduce = useReducedMotion();

  const fetchPrices = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const res = await fetch("https://api.nns.id.vn/agents", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const agents: ApiAgent[] = await res.json();
      const active = agents.filter((a) => a.price > 0);
      if (active.length === 0) throw new Error("empty");

      const avgPrice = Math.round(
        active.reduce((s, a) => s + a.price, 0) / active.length
      );
      const avgChange = Math.round(
        active.reduce((s, a) => s + a.change, 0) / active.length
      );

      setState({
        status: "success",
        data: { avgPrice, avgChange, count: active.length, fetchedAt: new Date() },
      });
    } catch {
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  /* Header timestamp */
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN");
  const timeStr = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  /* Direction helper */
  const dir =
    state.status === "success"
      ? state.data.avgChange > 0
        ? "up"
        : state.data.avgChange < 0
        ? "down"
        : "flat"
      : "flat";

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Giá Cà Phê Nhân Xô</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {dateStr} — cập nhật {timeStr}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
          </span>
          <span className="text-xs text-green-700 font-medium">Trực tiếp</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-6 min-h-[140px] flex items-center">

        {/* Loading skeleton */}
        {state.status === "loading" && (
          <div className="w-full animate-pulse space-y-3">
            <div className="h-4 bg-zinc-100 rounded w-2/5" />
            <div className="h-10 bg-zinc-100 rounded w-3/4" />
            <div className="h-4 bg-zinc-100 rounded w-1/3" />
          </div>
        )}

        {/* Error */}
        {state.status === "error" && (
          <div className="w-full flex flex-col items-center gap-3 py-2 text-center">
            <p className="text-zinc-500 text-sm">
              Không thể tải giá. Kiểm tra kết nối mạng.
            </p>
            <button
              onClick={fetchPrices}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 text-sm hover:border-zinc-400 transition-colors active:scale-[0.97]"
            >
              <ArrowClockwise size={14} weight="bold" />
              Thử lại
            </button>
          </div>
        )}

        {/* Success */}
        {state.status === "success" && (
          <motion.div
            className="w-full"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-xs text-zinc-400 mb-2">Giá trung bình hôm nay</p>

            <div className="flex items-baseline gap-3 flex-wrap">
              <p className="text-4xl font-black text-zinc-900 tracking-tight leading-none">
                <CountUp value={state.data.avgPrice} delay={0.1} />
                <span className="text-base font-normal text-zinc-400 ml-1.5">đ/kg</span>
              </p>

              {/* Change badge */}
              {dir !== "flat" && (
                <motion.span
                  initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 280,
                    damping: 18,
                    delay: 0.7,
                  }}
                  className={`flex items-center gap-0.5 text-sm font-semibold ${
                    dir === "up" ? "text-green-700" : "text-red-500"
                  }`}
                >
                  {dir === "up" ? (
                    <ArrowUp size={13} weight="bold" />
                  ) : (
                    <ArrowDown size={13} weight="bold" />
                  )}
                  {dir === "up" ? "+" : ""}
                  {state.data.avgChange.toLocaleString("vi-VN")} đ
                </motion.span>
              )}

              {dir === "flat" && (
                <span className="flex items-center gap-0.5 text-sm font-medium text-zinc-400">
                  <Minus size={13} weight="bold" />
                  Không đổi
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-zinc-400">
              Tổng hợp từ {state.data.count} đại lý tại Tây Nguyên
            </p>
          </motion.div>
        )}
      </div>

      <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-100">
        <p className="text-xs text-zinc-400 text-center">
          Đơn vị: đồng/kg · Tây Nguyên
        </p>
      </div>
    </div>
  );
}
