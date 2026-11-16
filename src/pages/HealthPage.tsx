import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, HeartPulse, Search, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { HealthRecord } from '../types';
import { HealthCharts } from '../components/HealthCharts';

export const HealthPage: React.FC = () => {
  const { user, updateProfile, language, t } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'vitals' | 'note'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Medical Info Form
  const [bloodGroup, setBloodGroup] = useState(user?.blood_group || '');
  const [allergies, setAllergies] = useState(user?.allergies || '');
  const [conditions, setConditions] = useState(user?.medical_conditions || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Record Modal Form
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recordType, setRecordType] = useState<'vitals' | 'note'>('vitals');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [sugarContext, setSugarContext] = useState<'fasting' | 'post_meal' | 'random'>('fasting');
  const [heartRate, setHeartRate] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [recordedAt, setRecordedAt] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBloodGroup(user?.blood_group || '');
    setAllergies(user?.allergies || '');
    setConditions(user?.medical_conditions || '');
  }, [user]);

  const loadRecords = async () => {
    try {
      const data = await apiFetch<{ records: HealthRecord[] }>('/api/health');
      setRecords(data.records);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const openNewModal = () => {
    setEditingId(null);
    setRecordType('vitals');
    setSystolic('');
    setDiastolic('');
    setBloodSugar('');
    setSugarContext('fasting');
    setHeartRate('');
    setWeightKg('');
    setTitle('');
    setNotes('');
    const nowLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setRecordedAt(nowLocal);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (rec: HealthRecord) => {
    setEditingId(rec.id);
    setRecordType(rec.record_type);
    setSystolic(rec.systolic !== null ? String(rec.systolic) : '');
    setDiastolic(rec.diastolic !== null ? String(rec.diastolic) : '');
    setBloodSugar(rec.blood_sugar !== null ? String(rec.blood_sugar) : '');
    setSugarContext(rec.sugar_context || 'fasting');
    setHeartRate(rec.heart_rate !== null ? String(rec.heart_rate) : '');
    setWeightKg(rec.weight_kg !== null ? String(rec.weight_kg) : '');
    setTitle(rec.title || '');
    setNotes(rec.notes || '');
    const d = new Date(rec.recorded_at);
    const localStr = !Number.isNaN(d.getTime())
      ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : '';
    setRecordedAt(localStr);
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        record_type: recordType,
        systolic: systolic ? Number(systolic) : null,
        diastolic: diastolic ? Number(diastolic) : null,
        blood_sugar: bloodSugar ? Number(bloodSugar) : null,
        sugar_context: sugarContext,
        heart_rate: heartRate ? Number(heartRate) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        title,
        notes,
        recorded_at: recordedAt ? new Date(recordedAt).toISOString() : new Date().toISOString(),
      };

      if (editingId) {
        await apiFetch(`/api/health/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/health', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      await loadRecords();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save health record.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/health/${id}`, { method: 'DELETE' });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveMedicalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      blood_group: bloodGroup,
      allergies,
      medical_conditions: conditions,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterType !== 'all' && r.record_type !== filterType) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.notes.toLowerCase().includes(q) ||
        String(r.systolic || '').includes(q) ||
        String(r.blood_sugar || '').includes(q)
      );
    });
  }, [records, filterType, searchQuery]);

  const locale = language === 'ml' ? 'ml-IN' : 'en-US';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#14274E]">
            {t.health.title}
          </h1>
          <p className="mt-1 text-base sm:text-lg text-[#4A5568]">{t.health.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#14274E] text-white font-bold text-base hover:bg-[#0E1C38] transition-colors min-h-[50px] shrink-0 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span>{t.health.addRecord}</span>
        </button>
      </div>

      {/* Medical Profile Information */}
      <section className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-7">
        <h2 className="font-display text-xl font-bold text-[#14274E] mb-4">
          {t.health.medicalProfileTitle}
        </h2>
        <form onSubmit={handleSaveMedicalInfo} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="med-blood-group" className="block text-sm font-semibold text-[#14274E] mb-1.5">
              {t.health.bloodGroup}
            </label>
            <input
              id="med-blood-group"
              type="text"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              placeholder="e.g. O+"
              className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-base"
            />
          </div>
          <div>
            <label htmlFor="med-allergies" className="block text-sm font-semibold text-[#14274E] mb-1.5">
              {t.health.allergies}
            </label>
            <input
              id="med-allergies"
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-base"
            />
          </div>
          <div>
            <label htmlFor="med-conditions" className="block text-sm font-semibold text-[#14274E] mb-1.5">
              {t.health.conditions}
            </label>
            <input
              id="med-conditions"
              type="text"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-base"
            />
          </div>
          <div className="md:col-span-3 flex items-center gap-4">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#D49425] text-[#0E1C38] font-bold text-base hover:bg-[#c2841b] min-h-[44px]"
            >
              {t.health.saveProfile}
            </button>
            {profileSaved && (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2F855A]">
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>{t.settings.saveSuccess}</span>
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Interactive Health Charts */}
      {records.length > 0 && <HealthCharts records={records} />}

      {/* Detailed History Section */}
      <section className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-7 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#14274E]">
            {t.health.historyTitle}
          </h2>

          {records.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#4A5568] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-9 pr-4 py-2 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-sm min-h-[40px]"
                />
              </div>
              <div className="inline-flex p-1 rounded-xl bg-[#FAF7F2] border border-[#E6DFD3]">
                {(
                  [
                    { id: 'all', label: t.health.allFilter },
                    { id: 'vitals', label: t.health.vitalsFilter },
                    { id: 'note', label: t.health.notesFilter },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterType(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                      filterType === f.id
                        ? 'bg-[#14274E] text-white'
                        : 'text-[#4A5568]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-10 text-center text-[#4A5568]">...</div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl bg-[#EEF4FD] border border-[#E6DFD3] p-10 text-center space-y-4">
            <HeartPulse className="w-12 h-12 text-[#14274E] mx-auto" aria-hidden="true" />
            <h3 className="font-display text-xl font-bold text-[#14274E]">
              {t.health.emptyState}
            </h3>
            <p className="text-base text-[#4A5568] max-w-md mx-auto">
              {t.health.emptySub}
            </p>
            <button
              type="button"
              onClick={openNewModal}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#14274E] text-white font-bold text-base min-h-[48px]"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              <span>{t.health.logFirst}</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E6DFD3]">
            {filteredRecords.map((rec) => (
              <div
                key={rec.id}
                className="py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[#4A5568] font-numeric">
                    <span>
                      {new Date(rec.recorded_at).toLocaleString(locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    {rec.title && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-sans font-bold text-[#14274E]">{rec.title}</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-5 pt-1">
                    {rec.systolic !== null && rec.diastolic !== null && (
                      <div className="font-numeric text-lg font-bold text-[#14274E]">
                        BP: {rec.systolic}/{rec.diastolic}{' '}
                        <span className="text-xs font-sans font-normal text-[#4A5568]">mmHg</span>
                      </div>
                    )}
                    {rec.blood_sugar !== null && (
                      <div className="font-numeric text-lg font-bold text-[#0E7490]">
                        Sugar: {rec.blood_sugar}{' '}
                        <span className="text-xs font-sans font-normal text-[#4A5568]">
                          mg/dL ({rec.sugar_context})
                        </span>
                      </div>
                    )}
                    {rec.heart_rate !== null && (
                      <div className="font-numeric text-lg font-bold text-[#9B2C2C]">
                        HR: {rec.heart_rate}{' '}
                        <span className="text-xs font-sans font-normal text-[#4A5568]">bpm</span>
                      </div>
                    )}
                    {rec.weight_kg !== null && (
                      <div className="font-numeric text-lg font-bold text-[#2F855A]">
                        Weight: {rec.weight_kg}{' '}
                        <span className="text-xs font-sans font-normal text-[#4A5568]">kg</span>
                      </div>
                    )}
                  </div>

                  {rec.notes && <p className="text-base text-[#4A5568]">{rec.notes}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(rec)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E6DFD3] text-sm font-bold text-[#14274E] hover:bg-[#EEF4FD] min-h-[42px]"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                    <span>{t.health.edit}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(rec.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FDF0F0] text-sm font-bold text-[#9B2C2C] hover:bg-[#fbdcdc] min-h-[42px]"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>{t.health.delete}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Record Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="ee-card bg-white rounded-3xl border border-[#E6DFD3] max-w-xl w-full p-6 sm:p-8 space-y-5 my-8">
            <h2 className="font-display text-2xl font-bold text-[#14274E]">
              {editingId ? t.health.editRecord : t.health.addRecord}
            </h2>

            {formError && (
              <div className="p-3 rounded-xl bg-[#FDF0F0] text-[#9B2C2C] text-sm font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveRecord} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#14274E] mb-1">
                    {t.health.systolic}
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={280}
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    placeholder="e.g. 120"
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] font-numeric"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14274E] mb-1">
                    {t.health.diastolic}
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={180}
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    placeholder="e.g. 80"
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] font-numeric"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14274E] mb-1">
                    {t.health.bloodSugar}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={20}
                    max={600}
                    value={bloodSugar}
                    onChange={(e) => setBloodSugar(e.target.value)}
                    placeholder="e.g. 105"
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] font-numeric"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14274E] mb-1">
                    {t.health.sugarContext}
                  </label>
                  <select
                    value={sugarContext}
                    onChange={(e) =>
                      setSugarContext(e.target.value as 'fasting' | 'post_meal' | 'random')
                    }
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
                  >
                    <option value="fasting">{t.health.fasting}</option>
                    <option value="post_meal">{t.health.postMeal}</option>
                    <option value="random">{t.health.random}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14274E] mb-1">
                    {t.health.heartRate}
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={220}
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="e.g. 72"
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] font-numeric"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14274E] mb-1">
                    {t.health.weightKg}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={20}
                    max={250}
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="e.g. 64.5"
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] font-numeric"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#14274E] mb-1">
                    {t.health.recordTitle}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14274E] mb-1">
                    {t.health.recordedAt}
                  </label>
                  <input
                    type="datetime-local"
                    value={recordedAt}
                    onChange={(e) => setRecordedAt(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] font-numeric"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#14274E] mb-1">
                  {t.health.notes}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-[#E6DFD3] font-bold text-[#14274E] min-h-[48px]"
                >
                  {t.health.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-[#14274E] text-white font-bold min-h-[48px]"
                >
                  {saving ? '...' : t.health.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
