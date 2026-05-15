"use client";

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
    placeholder: "3333-00-1234567 카카오뱅크",
  },
  {
    key: "depositAccountHolder",
    label: "수양회 입금주",
    placeholder: "홍길동",
  },
  {
    key: "shuttleBusDepositAccount",
    label: "셔틀버스 입금 계좌",
    placeholder: "3333-00-1234567 카카오뱅크",
  },
  {
    key: "shuttleBusDepositAccountHolder",
    label: "셔틀버스 입금주",
    placeholder: "홍길동",
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
}: {
  univGroups: AdminUnivGroup[];
  informationByUnivGroupId: Record<number, RetreatUnivGroupInformation>;
  onChange: (
    univGroupId: number,
    field: OperationInfoField,
    value: string
  ) => void;
}) {
  if (univGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
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
