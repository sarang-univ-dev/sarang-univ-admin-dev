import { AlertTriangle } from "lucide-react";

const ErrorMessage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <AlertTriangle className="text-red-500 w-6 h-6 mr-2" />
      <span className="text-red-600 text-sm">
        로그인 중 오류가 발생했습니다.
      </span>
    </div>
  );
};

export default ErrorMessage;
