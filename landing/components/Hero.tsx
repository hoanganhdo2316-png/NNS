"use client";

import { motion, useReducedMotion } from "motion/react";
import { DeviceMobile } from "@phosphor-icons/react";
import PriceBoard from "./PriceBoard";

export default function Hero() {
  const reduce = useReducedMotion();
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="min-h-[100dvh] bg-white pt-14 flex flex-col">
      <div className="max-w-5xl mx-auto w-full px-4 flex-1 flex flex-col lg:flex-row lg:items-center gap-10 py-10 lg:py-16">

        {/* Price board — top on mobile, right on desktop */}
        <motion.div
          className="w-full lg:w-[52%] lg:order-2"
          initial={reduce ? false : { opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.06, ease }}
        >
          <PriceBoard />
        </motion.div>

        {/* Text content */}
        <div className="w-full lg:w-[48%] lg:order-1">
          {/* Dramatic split-text entrance — lines slide from opposite sides */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-zinc-900 tracking-tight leading-[1.05] text-balance overflow-hidden">
            <motion.span
              className="block"
              initial={reduce ? false : { opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.2, ease }}
            >
              Giá cà phê
            </motion.span>
            <motion.span
              className="block text-green-700"
              initial={reduce ? false : { opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.32, ease }}
            >
              minh bạch.
            </motion.span>
          </h1>

          <motion.p
            className="mt-5 text-base text-zinc-500 leading-relaxed font-light max-w-[40ch]"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Nông dân xem giá thu mua từ nhiều đại lý. Đại lý cập nhật giá dễ dàng mỗi ngày.
          </motion.p>

          <motion.div
            className="mt-7 flex flex-col sm:flex-row gap-3"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6, ease }}
          >
            <a
              href="#tai-app"
              className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-green-700 text-white font-semibold rounded-xl text-sm min-h-[52px] transition-all duration-150 hover:-translate-y-0.5 hover:bg-green-600 hover:shadow-lg hover:shadow-green-900/20 active:translate-y-0.5"
            >
              <DeviceMobile size={18} weight="fill" />
              Tải ứng dụng miễn phí
            </a>
            <a
              href="#ban-la-ai"
              className="flex items-center justify-center px-6 py-3.5 border border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 font-medium rounded-xl text-sm min-h-[52px] transition-colors"
            >
              Tìm hiểu thêm
            </a>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
