import React, { useEffect, useState } from 'react';
import {
  Siren,
  Phone,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { EmergencyContact, SosAlert } from '../types';

export const SosPage: React.FC = () => {
  const { language, t } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Contact modal
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [contactError, setContactError] = useState('');

  // SOS Confirmation Modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareLocation, setShareLocation] = useState(false);
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'ready' | 'denied'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sosNote, setSosNote] = useState('');
  const [sendingSos, setSendingSos] = useState(false);
  const [latestDispatched, setLatestDispatched] = useState<SosAlert | null>(null);

  const loadSos = async () => {
    try {
      const data = await apiFetch<{ contacts: EmergencyContact[]; alerts: SosAlert[] }>('/api/sos');
      setContacts(data.contacts);
      setAlerts(data.alerts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSos();
  }, []);

  const openAddContact = () => {
    setEditingId(null);
    setName('');
    setRelationship('');
    setPhone('');
    setEmail('');
    setIsPrimary(contacts.length === 0);
    setContactError('');
    setContactModalOpen(true);
  };

  const openEditContact = (c: EmergencyContact) => {
    setEditingId(c.id);
    setName(c.name);
    setRelationship(c.relationship);
    setPhone(c.phone);
    setEmail(c.email || '');
    setIsPrimary(c.is_primary === 1);
    setContactError('');
    setContactModalOpen(true);
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');
    if (!name.trim() || !relationship.trim() || !phone.trim()) {
      setContactError('Name, relationship, and phone number are required.');
      return;
    }
    try {
      const payload = {
        name: name.trim(),
        relationship: relationship.trim(),
        phone: phone.trim(),
        email: email.trim(),
        is_primary: isPrimary,
      };
      if (editingId) {
        await apiFetch(`/api/sos/contacts/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/sos/contacts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setContactModalOpen(false);
      await loadSos();
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Unable to save contact.');
    }
  };

  const handleDeleteContact = async (id: string) => {
    await apiFetch(`/api/sos/contacts/${id}`, { method: 'DELETE' });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const openSosConfirmation = () => {
    setShareLocation(false);
    setLocationState('idle');
    setCoords(null);
    setSosNote('');
    setConfirmOpen(true);
  };

  const handleToggleLocation = (checked: boolean) => {
    setShareLocation(checked);
    if (!checked) {
      setLocationState('idle');
      setCoords(null);
      return;
    }
    if (!('geolocation' in navigator)) {
      setLocationState('denied');
      return;
    }
    setLocationState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setLocationState('ready');
      },
      () => {
        setLocationState('denied');
        setCoords(null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleConfirmSendSos = async () => {
    setSendingSos(true);
    try {
      const locationLabel =
        shareLocation && coords
          ? `${coords.lat}, ${coords.lng}`
          : '';
      const data = await apiFetch<{ alert: SosAlert }>('/api/sos/trigger', {
        method: 'POST',
        body: JSON.stringify({
          location_shared: Boolean(shareLocation && coords),
          latitude: coords ? coords.lat : null,
          longitude: coords ? coords.lng : null,
          location_label: locationLabel,
          notes: sosNote.trim(),
        }),
      });
      setConfirmOpen(false);
      setLatestDispatched(data.alert);
      await loadSos();
    } finally {
      setSendingSos(false);
    }
  };

  const handleResolveAlert = async (id: string) => {
    await apiFetch(`/api/sos/alerts/${id}/resolve`, { method: 'PATCH' });
    await loadSos();
  };

  const locale = language === 'ml' ? 'ml-IN' : 'en-US';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#14274E]">
            {t.sos.title}
          </h1>
          <p className="mt-1 text-base sm:text-lg text-[#4A5568]">{t.sos.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={openAddContact}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#14274E] text-white font-bold text-base hover:bg-[#0E1C38] min-h-[50px] shrink-0"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span>{t.sos.addContact}</span>
        </button>
      </div>

      {/* Prominent SOS Trigger Card */}
      <section className="ee-card rounded-3xl bg-[#FDF0F0] border-2 border-[#C53030]/35 p-6 sm:p-10 text-center space-y-5">
        <button
          type="button"
          onClick={openSosConfirmation}
          className="w-full max-w-md mx-auto py-6 px-8 rounded-3xl bg-[#C53030] hover:bg-[#9B2C2C] text-white shadow-md flex flex-col items-center justify-center gap-2 transition-colors min-h-[120px]"
        >
          <Siren className="w-12 h-12" aria-hidden="true" />
          <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.sos.sosButtonLabel}
          </span>
        </button>
        <p className="text-base font-medium text-[#742A2A]">{t.sos.sosSubLabel}</p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <a
            href="tel:112"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#C53030]/40 text-[#9B2C2C] font-bold text-base hover:bg-[#fff5f5] min-h-[48px]"
          >
            <Phone className="w-5 h-5" aria-hidden="true" />
            <span>{t.sos.emergencyHelpline}</span>
          </a>
        </div>
      </section>

      {/* Post-Dispatch Confirmation Banner */}
      {latestDispatched && (
        <section
          role="status"
          className="ee-card rounded-3xl bg-[#EFF8F0] border border-[#2F855A]/40 p-6 space-y-3"
        >
          <div className="flex items-center gap-2.5 text-[#276749]">
            <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden="true" />
            <h2 className="font-display text-xl font-bold">{t.sos.alertSentSuccess}</h2>
          </div>
          <p className="text-sm font-numeric text-[#276749]">
            {new Date(latestDispatched.triggered_at).toLocaleString(locale)}
            {latestDispatched.location_shared === 1 && latestDispatched.location_label
              ? ` · GPS: ${latestDispatched.location_label}`
              : ''}
          </p>
          {contacts.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-1">
              {contacts.map((c) => (
                <a
                  key={c.id}
                  href={`tel:${c.phone}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2F855A] text-white font-bold text-sm min-h-[44px]"
                >
                  <Phone className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {t.sos.callNow}: {c.name} ({c.phone})
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Designated Emergency Contacts */}
      <section className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-7 space-y-5">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#14274E]">
          {t.sos.contactsTitle}
        </h2>

        {loading ? (
          <div className="py-8 text-center text-[#4A5568]">...</div>
        ) : contacts.length === 0 ? (
          <div className="rounded-2xl bg-[#FAF7F2] border border-[#E6DFD3] p-8 text-center space-y-4">
            <ShieldAlert className="w-11 h-11 text-[#C53030] mx-auto" aria-hidden="true" />
            <h3 className="font-display text-xl font-bold text-[#14274E]">
              {t.sos.emptyContacts}
            </h3>
            <p className="text-base text-[#4A5568] max-w-md mx-auto">
              {t.sos.emptyContactsSub}
            </p>
            <button
              type="button"
              onClick={openAddContact}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#14274E] text-white font-bold min-h-[48px]"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              <span>{t.sos.addContact}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-2xl bg-[#FAF7F2] border border-[#E6DFD3] p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-[#4A5568]">
                      <span>{contact.relationship}</span>
                      {contact.is_primary === 1 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-bold text-[#B57913]">{t.sos.primaryBadge}</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-display text-xl font-bold text-[#14274E] mt-0.5">
                      {contact.name}
                    </h3>
                    <p className="font-numeric text-base font-semibold text-[#14274E] mt-1">
                      {contact.phone}
                    </p>
                    {contact.email && (
                      <p className="text-sm text-[#4A5568]">{contact.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditContact(contact)}
                      aria-label={t.health.edit}
                      className="p-2 rounded-xl bg-white border border-[#E6DFD3] text-[#14274E]"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteContact(contact.id)}
                      aria-label={t.health.delete}
                      className="p-2 rounded-xl bg-[#FDF0F0] text-[#9B2C2C]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <a
                  href={`tel:${contact.phone}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2F855A] text-white font-bold text-base hover:bg-[#276749] min-h-[48px]"
                >
                  <Phone className="w-5 h-5" aria-hidden="true" />
                  <span>{t.sos.callNow}</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SOS Alert History */}
      <section className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-7 space-y-4">
        <h2 className="font-display text-xl font-bold text-[#14274E]">
          {t.sos.alertsHistoryTitle}
        </h2>
        {alerts.length === 0 ? (
          <p className="text-base text-[#4A5568]">{t.sos.noAlertsYet}</p>
        ) : (
          <div className="divide-y divide-[#E6DFD3]">
            {alerts.map((al) => {
              let notifiedList: Array<{ name: string; phone: string }> = [];
              try {
                notifiedList = JSON.parse(al.notified_contacts_json || '[]');
              } catch {
                notifiedList = [];
              }
              return (
                <div
                  key={al.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="font-numeric text-sm font-bold text-[#14274E]">
                      {new Date(al.triggered_at).toLocaleString(locale)}
                      <span aria-hidden="true"> · </span>
                      <span className={al.status === 'resolved' ? 'text-[#2F855A]' : 'text-[#C53030]'}>
                        {al.status === 'resolved' ? t.sos.resolved : t.sos.activeAlert}
                      </span>
                    </p>
                    <p className="text-sm text-[#4A5568]">
                      {notifiedList.length > 0
                        ? notifiedList.map((c) => `${c.name} (${c.phone})`).join(', ')
                        : t.sos.noContactsWarning}
                    </p>
                    {al.location_shared === 1 && al.location_label && (
                      <p className="text-sm font-numeric text-[#0E7490] inline-flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" aria-hidden="true" />
                        <span>{al.location_label}</span>
                      </p>
                    )}
                    {al.notes && <p className="text-sm text-[#14274E]">{al.notes}</p>}
                  </div>
                  {al.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleResolveAlert(al.id)}
                      className="px-4 py-2.5 rounded-xl bg-[#EFF8F0] border border-[#2F855A]/30 text-[#276749] font-bold text-sm min-h-[42px] shrink-0"
                    >
                      {t.sos.markResolved}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SOS Confirmation Modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-confirm-heading"
        >
          <div className="ee-card bg-white rounded-3xl border-2 border-[#C53030] max-w-lg w-full p-6 sm:p-8 space-y-5 my-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-8 h-8 text-[#C53030] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h2 id="sos-confirm-heading" className="font-display text-2xl font-extrabold text-[#14274E]">
                  {t.sos.confirmTitle}
                </h2>
                <p className="mt-1 text-base text-[#4A5568]">{t.sos.confirmWarning}</p>
              </div>
            </div>

            {/* Designated contacts preview */}
            <div className="rounded-2xl bg-[#FAF7F2] border border-[#E6DFD3] p-4 space-y-2">
              <p className="text-sm font-bold text-[#14274E]">{t.sos.designatedListLabel}</p>
              {contacts.length === 0 ? (
                <p className="text-sm text-[#9B2C2C]">{t.sos.noContactsWarning}</p>
              ) : (
                <ul className="space-y-1.5">
                  {contacts.map((c) => (
                    <li key={c.id} className="text-base font-medium text-[#14274E] flex justify-between gap-2">
                      <span>
                        {c.name} ({c.relationship})
                      </span>
                      <span className="font-numeric font-bold">{c.phone}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Optional GPS location sharing with permission */}
            <div className="rounded-2xl bg-[#EEF4FD] border border-[#E6DFD3] p-4 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareLocation}
                  onChange={(e) => handleToggleLocation(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-[#14274E]"
                />
                <span className="text-base font-semibold text-[#14274E]">
                  {t.sos.shareLocationLabel}
                </span>
              </label>

              {locationState === 'loading' && (
                <p className="text-sm text-[#4A5568] pl-8">{t.sos.fetchingLocation}</p>
              )}
              {locationState === 'ready' && coords && (
                <p className="text-sm font-numeric font-bold text-[#2F855A] pl-8 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {t.sos.locationReady}: {coords.lat}, {coords.lng}
                  </span>
                </p>
              )}
              {locationState === 'denied' && (
                <p className="text-sm text-[#9B2C2C] pl-8">{t.sos.locationDenied}</p>
              )}
            </div>

            <div>
              <label htmlFor="sos-note-input" className="block text-sm font-semibold text-[#14274E] mb-1">
                {t.sos.sosNoteLabel}
              </label>
              <input
                id="sos-note-input"
                type="text"
                value={sosNote}
                onChange={(e) => setSosNote(e.target.value)}
                placeholder={t.sos.sosNotePlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-6 py-3.5 rounded-xl border border-[#E6DFD3] font-bold text-[#14274E] min-h-[50px]"
              >
                {t.sos.cancelBtn}
              </button>
              <button
                type="button"
                disabled={sendingSos}
                onClick={handleConfirmSendSos}
                className="px-6 py-3.5 rounded-xl bg-[#C53030] hover:bg-[#9B2C2C] text-white font-extrabold text-base min-h-[50px]"
              >
                {sendingSos ? '...' : t.sos.confirmSendBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="ee-card bg-white rounded-3xl border border-[#E6DFD3] max-w-lg w-full p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-2xl font-bold text-[#14274E]">
              {editingId ? t.sos.editContact : t.sos.addContact}
            </h2>
            {contactError && (
              <div className="p-3 rounded-xl bg-[#FDF0F0] text-[#9B2C2C] text-sm font-semibold">
                {contactError}
              </div>
            )}
            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#14274E] mb-1">
                  {t.sos.contactName}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14274E] mb-1">
                  {t.sos.relationship}
                </label>
                <input
                  type="text"
                  required
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14274E] mb-1">
                  {t.sos.phone}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] font-numeric"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#14274E] mb-1">
                  {t.sos.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2]"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-5 h-5 accent-[#14274E]"
                />
                <span className="text-base font-semibold text-[#14274E]">
                  {t.sos.primaryContact}
                </span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-[#E6DFD3] font-bold min-h-[48px]"
                >
                  {t.sos.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#14274E] text-white font-bold min-h-[48px]"
                >
                  {t.health.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
