import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Textarea } from "@/components/ui/textarea";

interface OptimizedTextareaProps {
  rowId: string;
  value: string;
  onValueChange: (id: string, value: string) => void;
  placeholder: string;
  className: string;
  disabled: boolean;
}

export const OptimizedTextarea = memo<OptimizedTextareaProps>(({ 
  rowId, 
  value, 
  onValueChange, 
  placeholder, 
  className, 
  disabled 
}) => {
  const [localValue, setLocalValue] = useState(value);

  // value prop이 변경되면 로컬 상태도 업데이트
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue); // 즉시 UI 업데이트
    onValueChange(rowId, newValue); // debounced 상태 업데이트
  }, [rowId, onValueChange]);

  const textareaStyle = useMemo(() => ({
    height: Math.max(
      60,
      Math.min(
        200,
        localValue.split("\n").length * 20 + 20
      )
    ) + "px",
  }), [localValue]);

  const rows = useMemo(() => Math.max(
    3,
    Math.min(10, localValue.split("\n").length + 1)
  ), [localValue]);

  return (
    <Textarea
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      style={textareaStyle}
      disabled={disabled}
      rows={rows}
    />
  );
});

OptimizedTextarea.displayName = 'OptimizedTextarea'; 