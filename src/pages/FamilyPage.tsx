import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Phone,
  Send,
  ShieldCheck,
  Pencil,
  Trash2,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { FamilyMember, FamilyMessage } from '../types';

interface SharedPreviewData {
  member: FamilyMember;
  health: Array<{
    id: string;
    systolic: number | null;
    diastolic: number | null;
    blood_sugar: number | null;
    heart_rate: number | null;
    weight_kg: number | null;
    recorded_at: string;
  }> | null;
  medicines: Array<{
    id: string;
    medicine_name: string;
    dosage: string;
    schedule_time: string;
  }> | null;
  appointments: Array<{
    id: string;
    doctor_name: string;
    hospital_name: string;
    appointment_date: string;
    appointment_time: string;
  }> | null;
  locationAllowed: boolean;
}

export const FamilyPage: React.FC = () => {
  const { language, t } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Add/Edit Member Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');

  // Messaging
  const [messageText, setMessageText] = useState('');
  const [senderMode, setSenderMode] = useState<'senior' | 'family'>('senior');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Shared preview modal
  const [previewData, setPreviewData] = useState<SharedPreviewData | null>(null);

  const loadFamily = async () => {
    try {
      const data = await apiFetch<{ members: FamilyMember[]; messages: FamilyMessage[] }>('/api/family');
      setMembers(data.members);
      setMessages(data.messages);
      if (data.members.length > 0) {
        setSelectedMemberId((prev) =>
          prev && data.members.some((m) => m.id === prev) ? prev : data.members[0].id
        );
      } else {
        setSelectedMemberId(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamily();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setRelationship('');
    setPhone('');
    setEmail('');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (m: FamilyMember) => {
    setEditingId(m.id);
    setName(m.name);
    setRelationship(m.relationship);
    setPhone(m.phone);
    setEmail(m.email || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim() || !relationship.trim() || !phone.trim()) {
      setFormError(t.family.errRequired);
      return;
    }
    try {
      const payload = {
        name: name.trim(),
        relationship: relationship.trim(),
        phone: phone.trim(),
        email: email.trim(),
      };
      if (editingId) {
        await apiFetch(`/api/family/members/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        const created = await apiFetch<{ member: FamilyMember }>('/api/family/members', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSelectedMemberId(created.member.id);
      }
      setModalOpen(false);
      await loadFamily();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save family member.');
    }
  };

  const handleDeleteMember = async (id: string) => {
    await apiFetch(`/api/family/members/${id}`, { method: 'DELETE' });
    await loadFamily();
  };

  const handleTogglePermission = async (
    member: FamilyMember,
    field: 'share_health' | 'share_medicines' | 'share_appointments' | 'share_location'
  ) => {
    const nextValue = member[field] === 1 ? false : true;
    const data = await apiFetch<{ member: FamilyMember }>(`/api/family/members/${member.id}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify({ [field]: nextValue }),
    });
    setMembers((prev) => prev.map((m) => (m.id === member.id ? data.member : m)));
  };

  const handleOpenPreview = async (memberId: string) => {
    const data = await apiFetch<{ preview: SharedPreviewData }>(
      `/api/family/members/${memberId}/shared-preview`
    );
    setPreviewData(data.preview);
  };

  const handleSendMessage = async (textOverride?: string) => {
    if (!selectedMemberId) return;
    const content = (textOverride ?? messageText).trim();
    if (!content) return;
    setSendingMsg(true);
    try {
      const data = await apiFetch<{ message: FamilyMessage }>('/api/family/messages', {
        method: 'POST',
        body: JSON.stringify({
          family_member_id: selectedMemberId,
          message_text: content,
          sender_role: textOverride ? 'senior' : senderMode,
        }),
      });
      setMessages((prev) => [...prev, data.message]);
      if (!textOverride) {
        setMessageText('');
      }
    } finally {
      setSendingMsg(false);
    }
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId) || null;
  const activeThread = messages.filter((m) => m.family_member_id === selectedMemberId);
  const locale = language === 'ml' ? 'ml-IN' : 'en-US';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#14274E]">
            {t.family.title}
          </h1>
          <p className="mt-1 text-base sm:text-lg text-[#4A5568]">{t.family.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#14274E] text-white font-bold text-base hover:bg-[#0E1C38] min-h-[50px] shrink-0"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span>{t.family.addMember}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#4A5568]">{t.loadingText}</div>
      ) : members.length === 0 ? (
        <div className="ee-card rounded-3xl bg-[#EFF8F0] border border-[#E6DFD3] p-10 text-center space-y-4">
          <Users className="w-12 h-12 text-[#2F855A] mx-auto" aria-hidden="true" />
          <h2 className="font-display text-2xl font-bold text-[#14274E]">{t.family.emptyState}</h2>
          <p className="text-base text-[#4A5568] max-w-md mx-auto">{t.family.emptySub}</p>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#14274E] text-white font-bold min-h-[48px]"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span>{t.family.addMember}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Family Contacts & Sharing Controls */}
          <div className="lg:col-span-5 space-y-4">
            {members.map((member) => {
              const isSelected = member.id === selectedMemberId;
              return (
                <div
                  key={member.id}
                  onClick={() => setSelectedMemberId(member.id)}
                  className={`ee-card rounded-3xl p-5 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-2 border-[#14274E] shadow-sm'
                      : 'bg-white/80 border-[#E6DFD3] hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#2F855A]">{member.relationship}</p>
                      <h2 className="font-display text-xl font-bold text-[#14274E]">{member.name}</h2>
                      <p className="font-numeric text-sm font-semibold text-[#4A5568] mt-0.5">
                        {member.phone}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`tel:${member.phone}`}
                        aria-label={`${t.family.call} ${member.name}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2F855A] text-white text-sm font-bold min-h-[40px]"
                      >
                        <Phone className="w-4 h-4" aria-hidden="true" />
                        <span>{t.family.call}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => openEdit(member)}
                        aria-label={t.health.edit}
                        className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E6DFD3] text-[#14274E]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member.id)}
                        aria-label={t.health.delete}
                        className="p-2 rounded-xl bg-[#FDF0F0] text-[#9B2C2C]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Permission Toggles */}
                  <div
                    className="mt-4 pt-4 border-t border-[#E6DFD3] space-y-2.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-xs font-bold text-[#4A5568] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#D49425]" aria-hidden="true" />
                      <span>{t.family.sharingTitle}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { field: 'share_health', label: t.family.shareHealth },
                          { field: 'share_medicines', label: t.family.shareMedicines },
                          { field: 'share_appointments', label: t.family.shareAppointments },
                          { field: 'share_location', label: t.family.shareLocation },
                        ] as const
                      ).map(({ field, label }) => {
                        const enabled = member[field] === 1;
                        return (
                          <label
                            key={field}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                              enabled
                                ? 'bg-[#EFF8F0] border-[#2F855A]/40 text-[#14274E]'
                                : 'bg-[#FAF7F2] border-[#E6DFD3] text-[#4A5568]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => handleTogglePermission(member, field)}
                              className="w-4 h-4 accent-[#2F855A]"
                            />
                            <span className="leading-tight">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(member.id)}
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-[#14274E] hover:underline py-1"
                    >
                      <Eye className="w-4 h-4" aria-hidden="true" />
                      <span>{t.family.previewShared}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Simple Family Messaging Interface */}
          <div className="lg:col-span-7 ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-7 flex flex-col min-h-[480px]">
            {!selectedMember ? (
              <div className="flex-1 flex items-center justify-center text-center text-[#4A5568]">
                <p>{t.family.selectMemberPrompt}</p>
              </div>
            ) : (
              <>
                <div className="pb-4 border-b border-[#E6DFD3] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#EFF8F0] text-[#2F855A] flex items-center justify-center">
                      <MessageSquare className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold text-[#14274E]">
                        {t.family.messagesTitle} — {selectedMember.name}
                      </h2>
                      <p className="text-sm text-[#4A5568]">
                        {selectedMember.relationship} · {selectedMember.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conversation Thread */}
                <div className="flex-1 py-5 space-y-3 overflow-y-auto max-h-[340px]">
                  {activeThread.length === 0 ? (
                    <div className="rounded-2xl bg-[#FAF7F2] border border-dashed border-[#E6DFD3] p-8 text-center">
                      <p className="text-base text-[#4A5568]">{t.family.noMessagesYet}</p>
                    </div>
                  ) : (
                    activeThread.map((msg) => {
                      const isSenior = msg.sender_role === 'senior';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isSenior ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-base ${
                              isSenior
                                ? 'bg-[#14274E] text-white'
                                : 'bg-[#EFF8F0] border border-[#2F855A]/30 text-[#14274E]'
                            }`}
                          >
                            <p className="text-xs font-bold opacity-80 mb-0.5">{msg.sender_name}</p>
                            <p>{msg.message_text}</p>
                          </div>
                          <span className="mt-1 text-xs font-numeric text-[#4A5568]">
                            {new Date(msg.created_at).toLocaleString(locale, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* One-Tap Quick Updates for Seniors */}
                <div className="pt-4 border-t border-[#E6DFD3] space-y-3">
                  <p className="text-sm font-bold text-[#14274E]">{t.family.quickUpdatesLabel}</p>
                  <div className="flex flex-wrap gap-2">
                    {t.family.quickUpdates.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={sendingMsg}
                        onClick={() => handleSendMessage(preset)}
                        className="px-3.5 py-2 rounded-xl bg-[#FEF8EA] border border-[#D49425]/40 text-sm font-semibold text-[#14274E] hover:bg-[#D49425] hover:text-[#0E1C38] transition-colors min-h-[40px] text-left"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Role switcher to send as senior or record family reply */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSenderMode('senior')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        senderMode === 'senior'
                          ? 'bg-[#14274E] text-white'
                          : 'bg-[#FAF7F2] text-[#4A5568]'
                      }`}
                    >
                      {t.family.sendMessage}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSenderMode('family')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        senderMode === 'family'
                          ? 'bg-[#2F855A] text-white'
                          : 'bg-[#FAF7F2] text-[#4A5568]'
                      }`}
                    >
                      {t.family.logFamilyReply}
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={
                        senderMode === 'family'
                          ? `${t.family.familyReplyPlaceholder} ${selectedMember.name}...`
                          : t.family.typeMessagePlaceholder
                      }
                      className="flex-1 px-4 py-3 rounded-xl border border-[#E6DFD3] bg-[#FAF7F2] text-base"
                    />
                    <button
                      type="submit"
                      disabled={sendingMsg || !messageText.trim()}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#14274E] text-white font-bold disabled:opacity-50 min-h-[48px] shrink-0"
                    >
                      <Send className="w-4 h-4" aria-hidden="true" />
                      <span className="hidden sm:inline">{t.family.sendMessage}</span>
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="ee-card bg-white rounded-3xl border border-[#E6DFD3] max-w-lg w-full p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-2xl font-bold text-[#14274E]">
              {editingId ? t.family.editMember : t.family.addMember}
            </h2>
            {formError && (
              <div className="p-3 rounded-xl bg-[#FDF0F0] text-[#9B2C2C] text-sm font-semibold">
                {formError}
              </div>
            )}
            <form onSubmit={handleSaveMember} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#14274E] mb-1">
                  {t.family.memberName}
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
                  {t.family.relationship}
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
                  {t.family.phone}
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
                  {t.family.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  {t.health.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Summary Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="ee-card bg-white rounded-3xl border border-[#E6DFD3] max-w-lg w-full p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-2xl font-bold text-[#14274E]">
              {t.family.previewShared}: {previewData.member.name}
            </h2>
            <div className="space-y-3 text-sm text-[#4A5568]">
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E6DFD3]">
                <p className="font-bold text-[#14274E] mb-1">{t.family.shareHealth}</p>
                {previewData.health === null ? (
                  <p>{t.family.notShared}</p>
                ) : previewData.health.length === 0 ? (
                  <p>{t.health.emptyState}</p>
                ) : (
                  previewData.health.map((h) => (
                    <p key={h.id} className="font-numeric">
                      {h.systolic ? `${t.health.bpShort} ${h.systolic}/${h.diastolic} ` : ''}
                      {h.blood_sugar ? `${t.health.sugarShort} ${h.blood_sugar} ` : ''}
                      {h.weight_kg ? `${t.health.weightShort} ${h.weight_kg} kg` : ''}
                    </p>
                  ))
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E6DFD3]">
                <p className="font-bold text-[#14274E] mb-1">{t.family.shareMedicines}</p>
                {previewData.medicines === null ? (
                  <p>{t.family.notShared}</p>
                ) : previewData.medicines.length === 0 ? (
                  <p>{t.medicines.emptyState}</p>
                ) : (
                  previewData.medicines.map((m) => (
                    <p key={m.id}>
                      {m.medicine_name} ({m.dosage}) · {m.schedule_time}
                    </p>
                  ))
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E6DFD3]">
                <p className="font-bold text-[#14274E] mb-1">{t.family.shareAppointments}</p>
                {previewData.appointments === null ? (
                  <p>{t.family.notShared}</p>
                ) : previewData.appointments.length === 0 ? (
                  <p>{t.appointments.emptyState}</p>
                ) : (
                  previewData.appointments.map((a) => (
                    <p key={a.id}>
                      {a.doctor_name} · {a.appointment_date} {a.appointment_time}
                    </p>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="px-6 py-3 rounded-xl bg-[#14274E] text-white font-bold min-h-[48px]"
              >
                {t.okButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
