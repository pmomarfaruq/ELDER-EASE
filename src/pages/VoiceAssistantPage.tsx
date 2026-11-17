import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { Appointment, HealthRecord, Language, MedicineReminder } from '../types';

interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export const VoiceAssistantPage: React.FC = () => {
  const { language, setLanguage, t } = useAuth();
  const navigate = useNavigate();

  const [voiceLang, setVoiceLang] = useState<Language>(language);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');
  const [manualInput, setManualInput] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const SpeechRecognitionCtor =
    typeof window !== 'undefined'
      ? ((window as unknown as Record<string, unknown>).SpeechRecognition ||
          (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as
          | (new () => SpeechRecognitionInstance)
          | undefined
      : undefined;

  const speakText = (text: string, lang: Language) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ml' ? 'ml-IN' : 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const processCommand = async (rawCommand: string) => {
    const cmd = rawCommand.trim();
    if (!cmd) return;
    setTranscript(cmd);
    const lower = cmd.toLowerCase();

    const isMl = voiceLang === 'ml' || /[\u0D00-\u0D7F]/.test(cmd);
    const replyLang: Language = isMl ? 'ml' : 'en';

    let reply = '';
    let routeTarget: string | null = null;

    // Language switch voice command
    if (lower.includes('malayalam') || cmd.includes('മലയാളം')) {
      await setLanguage('ml');
      setVoiceLang('ml');
      reply = 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റിയിരിക്കുന്നു.';
    } else if (lower.includes('english') || cmd.includes('ഇംഗ്ലീഷ്')) {
      await setLanguage('en');
      setVoiceLang('en');
      reply = 'Language switched to English.';
    }
    // Data Query: Blood pressure / vitals
    else if (
      lower.includes('blood pressure') ||
      lower.includes('sugar') ||
      lower.includes('latest') ||
      cmd.includes('രക്തസമ്മർദ്ദം') ||
      cmd.includes('ഷുഗർ')
    ) {
      const data = await apiFetch<{ records: HealthRecord[] }>('/api/health');
      const latestBp = data.records.find((r) => r.systolic !== null && r.diastolic !== null);
      if (!latestBp) {
        reply =
          replyLang === 'ml'
            ? 'ഇതുവരെ രക്തസമ്മർദ്ദ വിവരങ്ങൾ ചേർത്തിട്ടില്ല. എന്റെ ആരോഗ്യം പേജിൽ വിവരങ്ങൾ ചേർക്കാം.'
            : 'No blood pressure records added yet. You can add one in My Health.';
      } else {
        reply =
          replyLang === 'ml'
            ? `നിങ്ങളുടെ ഏറ്റവും പുതിയ രക്തസമ്മർദ്ദം ${latestBp.systolic} / ${latestBp.diastolic} mmHg ആണ്.`
            : `Your latest blood pressure reading is ${latestBp.systolic} over ${latestBp.diastolic} millimeters of mercury.`;
      }
    }
    // Data Query: Next medicine
    else if (
      lower.includes('next medicine') ||
      lower.includes('my medicine') ||
      cmd.includes('അടുത്ത മരുന്ന്') ||
      cmd.includes('ഏതാണ്')
    ) {
      const data = await apiFetch<{ reminders: MedicineReminder[] }>('/api/medicines');
      const active = data.reminders.filter((r) => r.active === 1);
      if (active.length === 0) {
        reply =
          replyLang === 'ml'
            ? 'മരുന്ന് ഓർമ്മപ്പെടുത്തലുകളൊന്നും ചേർത്തിട്ടില്ല.'
            : 'You have no medicine reminders scheduled yet.';
      } else {
        const first = active[0];
        reply =
          replyLang === 'ml'
            ? `നിങ്ങളുടെ അടുത്ത മരുന്ന് ${first.medicine_name}, ${first.dosage}, സമയം ${first.schedule_time}.`
            : `Your scheduled medicine is ${first.medicine_name}, ${first.dosage}, at ${first.schedule_time}.`;
      }
    }
    // Data Query / Navigation: Appointments
    else if (
      lower.includes('appointment') ||
      lower.includes('doctor') ||
      cmd.includes('ഡോക്ടർ') ||
      cmd.includes('സന്ദർശനം') ||
      cmd.includes('സന്ദർശനങ്ങൾ')
    ) {
      const data = await apiFetch<{ appointments: Appointment[] }>('/api/appointments');
      const upcoming = data.appointments.filter((a) => a.status === 'upcoming');
      if (lower.includes('open') || lower.includes('show') || cmd.includes('തുറക്കുക')) {
        routeTarget = '/appointments';
        reply =
          replyLang === 'ml'
            ? 'ഡോക്ടർ സന്ദർശനങ്ങൾ തുറക്കുന്നു.'
            : 'Opening My Appointments.';
      } else if (upcoming.length === 0) {
        reply =
          replyLang === 'ml'
            ? 'വരാനിരിക്കുന്ന ഡോക്ടർ സന്ദർശനങ്ങളൊന്നും ഇല്ല.'
            : 'You have no upcoming appointments available.';
      } else {
        const next = upcoming[0];
        reply =
          replyLang === 'ml'
            ? `നിങ്ങളുടെ അടുത്ത സന്ദർശനം ${next.doctor_name} ഡോക്ടറുമായി ${next.appointment_date} തീയതി ${next.appointment_time} മണിക്ക് ${next.hospital_name}-ലാണ്.`
            : `Your next appointment is with ${next.doctor_name} at ${next.hospital_name} on ${next.appointment_date} at ${next.appointment_time}.`;
      }
    }
    // Navigation commands
    else if (lower.includes('health') || cmd.includes('ആരോഗ്യം') || cmd.includes('ഹെൽത്ത്')) {
      routeTarget = '/health';
      reply = replyLang === 'ml' ? 'എന്റെ ആരോഗ്യം തുറക്കുന്നു.' : 'Opening My Health.';
    } else if (lower.includes('medicine') || cmd.includes('മരുന്ന്')) {
      routeTarget = '/medicines';
      reply =
        replyLang === 'ml' ? 'മരുന്ന് ഓർമ്മപ്പെടുത്തൽ തുറക്കുന്നു.' : 'Opening Medicine Reminders.';
    } else if (
      lower.includes('emergency') ||
      lower.includes('sos') ||
      lower.includes('help me') ||
      cmd.includes('അടിയന്തര') ||
      cmd.includes('സഹായം')
    ) {
      routeTarget = '/sos';
      reply = replyLang === 'ml' ? 'അടിയന്തര സഹായം തുറക്കുന്നു.' : 'Opening Emergency Help.';
    } else if (lower.includes('family') || cmd.includes('കുടുംബ')) {
      routeTarget = '/family';
      reply = replyLang === 'ml' ? 'കുടുംബ കണക്ട് തുറക്കുന്നു.' : 'Opening Family Connect.';
    } else if (lower.includes('setting') || cmd.includes('സെറ്റിംഗ്സ്')) {
      routeTarget = '/settings';
      reply = replyLang === 'ml' ? 'സെറ്റിംഗ്സ് തുറക്കുന്നു.' : 'Opening Settings.';
    } else if (lower.includes('home') || lower.includes('dashboard') || cmd.includes('ഹോം')) {
      routeTarget = '/dashboard';
      reply = replyLang === 'ml' ? 'ഹോം പേജിലേക്ക് പോകുന്നു.' : 'Going to Home Dashboard.';
    } else {
      reply =
        replyLang === 'ml'
          ? 'ക്ഷമിക്കണം, എനിക്ക് മനസ്സിലായില്ല. ആരോഗ്യം, മരുന്ന്, അടിയന്തര സഹായം, കുടുംബം, അല്ലെങ്കിൽ സന്ദർശനങ്ങൾ എന്ന് പറയാം.'
          : 'I can open My Health, Medicine Reminders, Emergency Help, Family Connect, Appointments, or read your latest recorded vitals.';
    }

    setResponseText(reply);
    speakText(reply, replyLang);

    if (routeTarget) {
      setTimeout(() => {
        navigate(routeTarget!);
      }, 900);
    }
  };

  const toggleListening = () => {
    if (!SpeechRecognitionCtor) return;
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = voiceLang === 'ml' ? 'ml-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || '';
      setListening(false);
      if (text) {
        processCommand(text);
      }
    };
    recognition.onerror = () => {
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#14274E]">
          {t.voice.title}
        </h1>
        <p className="mt-1 text-base sm:text-lg text-[#4A5568]">{t.voice.subtitle}</p>
      </div>

      {/* Voice Control Card */}
      <section className="ee-card bg-[#ECF8FA] rounded-3xl border border-[#E6DFD3] p-6 sm:p-10 space-y-6 text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="text-sm font-bold text-[#14274E]">{t.voice.voiceLangLabel}</span>
          <div className="inline-flex p-1 rounded-xl bg-white border border-[#E6DFD3]">
            <button
              type="button"
              onClick={() => setVoiceLang('en')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold ${
                voiceLang === 'en' ? 'bg-[#14274E] text-white' : 'text-[#4A5568]'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setVoiceLang('ml')}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold ${
                voiceLang === 'ml' ? 'bg-[#14274E] text-white' : 'text-[#4A5568]'
              }`}
            >
              മലയാളം
            </button>
          </div>
        </div>

        {SpeechRecognitionCtor ? (
          <button
            type="button"
            onClick={toggleListening}
            className={`mx-auto w-full max-w-sm py-6 px-8 rounded-3xl font-display text-xl font-extrabold flex flex-col items-center justify-center gap-3 transition-colors min-h-[140px] shadow-md ${
              listening
                ? 'bg-[#D49425] text-[#0E1C38]'
                : 'bg-[#14274E] text-white hover:bg-[#0E1C38]'
            }`}
          >
            {listening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            <span>{listening ? t.voice.stopListening : t.voice.tapToSpeak}</span>
            {listening && <span className="text-sm font-normal">{t.voice.listening}</span>}
          </button>
        ) : (
          <p className="text-base text-[#4A5568] max-w-lg mx-auto">{t.voice.unsupported}</p>
        )}

        {/* Text Fallback Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            processCommand(manualInput);
            setManualInput('');
          }}
          className="max-w-xl mx-auto flex gap-2"
        >
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={t.voice.commandInputPlaceholder}
            className="flex-1 px-4 py-3.5 rounded-xl border border-[#E6DFD3] bg-white text-base"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#14274E] text-white font-bold min-h-[48px] shrink-0"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span>{t.voice.runCommand}</span>
          </button>
        </form>
      </section>

      {/* Transcript & Spoken Reply */}
      {(transcript || responseText) && (
        <section className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 space-y-4">
          {transcript && (
            <div>
              <p className="text-sm font-bold text-[#4A5568]">{t.voice.youSaid}</p>
              <p className="text-xl font-bold text-[#14274E] mt-0.5">“{transcript}”</p>
            </div>
          )}
          {responseText && (
            <div className="pt-3 border-t border-[#E6DFD3] flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#0E7490]">{t.voice.assistantReply}</p>
                <p className="text-lg font-semibold text-[#14274E] mt-0.5">{responseText}</p>
              </div>
              <button
                type="button"
                onClick={() => speakText(responseText, voiceLang)}
                aria-label={t.voice.replayVoice}
                className="p-3 rounded-xl bg-[#EEF4FD] text-[#14274E] shrink-0"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* Quick Command Chips */}
      <section className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-7 space-y-4">
        <h2 className="font-display text-xl font-bold text-[#14274E]">
          {t.voice.quickCommandsTitle}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {t.voice.commandsList.map((item) => {
            const label = voiceLang === 'ml' ? item.ml : item.en;
            return (
              <button
                key={item.en}
                type="button"
                onClick={() => processCommand(label)}
                className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E6DFD3] text-left font-semibold text-base text-[#14274E] hover:bg-[#FEF8EA] hover:border-[#D49425] transition-colors min-h-[52px]"
              >
                “{label}”
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
