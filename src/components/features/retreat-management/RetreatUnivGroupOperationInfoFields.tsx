"use client";

import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  AdminUnivGroup,
  RetreatUnivGroupInformation,
} from "@/types/retreat-create";

type OperationInfoField = keyof RetreatUnivGroupInformation;

const operationInfoFields: {
  key: OperationInfoField;
  label: string;
  placeholder: string;
}[] = [
  {
    key: "adminStaffName",
    label: "행정간사 이름",
    placeholder: "홍길동",
  },
  {
    key: "adminStaffPhoneNumber",
    label: "행정간사 전화번호",
    placeholder: "010-0000-0000",
  },
  {
    key: "depositAccount",
    label: "수양회 입금 계좌",
    placeholder: "은행 000-0000-0000",
  },
  {
    key: "depositAccountHolder",
    label: "수양회 입금주",
    placeholder: "사랑의교회",
  },
  {
    key: "shuttleBusDepositAccount",
    label: "셔틀버스 입금 계좌",
    placeholder: "은행 000-0000-0000",
  },
  {
    key: "shuttleBusDepositAccountHolder",
    label: "셔틀버스 입금주",
    placeholder: "사랑의교회",
  },
];

export function createEmptyRetreatUnivGroupInformation(): RetreatUnivGroupInformation {
  return {
    adminStaffName: "",
    adminStaffPhoneNumber: "",
    depositAccount: "",
    depositAccountHolder: "",
    shuttleBusDepositAccount: "",
    shuttleBusDepositAccountHolder: "",
  };
}

export function RetreatUnivGroupOperationInfoFields({
  univGroups,
  informationByUnivGroupId,
  onChange,
  onApplyFirstToAll,
}: {
  univGroups: AdminUnivGroup[];
  informationByUnivGroupId: Record<number, RetreatUnivGroupInformation>;
  onChange: (
    univGroupId: number,
    field: OperationInfoField,
    value: string
  ) => void;
  onApplyFirstToAll?: () => void;
}) {
  if (univGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {onApplyFirstToAll && univGroups.length > 1 && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onApplyFirstToAll}>
            <Copy className="h-4 w-4" />첫 부서 정보 전체 적용
          </Button>
        </div>
      )}

      {univGroups.map(univGroup => {
        const information =
          informationByUnivGroupId[univGroup.id] ??
          createEmptyRetreatUnivGroupInformation();

        return (
          <div key={univGroup.id} className="space-y-4 rounded-md border p-4">
            <div>
              <h3 className="text-base font-semibold">
                {univGroup.number}부 {univGroup.name}
              </h3>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {operationInfoFields.map(field => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Input
                    value={information[field.key]}
                    placeholder={field.placeholder}
                    onChange={event =>
                      onChange(univGroup.id, field.key, event.target.value)
                    }
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
