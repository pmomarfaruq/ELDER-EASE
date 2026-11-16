import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  Pill,
  Siren,
  Users,
  CalendarClock,
  Mic,
  ChevronRight,
  Calendar,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import {
  Appointment,
  EmergencyContact,
  FamilyMember,
  HealthRecord,
  MedicineReminder,
} from '../types';

export const DashboardPage: React.FC = () => {
  const { user, language, t } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [imgError, setImgError] = useState(false);

  const [counts, setCounts] = useState<{
    health: number;
    medicines: number;
    contacts: number;
    family: number;
    appointments: number;
  } | null>(null);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [nextReminder, setNextReminder] = useState<MedicineReminder | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadSummary() {
      try {
        const [healthRes, medRes, sosRes, famRes, apptRes] = await Promise.all([
          apiFetch<{ records: HealthRecord[] }>('/api/health'),
          apiFetch<{ reminders: MedicineReminder[] }>('/api/medicines'),
          apiFetch<{ contacts: EmergencyContact[] }>('/api/sos'),
          apiFetch<{ members: FamilyMember[] }>('/api/family'),
          apiFetch<{ appointments: Appointment[] }>('/api/appointments'),
        ]);
        if (!active) return;

        const upcomingAppts = apptRes.appointments.filter((a) => a.status === 'upcoming');
        const activeReminders = medRes.reminders.filter((r) => r.active === 1);

        setCounts({
          health: healthRes.records.length,
          medicines: activeReminders.length,
          contacts: sosRes.contacts.length,
          family: famRes.members.length,
          appointments: upcomingAppts.length,
        });

        setNextAppointment(upcomingAppts[0] || null);
        setNextReminder(activeReminders[0] || null);
      } catch {
        // Keep counts null on transient fetch failure
      }
    }
    loadSummary();
    return () => {
      active = false;
    };
  }, []);

  const hour = now.getHours();
  const greetingText =
    hour < 12
      ? t.dashboard.goodMorning
      : hour < 17
      ? t.dashboard.goodAfternoon
      : t.dashboard.goodEvening;

  const locale = language === 'ml' ? 'ml-IN' : 'en-US';
  const dateString = now.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeString = now.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const featureCards = [
    {
      to: '/health',
      title: t.dashboard.cards.healthTitle,
      sub:
        counts && counts.health > 0
          ? `${counts.health} ${t.dashboard.recordsCount}`
          : t.dashboard.cards.healthSub,
      bg: 'bg-[#EEF4FD]',
      iconColor: 'text-[#14274E]',
      Icon: HeartPulse,
    },
    {
      to: '/medicines',
      title: t.dashboard.cards.medicineTitle,
      sub:
        counts && counts.medicines > 0
          ? `${counts.medicines} ${t.dashboard.remindersCount}`
          : t.dashboard.cards.medicineSub,
      bg: 'bg-[#FEF8EA]',
      iconColor: 'text-[#D49425]',
      Icon: Pill,
    },
    {
      to: '/sos',
      title: t.dashboard.cards.emergencyTitle,
      sub:
        counts && counts.contacts > 0
          ? `${counts.contacts} ${t.dashboard.contactsCount}`
          : t.dashboard.cards.emergencySub,
      bg: 'bg-[#FDF0F0]',
      iconColor: 'text-[#D93829]',
      Icon: Siren,
    },
    {
      to: '/family',
      title: t.dashboard.cards.familyTitle,
      sub:
        counts && counts.family > 0
          ? `${counts.family} ${t.dashboard.contactsCount}`
          : t.dashboard.cards.familySub,
      bg: 'bg-[#EFF8F0]',
      iconColor: 'text-[#14274E]',
      Icon: Users,
    },
    {
      to: '/appointments',
      title: t.dashboard.cards.appointmentsTitle,
      sub:
        counts && counts.appointments > 0
          ? `${counts.appointments} ${t.dashboard.visitsCount}`
          : t.dashboard.cards.appointmentsSub,
      bg: 'bg-[#F5F0FA]',
      iconColor: 'text-[#14274E]',
      Icon: CalendarClock,
    },
    {
      to: '/voice',
      title: t.dashboard.cards.voiceTitle,
      sub: t.dashboard.cards.voiceSub,
      bg: 'bg-[#ECF8FA]',
      iconColor: 'text-[#14274E]',
      Icon: Mic,
    },
  ];

  const hasAnyRealData =
    counts !== null &&
    (counts.health > 0 ||
      counts.medicines > 0 ||
      counts.contacts > 0 ||
      counts.family > 0 ||
      counts.appointments > 0);

  return (
    <div className="space-y-8">
      {/* Greeting Header matching Reference UI with Authenticated User's Name & Real Date/Time */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-7 space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#14274E] leading-tight">
            {greetingText}
            <span className="block text-[#D49425] mt-1">{user?.full_name}</span>
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-base sm:text-lg font-medium text-[#14274E]/85 tabular-nums pt-1">
            <span className="inline-flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#14274E]/70" aria-hidden="true" />
              <span>{dateString}</span>
            </span>
            <span aria-hidden="true" className="text-[#14274E]/35">|</span>
            <span className="inline-flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#14274E]/70" aria-hidden="true" />
              <span>{timeString}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <span className="w-12 h-0.5 bg-[#D49425]/60 inline-block" aria-hidden="true" />
            <p className="text-base sm:text-lg italic text-[#4A5568]">
              {t.dashboard.haveWonderfulDay}
            </p>
          </div>
        </div>

        <div className="md:col-span-5">
          <div className="ee-card rounded-3xl overflow-hidden border border-[#E6DFD3] bg-white shadow-sm aspect-[4/3] max-h-[260px] w-full">
            {!imgError ? (
              <img
                src="/src/assets/images/dashboard_senior_couple_1794839237049.jpg"
                alt="Happy senior couple using a tablet together"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#FEF8EA] flex items-center justify-center p-6 text-center">
                <p className="font-display font-bold text-xl text-[#14274E]">
                  {t.dashboard.haveWonderfulDay}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Six Main Feature Cards */}
      <section aria-label="Main Features">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featureCards.map(({ to, title, sub, bg, iconColor, Icon }) => (
            <Link
              key={to}
              to={to}
              className={`ee-card group ${bg} rounded-3xl p-6 border border-[#E6DFD3]/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between min-h-[172px]`}
            >
              <div className="flex items-center justify-center pt-1 pb-4">
                <Icon className={`w-12 h-12 ${iconColor}`} strokeWidth={2} aria-hidden="true" />
              </div>

              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-[#14274E] leading-snug">
                    {title}
                  </h2>
                  <p className="mt-1 text-sm sm:text-base text-[#4A5568] truncate">
                    {sub}
                  </p>
                </div>
                <span className="w-9 h-9 rounded-full bg-white/80 border border-[#14274E]/10 flex items-center justify-center text-[#14274E] group-hover:bg-[#14274E] group-hover:text-white transition-colors shrink-0">
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Speak to ElderEase Action Bar */}
      <section>
        <button
          type="button"
          onClick={() => navigate('/voice')}
          className="w-full rounded-full bg-[#14274E] hover:bg-[#0E1C38] text-white px-6 sm:px-8 py-4 sm:py-5 flex items-center justify-between gap-4 shadow-md transition-colors min-h-[64px]"
        >
          <div className="flex items-center gap-4">
            <Mic className="w-7 h-7 text-white shrink-0" aria-hidden="true" />
            <span className="h-6 w-px bg-white/30" aria-hidden="true" />
            <span className="font-display text-lg sm:text-xl font-bold tracking-tight">
              {t.dashboard.speakToElderEase}
            </span>
          </div>

          {/* Crisp Audio Waveform Icon */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-1 h-3 rounded-full bg-white/45" />
            <span className="w-1 h-6 rounded-full bg-white/70" />
            <span className="w-1 h-4 rounded-full bg-white/55" />
            <span className="w-1 h-8 rounded-full bg-[#D49425]" />
            <span className="w-1 h-5 rounded-full bg-white/65" />
            <span className="w-1 h-7 rounded-full bg-white/75" />
            <span className="w-1 h-3 rounded-full bg-white/45" />
          </div>
        </button>
      </section>

      {/* Real-Data-Only Personal Summary (Never invented or seeded) */}
      <section className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-7">
        {!hasAnyRealData ? (
          <div>
            <h2 className="font-display text-xl font-bold text-[#14274E]">
              {t.dashboard.emptyOverviewTitle}
            </h2>
            <p className="mt-2 text-base text-[#4A5568]">
              {t.dashboard.emptyOverviewDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-[#14274E]">
              {t.dashboard.todaySummary}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nextReminder && (
                <Link
                  to="/medicines"
                  className="p-4 rounded-2xl bg-[#FEF8EA] border border-[#E6DFD3] flex items-center justify-between gap-3 hover:border-[#D49425]"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#B57913]">
                      {t.dashboard.cards.medicineTitle}
                    </p>
                    <p className="text-lg font-bold text-[#14274E]">
                      {nextReminder.medicine_name} — {nextReminder.dosage}
                    </p>
                    <p className="text-sm font-numeric text-[#4A5568]">
                      {nextReminder.schedule_time}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#14274E]" aria-hidden="true" />
                </Link>
              )}

              {nextAppointment && (
                <Link
                  to="/appointments"
                  className="p-4 rounded-2xl bg-[#F5F0FA] border border-[#E6DFD3] flex items-center justify-between gap-3 hover:border-[#14274E]"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#14274E]/75">
                      {t.dashboard.cards.appointmentsTitle}
                    </p>
                    <p className="text-lg font-bold text-[#14274E]">
                      {nextAppointment.doctor_name}
                    </p>
                    <p className="text-sm font-numeric text-[#4A5568]">
                      {nextAppointment.appointment_date} · {nextAppointment.appointment_time} · {nextAppointment.hospital_name}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#14274E]" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
