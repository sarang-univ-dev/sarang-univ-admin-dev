import { cn } from "@/lib/utils/utils";

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  labelClassName?: string;
  valueClassName?: string;
}

export function InfoItem({
  label,
  value,
  labelClassName,
  valueClassName,
}: InfoItemProps) {
  return (
    <div className="flex items-center py-2">
      <dt className={cn(
        "text-sm font-medium text-gray-500 w-32 flex-shrink-0",
        labelClassName
      )}>
        {label}
      </dt>
      <dd className={cn("text-sm text-gray-900 flex-1", valueClassName)}>
        {value || "-"}
      </dd>
    </div>
  );
}
