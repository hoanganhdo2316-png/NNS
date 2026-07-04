"use client";

import { useState } from "react";
import Image from "next/image";
import { List, X } from "@phosphor-icons/react";

const navLinks = [
  { label: "Tính năng", href: "#tinh-nang" },
  { label: "Về NNS", href: "#ve-nns" },
  { label: "Liên hệ", href: "#lien-he" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-zinc-200 h-14">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <Image src="/logo.png" alt="NNS logo" width={34} height={34} className="rounded-lg" />
            <span className="text-xs text-zinc-400 hidden sm:block">Nông Nghiệp Số</span>
          </a>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#tai-app"
              className="px-4 py-2 bg-green-700 text-white text-sm font-semibold rounded-lg hover:bg-green-600 active:scale-[0.97] transition-all"
            >
              Tải ứng dụng
            </a>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-zinc-600 rounded-lg"
            aria-label={open ? "Đóng menu" : "Mở menu"}
          >
            {open ? <X size={20} /> : <List size={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed top-14 left-0 right-0 z-40 bg-white border-b border-zinc-200 px-4 py-4 flex flex-col gap-1 md:hidden">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="py-3 text-zinc-700 font-medium border-b border-zinc-100 last:border-0"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#tai-app"
            onClick={() => setOpen(false)}
            className="mt-2 py-3.5 bg-green-700 text-white text-center font-semibold rounded-lg"
          >
            Tải ứng dụng
          </a>
        </div>
      )}
    </>
  );
}
