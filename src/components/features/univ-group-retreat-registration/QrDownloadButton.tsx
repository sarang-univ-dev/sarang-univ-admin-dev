"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { webAxios } from "@/lib/api/axios";

interface QrDownloadButtonProps {
  retreatSlug: string;
  registrationId: string | number;
  userName: string;
}

function extractFileNameFromContentDisposition(
  contentDisposition: string | undefined,
  defaultName: string
): string {
  if (!contentDisposition) return defaultName;

  // RFC 5987 형식 (filename*=UTF-8''...) 먼저 시도
  const filenameStarMatch = contentDisposition.match(
    /filename\*=UTF-8''(.+?)(?:;|$)/i
  );
  if (filenameStarMatch) {
    return decodeURIComponent(filenameStarMatch[1]);
  }

  // 일반 filename 형식
  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
  if (filenameMatch) {
    return filenameMatch[1];
  }

  return defaultName;
}

export function QrDownloadButton({
  retreatSlug,
  registrationId,
  userName,
}: QrDownloadButtonProps) {
  const handleDownloadQR = async () => {
    try {
      const response = await webAxios.get(
        `/api/v1/retreat/${retreatSlug}/qr/${registrationId}/download`,
        { responseType: "blob" }
      );

      const fileName = extractFileNameFromContentDisposition(
        response.headers["content-disposition"],
        `QR_${userName}.png`
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("QR 다운로드 실패:", error);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleDownloadQR}>
      <Download className="h-4 w-4 mr-2" />
      QR 다운로드
    </Button>
  );
}
