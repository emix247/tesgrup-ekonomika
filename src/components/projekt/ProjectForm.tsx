'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROJECT_TYPES, PROJECT_STATUSES, LEGAL_FORMS } from '@/lib/utils/constants';
import type { Project } from '@/types/project';

interface ProjectFormProps {
  project?: Project;
}

// Exclude 'archivovano' from status dropdown — archiving is done via dedicated button
const EDITABLE_STATUSES = Object.entries(PROJECT_STATUSES).filter(([key]) => key !== 'archivovano');

export default function ProjectForm({ project }: ProjectFormProps) {
  const router = useRouter();
  const isEditing = !!project;
  const isArchived = project?.status === 'archivovano';

  const [form, setForm] = useState({
    name: project?.name || '',
    type: project?.type || '',
    location: project?.location || '',
    legalEntity: project?.legalEntity || '',
    legalForm: project?.legalForm || '',
    status: project?.status === 'archivovano' ? 'dokonceno' : (project?.status || 'priprava'),
    startDate: project?.startDate || '',
    endDate: project?.endDate || '',
    notes: project?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const url = isEditing ? `/api/projekty/${project.id}` : '/api/projekty';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.fieldErrors?.name?.[0] || 'Nepodařilo se uložit projekt');
      }
      const data = await res.json();
      router.push(`/projekty/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při ukládání');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!project) return;
    setArchiving(true);
    setError('');
    try {
      const newStatus = isArchived ? 'dokonceno' : 'archivovano';
      const res = await fetch(`/api/projekty/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Nepodařilo se archivovat projekt');
      router.push(isArchived ? `/projekty/${project.id}` : '/archiv');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba');
    } finally {
      setArchiving(false);
    }
  }

  async function handleDelete() {
    if (!project) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/projekty/${project.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Nepodařilo se smazat projekt');
      router.push('/portfolio');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chyba při mazání');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Základní informace</h2>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Název projektu *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="např. 19x RD Dubňany"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Typ projektu *
            </label>
            <select
              id="type"
              name="type"
              required
              value={form.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Vyberte typ</option>
              {Object.entries(PROJECT_TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Stav
            </label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              {EDITABLE_STATUSES.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Lokalita
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={form.location}
            onChange={handleChange}
            placeholder="např. Dubňany, okres Hodonín"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="legalEntity" className="block text-sm font-medium text-gray-700 mb-1">
              Právní subjekt
            </label>
            <input
              id="legalEntity"
              name="legalEntity"
              type="text"
              value={form.legalEntity}
              onChange={handleChange}
              placeholder="např. Tesgrup Development s.r.o."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="legalForm" className="block text-sm font-medium text-gray-700 mb-1">
              Právní forma
            </label>
            <select
              id="legalForm"
              name="legalForm"
              value={form.legalForm}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Nevybráno</option>
              {Object.entries(LEGAL_FORMS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Zahájení
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Ukončení (plán)
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Poznámky
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={form.notes}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Ukládám...' : isEditing ? 'Uložit změny' : 'Vytvořit projekt'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Zrušit
        </button>
      </div>

      {/* Archive & Delete section — only for existing projects */}
      {isEditing && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Správa projektu</h2>

          {/* Archive */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-amber-800">
                {isArchived ? 'Obnovit z archivu' : 'Archivovat projekt'}
              </h3>
              <p className="text-xs text-amber-600 mt-0.5">
                {isArchived
                  ? 'Projekt bude obnoven a přesunut zpět do aktivních projektů.'
                  : 'Projekt bude přesunut do archivu. Data zůstanou zachována a budou dostupná v sekci Archiv.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleArchive}
              disabled={archiving}
              className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {archiving ? 'Zpracovávám...' : isArchived ? 'Obnovit projekt' : 'Archivovat'}
            </button>
          </div>

          {/* Delete */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-red-800">Smazat projekt</h3>
              <p className="text-xs text-red-600 mt-0.5">
                Trvale smaže projekt a všechna související data. Tuto akci nelze vrátit zpět.
              </p>
            </div>
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Smazat projekt
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-700 font-medium">Opravdu smazat?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Mažu...' : 'Ano, smazat'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Ne
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
