import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HelpPage: React.FC = () => {
  const { t } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FEF8EA] border border-[#E6DFD3] flex items-center justify-center shrink-0">
          <HelpCircle className="w-7 h-7 text-[#D49425]" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#14274E]">
            {t.help.title}
          </h1>
          <p className="mt-1 text-base sm:text-lg text-[#4A5568]">{t.help.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {t.help.sections.map((sec) => (
          <div
            key={sec.title}
            className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-7 space-y-2.5"
          >
            <h2 className="font-display text-xl font-bold text-[#14274E]">{sec.title}</h2>
            <p className="text-base text-[#4A5568] leading-relaxed">{sec.body}</p>
          </div>
        ))}
      </div>

      <p className="text-sm font-semibold text-[#4A5568] pt-2">{t.designerCredit}</p>
    </div>
  );
};
