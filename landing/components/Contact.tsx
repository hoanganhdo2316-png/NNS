import { EnvelopeSimple, FacebookLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";

const channels = [
  {
    Icon: EnvelopeSimple,
    label: "Email",
    value: "nns.genz.taynguyen@gmail.com",
    href: "mailto:nns.genz.taynguyen@gmail.com",
    external: false,
  },
  {
    Icon: FacebookLogo,
    label: "Fanpage",
    value: "NNS - Nông Nghiệp Số",
    href: "https://www.facebook.com/profile.php?id=61589113256246",
    external: true,
  },
  {
    Icon: YoutubeLogo,
    label: "YouTube",
    value: "NNS - Nông Nghiệp Số",
    href: "https://youtube.com/@nns-nongnghiepso?si=AE5mKVQnFbHfpPgM",
    external: true,
  },
] as const;

export default function Contact() {
  return (
    <section id="lien-he" className="py-16 bg-white border-t border-zinc-200">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
            Liên hệ
          </h2>
          <p className="mt-2 text-zinc-500 text-sm sm:text-base">
            Có câu hỏi hoặc muốn hợp tác? Chúng tôi sẵn sàng hỗ trợ.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {channels.map((ch) => (
            <a
              key={ch.label}
              href={ch.href}
              target={ch.external ? "_blank" : undefined}
              rel={ch.external ? "noopener noreferrer" : undefined}
              className="group flex items-center gap-4 p-4 rounded-xl border border-zinc-200 hover:border-green-700 transition-colors min-h-[64px]"
            >
              <div className="p-2.5 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors shrink-0">
                <ch.Icon size={22} weight="fill" className="text-green-700" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">{ch.label}</p>
                <p className="text-sm text-zinc-900 font-medium mt-0.5">{ch.value}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
