import { redirect } from 'next/navigation';

export default async function SkutecnostProdejeRedirect({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  redirect(`/projekty/${projectId}/prijmy`);
}
