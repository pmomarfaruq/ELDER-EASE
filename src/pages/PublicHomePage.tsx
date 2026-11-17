import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  Pill,
  Siren,
  Users,
  CalendarClock,
  Mic,
  ArrowRight,
  Globe,
  ShieldCheck,
  Eye,
  Type,
  Lock,
} from 'lucide-react';
import { ElderEaseLogo } from '../components/ElderEaseLogo';
import { useAuth } from '../context/AuthContext';

const FEATURE_STYLES = [
  {
    id: 'health',
    bg: 'bg-[#EEF4FD]',
    iconBg: 'bg-[#14274E] text-white',
    Icon: HeartPulse,
  },
  {
    id: 'medicines',
    bg: 'bg-[#FEF8EA]',
    iconBg: 'bg-[#D49425] text-white',
    Icon: Pill,
  },
  {
    id: 'sos',
    bg: 'bg-[#FDF0F0]',
    iconBg: 'bg-[#C53030] text-white',
    Icon: Siren,
  },
  {
    id: 'family',
    bg: 'bg-[#EFF8F0]',
    iconBg: 'bg-[#2F855A] text-white',
    Icon: Users,
  },
  {
    id: 'appointments',
    bg: 'bg-[#F5F0FA]',
    iconBg: 'bg-[#14274E] text-white',
    Icon: CalendarClock,
  },
  {
    id: 'voice',
    bg: 'bg-[#ECF8FA]',
    iconBg: 'bg-[#0E7490] text-white',
    Icon: Mic,
  },
];

export const PublicHomePage: React.FC = () => {
  const { user, language, setLanguage, largeText, highContrast, setAccessibility, t } = useAuth();
  const navigate = useNavigate();
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [aboutImgFailed, setAboutImgFailed] = useState(false);

  const handleFeatureInspect = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#14274E]">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 bg-[#FAF7F2]/95 backdrop-blur border-b border-[#E6DFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
          <Link to="/" className="whitespace-nowrap shrink-0" aria-label="ElderEase Home">
            <ElderEaseLogo size="sm" />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-base font-medium text-[#14274E]/80" aria-label="Primary">
            <a href="#about" className="hover:text-[#14274E] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              {t.nav.about}
            </a>
            <a href="#features" className="hover:text-[#14274E] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              {t.nav.features}
            </a>
            <a href="#why-elderease" className="hover:text-[#14274E] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              {t.nav.why}
            </a>
            <a href="#mission" className="hover:text-[#14274E] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              {t.nav.mission}
            </a>
          </nav>

          <div className="shrink-0">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14274E] text-white font-semibold text-base hover:bg-[#0E1C38] transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
              >
                <span>{t.nav.home}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14274E] text-white font-semibold text-base hover:bg-[#0E1C38] transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
              >
                <span>{t.publicHome.ctaStart}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pt-14 lg:pb-20">
          {/* Accessibility & Language utility strip inside Hero */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 mb-8 border-b border-[#E6DFD3]">
            <p className="text-sm sm:text-base font-medium text-[#4A5568] italic">
              {t.tagline}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E6DFD3] text-sm font-semibold text-[#14274E] hover:bg-[#FEF8EA] transition-colors min-h-[40px] whitespace-nowrap shrink-0"
              >
                <Globe className="w-4 h-4 text-[#D49425]" aria-hidden="true" />
                <span>{language === 'en' ? 'English / മലയാളം' : 'മലയാളം / English'}</span>
              </button>
              <button
                type="button"
                onClick={() => setAccessibility({ large_text: !largeText })}
                aria-pressed={largeText}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-semibold transition-colors min-h-[40px] whitespace-nowrap shrink-0 ${
                  largeText
                    ? 'bg-[#14274E] text-white border-[#14274E]'
                    : 'bg-white text-[#14274E] border-[#E6DFD3] hover:bg-[#EEF4FD]'
                }`}
              >
                <Type className="w-4 h-4" aria-hidden="true" />
                <span>Aa</span>
              </button>
              <button
                type="button"
                onClick={() => setAccessibility({ high_contrast: !highContrast })}
                aria-pressed={highContrast}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm font-semibold transition-colors min-h-[40px] whitespace-nowrap shrink-0 ${
                  highContrast
                    ? 'bg-[#14274E] text-white border-[#14274E]'
                    : 'bg-white text-[#14274E] border-[#E6DFD3] hover:bg-[#EEF4FD]'
                }`}
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span>{t.publicHome.contrastBtn}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <h1
                className="font-display font-extrabold tracking-tight text-[#14274E] text-balance leading-[1.12]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.65rem)' }}
              >
                {t.publicHome.heroHeadline}
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-[#4A5568] max-w-xl leading-relaxed">
                {t.publicHome.heroDesc}
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  to={user ? '/dashboard' : '/signup'}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#D49425] text-[#0E1C38] font-bold text-lg hover:bg-[#c2841b] transition-colors min-h-[52px] whitespace-nowrap shrink-0 shadow-sm"
                >
                  <span>{t.publicHome.ctaStart}</span>
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>

                {!user && (
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-[#14274E] text-white font-bold text-lg hover:bg-[#0E1C38] transition-colors min-h-[52px] whitespace-nowrap shrink-0"
                  >
                    {t.publicHome.ctaLogin}
                  </Link>
                )}

                <a
                  href="#features"
                  className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-white border border-[#E6DFD3] text-[#14274E] font-semibold text-lg hover:bg-[#EEF4FD] transition-colors min-h-[52px] whitespace-nowrap shrink-0"
                >
                  {t.publicHome.ctaExplore}
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full rounded-3xl overflow-hidden bg-white border border-[#E6DFD3] shadow-sm flex flex-col">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_elderly_couple_1794839235799.jpg"
                    alt="Happy elderly Indian couple smiling together at home"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-72 sm:h-96 lg:h-full object-cover min-h-[320px]"
                  />
                ) : (
                  <div className="w-full h-80 lg:h-full bg-gradient-to-br from-[#EEF4FD] to-[#FEF8EA] flex flex-col items-center justify-center p-8 text-center">
                    <ElderEaseLogo size="lg" />
                    <p className="mt-4 text-base font-medium text-[#4A5568]">
                      {t.publicHome.heroCaption}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* About ElderEase */}
        <section id="about" className="bg-white border-y border-[#E6DFD3] py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
              <div className="lg:col-span-5">
                <div className="h-full rounded-3xl overflow-hidden border border-[#E6DFD3] bg-[#FAF7F2]">
                  {!aboutImgFailed ? (
                    <img
                      src="/src/assets/images/about_indian_family_1794839237197.jpg"
                      alt="Elderly Indian parents smiling with their daughter in a bright living room"
                      referrerPolicy="no-referrer"
                      onError={() => setAboutImgFailed(true)}
                      className="w-full h-72 lg:h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-72 lg:h-full bg-[#EFF8F0] flex items-center justify-center p-8">
                      <Users className="w-16 h-16 text-[#14274E]" aria-hidden="true" />
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col justify-center">
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#14274E] text-balance">
                  {t.publicHome.aboutTitle}
                </h2>
                <p className="mt-3 text-xl font-semibold text-[#B57913]">
                  {t.publicHome.aboutSubtitle}
                </p>
                <p className="mt-6 text-lg text-[#4A5568] leading-relaxed">
                  {t.publicHome.aboutBody1}
                </p>
                <p className="mt-4 text-lg text-[#4A5568] leading-relaxed">
                  {t.publicHome.aboutBody2}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Six Main Features (Informational Only on Public Home) */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#14274E] text-balance">
              {t.publicHome.featuresTitle}
            </h2>
            <p className="mt-3 text-lg text-[#4A5568]">
              {t.publicHome.featuresSubtitle}
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {t.publicHome.features.map((feat, idx) => {
              const style = FEATURE_STYLES[idx] || FEATURE_STYLES[0];
              const Icon = style.Icon;
              return (
                <div
                  key={feat.id}
                  className={`ee-card rounded-3xl p-7 border border-[#E6DFD3] ${style.bg} flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5`}
                >
                  <div>
                    <div className={`w-14 h-14 rounded-2xl ${style.iconBg} flex items-center justify-center`}>
                      <Icon className="w-7 h-7" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 font-display text-2xl font-bold text-[#14274E]">
                      0{idx + 1}. {feat.title}
                    </h3>
                    <p className="mt-3 text-base text-[#4A5568] leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#14274E]/10 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4A5568]">
                      <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{user ? t.nav.home : t.nav.login}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleFeatureInspect}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-[#14274E] hover:text-[#B57913] transition-colors whitespace-nowrap shrink-0 min-h-[40px] px-2"
                    >
                      <span>{user ? t.nav.home : t.publicHome.ctaStart}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-sm text-[#4A5568]">
            {t.publicHome.featureReadOnlyHint}
          </p>
        </section>

        {/* Why ElderEase */}
        <section id="why-elderease" className="bg-white border-y border-[#E6DFD3] py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#14274E]">
                {t.publicHome.whyTitle}
              </h2>
              <p className="mt-3 text-lg text-[#4A5568]">
                {t.publicHome.whySubtitle}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
              {t.publicHome.whyPoints.map((point, index) => (
                <div
                  key={point.title}
                  className="ee-card rounded-2xl p-7 bg-[#FAF7F2] border border-[#E6DFD3]"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-[#D49425] shrink-0" aria-hidden="true" />
                    <h3 className="font-display text-xl font-bold text-[#14274E]">
                      0{index + 1}. {point.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-base text-[#4A5568] leading-relaxed">
                    {point.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section id="mission" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-3xl p-8 sm:p-10 bg-[#14274E] text-white">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#FEF8EA]">
                {t.publicHome.missionTitle}
              </h2>
              <p className="mt-4 text-lg text-white/90 leading-relaxed">
                {t.publicHome.missionBody}
              </p>
            </div>

            <div className="ee-card rounded-3xl p-8 sm:p-10 bg-[#FEF8EA] border border-[#E6DFD3] text-[#14274E]">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#14274E]">
                {t.publicHome.visionTitle}
              </h2>
              <p className="mt-4 text-lg text-[#4A5568] leading-relaxed">
                {t.publicHome.visionBody}
              </p>
            </div>
          </div>
        </section>

        {/* Final Sign Up & Login CTA Band */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="ee-card rounded-3xl bg-[#EEF4FD] border border-[#E6DFD3] p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#14274E]">
                {t.publicHome.ctaBandTitle}
              </h2>
              <p className="mt-3 text-lg text-[#4A5568]">
                {t.publicHome.ctaBandDesc}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <Link
                to={user ? '/dashboard' : '/signup'}
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-[#D49425] text-[#0E1C38] font-bold text-lg hover:bg-[#c2841b] transition-colors min-h-[52px] whitespace-nowrap"
              >
                {t.auth.goToSignup}
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-[#14274E] text-white font-bold text-lg hover:bg-[#0E1C38] transition-colors min-h-[52px] whitespace-nowrap"
                >
                  {t.auth.goToLogin}
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#14274E] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="font-display text-2xl font-extrabold">
              <span className="text-white">Elder</span>
              <span className="text-[#D49425]">Ease</span>
            </div>
            <p className="mt-1 text-sm text-white/80 italic">{t.tagline}</p>
            <p className="mt-2 text-sm text-white/75">{t.publicHome.footerRights}</p>
          </div>

          <div className="flex flex-col md:items-end gap-2">
            <p className="text-base font-semibold text-[#FEF8EA]">{t.designerCredit}</p>
            <div className="flex items-center gap-5 text-sm text-white/80">
              <Link to="/login" className="hover:underline">
                {t.nav.login}
              </Link>
              <Link to="/signup" className="hover:underline">
                {t.auth.goToSignup}
              </Link>
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
                className="hover:underline"
              >
                {language === 'en' ? 'മലയാളം' : 'English'}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
