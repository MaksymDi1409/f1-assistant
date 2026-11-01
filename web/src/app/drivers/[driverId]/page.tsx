import PageHeader from "@/components/PageHeader";

export default async function DriverPage({
  params,
}: PageProps<"/drivers/[driverId]">) {
  const { driverId } = await params;

  return <PageHeader title={`Пілот: ${driverId}`} />;
}