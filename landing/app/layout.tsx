import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NNS - Nông Nghiệp Số",
  description:
    "Kết nối nông dân và đại lý cà phê tại Tây Nguyên. Xem giá thu mua cập nhật hàng ngày trên điện thoại.",
  keywords: ["cà phê", "Tây Nguyên", "giá thu mua", "nông nghiệp", "đại lý"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={beVietnam.variable}>
      <body>{children}</body>
    </html>
  );
}
