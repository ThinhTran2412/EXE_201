import { Camera, LogIn } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer text-textMain">
          <Camera className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold tracking-tight">Pickic</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#features" className="hover:text-primary transition-colors">
            Tính năng
          </a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">
            Cách hoạt động
          </a>
          <a href="#showcase" className="hover:text-primary transition-colors">
            Portfolio
          </a>
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="/admin/login"
            className="hidden sm:inline-flex items-center justify-center gap-2 rounded-full bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 text-sm font-medium shadow transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden md:inline">Admin</span>
          </a>
          <a
            href="#download"
            className="hidden md:inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-primary/90 transition-all font-semibold"
          >
            Tải App Ngay
          </a>
        </div>
      </div>
    </header>
  );
}
