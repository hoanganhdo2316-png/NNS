"use client";

import { motion, useReducedMotion } from "motion/react";
import { CalendarCheck, Plant, Scales, BellRinging } from "@phosphor-icons/react";

const features = [
  {
    Icon: CalendarCheck,
    title: "Cập nhật giá mỗi ngày",
    body: "Đại lý đăng giá thu mua từ sáng sớm. Luôn có thông tin mới nhất trước khi quyết định bán.",
  },
  {
    Icon: Plant,
    title: "Miễn phí cho nông dân",
    body: "Không mất phí, không cần đăng ký. Mở ứng dụng là xem được giá ngay.",
  },
  {
    Icon: Scales,
    title: "So sánh nhiều đại lý",
    body: "Xem giá của tất cả đại lý trong khu vực trên một màn hình, chọn nơi có giá cao nhất.",
  },
  {
    Icon: BellRinging,
    title: "Thông báo khi giá thay đổi",
    body: "Nhận thông báo ngay khi giá tăng hoặc giảm. Không bỏ lỡ thời điểm bán có lợi.",
  },
];

export default function Features() {
  const reduce = useReducedMotion();

  return (
    <section id="tinh-nang" className="py-20 bg-white border-t border-zinc-100">
      <div className="max-w-5xl mx-auto px-4">

        {/* Section label — one line, no uppercase eyebrow above every section */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight text-balance">
            Tính năng
          </h2>
          <p className="text-zinc-400 text-sm max-w-[40ch] sm:text-right leading-relaxed">
            Đơn giản, thiết thực cho người trồng và thu mua cà phê.
          </p>
        </div>

        {/* Editorial feature list — no icon-card-grid */}
        <div className="divide-y divide-zinc-100">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={reduce ? false : { opacity: 0, x: -14 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.5,
                delay: i * 0.07,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="group py-6 sm:py-7 grid sm:grid-cols-[1fr_1.2fr] gap-3 sm:gap-10 items-start"
            >
              {/* Left: icon + feature name */}
              <div className="flex items-center gap-3">
                <motion.span
                  className="shrink-0 text-green-700"
                  whileHover={reduce ? {} : { rotate: [0, -10, 8, 0], scale: 1.15 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <f.Icon size={20} weight="fill" />
                </motion.span>
                <h3 className="font-bold text-zinc-900 text-base sm:text-lg leading-snug">
                  {f.title}
                </h3>
              </div>

              {/* Right: description */}
              <p className="text-zinc-500 text-sm leading-relaxed">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
