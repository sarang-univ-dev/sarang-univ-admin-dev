import { ShuttleBusPassengersPageClient } from "@/components/features/shuttle-bus-passengers/ShuttleBusPassengersPageClient";

interface PageProps {
  params: Promise<{
    retreatSlug: string;
  }>;
}

export default async function ShuttleBusPassengersPage({
  params,
}: PageProps) {
  const { retreatSlug } = await params;

  return (
    <div className="p-6">
      <ShuttleBusPassengersPageClient retreatSlug={retreatSlug} />
    </div>
  );
}
