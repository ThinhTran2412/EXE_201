import { Link } from "react-router-dom";
import { Camera, ChevronRight, Shield, UserRound, WandSparkles } from "lucide-react";

const cards = [
  {
    title: "Khách hàng",
    description: "Đăng nhập bằng OTP, email/mật khẩu hoặc Google để khám phá, match và đặt lịch.",
    to: "/auth/customer",
    icon: UserRound,
    tone: "from-orange-500 to-amber-400",
  },
  {
    title: "Nhiếp ảnh gia",
    description: "Đăng nhập để quản lý hồ sơ, lịch chụp và trao đổi với khách hàng.",
    to: "/auth/photographer",
    icon: Camera,
    tone: "from-slate-900 to-slate-700",
  },
  {
    title: "Quản trị viên",
    description: "Đi vào khu vực quản trị để theo dõi người dùng, booking và giao dịch.",
    to: "/admin/login",
    icon: Shield,
    tone: "from-rose-600 to-orange-600",
  },
];

export default function AuthHub() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(245,242,235,1)_45%,_rgba(229,91,40,0.08)_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-12">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
          <WandSparkles className="h-5 w-5 text-orange-500" />
          ShootMatch Auth
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-orange-600 shadow-sm">
              Đồng bộ với mobile
            </p>
            <h1 className="max-w-2xl text-4xl font-black uppercase leading-tight md:text-6xl">
              Chọn đúng vai trò để vào đúng luồng xác thực.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              Web giờ dùng cùng mô hình session với backend và mobile: access token, refresh token, role và route guard
              theo quyền.
            </p>
          </div>

          <div className="grid gap-4">
            {cards.map((card) => (
              <Link
                key={card.to}
                to={card.to}
                className="group rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.14)]"
              >
                <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${card.tone} p-3 text-white shadow-lg`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{card.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-500" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
