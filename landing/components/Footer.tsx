import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-zinc-900 py-6">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <a href="#" className="flex items-center gap-2">
          <div className="bg-white rounded-lg p-0.5">
            <Image src="/logo.png" alt="NNS logo" width={28} height={28} className="rounded-md" />
          </div>
          <span className="text-zinc-400 text-sm">Nông Nghiệp Số</span>
        </a>
        <p className="text-zinc-500 text-xs text-center sm:text-right">
          2026 NNS - Nông Nghiệp Số. Kết nối nông dân và đại lý tại Tây Nguyên.
        </p>
      </div>
    </footer>
  );
}
