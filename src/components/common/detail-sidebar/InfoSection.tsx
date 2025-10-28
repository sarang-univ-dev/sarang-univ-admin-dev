import { cn } from "@/lib/utils/utils";

interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function InfoSection({ title, children, className }: InfoSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-base font-semibold text-gray-900 pb-2 border-b">
        {title}
      </h3>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}
