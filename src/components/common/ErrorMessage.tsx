import { AlertTriangle } from "lucide-react";

interface Props {
  message: string;
}

const ErrorMessage = ({message}:Props) => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <AlertTriangle className="text-red-500 w-6 h-6 mr-2" />
      <span className="text-red-600 text-sm">
        {message}
      </span>
    </div>
  );
};

export default ErrorMessage;
