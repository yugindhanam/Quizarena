import Exam from "@/components/exam";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Exam id={(await params).id} />;
}
