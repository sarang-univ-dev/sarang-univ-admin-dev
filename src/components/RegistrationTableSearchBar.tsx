"use client";

import { useState, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { debounce } from "lodash";

interface SearchBarProps {
  onSearch: (results: any[], searchTerm: string) => void;
  data: any[];
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  data,
  placeholder = "이름, 부서, 학년, 타입으로 검색...",
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // 검색어 변경 시 데이터 필터링
  const debouncedSearch = useRef(
    debounce((term: string, currentData: any[]) => {
      if (!term.trim()) {
        onSearch(currentData, term);
        return;
      }

      const lowercasedTerm = term.toLowerCase();
      const filtered = currentData.filter(
        item =>
          (item.name && item.name.toLowerCase().includes(lowercasedTerm)) ||
          (item.department &&
            item.department.toLowerCase().includes(lowercasedTerm)) ||
          (item.grade &&
            item.grade.toString().toLowerCase().includes(lowercasedTerm)) ||
          (item.type && item.type.toLowerCase().includes(lowercasedTerm))
      );

      onSearch(filtered, term);
    }, 300)
  ).current;

  // 검색어 변경 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term, data);
  };

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
      <Input
        placeholder={placeholder}
        className="pl-8 pr-4 py-2 border-gray-200 focus:border-gray-300 focus:ring-0"
        value={searchTerm}
        onChange={handleSearchChange}
      />
    </div>
  );
}
