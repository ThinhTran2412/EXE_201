import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import {
  ArrowRight,
  Search,
  Heart,
  MessageCircle,
  Calendar,
  ShieldCheck,
  Wallet,
  Star,
  Globe,
} from "lucide-react";

// ── Local images from /public/picture ─────────────────────────────────────────
const pics = [
  "/picture/08ef9fc5cb35456b1c245.jpg",
  "/picture/0cf423426eb2e0ecb9a328.jpg",
  "/picture/173fd2fa860a0854511b16.jpg",
  "/picture/1de35fa31853960dcf4243.jpg",
  "/picture/208a3fac6b5ce502bc4d4.jpg",
  "/picture/22469bccd63c5862012d24.jpg",
  "/picture/2d5c71802570ab2ef26111.jpg",
  "/picture/36dbd1f185010b5f52108.jpg",
  "/picture/3fb13c9a686ae634bf7b6.jpg",
  "/picture/41219c2ac8da46841fcb3.jpg",
  "/picture/46ead19796671839417641.jpg",
  "/picture/47aac1208cd0028e5bc134.jpg",
  "/picture/481fdddb892b07755e3a21.jpg",
  "/picture/4add650031f0bfaee6e112.jpg",
  "/picture/58b0bb9aef6a6134387b9.jpg",
  "/picture/5dab352178d1f68fafc027.jpg",
  "/picture/74b924c76337ed69b42639.jpg",
  "/picture/757e58af0c5f8201db4e14.jpg",
  "/picture/8282dd4689b607e85ea723.jpg",
  "/picture/8887c00c8dfc03a25aed32.jpg",
  "/picture/8ca3508804788a26d3697.jpg",
  "/picture/8d5a7f9e2b6ea530fc7f22.jpg",
  "/picture/928cf20bbffb31a568ea35.jpg",
  "/picture/9cef5ee70a178449dd062.jpg",
  "/picture/9e471ace573ed960802f31.jpg",
  "/picture/a3eecd2b99db17854eca20.jpg",
  "/picture/a535cef09a00145e4d1118.jpg",
  "/picture/a6608cb3d843561d0f5215.jpg",
  "/picture/ac8e0f0642f6cca895e729.jpg",
  "/picture/ad33f8b9b5493b17625836.jpg",
  "/picture/aedee057ada723f97ab630.jpg",
  "/picture/bc1fc89585650b3b527426.jpg",
  "/picture/c10a06db522bdc75853a13.jpg",
  "/picture/c15b059e516edf30867f17.jpg",
  "/picture/cd188166c69648c8118742.jpg",
  "/picture/d590bc1af1ea7fb426fb33.jpg",
  "/picture/d868161651e6dfb886f740.jpg",
  "/picture/e504888ec57e4b20126f38.jpg",
  "/picture/e64e9293c663483d117210.jpg",
  "/picture/ebcda847e5b76be932a625.jpg",
  "/picture/ebe8812dd5dd5b8302cc19.jpg",
  "/picture/ee7c00775487dad983961.jpg",
  "/picture/ff497ac33733b96de02237.jpg",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">

        {/* ══════════════════════════════════════════════════════════════
            HERO SECTION
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative w-full h-[520px] flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-foreground/70 z-10" />
            <img
              src={pics[20]}
              alt="Hero Background"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="z-20 text-center max-w-3xl px-6">
            <span className="text-gray-300 tracking-[0.3em] text-xs font-semibold uppercase mb-4 block">
              ShootMatch Studio
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-extrabold text-white uppercase leading-tight mb-6">
              Pick đúng <span className="text-primary">người</span>
              <br />
              Pick đúng <span className="text-primary">khoảnh khắc</span>
            </h1>
            <div className="mt-6 inline-flex flex-col sm:flex-row items-stretch sm:items-center bg-white/10 backdrop-blur-sm rounded-3xl sm:rounded-full border border-white/20 px-2 py-2 gap-2">
              <span className="px-4 text-white/80 text-sm flex items-center gap-2 justify-center sm:justify-start">
                <Search className="w-4 h-4 text-white/50" /> Khám phá nhiếp ảnh gia
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  to="/auth"
                  className="bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-1"
                >
                  Tìm ngay <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/web"
                  className="bg-white/10 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-white/20 transition-colors flex items-center justify-center gap-1 border border-white/15"
                >
                  Mở web <Globe className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            STATS ROW
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-background border-b border-border py-8 px-4">
          <div className="max-w-2xl mx-auto flex justify-around items-center">
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-primary leading-none">1,200+</p>
              <p className="text-foreground/50 text-[10px] uppercase tracking-widest mt-1">Thợ Chụp Ảnh</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-primary leading-none">48K+</p>
              <p className="text-foreground/50 text-[10px] uppercase tracking-widest mt-1">Booking Thành Công</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="font-display text-3xl font-bold text-primary leading-none">4.9★</p>
              <p className="text-foreground/50 text-[10px] uppercase tracking-widest mt-1">Đánh Giá TB</p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            KHOẢNH KHẮC — Photo Grid (Image 1)
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-background py-14 px-6">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-foreground/40 mb-2">
              Gallery
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-8">
              Khoảnh Khắc
            </h2>

            {/* Desktop: 4-col masonry-style grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3" style={{ gridTemplateRows: "auto" }}>
              {/* Col 1 — tall, spans 2 rows */}
              <div className="md:row-span-2 rounded-2xl overflow-hidden bg-border">
                <img src={pics[0]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" style={{ minHeight: "280px" }} />
              </div>
              {/* Row 1, col 2 */}
              <div className="rounded-2xl overflow-hidden bg-border" style={{ aspectRatio: "1/1" }}>
                <img src={pics[1]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              {/* Row 1, col 3 */}
              <div className="rounded-2xl overflow-hidden bg-border" style={{ aspectRatio: "1/1" }}>
                <img src={pics[2]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              {/* Row 1, col 4 — tall */}
              <div className="md:row-span-2 rounded-2xl overflow-hidden bg-border">
                <img src={pics[3]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" style={{ minHeight: "280px" }} />
              </div>
              {/* Row 2, col 2+3 wide */}
              <div className="col-span-2 rounded-2xl overflow-hidden bg-border" style={{ aspectRatio: "16/7" }}>
                <img src={pics[4]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              {/* Row 3 — four equal */}
              <div className="rounded-2xl overflow-hidden bg-border" style={{ aspectRatio: "1/1" }}>
                <img src={pics[6]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="rounded-2xl overflow-hidden bg-border" style={{ aspectRatio: "1/1" }}>
                <img src={pics[7]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="rounded-2xl overflow-hidden bg-border" style={{ aspectRatio: "1/1" }}>
                <img src={pics[8]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="rounded-2xl overflow-hidden bg-border" style={{ aspectRatio: "1/1" }}>
                <img src={pics[9]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            AI CÓ THỂ DÙNG SHOOTMATCH? (Image 2)
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-background py-14 px-6 border-t border-border">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-foreground/40 mb-2">
              Dành Cho
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight mb-10">
              Ai có thể dùng ShootMatch?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Khách Hàng */}
              <Link
                to="/auth"
                className="group relative rounded-3xl overflow-hidden flex flex-col justify-end shadow-xl"
                style={{ minHeight: "480px" }}
              >
                <img
                  src={pics[10]}
                  alt="Khách hàng"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="relative z-10 p-8">
                  <span className="inline-block bg-primary text-white text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
                    Khách Hàng
                  </span>
                  <h3 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
                    Tìm Thợ Chụp Ảnh
                  </h3>
                  <p className="text-white/60 text-sm mb-6">Đặt lịch nhanh, giá minh bạch</p>
                  <span className="text-white text-sm font-bold tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all">
                    ĐĂNG KÝ NGAY <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>

              {/* Card Thợ Ảnh */}
              <Link
                to="/auth"
                className="group relative rounded-3xl overflow-hidden flex flex-col justify-end shadow-xl"
                style={{ minHeight: "480px" }}
              >
                <img
                  src={pics[11]}
                  alt="Thợ ảnh"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="relative z-10 p-8">
                  <span className="inline-block bg-[#3617cf] text-white text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-4">
                    Thợ Ảnh
                  </span>
                  <h3 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight mb-2">
                    Nhận Booking
                  </h3>
                  <p className="text-white/60 text-sm mb-6">Portfolio đẹp, thu nhập ổn định</p>
                  <span className="text-white text-sm font-bold tracking-wider flex items-center gap-2 group-hover:gap-3 transition-all">
                    THAM GIA <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>



        {/* ══════════════════════════════════════════════════════════════
            NỔI BẬT — Featured photographers
        ══════════════════════════════════════════════════════════════ */}
        <section id="features" className="bg-background py-12 px-4 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Nổi Bật</h2>
              <a href="#" className="text-xs font-semibold text-primary hover:underline uppercase tracking-wider">
                Xem tất cả
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { src: pics[12], title: "Chân dung nghệ thuật", loc: "Hà Nội" },
                { src: pics[16], title: "Ảnh cưới - Pre-wedding", loc: "Đà Lạt" },
                { src: pics[22], title: "Nhiếp ảnh sự kiện",    loc: "TP. Hồ Chí Minh" },
              ].map(({ src, title, loc }) => (
                <div
                  key={title}
                  className="group relative rounded-2xl overflow-hidden bg-border cursor-pointer shadow hover:shadow-lg transition-all"
                  style={{ aspectRatio: "3/4" }}
                >
                  <img
                    src={src}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={title}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-white font-semibold text-base">{title}</h3>
                    <p className="text-gray-300 text-xs">{loc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            CÁCH HOẠT ĐỘNG
        ══════════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="bg-white py-16 px-4 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">
              Hành trình tạo nên bức ảnh đẹp
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { Icon: Search,        label: "Tìm kiếm",    desc: "Khám phá hàng trăm nhiếp ảnh gia với đa dạng phong cách." },
                { Icon: Heart,         label: "Swipe & Match", desc: "Quẹt phải để kết nối. Matching tức thì khi cả hai tương tác." },
                { Icon: MessageCircle, label: "Trao đổi",    desc: "Chat trực tiếp, chốt ý tưởng, giá cả và thời gian chụp." },
                { Icon: Calendar,      label: "Đặt lịch",    desc: "Đặt cọc & thanh toán an toàn. Trải nghiệm buổi chụp tuyệt vời." },
              ].map(({ Icon, label, desc }) => (
                <div key={label} className="flex flex-col items-center group">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center shadow border border-border text-primary group-hover:bg-primary group-hover:text-white transition-colors mb-4">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-semibold mb-1 text-foreground">{label}</h3>
                  <p className="text-foreground/50 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            VÌ SAO CHỌN SHOOTMATCH?
        ══════════════════════════════════════════════════════════════ */}
        <section className="bg-background py-14 px-6 border-t border-border">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-foreground/40 mb-2">
              Tính Năng
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight mb-10">
              Vì sao chọn <span className="text-primary">ShootMatch?</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  Icon: ShieldCheck,
                  color: "bg-primary/10 text-primary",
                  title: "Xác Minh 100%",
                  desc: "Mọi nhiếp ảnh gia đều được kiểm duyệt portfolio và danh tính trước khi lên nền tảng.",
                },
                {
                  Icon: Wallet,
                  color: "bg-green-100 text-green-600",
                  title: "Thanh Toán An Toàn",
                  desc: "Tiền được giữ escrow cho đến khi buổi chụp hoàn thành và cả hai bên hài lòng.",
                },
                {
                  Icon: MessageCircle,
                  color: "bg-purple-100 text-purple-600",
                  title: "Chat Trực Tiếp",
                  desc: "Trao đổi concept, yêu cầu và lịch trình với nhiếp ảnh gia trực tiếp trong app.",
                },
                {
                  Icon: Star,
                  color: "bg-yellow-100 text-yellow-600",
                  title: "Review Minh Bạch",
                  desc: "Đọc đánh giá thực từ khách hàng thật để đưa ra lựa chọn tự tin nhất.",
                },
              ].map(({ Icon, color, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-6 bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all group"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${color} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-bold text-lg mb-2">{title}</h3>
                    <p className="text-foreground/50 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            CTA SECTION
        ══════════════════════════════════════════════════════════════ */}
        <section id="download" className="py-16 px-4 bg-background border-t border-border">
          <div className="max-w-3xl mx-auto relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-orange-500 p-8 md:p-14 flex flex-col items-center text-center shadow-2xl">
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
            <span className="relative z-10 text-white/90 tracking-widest text-xs font-semibold uppercase mb-3">
              Bắt đầu ngay hôm nay
            </span>
            <h2 className="relative z-10 font-display text-4xl md:text-5xl font-extrabold text-white mb-8">
              SWIPE & MATCH
            </h2>
            <Link
              to="/auth"
              className="relative z-10 flex items-center justify-center gap-2 bg-white text-primary px-8 py-3 rounded-xl hover:bg-gray-100 transition-colors font-semibold text-base group shadow-lg"
            >
              Khám Phá Trong App
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
