import { motion } from "framer-motion";
import { ArrowLeft, Download, MonitorSmartphone, Share, PlusSquare } from "lucide-react";
import { Link } from "react-router-dom";
import logoCreamHorizontal from "../assets/Logo Pickic/cream_horizontal.png";

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function InstallPage() {
  return (
    <>
      {/* Background & Styling */}
      <style>{`
        :root {
          --cream: #fff7e1;
          --dark: #0a0a06;
          --orange: #ff4200;
        }
        body {
          background-color: var(--dark);
          color: var(--cream);
          overflow-x: hidden;
        }
        .film-grain {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 50; opacity: 0.04;
          background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuAqoVzK0YGRAP5LeOe6bASYgBEIQM4OF5Cak1yvOq57mrUHqcFvm9SkCz0ZRIGkRVZiAG7JhjAM17f5Ma4ENgN4ngzSrjQfwK7ZQGWbZNNwpUgOa5AytKXU_dlXRVid-C8cx8JRzlbo0SyC8YHTS9hydT7-kZyVsK2-hCQYXAX8sU6ky3RSo8hvtvKoKlMzYLgB9lRhKnAvKTX7Wos8vT2OzOEBFlLlOZby4hyJMaecoAvpAl-iBnlrlGxJ-Tl_5NFLO9NrUfZHtXA");
        }
        .hero-orb {
          position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
          width: 800px; height: 800px;
          background: radial-gradient(circle, rgba(255,66,0,0.1), transparent 70%);
          filter: blur(60px); z-index: 1; pointer-events: none;
        }
      `}</style>
      <div className="film-grain" />
      <div className="fixed inset-0 z-0 bg-[#0a0a06] overflow-hidden pointer-events-none">
        <div className="hero-orb" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-20 w-full flex items-center justify-between pointer-events-auto py-6 px-8 md:px-12 bg-gradient-to-b from-[#0a0a06] to-transparent"
      >
        <Link to="/" className="flex items-center group">
          <ArrowLeft className="w-5 h-5 text-[#fff7e1]/60 group-hover:text-[#fff7e1] transition-colors mr-3" />
          <span className="font-mono text-xs uppercase tracking-widest text-[#fff7e1]/60 group-hover:text-[#fff7e1] transition-colors">Trở về</span>
        </Link>
        <Link to="/">
          <img src={logoCreamHorizontal} alt="Pickic Logo" className="h-[60px] md:h-[80px] select-none" />
        </Link>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 w-full min-h-screen pt-32 pb-24 flex flex-col items-center justify-center pointer-events-auto">
        <div className="w-[90%] max-w-[1000px] mx-auto">
          
          <div className="text-center mb-16 md:mb-24">
            <Reveal delay={0.1}>
              <h1 className="font-anton text-4xl md:text-5xl lg:text-6xl text-[#fff7e1] tracking-wide mb-6">
                Tải Ứng Dụng <span className="text-[#ff4200]">Pickic</span>
              </h1>
              <p className="text-[#fff7e1]/60 text-sm md:text-base max-w-[600px] mx-auto font-light leading-relaxed">
                Trải nghiệm liền mạch trên mọi thiết bị. Dữ liệu được đồng bộ theo thời gian thực với hệ thống API chung, đảm bảo bạn không bao giờ bỏ lỡ khoảnh khắc nào.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {/* iOS / PWA Card */}
            <Reveal delay={0.2} className="relative group rounded-2xl overflow-hidden border border-[#fff7e1]/[0.08] hover:border-[#fff7e1]/20 bg-gradient-to-br from-[#fff7e1]/[0.03] to-transparent backdrop-blur-md transition-all duration-500 p-8 md:p-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <MonitorSmartphone className="w-10 h-10 text-[#fff7e1]/80" />
                <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#fff7e1]/40 uppercase px-3 py-1 border border-[#fff7e1]/10 rounded-full">
                  iOS / Web
                </span>
              </div>
              <h2 className="font-anton text-2xl md:text-3xl text-[#fff7e1] mb-4">Pickic PWA</h2>
              <p className="text-sm text-[#fff7e1]/50 font-light leading-relaxed mb-8">
                Cài đặt trực tiếp từ trình duyệt Safari trên iPhone/iPad của bạn mà không cần thông qua App Store. Ứng dụng nhẹ, mượt mà và đầy đủ tính năng.
              </p>
              
              <div className="mt-auto">
                <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#fff7e1]/70 mb-4 flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-[#fff7e1]/30"></span> Các bước cài đặt
                </h3>
                <ul className="space-y-4 font-light text-sm text-[#fff7e1]/60">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#fff7e1]/10 flex items-center justify-center font-mono text-[10px] text-[#fff7e1]">1</span>
                    <span>Truy cập <a href="https://app.pickic.io.vn" className="text-[#ff4200] hover:underline" target="_blank" rel="noreferrer">app.pickic.io.vn</a> bằng trình duyệt <span className="text-[#ffb700] font-semibold">Safari</span>.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#fff7e1]/10 flex items-center justify-center font-mono text-[10px] text-[#fff7e1]">2</span>
                    <span>Nhấn vào biểu tượng <span className="text-[#ffb700] font-semibold">Chia sẻ</span> <Share className="inline w-4 h-4 mx-1 text-[#ffb700]" /> ở thanh công cụ dưới cùng.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#fff7e1]/10 flex items-center justify-center font-mono text-[10px] text-[#fff7e1]">3</span>
                    <span>Cuộn xuống và chọn <span className="text-[#ffb700] font-semibold">"Thêm vào MH chính"</span> <PlusSquare className="inline w-4 h-4 mx-1 text-[#ffb700]" /> (Add to Home Screen).</span>
                  </li>
                </ul>
              </div>
              
              <a href="https://app.pickic.io.vn" target="_blank" rel="noreferrer" className="mt-8 flex items-center justify-center w-full py-4 bg-[#fff7e1]/10 hover:bg-[#fff7e1]/20 text-[#fff7e1] rounded-xl font-mono text-xs tracking-widest uppercase transition-colors">
                Mở ứng dụng Web
              </a>
            </Reveal>

            {/* Android APK Card */}
            <Reveal delay={0.3} className="relative group rounded-2xl overflow-hidden border border-[#fff7e1]/[0.08] hover:border-[#ff4200]/30 hover:shadow-[0_0_40px_rgba(255,66,0,0.1)] bg-gradient-to-br from-[#fff7e1]/[0.03] to-transparent backdrop-blur-md transition-all duration-500 p-8 md:p-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-[#2ecc71]">
                  <path d="M17.523 15.3414C17.523 15.3414 16.9205 15.3414 16.9205 15.9439C16.9205 16.5464 17.523 16.5464 17.523 16.5464C18.1255 16.5464 18.1255 15.9439 18.1255 15.9439C18.1255 15.3414 17.523 15.3414 17.523 15.3414ZM6.47712 15.3414C6.47712 15.3414 5.87463 15.3414 5.87463 15.9439C5.87463 16.5464 6.47712 16.5464 6.47712 16.5464C7.07961 16.5464 7.07961 15.9439 7.07961 15.9439C7.07961 15.3414 6.47712 15.3414 6.47712 15.3414ZM12.0001 2.25C6.6151 2.25 2.25012 6.61498 2.25012 12C2.25012 17.385 6.6151 21.75 12.0001 21.75C17.3851 21.75 21.7501 17.385 21.7501 12C21.7501 6.61498 17.3851 2.25 12.0001 2.25ZM16.5181 12.0299H7.48208C7.48208 9.53724 9.50742 7.51189 12.0001 7.51189C14.4928 7.51189 16.5181 9.53724 16.5181 12.0299ZM17.9546 17.4526H6.04561V12.9344H17.9546V17.4526Z"/>
                </svg>
                <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#fff7e1]/40 uppercase px-3 py-1 border border-[#fff7e1]/10 rounded-full">
                  Android
                </span>
              </div>
              <h2 className="font-anton text-2xl md:text-3xl text-[#fff7e1] mb-4">Pickic Native</h2>
              <p className="text-sm text-[#fff7e1]/50 font-light leading-relaxed mb-8">
                Tải file APK trực tiếp để cài đặt ứng dụng gốc trên thiết bị Android. Hiệu năng tối đa và tích hợp sâu với hệ điều hành.
              </p>
              
              <div className="mt-auto">
                 <div className="p-4 rounded-xl bg-[#ff4200]/10 border border-[#ff4200]/20 mb-6">
                    <p className="text-xs text-[#fff7e1]/80 leading-relaxed font-light">
                      <span className="text-[#ff4200] font-medium">Lưu ý:</span> Bạn có thể cần bật tuỳ chọn <strong>"Cài đặt ứng dụng từ nguồn không xác định"</strong> (Install apps from unknown sources) trong Cài đặt bảo mật của điện thoại trước khi cài file APK.
                    </p>
                 </div>
              </div>
              
              <a 
                href="https://github.com/ThinhTran2412/EXE_201/releases/latest/download/Pickic.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto flex items-center justify-center w-full py-4 bg-[#ff4200] hover:bg-[#e63b00] text-[#fff7e1] rounded-xl font-mono text-xs tracking-widest uppercase transition-colors group"
              >
                <Download className="w-4 h-4 mr-2 group-hover:-translate-y-1 transition-transform" />
                Tải File APK
              </a>
            </Reveal>
          </div>

        </div>
      </main>
    </>
  );
}
