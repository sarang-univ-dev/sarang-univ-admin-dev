"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export interface FilterOption {
  id: string
  label: string
  type: "select" | "input" | "date"
  options?: { value: string; label: string }[]
  placeholder?: string
}

interface SearchBarProps {
  onSearch: (filters: Record<string, any>) => void
  filterOptions: FilterOption[]
  showResetButton?: boolean
}

export function SearchBar({ onSearch, filterOptions, showResetButton = true }: SearchBarProps) {
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  const handleFilterChange = (id: string, value: any) => {
    const newFilters = { ...filters, [id]: value }
    setFilters(newFilters)

    if (value && !activeFilters.includes(id)) {
      setActiveFilters([...activeFilters, id])
    } else if (!value && activeFilters.includes(id)) {
      setActiveFilters(activeFilters.filter((filterId) => filterId !== id))
    }
  }

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleReset = () => {
    setFilters({})
    setActiveFilters([])
    onSearch({})
  }

  const removeFilter = (id: string) => {
    const newFilters = { ...filters }
    delete newFilters[id]
    setFilters(newFilters)
    setActiveFilters(activeFilters.filter((filterId) => filterId !== id))
    onSearch(newFilters)
  }

  const getFilterOptionById = (id: string) => {
    return filterOptions.find((option) => option.id === id)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="이름으로 검색..."
              className="pl-8 pr-4 py-2 border-gray-200 focus:border-gray-300 focus:ring-0"
              value={filters["name"] || ""}
              onChange={(e) => handleFilterChange("name", e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="flex items-center gap-1 hover:bg-gray-100"
          >
            <Filter className="h-4 w-4" />
            <span>필터</span>
          </Button>

          <Button onClick={handleSearch} size="sm" className="bg-black text-white hover:bg-gray-800">
            검색
          </Button>

          {showResetButton && activeFilters.length > 0 && (
            <Button variant="ghost" onClick={handleReset} size="sm" className="text-gray-500 hover:text-gray-700">
              초기화
            </Button>
          )}
        </div>

        {isFilterExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
            {filterOptions
              .filter((option) => option.id !== "name")
              .map((option) => (
                <div key={option.id} className="w-full">
                  {option.type === "select" && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">{option.label}</label>
                      <Select
                        value={filters[option.id] || ""}
                        onValueChange={(value) => handleFilterChange(option.id, value)}
                      >
                        <SelectTrigger className="w-full border-gray-200">
                          <SelectValue placeholder={option.placeholder || option.label} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          {option.options?.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {option.type === "date" && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">{option.label}</label>
                      <Input
                        type="date"
                        className="w-full border-gray-200"
                        value={filters[option.id] || ""}
                        onChange={(e) => handleFilterChange(option.id, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((id) => {
            const option = getFilterOptionById(id)
            if (!option || id === "name") return null

            let displayValue = filters[id]
            if (option.type === "select") {
              const selectedOption = option.options?.find((opt) => opt.value === filters[id])
              displayValue = selectedOption?.label || filters[id]
            }

            return (
              <Badge
                key={id}
                variant="outline"
                className="px-2 py-1 bg-gray-50 text-gray-700 border-gray-200 font-normal"
              >
                {option.label}: {displayValue}
                <button onClick={() => removeFilter(id)} className="ml-1 rounded-full hover:bg-gray-200 p-1">
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove filter</span>
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
