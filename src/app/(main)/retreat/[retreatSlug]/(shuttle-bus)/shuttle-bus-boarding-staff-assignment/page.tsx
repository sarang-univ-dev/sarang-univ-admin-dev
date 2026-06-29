import { BoardingStaffAssignmentPageClient } from "@/components/features/shuttle-bus-boarding-staff-assignment/BoardingStaffAssignmentPageClient";

interface PageProps {
  params: Promise<{
    retreatSlug: string;
  }>;
}

export default async function ShuttleBusBoardingStaffAssignmentPage({
  params,
}: PageProps) {
  const { retreatSlug } = await params;

  return (
    <div className="p-6">
      <BoardingStaffAssignmentPageClient retreatSlug={retreatSlug} />
    </div>
  );
}
