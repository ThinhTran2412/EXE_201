/** Mã vùng — đồng bộ với ShootMatch.Domain.ValueObjects.Location */
export const REGIONS: Record<string, string> = {
  HN: 'Hà Nội',
  HCM: 'TP.HCM',
  DN: 'Đà Nẵng',
  HP: 'Hải Phòng',
  CT: 'Cần Thơ',
  OTHER: 'Tỉnh / thành khác',
};

export const REGION_OPTIONS = Object.entries(REGIONS).map(([code, label]) => ({
  code,
  label,
}));

export function formatRegion(code?: string | null): string {
  if (!code) return '';
  return REGIONS[code] ?? code;
}
