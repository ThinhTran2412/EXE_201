import { useEffect, useState } from "react";
import { ImagePlus, Save, X } from "lucide-react";
import { api } from "../../lib/api";
import type { AdminCustomer, AdminPhotographer } from "./adminData";

export type EditUserTarget =
  | { kind: "customer"; user: AdminCustomer }
  | { kind: "photographer"; user: AdminPhotographer };

interface EditUserModalProps {
  open: boolean;
  target: EditUserTarget | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

interface FormState {
  displayName: string;
  email: string;
  phone: string;
  region: string;
}

function buildUploadEndpoint(target: EditUserTarget, kind: "avatar" | "cover") {
  return target.kind === "customer"
    ? `/admin/customers/${target.user.id}/${kind}/upload`
    : `/admin/photographers/${target.user.id}/${kind}/upload`;
}

function buildUpdateEndpoint(target: EditUserTarget) {
  return target.kind === "customer" ? `/admin/customers/${target.user.id}` : `/admin/photographers/${target.user.id}`;
}

async function uploadPhoto(target: EditUserTarget, kind: "avatar" | "cover", file: File) {
  const formData = new FormData();
  formData.append("File", file);

  const response = await api.post(buildUploadEndpoint(target, kind), formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return typeof response.data?.photoUrl === "string" ? response.data.photoUrl : "";
}

export default function EditUserModal({ open, target, onClose, onSaved }: EditUserModalProps) {
  const [form, setForm] = useState<FormState>({
    displayName: "",
    email: "",
    phone: "",
    region: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !target) return;

    setForm({
      displayName: target.user.displayName ?? "",
      email: target.user.email ?? "",
      phone: target.user.phone ?? "",
      region: target.user.region ?? "",
    });
    setAvatarFile(null);
    setCoverFile(null);
    setError(null);
  }, [open, target]);

  if (!open || !target) return null;

  const currentAvatarUrl = target.user.avatarUrl ?? "";
  const currentCoverUrl = "coverPhotoUrl" in target.user ? (target.user.coverPhotoUrl ?? "") : "";

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const avatarUrl = avatarFile ? await uploadPhoto(target, "avatar", avatarFile) : undefined;
      const coverUrl = coverFile ? await uploadPhoto(target, "cover", coverFile) : undefined;

      const payload = {
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        region: form.region.trim(),
        ...(avatarUrl ? { avatarUrl } : {}),
        ...(coverUrl ? { coverPhotoUrl: coverUrl } : {}),
      };

      await api.put(buildUpdateEndpoint(target), payload);
      await onSaved();
      onClose();
    } catch (submitError) {
      console.error(submitError);
      setError("Không thể lưu thay đổi lúc này.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500 font-semibold">Chỉnh sửa</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-900">
              {target.kind === "customer" ? "Sửa khách hàng" : "Sửa nhiếp ảnh gia"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Tên hiển thị</span>
                <input
                  value={form.displayName}
                  onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#e65a28]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#e65a28]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Số điện thoại</span>
                <input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#e65a28]"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Khu vực</span>
                <input
                  value={form.region}
                  onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#e65a28]"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Ảnh đại diện</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                  className="block w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Ảnh bìa</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
                  className="block w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                />
              </label>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Ảnh hiện tại</div>
              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-2 text-sm font-semibold text-slate-700">Avatar</div>
                  {currentAvatarUrl ? (
                    <img
                      src={currentAvatarUrl}
                      alt="Avatar hiện tại"
                      className="h-32 w-full rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-2xl bg-white text-sm text-slate-400">
                      Chưa có ảnh
                    </div>
                  )}
                </div>
                <div>
                  <div className="mb-2 text-sm font-semibold text-slate-700">Cover</div>
                  {currentCoverUrl ? (
                    <img src={currentCoverUrl} alt="Cover hiện tại" className="h-32 w-full rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-2xl bg-white text-sm text-slate-400">
                      Chưa có ảnh
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e65a28] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#cf4028] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
              <ImagePlus size={16} />
              Upload ảnh trước khi lưu
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
