"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useGbsLineupManagement } from "@/hooks/gbs-lineup";

interface GbsCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retreatSlug: string;
}

export function GbsCreateModal({
  open,
  onOpenChange,
  retreatSlug,
}: GbsCreateModalProps) {
  const { createGbsGroups } = useGbsLineupManagement(retreatSlug);

  const [multiCreate, setMultiCreate] = useState(false);
  const [gbsNumbers, setGbsNumbers] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      await createGbsGroups(gbsNumbers);
      onOpenChange(false);
      setGbsNumbers([""]);
      setMultiCreate(false);
    } catch (error) {
      // 에러는 훅에서 처리됨
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setGbsNumbers([""]);
    setMultiCreate(false);
  };

  const isValid = multiCreate
    ? gbsNumbers[0]?.trim() && gbsNumbers[1]?.trim()
    : gbsNumbers[0]?.trim();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>GBS 생성</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={multiCreate}
              onCheckedChange={(val) => {
                setMultiCreate(!!val);
                if (!val) {
                  setGbsNumbers([gbsNumbers[0] || ""]);
                }
              }}
              id="multiCreate"
            />
            <Label htmlFor="multiCreate" className="select-none cursor-pointer">
              여러개 생성 (범위)
            </Label>
          </div>

          {multiCreate ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                placeholder="시작 번호"
                value={gbsNumbers[0] || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setGbsNumbers([value, gbsNumbers[1] || ""]);
                }}
              />
              <span className="mx-1 text-muted-foreground">~</span>
              <Input
                type="number"
                min={1}
                placeholder="끝 번호"
                value={gbsNumbers[1] || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setGbsNumbers([gbsNumbers[0] || "", value]);
                }}
              />
            </div>
          ) : (
            <Input
              type="number"
              min={1}
              placeholder="GBS 번호"
              value={gbsNumbers[0] || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setGbsNumbers([value]);
              }}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button onClick={handleCreate} disabled={!isValid || isLoading}>
            {isLoading ? "생성 중..." : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
