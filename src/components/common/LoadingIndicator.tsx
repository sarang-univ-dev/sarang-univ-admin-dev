"use client";

import { Loader2 } from "lucide-react";

const LoadingIndicator = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="ml-2 text-gray-700">로딩 중입니다...</span>
    </div>
  );
};

export default LoadingIndicator;
