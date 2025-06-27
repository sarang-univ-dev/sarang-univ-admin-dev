import React, { memo, useCallback, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

interface OptimizedTextareaProps {
  rowId: string;
  value: string;
  onValueChange: (id: string, value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const OptimizedTextarea = memo<OptimizedTextareaProps>(({
  rowId,
  value,
  onValueChange,
  placeholder = "",
  className = "",
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onValueChange(rowId, newValue);
    
    // 자동 높이 조절
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [rowId, onValueChange]);

  // 초기 높이 설정
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      style={{
        minHeight: "60px",
        maxHeight: "200px",
        resize: "none",
        overflow: "hidden",
      }}
    />
  );
});

OptimizedTextarea.displayName = 'OptimizedTextarea';

export { OptimizedTextarea }; 