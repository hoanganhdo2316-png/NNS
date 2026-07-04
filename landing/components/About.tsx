"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

function CountStat({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const animated = useRef(false);
  const [n, setN] = useState(value);

  useEffect(() => {
    if (!isInView || animated.current || reduce) return;
    animated.current = true;
    let current = 0;
    setN(0);
    const interval = setInterval(() => {
      current += 1;
      setN(current);
      if (current >= value) clearInterval(interval);
    }, 130);
    return () => clearInterval(interval);
  }, [isInView, reduce, value]);

  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}

export default function About() {
  const reduce = useReducedMotion();

  return (
    <section id="ve-nns" className="bg-zinc-900 py-24 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4">

        {/* Bold statement — the ONE scroll moment that earns motion */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-6">
            Về Nông Nghiệp Số
          </p>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] text-balance">
            Nông dân xứng đáng{" "}
            <span className="text-green-400">biết giá tốt nhất.</span>
          </h2>

          <p className="mt-6 text-zinc-400 leading-[1.75] max-w-[55ch] text-base sm:text-lg font-light">
            Đại lý cập nhật giá thu mua lên NNS mỗi buổi sáng. Nông dân chỉ cần mở điện thoại là thấy
            ngay bảng giá của tất cả đại lý trong khu vực — không cần hỏi, không cần gọi điện.
          </p>
        </motion.div>

        {/* Stats — staggered entrance */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-px bg-zinc-800 rounded-2xl overflow-hidden">
          {[
            { value: 5, suffix: "+", label: "tỉnh Tây Nguyên" },
            { label: "Miễn phí", sublabel: "cho nông dân", isFree: true },
            { label: "Hàng ngày", sublabel: "cập nhật giá mới", isText: true },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-zinc-900 px-6 py-8"
            >
              {"value" in item ? (
                <>
                  <p className="text-4xl font-black text-white tabular-nums">
                    <CountStat value={item.value!} suffix={item.suffix} />
                  </p>
                  <p className="mt-1.5 text-zinc-500 text-sm">{item.label}</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-green-400">{item.label}</p>
                  <p className="mt-1.5 text-zinc-500 text-sm">{item.sublabel}</p>
                </>
              )}
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
