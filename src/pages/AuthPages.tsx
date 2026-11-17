import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { ElderEaseLogo } from '../components/ElderEaseLogo';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

const AuthShell: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => {
  const { language, setLanguage, t } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between px-4 py-8 sm:px-6">
      <div className="max-w-lg w-full mx-auto flex items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-base font-semibold text-[#14274E] hover:underline min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          <span>{t.auth.backHome}</span>
        </Link>
        <button
          type="button"
          onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E6DFD3] text-sm font-semibold text-[#14274E] min-h-[40px]"
        >
          <Globe className="w-4 h-4 text-[#D49425]" aria-hidden="true" />
          <span>{language === 'en' ? 'മലയാളം' : 'English'}</span>
        </button>
      </div>

      <main className="max-w-lg w-full mx-auto my-8">
        <div className="ee-card bg-white rounded-3xl border border-[#E6DFD3] shadow-sm p-7 sm:p-10">
          <div className="mb-6">
            <ElderEaseLogo size="md" showTagline taglineText={t.tagline} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#14274E]">
            {title}
          </h1>
          <p className="mt-2 text-base text-[#4A5568]">{subtitle}</p>

          <div className="mt-7">{children}</div>
        </div>
      </main>

      <footer className="text-center text-sm text-[#4A5568]">
        {t.designerCredit}
      </footer>
    </div>
  );
};

export const LoginPage: React.FC = () => {
  const { user, login, t } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError(t.auth.errEmailPassword);
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-4 rounded-xl bg-[#FDF0F0] border border-[#C53030]/30 text-[#9B2C2C] text-base font-medium"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="block text-base font-semibold text-[#14274E] mb-2">
            {t.auth.email}
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-base text-[#14274E]"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="login-password" className="block text-base font-semibold text-[#14274E]">
              {t.auth.password}
            </label>
            <Link to="/forgot-password" className="text-sm font-semibold text-[#B57913] hover:underline">
              {t.auth.forgotLink}
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 pr-12 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-base text-[#14274E]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#4A5568] hover:text-[#14274E] min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 px-6 rounded-xl bg-[#14274E] text-white font-bold text-lg hover:bg-[#0E1C38] disabled:opacity-60 transition-colors min-h-[52px]"
        >
          {submitting ? '...' : t.auth.loginButton}
        </button>

        <p className="text-center text-base text-[#4A5568] pt-2">
          {t.auth.noAccount}{' '}
          <Link to="/signup" className="font-bold text-[#14274E] hover:underline">
            {t.auth.goToSignup}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export const SignupPage: React.FC = () => {
  const { user, signup, t } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (fullName.trim().length < 2) {
      setError(t.auth.errFullName);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.auth.errEmailInvalid);
      return;
    }
    if (password.length < 8) {
      setError(t.auth.errPasswordMin);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.auth.errPasswordMatch);
      return;
    }

    setSubmitting(true);
    try {
      await signup(fullName.trim(), email.trim(), password, confirmPassword);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title={t.auth.signupTitle} subtitle={t.auth.signupSubtitle}>
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-4 rounded-xl bg-[#FDF0F0] border border-[#C53030]/30 text-[#9B2C2C] text-base font-medium"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="signup-name" className="block text-base font-semibold text-[#14274E] mb-2">
            {t.auth.fullName}
          </label>
          <input
            id="signup-name"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-base text-[#14274E]"
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="block text-base font-semibold text-[#14274E] mb-2">
            {t.auth.email}
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-base text-[#14274E]"
            placeholder="name@example.com"
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-base font-semibold text-[#14274E] mb-2">
            {t.auth.password}
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 pr-12 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-base text-[#14274E]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#4A5568] hover:text-[#14274E] min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="mt-1 text-sm text-[#4A5568]">{t.auth.minPasswordHint}</p>
        </div>

        <div>
          <label htmlFor="signup-confirm" className="block text-base font-semibold text-[#14274E] mb-2">
            {t.auth.confirmPassword}
          </label>
          <div className="relative">
            <input
              id="signup-confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3.5 pr-12 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-base text-[#14274E]"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? t.auth.hidePassword : t.auth.showPassword}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#4A5568] hover:text-[#14274E] min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 px-6 rounded-xl bg-[#D49425] text-[#0E1C38] font-bold text-lg hover:bg-[#c2841b] disabled:opacity-60 transition-colors min-h-[52px]"
        >
          {submitting ? '...' : t.auth.signupButton}
        </button>

        <p className="text-center text-base text-[#4A5568] pt-2">
          {t.auth.hasAccount}{' '}
          <Link to="/login" className="font-bold text-[#14274E] hover:underline">
            {t.auth.goToLogin}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export const ForgotPasswordPage: React.FC = () => {
  const { user, t } = useAuth();
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [issuedCode, setIssuedCode] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await apiFetch<{ verificationCode: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setIssuedCode(data.verificationCode);
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError(t.auth.errPasswordMin);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.auth.errPasswordMatch);
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword,
          confirmPassword,
        }),
      });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle}>
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 p-4 rounded-xl bg-[#FDF0F0] border border-[#C53030]/30 text-[#9B2C2C] text-base font-medium"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {step === 'request' && (
        <form onSubmit={handleRequestCode} className="space-y-5">
          <div>
            <label htmlFor="forgot-email" className="block text-base font-semibold text-[#14274E] mb-2">
              {t.auth.email}
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-base text-[#14274E]"
              placeholder="name@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-xl bg-[#14274E] text-white font-bold text-lg hover:bg-[#0E1C38] min-h-[52px]"
          >
            {submitting ? '...' : t.auth.sendCodeButton}
          </button>
          <p className="text-center text-base">
            <Link to="/login" className="font-semibold text-[#14274E] hover:underline">
              {t.auth.goToLogin}
            </Link>
          </p>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleReset} className="space-y-5">
          {issuedCode && (
            <div className="p-4 rounded-xl bg-[#FEF8EA] border border-[#D49425] text-[#14274E]">
              <p className="text-sm font-medium">{t.auth.codeSentNotice}</p>
              <p className="mt-1 font-numeric text-2xl font-bold tracking-widest">{issuedCode}</p>
            </div>
          )}

          <div>
            <label htmlFor="reset-code" className="block text-base font-semibold text-[#14274E] mb-2">
              {t.auth.verificationCode}
            </label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-lg font-numeric text-[#14274E]"
              placeholder="123456"
            />
          </div>

          <div>
            <label htmlFor="reset-pass" className="block text-base font-semibold text-[#14274E] mb-2">
              {t.auth.newPassword}
            </label>
            <div className="relative">
              <input
                id="reset-pass"
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-base text-[#14274E]"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? t.auth.hidePassword : t.auth.showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#4A5568]"
              >
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reset-confirm" className="block text-base font-semibold text-[#14274E] mb-2">
              {t.auth.confirmPassword}
            </label>
            <input
              id="reset-confirm"
              type={showNew ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-base text-[#14274E]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-xl bg-[#D49425] text-[#0E1C38] font-bold text-lg hover:bg-[#c2841b] min-h-[52px]"
          >
            {submitting ? '...' : t.auth.resetButton}
          </button>
        </form>
      )}

      {step === 'done' && (
        <div className="space-y-6 text-center py-4">
          <CheckCircle2 className="w-14 h-14 text-[#2F855A] mx-auto" aria-hidden="true" />
          <p className="text-lg font-semibold text-[#14274E]">
            {t.auth.passwordUpdated}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full py-4 px-6 rounded-xl bg-[#14274E] text-white font-bold text-lg hover:bg-[#0E1C38] min-h-[52px]"
          >
            {t.auth.goToLogin}
          </Link>
        </div>
      )}
    </AuthShell>
  );
};
