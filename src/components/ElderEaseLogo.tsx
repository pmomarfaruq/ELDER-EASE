import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  taglineText?: string;
}

export const ElderEaseLogo: React.FC<LogoProps> = ({
  size = 'md',
  showTagline = false,
  taglineText = 'A Little Help. A Lot More Independence.',
}) => {
  const iconSize = size === 'sm' ? 34 : size === 'lg' ? 52 : 42;
  const wordSize =
    size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl';

  return (
    <div className="inline-flex items-center gap-3 shrink-0">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Warm Gold House Outline */}
        <path
          d="M8 29L32 9L56 29"
          stroke="#D49425"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 25V53C14 54.6569 15.3431 56 17 56H47C48.6569 56 50 54.6569 50 53V25"
          stroke="#D49425"
          strokeWidth="3.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#FEF8EA"
          fillOpacity="0.45"
        />
        {/* Chimney detail */}
        <path d="M44 13V19" stroke="#D49425" strokeWidth="3.8" strokeLinecap="round" />
        {/* Two Senior Figures in Navy Blue */}
        <circle cx="25.5" cy="31.5" r="3.8" fill="#14274E" />
        <path
          d="M19.5 49V41.5C19.5 38.7 21.7 36.5 24.5 36.5H26.5C29.3 36.5 31.5 38.7 31.5 41.5V49"
          fill="#14274E"
        />
        <circle cx="38.5" cy="31.5" r="3.8" fill="#14274E" />
        <path
          d="M32.5 49V41.5C32.5 38.7 34.7 36.5 37.5 36.5H39.5C42.3 36.5 44.5 38.7 44.5 41.5V49"
          fill="#14274E"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span className={`font-display font-extrabold tracking-tight ${wordSize} whitespace-nowrap`}>
          <span className="text-[#14274E]">Elder</span>
          <span className="text-[#D49425]">Ease</span>
        </span>
        {showTagline && (
          <span className="text-xs italic text-[#4A5568] mt-1">
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
};
