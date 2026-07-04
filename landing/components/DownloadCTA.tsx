import { FacebookLogo } from "@phosphor-icons/react/dist/ssr";

const FANPAGE_URL = "https://www.facebook.com/profile.php?id=61589113256246";

export default function DownloadCTA() {
  return (
    <section id="tai-app" className="bg-green-700 py-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight text-balance leading-tight">
              Đã có giá mới hôm nay!
            </h2>
            <p className="mt-3 text-green-100 text-base font-light max-w-[40ch] leading-relaxed">
              Hãy theo dõi NNS - Nông Nghiệp Số để nhận thông tin sớm nhất.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a
              href={FANPAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-5 py-3.5 bg-white text-green-900 font-semibold rounded-xl text-sm min-h-[52px] hover:bg-green-50 transition-colors active:scale-[0.97]"
            >
              <FacebookLogo size={20} weight="fill" className="shrink-0" />
              <span>Theo dõi Fanpage</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
