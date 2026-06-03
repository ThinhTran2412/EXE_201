import axios from 'axios';

/** Trích thông báo lỗi từ axios / fetch để hiển thị cho người dùng. */
export function parseApiError(err: unknown, fallback = 'Đã xảy ra lỗi.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string; title?: string } | undefined;
    const msg = data?.error ?? data?.message ?? data?.title;
    if (msg) return msg;
    if (err.response?.status === 401) return 'Phiên đăng nhập hết hạn. Đăng nhập lại.';
    if (err.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (err.response?.status === 404) return 'Không tìm thấy tài nguyên trên server.';
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
