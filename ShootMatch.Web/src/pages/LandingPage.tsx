import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { ArrowRight, Search, Heart, MessageCircle, Calendar } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative w-full h-[600px] flex flex-col items-center justify-center p-4">
          <div className="absolute inset-0 z-0">
            {/* Background Image Container */}
            <div className="absolute inset-0 bg-zinc-900/80 z-10"></div>
            <img
              src="/hero_bg.png"
              alt="Hero Background"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image not yet generated or available
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=2070&auto=format&fit=crop";
              }}
            />
          </div>

          <div className="z-20 text-center max-w-4xl pt-10">
            <span className="text-gray-300 tracking-[0.3em] text-sm md:text-base font-semibold uppercase mb-6 block">
              Pic Kic Studio
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white uppercase leading-tight mb-8">
              Pick đúng <span className="text-primary">người</span>
              <br />
              Pick đúng <span className="text-primary">khoảnh khắc</span>
            </h1>
          </div>

          {/* Floating Search Bar */}
          <div className="z-20 mt-12 w-full max-w-md bg-zinc-900 rounded-full flex items-center p-2 shadow-xl border border-zinc-700">
            <div className="flex-1 px-6 text-white font-medium flex items-center justify-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              Khám phá
            </div>
            <button className="bg-white text-black p-3 rounded-full hover:bg-gray-200 transition-colors">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 21v-7" />
                <path d="M4 10V3" />
                <path d="M12 21v-9" />
                <path d="M12 8V3" />
                <path d="M20 21v-5" />
                <path d="M20 12V3" />
                <path d="M1 14h6" />
                <path d="M9 8h6" />
                <path d="M17 16h6" />
              </svg>
            </button>
          </div>
        </section>

        {/* NỔI BẬT SECTION */}
        <section id="features" className="py-16 md:py-24 container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-textMain">Nổi Bật</h2>
            <a
              href="#"
              className="text-sm font-medium text-gray-500 hover:text-primary transition-colors uppercase tracking-wider"
            >
              Xem tất cả
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative rounded-3xl overflow-hidden aspect-[3/4] bg-zinc-200 cursor-pointer shadow-lg hover:shadow-xl transition-all">
              <img
                src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                alt="Featured"
              />
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white font-semibold text-lg">Chân dung nghệ thuật</h3>
                <p className="text-gray-300 text-sm">Hà Nội</p>
              </div>
            </div>
            <div className="group relative rounded-3xl overflow-hidden aspect-[3/4] bg-zinc-200 cursor-pointer shadow-lg hover:shadow-xl transition-all">
              <img
                src="https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                alt="Featured"
              />
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white font-semibold text-lg">Ảnh cưới - Pre-wedding</h3>
                <p className="text-gray-300 text-sm">Đà Lạt</p>
              </div>
            </div>
            <div className="group relative rounded-3xl overflow-hidden aspect-[3/4] bg-zinc-200 cursor-pointer shadow-lg hover:shadow-xl transition-all">
              <img
                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                alt="Featured"
              />
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white font-semibold text-lg">Nhiếp ảnh sự kiện</h3>
                <p className="text-gray-300 text-sm">TP. Hồ Chí Minh</p>
              </div>
            </div>
          </div>
        </section>

        {/* CÁCH HOẠT ĐỘNG (HOW IT WORKS) */}
        <section id="how-it-works" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-textMain">
              Hành trình tạo nên bức ảnh đẹp
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center relative">
              <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gray-200 z-0"></div>

              <div className="relative z-10 flex flex-col items-center group">
                <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center shadow border border-border text-primary group-hover:bg-primary group-hover:text-white transition-colors mb-6">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-textMain">Tìm kiếm</h3>
                <p className="text-gray-600 text-sm px-4">
                  Khám phá hàng trăm nhiếp ảnh gia với đa dạng phong cách quanh bạn.
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-center group">
                <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center shadow border border-border text-primary group-hover:bg-primary group-hover:text-white transition-colors mb-6">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-textMain">Swipe & Match</h3>
                <p className="text-gray-600 text-sm px-4">
                  Quẹt phải (Like) để kết nối. Matching tức thì khi cả hai cùng tương tác.
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-center group">
                <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center shadow border border-border text-primary group-hover:bg-primary group-hover:text-white transition-colors mb-6">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-textMain">Trao đổi</h3>
                <p className="text-gray-600 text-sm px-4">
                  Chat trực tiếp trong app, chốt ý tưởng, giá cả và thời gian chụp.
                </p>
              </div>

              <div className="relative z-10 flex flex-col items-center group">
                <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center shadow border border-border text-primary group-hover:bg-primary group-hover:text-white transition-colors mb-6">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-textMain">Đặt lịch</h3>
                <p className="text-gray-600 text-sm px-4">
                  Đặt cọc & thanh toán an toàn. Trải nghiệm buổi chụp tuyệt vời của riêng bạn.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section id="download" className="py-20 md:py-32 container mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-orange-500 p-8 md:p-16 flex flex-col items-center text-center shadow-2xl">
            {/* Texture overlay */}
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>

            <span className="relative z-10 text-white/90 tracking-widest text-sm font-semibold uppercase mb-4">
              Bắt đầu ngay hôm nay
            </span>
            <h2 className="relative z-10 text-4xl md:text-6xl font-extrabold text-white mb-10">SWIPE & MATCH</h2>

            <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                to="/auth"
                className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-8 py-4 rounded-xl hover:bg-black transition-colors font-semibold text-lg group"
              >
                Khám Phá Trong App
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="relative z-10 mt-12 flex gap-6 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>{" "}
                App Store
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.525 15.65c-.09.09-.234.156-.375.156H6.85c-.14 0-.28-.063-.375-.156L1.134 10.3c-.203-.203-.203-.547 0-.75l5.344-5.344c.094-.094.235-.156.375-.156h10.3c.14 0 .28.063.375.156l5.344 5.344c.203.203.203.547 0 .75l-5.344 5.344zM6.622 4.969L1.937 9.656l4.685 4.688h10.756l4.685-4.688-4.685-4.688H6.622z" />
                </svg>{" "}
                Google Play
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
