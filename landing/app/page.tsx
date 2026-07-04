import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhoAreYou from "@/components/WhoAreYou";
import Features from "@/components/Features";
import About from "@/components/About";
import DownloadCTA from "@/components/DownloadCTA";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <WhoAreYou />
      <Features />
      <About />
      <DownloadCTA />
      <Contact />
      <Footer />
    </main>
  );
}
