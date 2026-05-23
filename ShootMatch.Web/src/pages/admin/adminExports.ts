import type { AxiosResponse } from "axios";

function parseFileName(contentDisposition: string | undefined, fallback: string) {
  if (!contentDisposition) return fallback;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/"/g, ""));
  }

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1];
  }

  return fallback;
}

export function downloadAdminReport(response: AxiosResponse<Blob>, fallbackFileName: string) {
  const fileName = parseFileName(response.headers["content-disposition"], fallbackFileName);
  const contentType = String(response.headers["content-type"] ?? "application/octet-stream");
  const blob = new Blob([response.data], { type: contentType });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
