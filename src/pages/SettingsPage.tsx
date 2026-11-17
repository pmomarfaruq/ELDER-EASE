import React, { useState } from 'react';
import { Check, Globe, Type, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, language, setLanguage, largeText, highContrast, setAccessibility, updateProfile, t } =
    useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#14274E]">
          {t.settings.title}
        </h1>
        <p className="mt-1 text-base sm:text-lg text-[#4A5568]">{t.settings.subtitle}</p>
      </div>

      {/* Language Selection */}
      <section className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-[#D49425]" aria-hidden="true" />
          <h2 className="font-display text-xl font-bold text-[#14274E]">
            {t.settings.languageSection}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`p-5 rounded-2xl border text-left transition-colors min-h-[72px] ${
              language === 'en'
                ? 'bg-[#14274E] text-white border-[#14274E]'
                : 'bg-[#FAF7F2] text-[#14274E] border-[#E6DFD3]'
            }`}
          >
            <p className="font-display text-xl font-bold">English</p>
            <p className={`text-sm ${language === 'en' ? 'text-white/80' : 'text-[#4A5568]'}`}>
              {t.settings.englishDesc}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setLanguage('ml')}
            className={`p-5 rounded-2xl border text-left transition-colors min-h-[72px] ${
              language === 'ml'
                ? 'bg-[#14274E] text-white border-[#14274E]'
                : 'bg-[#FAF7F2] text-[#14274E] border-[#E6DFD3]'
            }`}
          >
            <p className="font-display text-xl font-bold">മലയാളം (Malayalam)</p>
            <p className={`text-sm ${language === 'ml' ? 'text-white/80' : 'text-[#4A5568]'}`}>
              {t.settings.malayalamDesc}
            </p>
          </button>
        </div>
      </section>

      {/* Accessibility Toggles */}
      <section className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-7 space-y-5">
        <h2 className="font-display text-xl font-bold text-[#14274E]">
          {t.settings.accessibilitySection}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-[#FAF7F2] border border-[#E6DFD3] cursor-pointer">
            <div className="flex items-start gap-3">
              <Type className="w-6 h-6 text-[#14274E] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-lg font-bold text-[#14274E]">{t.settings.largeTextLabel}</p>
                <p className="text-sm text-[#4A5568] mt-1">{t.settings.largeTextDesc}</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={largeText}
              onChange={(e) => setAccessibility({ large_text: e.target.checked })}
              className="w-6 h-6 accent-[#14274E] shrink-0 mt-1"
            />
          </label>

          <label className="flex items-start justify-between gap-4 p-5 rounded-2xl bg-[#FAF7F2] border border-[#E6DFD3] cursor-pointer">
            <div className="flex items-start gap-3">
              <Eye className="w-6 h-6 text-[#14274E] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-lg font-bold text-[#14274E]">{t.settings.highContrastLabel}</p>
                <p className="text-sm text-[#4A5568] mt-1">{t.settings.highContrastDesc}</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={highContrast}
              onChange={(e) => setAccessibility({ high_contrast: e.target.checked })}
              className="w-6 h-6 accent-[#14274E] shrink-0 mt-1"
            />
          </label>
        </div>
      </section>

      {/* Profile Settings */}
      <section className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-7 space-y-5">
        <h2 className="font-display text-xl font-bold text-[#14274E]">
          {t.settings.profileSection}
        </h2>

        {error && (
          <div className="p-3 rounded-xl bg-[#FDF0F0] text-[#9B2C2C] text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
          <div>
            <label className="block text-sm font-semibold text-[#14274E] mb-1">
              {t.settings.fullName}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#14274E] mb-1">
              {t.settings.email}
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]/60 text-[#4A5568]"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#14274E] mb-1">
              {t.settings.phone}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] font-numeric"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#14274E] mb-1">
              {t.settings.address}
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
            />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              className="px-6 py-3.5 rounded-xl bg-[#14274E] text-white font-bold min-h-[48px]"
            >
              {t.settings.saveButton}
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2F855A]">
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>{t.settings.saveSuccess}</span>
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
};
