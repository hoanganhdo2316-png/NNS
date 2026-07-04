"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Plant, Storefront } from "@phosphor-icons/react";

// TODO: thay link Google Play thật khi có link app chính thức
const PLAY_STORE_URL = "https://play.google.com/store/apps";

const options = [
  {
    id: "farmer",
    Icon: Plant,
    title: "Nông dân",
    description:
      "Xem giá thu mua cà phê từ nhiều đại lý mỗi ngày. So sánh và chọn nơi bán có giá tốt nhất.",
    cta: "Tôi là nông dân",
    image: "/nongdan.jpg",
    overlay: "from-green-950/90 via-green-950/50 to-green-950/5",
    iconBg: "bg-green-700/80 backdrop-blur-sm border border-white/20",
    from: { opacity: 0, x: -28, y: 16 },
  },
  {
    id: "dealer",
    Icon: Storefront,
    title: "Đại lý",
    description:
      "Đăng giá thu mua cà phê lên NNS mỗi sáng. Hàng nghìn nông dân tại Tây Nguyên sẽ thấy ngay.",
    cta: "Tôi là đại lý",
    image: "/daily.webp",
    overlay: "from-zinc-950/92 via-zinc-950/55 to-zinc-950/5",
    iconBg: "bg-white/15 backdrop-blur-sm border border-white/20",
    from: { opacity: 0, x: 28, y: 16 },
  },
] as const;

export default function WhoAreYou() {
  const reduce = useReducedMotion();

  return (
    <section id="ban-la-ai" className="py-16 bg-zinc-50">
      <div className="max-w-5xl mx-auto px-4">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
            Bạn là ai?
          </h2>
          <p className="mt-2 text-zinc-500 text-sm sm:text-base">
            Chọn để xem NNS giúp được gì cho bạn.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map((opt) => (
            <motion.a
              key={opt.id}
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={opt.cta}
              initial={reduce ? false : opt.from}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: "spring", stiffness: 90, damping: 16 }}
              whileHover="hovered"
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden rounded-2xl min-h-[340px] sm:min-h-[400px] flex flex-col justify-end text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
            >
              {/* Background image — zooms out on entrance, zooms in on hover */}
              <motion.div
                className="absolute inset-0"
                initial={reduce ? false : { scale: 1.08 }}
                whileInView={{ scale: 1.0 }}
                viewport={{ once: true }}
                variants={reduce ? {} : { hovered: { scale: 1.06 } }}
                transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              >
                <Image
                  src={opt.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority={opt.id === "farmer"}
                />
              </motion.div>

              {/* Gradient scrim */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-t ${opt.overlay}`}
                variants={reduce ? {} : { hovered: { opacity: 0.85 } }}
                transition={{ duration: 0.4 }}
              />

              {/* Content */}
              <motion.div
                className="relative z-10 p-6"
                variants={reduce ? {} : { hovered: { y: -4 } }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
              >
                <div className={`inline-flex p-2.5 rounded-xl mb-4 ${opt.iconBg}`}>
                  <opt.Icon size={22} weight="fill" className="text-white" />
                </div>

                <h3 className="text-2xl font-extrabold text-white tracking-tight">
                  {opt.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  {opt.description}
                </p>

                <div className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold bg-white/15 backdrop-blur-sm border border-white/30 text-white transition-colors hover:bg-white/25">
                  {opt.cta}
                  <motion.span
                    variants={reduce ? {} : { hovered: { x: 3 } }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="text-xs"
                  >
                    →
                  </motion.span>
                </div>
              </motion.div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
