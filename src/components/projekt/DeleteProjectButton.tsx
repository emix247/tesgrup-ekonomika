'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    await fetch(`/api/projekty/${projectId}`, { method: 'DELETE' });
    router.refresh();
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <span className="text-xs text-gray-500">Smazat {projectName}?</span>
        <button onClick={handleDelete} className="text-xs text-red-600 hover:text-red-700 font-medium">Ano</button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">Ne</button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="text-xs text-gray-400 hover:text-red-600 transition-colors">
      Smazat
    </button>
  );
}
