import { redirect } from 'next/navigation';

export default async function SkutecnostCerpaniRedirect({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  redirect(`/projekty/${projectId}/financovani`);
}
