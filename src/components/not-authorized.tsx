import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft } from "lucide-react";

function NotAuthorizedComponentInner() {
  const goBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-destructive mb-4">
        <ShieldAlert size={64} />
      </div>
      <h1 className="text-4xl font-bold mb-2">Not Authorized</h1>
      <p className="text-xl mb-8 text-muted-foreground">
        해당 페이지에 대한 권한이 없습니다.
      </p>
      <Button onClick={goBack} variant="outline" className="flex items-center">
        <ArrowLeft className="mr-2 h-4 w-4" />
        이전 페이지로 돌아가기
      </Button>
    </div>
  );
}

export const NotAuthorizedComponent = dynamic(
  () => Promise.resolve(NotAuthorizedComponentInner),
  { ssr: false }
);

// TODO: fix ssr error related to window object
