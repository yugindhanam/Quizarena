import Analytics from "@/components/analytics";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Analytics id={(await params).id} />;
}
