'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MILESTONE_STATUSES } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/format';

interface Milestone {
  id: string;
  name: string;
  plannedDate: string | null;
  actualDate: string | null;
  status: string;
  sortOrder: number | null;
}

interface Props {
  projectId: string;
  initialMilestones: Milestone[];
}

const STATUS_COLORS: Record<string, string> = {
  ceka: 'bg-gray-100 text-gray-700',
  probiha: 'bg-blue-50 text-blue-700',
  splneno: 'bg-emerald-50 text-emerald-700',
  zpozdeno: 'bg-red-50 text-red-700',
};

export default function MilnikyClient({ projectId, initialMilestones }: Props) {
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>(
    [...initialMilestones].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    plannedDate: '',
    actualDate: '',
    status: 'ceka',
  });

  const completed = milestones.filter(m => m.status === 'splneno').length;
  const delayed = milestones.filter(m => m.status === 'zpozdeno').length;

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/projekty/${projectId}/milniky`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        plannedDate: form.plannedDate || undefined,
        actualDate: form.actualDate || undefined,
        status: form.status,
        sortOrder: milestones.length,
      }),
    });
    if (res.ok) {
      const m = await res.json();
      setMilestones([...milestones, m]);
      setForm({ name: '', plannedDate: '', actualDate: '', status: 'ceka' });
      setShowForm(false);
      router.refresh();
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/projekty/${projectId}/milniky`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status,
        actualDate: status === 'splneno' ? new Date().toISOString().split('T')[0] : undefined,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMilestones(milestones.map(m => m.id === id ? updated : m));
      router.refresh();
    }
  }

  async function deleteMilestone(id: string) {
    await fetch(`/api/projekty/${projectId}/milniky?id=${id}`, { method: 'DELETE' });
    setMilestones(milestones.filter(m => m.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Celkem milníků</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{milestones.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Splněno</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{completed}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Zpožděno</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{delayed}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm text-gray-500">Průběh</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {milestones.length > 0 ? `${Math.round((completed / milestones.length) * 100)} %` : '—'}
          </div>
        </div>
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
        >
          {showForm ? 'Zrušit' : '+ Přidat milník'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={addMilestone} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Nový milník</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Název milníku</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="např. Stavební povolení"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stav</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {Object.entries(MILESTONE_STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plánované datum</label>
              <input
                type="date"
                value={form.plannedDate}
                onChange={e => setForm({ ...form, plannedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skutečné datum</label>
              <input
                type="date"
                value={form.actualDate}
                onChange={e => setForm({ ...form, actualDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
          <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700">
            Přidat milník
          </button>
        </form>
      )}

      {/* Timeline */}
      {milestones.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          Zatím žádné milníky.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-4">
            {milestones.map((m, i) => {
              const isLate = m.status !== 'splneno' && m.plannedDate && new Date(m.plannedDate) < new Date();
              return (
                <div key={m.id} className="flex items-start gap-4">
                  {/* Timeline dot & line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-1.5 ${
                      m.status === 'splneno' ? 'bg-emerald-500' :
                      m.status === 'zpozdeno' || isLate ? 'bg-red-500' :
                      m.status === 'probiha' ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                    {i < milestones.length - 1 && (
                      <div className="w-px h-8 bg-gray-200 mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex items-center justify-between pb-4">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{m.name}</div>
                      <div className="flex items-center gap-3 mt-1">
                        {m.plannedDate && (
                          <span className="text-xs text-gray-500">Plán: {formatDate(m.plannedDate)}</span>
                        )}
                        {m.actualDate && (
                          <span className="text-xs text-gray-500">Skutečnost: {formatDate(m.actualDate)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={m.status}
                        onChange={e => updateStatus(m.id, e.target.value)}
                        className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${STATUS_COLORS[m.status] || STATUS_COLORS.ceka}`}
                      >
                        {Object.entries(MILESTONE_STATUSES).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <button onClick={() => deleteMilestone(m.id)} className="text-xs text-gray-400 hover:text-red-600">
                        Smazat
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
