import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Plus, Pencil, Trash2, CheckCircle2, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { Appointment } from '../types';

export const AppointmentsPage: React.FC = () => {
  const { t } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'completed' | 'all'>('upcoming');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [formError, setFormError] = useState('');

  const loadAppointments = async () => {
    try {
      const data = await apiFetch<{ appointments: Appointment[] }>('/api/appointments');
      setAppointments(data.appointments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setDoctorName('');
    setSpecialty('');
    setHospitalName('');
    setAppointmentDate(new Date().toISOString().slice(0, 10));
    setAppointmentTime('10:00');
    setNotes('');
    setReminderEnabled(true);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (appt: Appointment) => {
    setEditingId(appt.id);
    setDoctorName(appt.doctor_name);
    setSpecialty(appt.specialty || '');
    setHospitalName(appt.hospital_name);
    setAppointmentDate(appt.appointment_date);
    setAppointmentTime(appt.appointment_time);
    setNotes(appt.notes || '');
    setReminderEnabled(appt.reminder_enabled === 1);
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!doctorName.trim() || !hospitalName.trim() || !appointmentDate || !appointmentTime) {
      setFormError('Doctor name, hospital, date, and time are required.');
      return;
    }
    try {
      const payload = {
        doctor_name: doctorName.trim(),
        specialty: specialty.trim(),
        hospital_name: hospitalName.trim(),
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        notes: notes.trim(),
        reminder_enabled: reminderEnabled,
        status: 'upcoming',
      };
      if (editingId) {
        const existing = appointments.find((a) => a.id === editingId);
        await apiFetch(`/api/appointments/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({ ...payload, status: existing?.status || 'upcoming' }),
        });
      } else {
        await apiFetch('/api/appointments', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      await loadAppointments();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save appointment.');
    }
  };

  const handleMarkComplete = async (appt: Appointment) => {
    await apiFetch(`/api/appointments/${appt.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        doctor_name: appt.doctor_name,
        specialty: appt.specialty,
        hospital_name: appt.hospital_name,
        appointment_date: appt.appointment_date,
        appointment_time: appt.appointment_time,
        notes: appt.notes,
        reminder_enabled: appt.reminder_enabled === 1,
        status: 'completed',
      }),
    });
    await loadAppointments();
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/appointments/${id}`, { method: 'DELETE' });
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return appointments;
    return appointments.filter((a) => a.status === filter);
  }, [appointments, filter]);

  const todayDateStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#14274E]">
            {t.appointments.title}
          </h1>
          <p className="mt-1 text-base sm:text-lg text-[#4A5568]">{t.appointments.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#14274E] text-white font-bold text-base hover:bg-[#0E1C38] min-h-[50px] shrink-0"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span>{t.appointments.addAppointment}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      {appointments.length > 0 && (
        <div className="inline-flex p-1.5 rounded-2xl bg-white border border-[#E6DFD3]">
          {(
            [
              { id: 'upcoming', label: t.appointments.filterUpcoming },
              { id: 'completed', label: t.appointments.filterCompleted },
              { id: 'all', label: t.appointments.filterAll },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-5 py-2 rounded-xl text-base font-bold ${
                filter === tab.id ? 'bg-[#14274E] text-white' : 'text-[#4A5568]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-[#4A5568]">...</div>
      ) : appointments.length === 0 ? (
        <div className="ee-card rounded-3xl bg-[#F5F0FA] border border-[#E6DFD3] p-10 text-center space-y-4">
          <CalendarClock className="w-12 h-12 text-[#14274E] mx-auto" aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold text-[#14274E]">
            {t.appointments.emptyState}
          </h2>
          <p className="text-base text-[#4A5568] max-w-md mx-auto">
            {t.appointments.emptySub}
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#14274E] text-white font-bold min-h-[48px]"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span>{t.appointments.addAppointment}</span>
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-8 text-center text-[#4A5568]">
          {t.appointments.emptyState}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((appt) => {
            const isToday = appt.appointment_date === todayDateStr && appt.status === 'upcoming';
            return (
              <div
                key={appt.id}
                className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-sm font-numeric font-bold text-[#B57913]">
                      <span>{appt.appointment_date}</span>
                      <span aria-hidden="true">·</span>
                      <span>{appt.appointment_time}</span>
                      {isToday && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#2F855A]">{t.appointments.todayBadge}</span>
                        </>
                      )}
                    </div>
                    <h2 className="mt-1 font-display text-2xl font-bold text-[#14274E]">
                      {appt.doctor_name}
                    </h2>
                    {appt.specialty && (
                      <p className="text-sm font-semibold text-[#4A5568]">{appt.specialty}</p>
                    )}
                    <p className="mt-1 text-base font-medium text-[#14274E]">{appt.hospital_name}</p>
                    {appt.notes && <p className="mt-2 text-sm text-[#4A5568]">{appt.notes}</p>}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(appt)}
                      aria-label={t.health.edit}
                      className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E6DFD3] text-[#14274E]"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(appt.id)}
                      aria-label={t.health.delete}
                      className="p-2.5 rounded-xl bg-[#FDF0F0] text-[#9B2C2C]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E6DFD3] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-[#4A5568]">
                    {appt.reminder_enabled === 1 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-[#14274E]">
                        <Bell className="w-4 h-4 text-[#D49425]" aria-hidden="true" />
                        <span>Reminder On</span>
                      </span>
                    )}
                  </div>

                  {appt.status === 'upcoming' ? (
                    <button
                      type="button"
                      onClick={() => handleMarkComplete(appt)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EFF8F0] text-[#276749] font-bold text-sm hover:bg-[#dcf0df] min-h-[42px]"
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>{t.appointments.markComplete}</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2F855A]">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>{t.appointments.completed}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="ee-card bg-white rounded-3xl border border-[#E6DFD3] max-w-lg w-full p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-2xl font-bold text-[#14274E]">
              {editingId ? t.appointments.editAppointment : t.appointments.addAppointment}
            </h2>
            {formError && (
              <div className="p-3 rounded-xl bg-[#FDF0F0] text-[#9B2C2C] text-sm font-semibold">
                {formError}
              </div>
            )}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#14274E] mb-1">
                  {t.appointments.doctorName}
                </label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14274E] mb-1">
                  {t.appointments.specialty}
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14274E] mb-1">
                  {t.appointments.hospitalName}
                </label>
                <input
                  type="text"
                  required
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#14274E] mb-1">
                    {t.appointments.date}
                  </label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] font-numeric"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#14274E] mb-1">
                    {t.appointments.time}
                  </label>
                  <input
                    type="time"
                    required
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] font-numeric"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14274E] mb-1">
                  {t.appointments.notes}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="w-5 h-5 accent-[#14274E]"
                />
                <span className="text-base font-semibold text-[#14274E]">
                  {t.appointments.enableReminder}
                </span>
              </label>
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
                  {t.appointments.saveAppointment}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
