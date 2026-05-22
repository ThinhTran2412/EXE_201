
export default function Footer() {
    return (
        <footer className="w-full bg-[#1c1917] text-stone-300 py-12 md:py-16">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                    <span className="text-2xl font-bold text-white mb-4 block">Pickic</span>
                    <p className="max-w-xs text-sm text-stone-400">
                        Nền tảng kết nối Nhiếp ảnh gia và Khách hàng số 1 Việt Nam. Pick đúng người, pick đúng khoảnh khắc.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <h4 className="text-white font-semibold mb-2">Về chúng tôi</h4>
                    <a href="#" className="text-sm hover:text-white transition-colors">Giới thiệu</a>
                    <a href="#" className="text-sm hover:text-white transition-colors">Liên hệ</a>
                    <a href="#" className="text-sm hover:text-white transition-colors">Quy chế hoạt động</a>
                </div>

                <div className="flex flex-col gap-3">
                    <h4 className="text-white font-semibold mb-2">Pháp lý</h4>
                    <a href="#" className="text-sm hover:text-white transition-colors">Điều khoản dịch vụ</a>
                    <a href="#" className="text-sm hover:text-white transition-colors">Chính sách bảo mật</a>
                    <a href="#" className="text-sm hover:text-white transition-colors">Giải quyết khiếu nại</a>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-12 pt-8 border-t border-stone-800 text-sm text-stone-500 text-center">
                © 2026 Pickic (ShootMatch). All rights reserved.
            </div>
        </footer>
    );
}
