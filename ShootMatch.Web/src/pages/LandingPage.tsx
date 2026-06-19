import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import logoCreamHorizontal from "../assets/Logo Pickic/cream_horizontal.png";
import logoCreamOriginalSquare from "../assets/Logo Pickic/cream_original_square.png";
import { socialLinks as socialLinksData } from "../config/social-links";

const VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260521_064421_279656fd-e76f-40a0-8fed-7456d4f7715a.mp4";

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }} className={className}>{children}</motion.div>;
}

function NavItem({ text }: { text: string }) {
  const [cycle, setCycle] = useState(0);
  return <button onMouseEnter={() => setCycle((p) => p + 1)} onMouseLeave={() => setCycle((p) => p + 1)} className="relative overflow-hidden group flex items-center justify-center py-1 cursor-pointer h-8 px-3">{cycle === 0 ? <span className="text-[#fff7e1]/64 font-mono text-[11px] tracking-[-0.01em] group-hover:text-[#fff7e1] transition-colors duration-300">{text}</span> : <span className="relative flex flex-col items-center justify-center h-full w-full"><span key={`out-${cycle}`} className="animate-fly-out-up text-[#fff7e1]/90 font-mono text-[11px] tracking-[-0.01em]">{text}</span><span key={`in-${cycle}`} className="absolute inset-0 flex items-center justify-center animate-fly-in-up text-[#fff7e1] font-mono text-[11px] tracking-[-0.01em]">{text}</span></span>}</button>;
}

function SectionHighlight({ children }: { children: React.ReactNode }) {
  return <span className="text-[#ff4200]">{children}</span>;
}

function SectionLead({ children, align = "center" }: { children: React.ReactNode; align?: "center" | "left" }) {
  return (
    <div className={`flex flex-col gap-3 mb-5 md:mb-7 ${align === "center" ? "items-center text-center" : "items-start text-left"}`}>
      <span className="block h-[2px] w-12 md:w-16 bg-[#ff4200] rounded-full" aria-hidden />
      <p className="font-mono text-lg md:text-xl font-semibold tracking-[0.02em] leading-snug text-[#fff7e1]/88 text-balance">
        {children}
      </p>
    </div>
  );
}

function SocialActionLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="group flex items-center justify-between gap-3 rounded-full border border-[#fff7e1]/10 bg-[#0a0a06]/75 px-4 py-3 text-[#fff7e1]/80 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 hover:border-[#fff7e1]/20 hover:bg-[#14130d]/90 hover:text-[#fff7e1] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4200]/80"
    >
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]">{children}</span>
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
    </a>
  );
}

export default function LandingPage() {
  const [arrowCycle, setArrowCycle] = useState(0);
  const [footerArrowCycle, setFooterArrowCycle] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSocialDock, setShowSocialDock] = useState(false);
  const [socialDockExpanded, setSocialDockExpanded] = useState(false);
  const [socialLinks] = useState(socialLinksData);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screen3Ref = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 500, 800], [0, 0, -150]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Thiết lập tốc độ phát chậm hơn (35% tốc độ bình thường)
    video.playbackRate = 0.35;

    const onReady = () => {
      setIsLoaded(true);
      video.play().catch((err) => console.log("Autoplay block:", err));
    };

    if (video.readyState >= 3) {
      onReady();
    } else {
      video.addEventListener("canplaythrough", onReady);
    }

    return () => video.removeEventListener("canplaythrough", onReady);
  }, []);

  useEffect(() => {
    const footerEl = footerRef.current;
    if (!footerEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowSocialDock(!entry.isIntersecting && window.scrollY > 1200);
      },
      { threshold: 0.12, rootMargin: "0px 0px -120px 0px" }
    );

    observer.observe(footerEl);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const toggleSocialDock = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const triggerPoint = Math.max(0, scrollableHeight - 900);
      setShowSocialDock(window.scrollY >= triggerPoint);
    };

    toggleSocialDock();
    window.addEventListener("scroll", toggleSocialDock, { passive: true });
    window.addEventListener("resize", toggleSocialDock);

    return () => {
      window.removeEventListener("scroll", toggleSocialDock);
      window.removeEventListener("resize", toggleSocialDock);
    };
  }, []);

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Anton&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap');:root{--cream:#fff7e1;--dark:#0a0a06;--orange:#ff4200;--purple:#3617cf;--glass:rgba(255,247,225,0.05);--border:rgba(255,247,225,0.09);--font-sans:'Plus Jakarta Sans',sans-serif;--font-mono:'JetBrains Mono',monospace;}body{background-color:var(--dark);color:var(--cream);font-family:var(--font-sans);overflow-x:hidden;}.font-anton{font-family:'Anton',sans-serif;text-transform:uppercase;}.film-grain{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:50;opacity:0.04;background-image:url("https://lh3.googleusercontent.com/aida-public/AB6AXuAqoVzK0YGRAP5LeOe6bASYgBEIQM4OF5Cak1yvOq57mrUHqcFvm9SkCz0ZRIGkRVZiAG7JhjAM17f5Ma4ENgN4ngzSrjQfwK7ZQGWbZNNwpUgOa5AytKXU_dlXRVid-C8cx8JRzlbo0SyC8YHTS9hydT7-kZyVsK2-hCQYXAX8sU6ky3RSo8hvtvKoKlMzYLgB9lRhKnAvKTX7Wos8vT2OzOEBFlLlOZby4hyJMaecoAvpAl-iBnlrlGxJ-Tl_5NFLO9NrUfZHtXA");}.hero-orb{position:absolute;bottom:-100px;left:50%;transform:translateX(-50%);width:700px;height:700px;background:radial-gradient(circle,rgba(255,66,0,0.16),transparent 70%);filter:blur(50px);z-index:1;pointer-events:none;}.hero-vig-top{position:absolute;top:0;left:0;right:0;height:220px;background:linear-gradient(to bottom,rgba(10,10,6,0.95),transparent);z-index:2;pointer-events:none;}.hero-vig-bot{position:absolute;bottom:0;left:0;right:0;height:300px;background:linear-gradient(to top,rgba(10,10,6,1) 20%,transparent);z-index:2;pointer-events:none;}.hero-vig-side{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 30%,rgba(10,10,6,0.55) 100%);z-index:2;pointer-events:none;}@keyframes flyOutUp{0%{transform:translateY(0);}100%{transform:translateY(-150%);}}@keyframes flyInUp{0%{transform:translateY(150%);}100%{transform:translateY(0);}}.animate-fly-out-up{animation:flyOutUp .4s cubic-bezier(.4,0,.2,1) forwards;}.animate-fly-in-up{animation:flyInUp .4s cubic-bezier(.4,0,.2,1) forwards;}@keyframes flyOutRight{0%{transform:translateX(0);}100%{transform:translateX(250%);}}@keyframes flyInLeft{0%{transform:translateX(-250%);}100%{transform:translateX(0);}}.animate-fly-out{animation:flyOutRight .5s cubic-bezier(.4,0,.2,1) forwards;}.animate-fly-in{animation:flyInLeft .5s cubic-bezier(.4,0,.2,1) forwards;}@keyframes softGlowPulse{0%,100%{opacity:.82;transform:scale(1);}50%{opacity:1;transform:scale(1.02);}}.animate-soft-glow-pulse{animation:softGlowPulse 2.6s ease-in-out infinite;}.scroll-reveal{margin:0;}.scroll-reveal-text{display:flex;flex-wrap:wrap;margin:0;}.word{display:inline-block;white-space:pre;}::-webkit-scrollbar{width:8px;}::-webkit-scrollbar-track{background:var(--dark);}::-webkit-scrollbar-thumb{background:rgba(255,247,225,0.12);border-radius:4px;}::-webkit-scrollbar-thumb:hover{background:rgba(255,247,225,0.25);}`}</style>
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-center"
          >
            <img src={logoCreamHorizontal} alt="Pickic Logo" className="h-[192px] md:h-[268px] mb-8 select-none" />
            <div className="text-[10px] font-mono tracking-widest text-white/50 mb-4 uppercase">
              Đang lấy nét không gian trải nghiệm
            </div>
            <div className="w-64 h-[1px] bg-white/10 mt-2 overflow-hidden relative rounded-full">
              <div
                className="h-full bg-white w-1/3 animate-pulse absolute left-0 top-0 rounded-full"
                style={{ animationDuration: "1.5s", animationIterationCount: "infinite" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="film-grain" />
      <div className="fixed inset-0 z-0 bg-[#0a0a06] overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          src={VIDEO_URL}
          autoPlay
          muted
          playsInline
          loop
          style={{ transform: "translate3d(-50%, -50%, 0)", willChange: "transform" }}
          className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover opacity-40 brightness-[0.75] contrast-[1.05]"
        />
        <div className="hero-vig-top" />
        <div className="hero-vig-bot" />
        <div className="hero-vig-side" />
        <div className="hero-orb" />
      </div>
      <motion.header
        style={{ y: headerY }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-1/2 -translate-x-1/2 z-20 w-[90%] flex items-center justify-between pointer-events-auto py-4 md:py-6 lg:py-8"
      >
        <a href="/" className="flex items-center">
          <img src={logoCreamHorizontal} alt="Pickic Logo" className="h-[115px] md:h-[153px] select-none -ml-6 lg:-ml-8 -mt-4 lg:-mt-6" />
        </a>
        <div className="hidden lg:flex items-stretch bg-[#0a0a06]/20 backdrop-blur-[40px] border border-[#fff7e1]/[0.05] rounded-full overflow-hidden p-[2px]">
          <nav className="flex items-center justify-center px-5 font-mono text-[10px] tracking-[-0.01em]">
            <NavItem text="NHIẾP ẢNH GIA" />
          </nav>
          <button className="bg-[#fff7e1] text-[#0a0a06] px-5 py-2 font-mono text-[10px] leading-4 font-bold tracking-[-0.01em] hover:bg-[#ffe8c0] transition-colors rounded-full">
            ĐẶT LỊCH NGAY
          </button>
        </div>
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="lg:hidden text-[#fff7e1]/80 hover:text-[#fff7e1] p-2 border border-[#fff7e1]/10 rounded-full bg-[#0a0a06]/40 backdrop-blur-md"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </motion.header>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 top-20 z-40 mx-auto w-[90%] bg-black/95 border border-white/10 backdrop-blur-2xl rounded-2xl p-6 flex flex-col gap-5 lg:hidden"
          >
            <div className="flex flex-col gap-3">
              <a href="#" className="font-mono text-sm tracking-widest text-white/80 py-2 border-b border-white/5">
                NHIẾP ẢNH GIA
              </a>
            </div>
            <button className="w-full bg-white text-black font-mono text-xs font-bold tracking-widest py-4 rounded-xl">
              ĐẶT LỊCH NGAY
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="relative z-10 pointer-events-none w-full min-h-screen">
        <section className="w-[90%] mx-auto h-screen flex flex-col py-8 md:py-12 lg:py-16 pb-12 justify-between">
          <div className="h-16" />
          <div className="flex-1 w-full pointer-events-auto flex flex-col md:grid md:grid-cols-12 md:grid-rows-[1fr_auto] gap-y-12 md:gap-y-0 md:gap-x-8 items-stretch justify-center">
            <div className="md:row-start-2 md:col-start-1 md:col-span-7 flex items-end">
              <Reveal delay={0.2}>
                <h1 className="font-anton text-[clamp(1.5rem,3vw,2.75rem)] tracking-wide text-[#fff7e1] max-w-[900px] flex flex-col gap-2 md:gap-3">
                  <span>Pickic</span>
                  <span className="text-[#ff4200]">Khung hình riêng.</span>
                  <span>Câu chuyện độc bản.</span>
                </h1>
              </Reveal>
            </div>
            <div className="md:row-start-1 md:col-start-8 md:col-span-5 flex flex-col justify-center items-start md:items-end text-left md:text-right">
              <Reveal delay={0.3}>
                <p className="text-sm md:text-base lg:text-lg text-[#fff7e1]/60 leading-[1.5] font-light max-w-[460px] md:relative md:-top-[40px]">
                  Kết nối trực tiếp với những nhiếp ảnh gia hàng đầu. Từ những cảm xúc chân thật nhất đến những khoảnh khắc rực rỡ nhất của cuộc đời, chúng tôi giúp bạn lưu giữ chúng một cách nghệ thuật và tinh tế.
                </p>
              </Reveal>
            </div>
            <div className="md:row-start-2 md:col-start-8 md:col-span-5 flex items-end justify-start md:justify-end">
              <Reveal delay={0.4}>
                <div
                  onMouseEnter={() => setArrowCycle((p) => p + 1)}
                  onMouseLeave={() => setArrowCycle((p) => p + 1)}
                  className="flex items-stretch gap-[2px] group cursor-pointer"
                >
                  <div className="px-7 py-5 md:px-9 md:py-6 bg-white/10 backdrop-blur-[40px] border border-white/10 rounded-l-full group-hover:bg-white group-hover:border-white transition-all duration-300">
                    <span className="font-mono text-xs md:text-sm font-bold tracking-widest text-white/90 group-hover:text-black transition-colors duration-300">
                      TÌM NHIẾP ẢNH GIA
                    </span>
                  </div>
                  <div className="px-6 py-5 md:px-7 md:py-6 bg-white/10 backdrop-blur-[40px] border border-white/10 rounded-r-full overflow-hidden flex items-center justify-center relative w-16 md:w-20 group-hover:bg-white group-hover:border-white transition-all duration-300 text-white group-hover:text-black">
                    {arrowCycle === 0 ? (
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                    ) : (
                      <span className="relative flex items-center justify-center w-full h-full">
                        <ArrowRight
                          key={`arrow-out-${arrowCycle}`}
                          className="animate-fly-out w-4 h-4 md:w-5 md:h-5 absolute text-current"
                        />
                        <ArrowRight
                          key={`arrow-in-${arrowCycle}`}
                          className="animate-fly-in w-4 h-4 md:w-5 md:h-5 absolute text-current"
                        />
                      </span>
                    )}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Sleek Stats Section */}
        <section className="w-[90%] max-w-[1000px] mx-auto pointer-events-auto border-t border-b border-[#fff7e1]/[0.06] py-16 grid grid-cols-3 gap-4 text-center">
          <Reveal delay={0.1}>
            <div className="flex flex-col items-center">
              <span className="font-anton text-2xl md:text-4xl leading-none text-[#fff7e1]/95">
                1,200<span className="text-[#ff4200]">+</span>
              </span>
              <span className="font-mono text-xs md:text-sm uppercase tracking-widest text-[#fff7e1]/40 mt-3">
                Nhiếp ảnh gia
              </span>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-col items-center">
              <span className="font-anton text-2xl md:text-4xl leading-none text-[#fff7e1]/95">
                48K<span className="text-[#ff4200]">+</span>
              </span>
              <span className="font-mono text-xs md:text-sm uppercase tracking-widest text-[#fff7e1]/40 mt-3">
                Buổi chụp thành công
              </span>
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="flex flex-col items-center">
              <span className="font-anton text-2xl md:text-4xl leading-none text-[#fff7e1]/95">
                4.9<span className="text-[#ff4200]">★</span>
              </span>
              <span className="font-mono text-xs md:text-sm uppercase tracking-widest text-[#fff7e1]/40 mt-3">
                Đánh giá trung bình
              </span>
            </div>
          </Reveal>
        </section>

        {/* Scattered Photo Gallery (Artistic Negative Space) */}
        <section className="w-[90%] max-w-[1100px] mx-auto pointer-events-auto py-28 md:py-40">
          <div className="mb-24 text-center md:text-left">
            <Reveal delay={0.1}>
              <p className="mt-0 text-xs font-mono tracking-[0.25em] text-[#ff4200] uppercase mb-3">
                Khoảnh khắc
              </p>
              <h2 className="font-anton text-2xl md:text-4xl text-[#fff7e1] tracking-wide">
                Góc nhìn độc bản
              </h2>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-36 md:gap-y-56 gap-x-24 md:gap-x-36">
            {/* Left Column */}
            <div className="flex flex-col gap-36 md:gap-56">
              <Reveal delay={0.1}>
                <div className="flex flex-col gap-4 max-w-[420px] w-full mx-auto md:mx-0">
                  <div className="group relative rounded-lg overflow-hidden border border-[#fff7e1]/[0.05] aspect-[3/4] hover:border-[#fff7e1]/20 transition-all duration-300 bg-black/10">
                    <img
                      src="/picture/928cf20bbffb31a568ea35.jpg"
                      alt="Wedding"
                      className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-103 filter brightness-[0.7] group-hover:brightness-95 saturate-[0.8]"
                    />
                  </div>
                  <div className="flex justify-between items-center px-1 font-mono text-[11px] md:text-xs text-[#fff7e1]/50 uppercase tracking-widest">
                    <span>[01] Phóng sự cưới</span>
                    <span>35mm • f/1.8</span>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="flex flex-col gap-4 max-w-[360px] w-full mx-auto md:ml-24">
                  <div className="group relative rounded-lg overflow-hidden border border-[#fff7e1]/[0.05] aspect-square hover:border-[#fff7e1]/20 transition-all duration-300 bg-black/10">
                    <img
                      src="/picture/8ca3508804788a26d3697.jpg"
                      alt="Portrait"
                      className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-103 filter brightness-[0.7] group-hover:brightness-95 saturate-[0.8]"
                    />
                  </div>
                  <div className="flex justify-between items-center px-1 font-mono text-[11px] md:text-xs text-[#fff7e1]/50 uppercase tracking-widest">
                    <span>[02] Chân dung</span>
                    <span>85mm • f/1.4</span>
                  </div>
                </div>
              </Reveal>
            </div>
            {/* Right Column */}
            <div className="flex flex-col gap-36 md:gap-56 md:pt-56">
              <Reveal delay={0.2}>
                <div className="flex flex-col gap-4 max-w-[460px] w-full mx-auto md:mx-0">
                  <div className="group relative rounded-lg overflow-hidden border border-[#fff7e1]/[0.05] aspect-[4/3] hover:border-[#fff7e1]/20 transition-all duration-300 bg-black/10">
                    <img
                      src="/picture/c10a06db522bdc75853a13.jpg"
                      alt="Outdoors"
                      className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-103 filter brightness-[0.7] group-hover:brightness-95 saturate-[0.8]"
                    />
                  </div>
                  <div className="flex justify-between items-center px-1 font-mono text-[11px] md:text-xs text-[#fff7e1]/50 uppercase tracking-widest">
                    <span>[03] Ngoại cảnh</span>
                    <span>28mm • f/2.8</span>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.4}>
                <div className="flex flex-col gap-4 max-w-[380px] w-full mx-auto md:ml-auto md:mr-12">
                  <div className="group relative rounded-lg overflow-hidden border border-[#fff7e1]/[0.05] aspect-[3/4] hover:border-[#fff7e1]/20 transition-all duration-300 bg-black/10">
                    <img
                      src="/picture/aedee057ada723f97ab630.jpg"
                      alt="Fashion"
                      className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-103 filter brightness-[0.7] group-hover:brightness-95 saturate-[0.8]"
                    />
                  </div>
                  <div className="flex justify-between items-center px-1 font-mono text-[11px] md:text-xs text-[#fff7e1]/50 uppercase tracking-widest">
                    <span>[04] Thời trang</span>
                    <span>50mm • f/1.2</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Who is it for Section */}
        <section className="w-[90%] max-w-[1100px] mx-auto pointer-events-auto py-28 md:py-40 border-t border-[#fff7e1]/[0.06]">
          <div className="text-center mb-24">
            <Reveal delay={0.1}>
              <SectionLead align="center">
                Tìm bạn đồng hành <SectionHighlight>hợp gu</SectionHighlight>
              </SectionLead>
              <h2 className="font-anton text-2xl md:text-4xl text-[#fff7e1] tracking-wide">
                Kết nối những tâm hồn đồng điệu tại Pickic
              </h2>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
            {/* For Customers Card */}
            <Reveal delay={0.2} className="relative group h-[260px] rounded-xl overflow-hidden border border-[#fff7e1]/[0.05] hover:border-[#ff4200]/30 hover:shadow-[0_0_40px_rgba(255,66,0,0.1)] bg-gradient-to-br from-[#fff7e1]/[0.03] to-transparent backdrop-blur-md transition-all duration-500 flex items-center">
              <div className="flex flex-row justify-between items-center p-8 md:p-10 gap-6 w-full h-full relative z-10">
                <div className="flex flex-col items-start justify-center">
                  <span className="font-mono text-[10px] md:text-xs font-bold tracking-[0.15em] text-[#fff7e1]/40 uppercase mb-3">
                    Khách hàng
                  </span>
                  <h3 className="font-anton text-2xl md:text-3xl text-[#fff7e1] leading-none mb-3">Tìm Thợ Chụp Ảnh</h3>
                  <p className="text-xs md:text-sm text-[#fff7e1]/40 font-light leading-relaxed max-w-[240px]">
                    Đặt lịch nhanh, giá cả minh bạch
                  </p>
                  <button className="flex items-center gap-2 font-mono text-[11px] md:text-xs font-bold tracking-widest text-[#fff7e1]/70 mt-6 uppercase group-hover:text-[#ff4200] transition-colors">
                    Đăng ký ngay <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-[140px] h-[190px] md:w-[150px] md:h-[210px] rounded-lg overflow-hidden border border-[#fff7e1]/[0.05] flex-shrink-0 relative bg-black/20">
                  <img
                    src="/picture/8282dd4689b607e85ea723.jpg"
                    alt="Customer"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-103 filter brightness-[0.6] saturate-[0.6] group-hover:brightness-90"
                  />
                </div>
              </div>
            </Reveal>
            {/* For Photographers Card */}
            <Reveal delay={0.3} className="relative group h-[260px] rounded-xl overflow-hidden border border-[#fff7e1]/[0.05] hover:border-violet-500/30 hover:shadow-[0_0_40px_rgba(139,92,246,0.1)] bg-gradient-to-br from-[#fff7e1]/[0.03] to-transparent backdrop-blur-md transition-all duration-500 flex items-center">
              <div className="flex flex-row justify-between items-center p-8 md:p-10 gap-6 w-full h-full relative z-10">
                <div className="flex flex-col items-start justify-center">
                  <span className="font-mono text-[10px] md:text-xs font-bold tracking-[0.15em] text-[#fff7e1]/40 uppercase mb-3">
                    Thợ Ảnh
                  </span>
                  <h3 className="font-anton text-2xl md:text-3xl text-[#fff7e1] leading-none mb-3">Nhận Booking</h3>
                  <p className="text-xs md:text-sm text-[#fff7e1]/40 font-light leading-relaxed max-w-[240px]">
                    Portfolio đẹp, thu nhập ổn định
                  </p>
                  <button className="flex items-center gap-2 font-mono text-[11px] md:text-xs font-bold tracking-widest text-[#fff7e1]/70 mt-6 uppercase group-hover:text-violet-400 transition-colors">
                    Tham gia <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-[140px] h-[190px] md:w-[150px] md:h-[210px] rounded-lg overflow-hidden border border-[#fff7e1]/[0.05] flex-shrink-0 relative bg-black/20">
                  <img
                    src="/picture/208a3fac6b5ce502bc4d4.jpg"
                    alt="Photographer"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-103 filter brightness-[0.6] saturate-[0.6] group-hover:brightness-90"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Minimal Stepper Section */}
        <section className="w-[90%] max-w-[1100px] mx-auto pointer-events-auto py-28 md:py-40 border-t border-[#fff7e1]/[0.06]">
          <div className="mb-24 text-center">
            <Reveal delay={0.1}>
              <SectionLead align="center">
                <SectionHighlight>Quy trình</SectionHighlight>
              </SectionLead>
              <h2 className="font-anton text-2xl md:text-4xl text-[#fff7e1] tracking-wide">
                Chỉ 3 bước đơn giản
              </h2>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
            <Reveal delay={0.2} className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="font-anton text-5xl md:text-6xl text-[#ff4200] mb-4">01</span>
              <h3 className="text-base md:text-lg font-bold text-[#fff7e1] uppercase tracking-wider mb-3">Khám Phá & Lọc</h3>
              <p className="text-sm md:text-[15px] text-[#fff7e1]/50 leading-relaxed font-light max-w-[280px]">
                Browse hàng trăm nhiếp ảnh gia, lọc theo phong cách, giá cả, khu vực.
              </p>
            </Reveal>
            <Reveal delay={0.3} className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="font-anton text-5xl md:text-6xl text-[#ff4200] mb-4">02</span>
              <h3 className="text-base md:text-lg font-bold text-[#fff7e1] uppercase tracking-wider mb-3">Match & Đặt Lịch</h3>
              <p className="text-sm md:text-[15px] text-[#fff7e1]/50 leading-relaxed font-light max-w-[280px]">
                Xem portfolio, đọc review, chọn ngày giờ và xác nhận booking trong vài giây.
              </p>
            </Reveal>
            <Reveal delay={0.4} className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="font-anton text-5xl md:text-6xl text-[#ff4200] mb-4">03</span>
              <h3 className="text-base md:text-lg font-bold text-[#fff7e1] uppercase tracking-wider mb-3">Chụp & Tận Hưởng</h3>
              <p className="text-sm md:text-[15px] text-[#fff7e1]/50 leading-relaxed font-light max-w-[280px]">
                Gặp gỡ nhiếp ảnh gia, tận hưởng buổi chụp, nhận ảnh đẹp về máy.
              </p>
            </Reveal>
          </div>
        </section>

        <section ref={footerRef} className="w-[90%] max-w-[1100px] mx-auto py-28 md:py-40 border-t border-[#fff7e1]/[0.06] pointer-events-auto">
          <div className="w-full mx-auto">
            <Reveal delay={0.1}>
              <SectionLead align="left">
                <SectionHighlight>Tính năng</SectionHighlight>
              </SectionLead>
              <h2 className="font-anton text-2xl md:text-4xl text-[#fff7e1] tracking-wide mb-16">
                Vì sao chọn Pickic ?
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-12 items-start">
              <Reveal delay={0.2}>
                <div className="flex flex-col gap-2">
                  <h3 className="text-base md:text-lg font-bold text-[#fff7e1] tracking-wider uppercase">Sàng lọc theo cá tính</h3>
                  <p className="text-sm md:text-[15px] text-[#fff7e1]/50 leading-relaxed font-light mt-2 max-w-[480px]">
                    Dù là màu ảnh điện ảnh (cinematic), cổ điển (retro) hay trong trẻo tự nhiên, bạn đều dễ dàng tìm thấy nhiếp ảnh gia có chung tiếng nói nghệ thuật.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="flex flex-col gap-2">
                  <h3 className="text-base md:text-lg font-bold text-[#fff7e1] tracking-wider uppercase">Đồng hành cùng chuyên gia</h3>
                  <p className="text-sm md:text-[15px] text-[#fff7e1]/50 leading-relaxed font-light mt-2 max-w-[480px]">
                    Mọi nhiếp ảnh gia trên Pickic đều được kiểm duyệt năng lực kỹ lưỡng, mang đến sự chuyên nghiệp tối đa từ khâu chuẩn bị đến khi bàn giao sản phẩm.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section ref={screen3Ref} className="w-full pb-28 pointer-events-auto">
          <div
            className="w-[80%] mx-auto"
            style={{
              backgroundColor: "rgba(10, 10, 6, 0.3)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 247, 225, 0.05)",
              padding: "clamp(32px, 6vw, 80px)",
              borderRadius: "24px",
            }}
          >
            <div
              className="flex flex-col lg:flex-row lg:items-end justify-between gap-10"
              style={{
                borderBottom: "1px solid rgba(255, 247, 225, 0.05)",
                paddingBottom: "clamp(32px, 5vw, 64px)",
              }}
            >
              <div>
                <h2
                  className="font-anton text-[#fff7e1] font-medium"
                  style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)", letterSpacing: "0.02em", lineHeight: 1.4 }}
                >
                  Lưu giữ câu chuyện <br />
                  của bạn ngay hôm nay
                </h2>
              </div>
              <div
                onMouseEnter={() => setFooterArrowCycle((p) => p + 1)}
                onMouseLeave={() => setFooterArrowCycle((p) => p + 1)}
                className="flex items-stretch gap-[1px] group cursor-pointer self-start lg:self-auto"
              >
                <div className="px-8 py-5 bg-[#ff4200] rounded-l-full group-hover:bg-[#e63b00] transition-colors duration-300">
                  <span className="font-mono text-xs font-bold tracking-widest text-[#fff7e1]">ĐẶT LỊCH CHỤP</span>
                </div>
                <div className="px-5 bg-[#ff4200] rounded-r-full overflow-hidden flex items-center justify-center relative w-14 group-hover:bg-[#e63b00] transition-colors duration-300 text-[#fff7e1]">
                  {footerArrowCycle === 0 ? (
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <span className="relative flex items-center justify-center w-full h-full">
                      <ArrowRight
                        key={`f-arrow-out-${footerArrowCycle}`}
                        className="animate-fly-out w-4 h-4 md:w-5 md:h-5 absolute text-current"
                      />
                      <ArrowRight
                        key={`f-arrow-in-${footerArrowCycle}`}
                        className="animate-fly-in w-4 h-4 md:w-5 md:h-5 absolute text-current"
                      />
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
              style={{ paddingTop: "clamp(32px, 5vw, 64px)", gap: "clamp(24px, 4vw, 48px)" }}
            >
              <div className="flex flex-col gap-4">
                <img src={logoCreamOriginalSquare} alt="Pickic Square Logo" className="w-10 md:w-12 select-none mb-1 -mt-2" />
                <p className="text-xs md:text-sm text-[#fff7e1]/40 leading-relaxed font-light mt-2 max-w-[240px]">
                  Nền tảng kết nối nhiếp ảnh gia chuyên nghiệp hàng đầu, giúp bạn lưu trữ những ký ức đẹp nhất một cách trọn vẹn.
                </p>
              </div>
              <div>
                <h4 className="text-[11px] font-mono tracking-[0.2em] text-[#fff7e1]/30 uppercase mb-4">TRẢI NGHIỆM</h4>
                <ul className="flex flex-col gap-3 font-mono text-xs md:text-sm">
                  <li>
                    <a href="#" className="text-[#fff7e1]/60 hover:text-[#fff7e1] transition-colors">
                      CHÂN DUNG & NGHỆ THUẬT
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#fff7e1]/60 hover:text-[#fff7e1] transition-colors">
                      SỰ KIỆN & TIỆC CƯỚI
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#fff7e1]/60 hover:text-[#fff7e1] transition-colors">
                      THỜI TRANG & QUẢNG CÁO
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#fff7e1]/60 hover:text-[#fff7e1] transition-colors">
                      NGOẠI CẢNH & PHÓNG SỰ
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-mono tracking-[0.2em] text-[#fff7e1]/30 uppercase mb-4">TIÊU CHUẨN</h4>
                <ul className="flex flex-col gap-3 font-mono text-xs md:text-sm">
                  <li>
                    <a href="#" className="text-[#fff7e1]/60 hover:text-[#fff7e1] transition-colors">
                      NHIẾP ẢNH GIA XÁC MINH
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#fff7e1]/60 hover:text-[#fff7e1] transition-colors">
                      BẢO HÀNH CHẤT LƯỢNG ẢNH
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#fff7e1]/60 hover:text-[#fff7e1] transition-colors">
                      HỢP ĐỒNG MINH BẠCH
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#fff7e1]/60 hover:text-[#fff7e1] transition-colors">
                      BÀN GIAO ĐÚNG HẠN
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-mono tracking-[0.2em] text-[#fff7e1]/30 uppercase mb-4">KẾT NỐI</h4>
                <ul className="flex flex-col gap-3 font-mono text-xs md:text-sm">
                  <li>
                    <a href="#" className="text-[#fff7e1]/60 hover:text-[#fff7e1] transition-colors">
                      TRỞ THÀNH PARTNER
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#fff7e1]/60 hover:text-[#fff7e1] transition-colors">
                      CỘNG ĐỒNG PICKIC
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#fff7e1]/60 hover:text-[#fff7e1] transition-colors">
                      HƯỚNG DẪN ĐẶT LỊCH
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#fff7e1]/60 hover:text-[#fff7e1] transition-colors">
                      HỖ TRỢ KHÁCH HÀNG
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div
              className="flex flex-col md:flex-row items-center justify-between gap-4 font-mono"
              style={{
                marginTop: "48px",
                paddingTop: "28px",
                borderTop: "1px solid rgba(255, 247, 225, 0.05)",
              }}
            >
              <div className="text-xs text-[#fff7e1]/30 tracking-wider uppercase text-center md:text-left">
                © 2026 PICKIC. TẤT CẢ QUYỀN ĐƯỢC BẢO LƯU.
              </div>
              <div className="flex gap-6 text-xs text-[#fff7e1]/30 tracking-wider">
                <a href="#" className="hover:text-[#fff7e1]/50 transition-colors">
                  ĐIỀU KHOẢN DỊCH VỤ
                </a>
                <span className="text-[#fff7e1]/10">|</span>
                <a href="#" className="hover:text-[#fff7e1]/50 transition-colors">
                  CHÍNH SÁCH BẢO MẬT
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {showSocialDock && (
          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-1/2 z-20 -translate-y-1/2 pointer-events-auto"
          >
            <div className="group flex items-center">
              <button
                type="button"
                onClick={() => setSocialDockExpanded((v) => !v)}
                aria-expanded={socialDockExpanded}
                aria-controls="social-dock-panel"
                aria-label={socialDockExpanded ? "Thu gọn menu kết nối" : "Mở menu kết nối nhanh"}
                className="group relative flex h-[92px] w-[40px] -translate-x-[1px] items-center justify-center overflow-hidden rounded-l-[20px] border border-r-0 border-[#fff7e1]/10 bg-[#0a0a06]/88 text-[#fff7e1] shadow-[0_0_28px_rgba(255,66,0,0.34),0_0_70px_rgba(255,66,0,0.18),0_18px_52px_rgba(0,0,0,0.38)] backdrop-blur-xl transition-transform duration-300 hover:-translate-x-[4px] hover:bg-[#12110d] hover:shadow-[0_0_42px_rgba(255,66,0,0.58),0_0_110px_rgba(255,66,0,0.36),0_18px_52px_rgba(0,0,0,0.38)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4200]/70 animate-soft-glow-pulse"
              >
                <span className="absolute inset-0 rounded-l-[20px] shadow-[inset_0_0_0_1px_rgba(255,66,0,0.28),0_0_30px_rgba(255,66,0,0.35)] transition-shadow duration-300 group-hover:shadow-[inset_0_0_0_1px_rgba(255,66,0,0.42),0_0_48px_rgba(255,66,0,0.55)]" aria-hidden />
                <span className="absolute inset-y-3 right-1.5 w-px bg-gradient-to-b from-transparent via-[#ff4200]/60 to-transparent animate-pulse" aria-hidden />
                <span className="absolute inset-0 rounded-l-[20px] bg-[radial-gradient(circle_at_50%_50%,rgba(255,66,0,0.18),transparent_60%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
                <span className="relative flex items-center justify-center">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-[#fff7e1]/78 [writing-mode:vertical-rl] rotate-180">
                    Social
                  </span>
                </span>
                <span className="sr-only">{socialDockExpanded ? "Thu gọn" : "Mở rộng"}</span>
              </button>
              <motion.div
                id="social-dock-panel"
                initial={false}
                animate={{ width: socialDockExpanded ? 248 : 0, opacity: socialDockExpanded ? 1 : 0 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden rounded-l-[24px] border border-r-0 border-[#fff7e1]/10 bg-[#0a0a06]/86 shadow-[0_18px_52px_rgba(0,0,0,0.38)] backdrop-blur-xl"
                style={{ pointerEvents: socialDockExpanded ? "auto" : "none" }}
              >
                <div className="w-[248px] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#ff4200]">
                      Kết nối nhanh
                    </p>
                    <span className="rounded-full border border-[#fff7e1]/10 bg-white/5 px-2 py-0.5 text-[9px] font-mono uppercase tracking-[0.18em] text-[#fff7e1]/35">
                      Social
                    </span>
                  </div>
                  <div className="grid gap-2">
                    <SocialActionLink href={socialLinks?.fanpage ?? "#"} label="Mở fanpage ShooMatch trên Facebook">
                      Fanpage
                    </SocialActionLink>
                    <SocialActionLink href={socialLinks?.tiktok ?? "#"} label="Mở TikTok ShooMatch">
                      TikTok
                    </SocialActionLink>
                    <SocialActionLink href={socialLinks?.support ?? "#"} label="Gửi email cho bộ phận hỗ trợ ShooMatch">
                      Support
                    </SocialActionLink>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
