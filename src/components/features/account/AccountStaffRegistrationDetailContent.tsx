import { InfoSection, InfoItem } from "@/components/common/detail-sidebar";
import { AccountStaffTableData } from "@/hooks/account/use-account-staff-columns";
import { GenderBadge, StatusBadge, TypeBadge } from "@/components/Badge";
import { formatDate } from "@/utils/formatDate";

interface AccountStaffRegistrationDetailContentProps {
  data: AccountStaffTableData;
}

export function AccountStaffRegistrationDetailContent({
  data,
}: AccountStaffRegistrationDetailContentProps) {
  return (
    <>
      {/* 기본 정보 */}
      <InfoSection title="기본 정보">
        <InfoItem label="이름" value={data.name} />
        <InfoItem label="부서" value={data.department} />
        <InfoItem label="학년" value={data.grade} />
        <InfoItem label="성별" value={<GenderBadge gender={data.gender as any} />} />
        <InfoItem label="전화번호" value={data.phoneNumber} />
      </InfoSection>

      {/* 신청 정보 */}
      <InfoSection title="신청 정보">
        <InfoItem
          label="신청시각"
          value={formatDate(data.createdAt)}
        />
        <InfoItem
          label="타입"
          value={data.type ? <TypeBadge type={data.type as any} /> : "-"}
        />
        <InfoItem
          label="금액"
          value={`${data.amount?.toLocaleString()}원`}
        />
        <InfoItem
          label="입금 현황"
          value={<StatusBadge status={data.status as any} />}
        />
      </InfoSection>

      {/* 처리 정보 */}
      <InfoSection title="처리 정보">
        <InfoItem label="처리자명" value={data.confirmedBy} />
        <InfoItem
          label="처리시각"
          value={formatDate(data.paymentConfirmedAt)}
        />
      </InfoSection>

      {/* 재정간사 메모 */}
      {data.accountMemo && (
        <InfoSection title="재정간사 메모">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{data.accountMemo}</p>
          </div>
        </InfoSection>
      )}
    </>
  );
}
