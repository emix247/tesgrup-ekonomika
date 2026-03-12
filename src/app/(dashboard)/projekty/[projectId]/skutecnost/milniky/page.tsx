import { redirect } from 'next/navigation';

export default async function SkutecnostMilnikyRedirect({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  redirect(`/projekty/${projectId}/milniky`);
}
