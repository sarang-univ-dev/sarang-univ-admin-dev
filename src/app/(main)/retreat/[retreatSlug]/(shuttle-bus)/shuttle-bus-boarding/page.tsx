import { BoardingStaffMobilePageClient } from "@/components/features/shuttle-bus-boarding/BoardingStaffMobilePageClient";

interface PageProps {
  params: Promise<{
    retreatSlug: string;
  }>;
}

export default async function ShuttleBusBoardingPage({ params }: PageProps) {
  const { retreatSlug } = await params;

  return <BoardingStaffMobilePageClient retreatSlug={retreatSlug} />;
}
