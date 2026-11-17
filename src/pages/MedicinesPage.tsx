import React, { useEffect, useState } from 'react';
import { Plus, Pill, CheckCircle2, XCircle, Pencil, Trash2, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { MedicineLog, MedicineReminder } from '../types';

export const MedicinesPage: React.FC = () => {
  const { language, t } = useAuth();
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [logs, setLogs] = useState<MedicineLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  // Form Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [frequency, setFrequency] = useState('daily');
  const [instructions, setInstructions] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      const data = await apiFetch<{ reminders: MedicineReminder[]; logs: MedicineLog[] }>('/api/medicines');
      setReminders(data.reminders);
      setLogs(data.logs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const requestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifyPermission(perm);
  };

  const openAdd = () => {
    setEditingId(null);
    setMedicineName('');
    setDosage('');
    setScheduleTime('08:00');
    setFrequency('daily');
    setInstructions('');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (rem: MedicineReminder) => {
    setEditingId(rem.id);
    setMedicineName(rem.medicine_name);
    setDosage(rem.dosage);
    setScheduleTime(rem.schedule_time);
    setFrequency(rem.frequency);
    setInstructions(rem.instructions || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!medicineName.trim() || !dosage.trim() || !scheduleTime) {
      setFormError('Medicine name, dosage, and time are required.');
      return;
    }
    try {
      const payload = {
        medicine_name: medicineName.trim(),
        dosage: dosage.trim(),
        schedule_time: scheduleTime,
        frequency,
        instructions: instructions.trim(),
      };
      if (editingId) {
        await apiFetch(`/api/medicines/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/medicines', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save reminder.');
    }
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/medicines/${id}`, { method: 'DELETE' });
    setReminders((prev) => prev.filter((r) => r.id !== id));
    setLogs((prev) => prev.filter((l) => l.reminder_id !== id));
  };

  const handleLogDose = async (reminderId: string, status: 'taken' | 'skipped') => {
    const todayStr = new Date().toISOString().slice(0, 10);
    await apiFetch(`/api/medicines/${reminderId}/log`, {
      method: 'POST',
      body: JSON.stringify({ status, scheduled_for: todayStr }),
    });
    await loadData();
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const getTodayStatus = (reminderId: string): 'taken' | 'skipped' | null => {
    const match = logs.find((l) => l.reminder_id === reminderId && l.scheduled_for === todayStr);
    return match ? match.status : null;
  };

  const locale = language === 'ml' ? 'ml-IN' : 'en-US';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#14274E]">
            {t.medicines.title}
          </h1>
          <p className="mt-1 text-base sm:text-lg text-[#4A5568]">{t.medicines.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {notifyPermission !== 'unsupported' && (
            <button
              type="button"
              onClick={requestNotifications}
              className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl border text-sm font-bold min-h-[48px] ${
                notifyPermission === 'granted'
                  ? 'bg-[#EFF8F0] border-[#2F855A]/30 text-[#2F855A]'
                  : 'bg-white border-[#E6DFD3] text-[#14274E]'
              }`}
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              <span>
                {notifyPermission === 'granted' ? t.medicines.notifyEnabled : t.medicines.notifyBrowser}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#D49425] text-[#0E1C38] font-bold text-base hover:bg-[#c2841b] min-h-[50px]"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span>{t.medicines.addReminder}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex p-1.5 rounded-2xl bg-white border border-[#E6DFD3]">
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`px-5 py-2.5 rounded-xl text-base font-bold transition-colors ${
            activeTab === 'today' ? 'bg-[#14274E] text-white' : 'text-[#4A5568]'
          }`}
        >
          {t.medicines.todayTab}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 rounded-xl text-base font-bold transition-colors ${
            activeTab === 'history' ? 'bg-[#14274E] text-white' : 'text-[#4A5568]'
          }`}
        >
          {t.medicines.historyTab}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#4A5568]">{t.loadingText}</div>
      ) : activeTab === 'today' ? (
        reminders.length === 0 ? (
          <div className="ee-card rounded-3xl bg-[#FEF8EA] border border-[#E6DFD3] p-10 text-center space-y-4">
            <Pill className="w-12 h-12 text-[#D49425] mx-auto" aria-hidden="true" />
            <h2 className="font-display text-2xl font-bold text-[#14274E]">
              {t.medicines.emptyState}
            </h2>
            <p className="text-base text-[#4A5568] max-w-md mx-auto">
              {t.medicines.emptySub}
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#14274E] text-white font-bold min-h-[48px]"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              <span>{t.medicines.addReminder}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {reminders.map((rem) => {
              const todayStatus = getTodayStatus(rem.id);
              return (
                <div
                  key={rem.id}
                  className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 flex flex-col justify-between gap-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-numeric text-sm font-bold text-[#B57913]">
                        {rem.schedule_time} ·{' '}
                        {rem.frequency === 'daily'
                          ? t.medicines.freqDaily
                          : rem.frequency === 'twice_daily'
                          ? t.medicines.freqTwice
                          : rem.frequency === 'weekly'
                          ? t.medicines.freqWeekly
                          : t.medicines.freqAsNeeded}
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-bold text-[#14274E]">
                        {rem.medicine_name}
                      </h2>
                      <p className="text-base font-semibold text-[#4A5568]">{rem.dosage}</p>
                      {rem.instructions && (
                        <p className="mt-2 text-sm text-[#4A5568]">{rem.instructions}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(rem)}
                        aria-label={t.health.edit}
                        className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DFD3] text-[#14274E] hover:bg-[#EEF4FD]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(rem.id)}
                        aria-label={t.health.delete}
                        className="p-2.5 rounded-xl bg-[#FDF0F0] text-[#9B2C2C] hover:bg-[#fbdcdc]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E6DFD3] flex flex-wrap items-center justify-between gap-3">
                    {todayStatus ? (
                      <div
                        className={`inline-flex items-center gap-2 text-base font-bold ${
                          todayStatus === 'taken' ? 'text-[#2F855A]' : 'text-[#B57913]'
                        }`}
                      >
                        {todayStatus === 'taken' ? (
                          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                        ) : (
                          <XCircle className="w-5 h-5" aria-hidden="true" />
                        )}
                        <span>
                          {todayStatus === 'taken' ? t.medicines.takenToday : t.medicines.skippedToday}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3 w-full">
                        <button
                          type="button"
                          onClick={() => handleLogDose(rem.id, 'taken')}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2F855A] text-white font-bold text-base hover:bg-[#276749] min-h-[48px]"
                        >
                          <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                          <span>{t.medicines.markTaken}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLogDose(rem.id, 'skipped')}
                          className="px-4 py-3 rounded-xl bg-[#FAF7F2] border border-[#E6DFD3] text-[#4A5568] font-bold text-base hover:bg-[#FDF0F0] min-h-[48px]"
                        >
                          {t.medicines.markSkipped}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-7">
          {logs.length === 0 ? (
            <p className="text-base text-[#4A5568] text-center py-8">{t.medicines.noLogsYet}</p>
          ) : (
            <div className="divide-y divide-[#E6DFD3]">
              {logs.map((log) => (
                <div key={log.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-[#14274E]">
                      {log.medicine_name} — {log.dosage}
                    </p>
                    <p className="text-sm font-numeric text-[#4A5568]">
                      {new Date(log.logged_at).toLocaleString(locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-sm font-bold ${
                      log.status === 'taken' ? 'text-[#2F855A]' : 'text-[#B57913]'
                    }`}
                  >
                    {log.status === 'taken' ? (
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <XCircle className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>{log.status === 'taken' ? t.medicines.takenToday : t.medicines.skippedToday}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="ee-card bg-white rounded-3xl border border-[#E6DFD3] max-w-lg w-full p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-2xl font-bold text-[#14274E]">
              {editingId ? t.medicines.editReminder : t.medicines.addReminder}
            </h2>
            {formError && (
              <div className="p-3 rounded-xl bg-[#FDF0F0] text-[#9B2C2C] text-sm font-semibold">
                {formError}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#14274E] mb-1">
                  {t.medicines.medicineName}
                </label>
                <input
                  type="text"
                  required
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14274E] mb-1">
                  {t.medicines.dosage}
                </label>
                <input
                  type="text"
                  required
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 500mg · 1 tablet"
                  className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#14274E] mb-1">
                    {t.medicines.scheduleTime}
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] font-numeric"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14274E] mb-1">
                    {t.medicines.frequency}
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
                  >
                    <option value="daily">{t.medicines.freqDaily}</option>
                    <option value="twice_daily">{t.medicines.freqTwice}</option>
                    <option value="weekly">{t.medicines.freqWeekly}</option>
                    <option value="as_needed">{t.medicines.freqAsNeeded}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14274E] mb-1">
                  {t.medicines.instructions}
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-[#E6DFD3] font-bold min-h-[48px]"
                >
                  {t.health.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#14274E] text-white font-bold min-h-[48px]"
                >
                  {t.medicines.saveReminder}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
