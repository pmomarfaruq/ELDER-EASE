import React, { useMemo, useState } from 'react';
import { HealthRecord } from '../types';
import { useAuth } from '../context/AuthContext';

type ChartMetric = 'bp' | 'sugar' | 'weight';

interface HealthChartsProps {
  records: HealthRecord[];
}

export const HealthCharts: React.FC<HealthChartsProps> = ({ records }) => {
  const { language, t } = useAuth();
  const [metric, setMetric] = useState<ChartMetric>('bp');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sortedPoints = useMemo(() => {
    const asc = [...records].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
    if (metric === 'bp') {
      return asc.filter((r) => r.systolic !== null && r.diastolic !== null);
    }
    if (metric === 'sugar') {
      return asc.filter((r) => r.blood_sugar !== null);
    }
    return asc.filter((r) => r.weight_kg !== null);
  }, [records, metric]);

  const locale = language === 'ml' ? 'ml-IN' : 'en-US';
  const formatShortDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };
  const formatFullDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Chart dimensions
  const width = 680;
  const height = 260;
  const padLeft = 48;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 38;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const { minY, maxY } = useMemo(() => {
    if (sortedPoints.length === 0) return { minY: 0, maxY: 100 };
    const vals: number[] = [];
    for (const p of sortedPoints) {
      if (metric === 'bp') {
        if (p.systolic !== null) vals.push(p.systolic);
        if (p.diastolic !== null) vals.push(p.diastolic);
      } else if (metric === 'sugar') {
        if (p.blood_sugar !== null) vals.push(p.blood_sugar);
      } else if (p.weight_kg !== null) {
        vals.push(p.weight_kg);
      }
    }
    const rawMin = Math.min(...vals);
    const rawMax = Math.max(...vals);
    const pad = Math.max(10, Math.round((rawMax - rawMin) * 0.2));
    return {
      minY: Math.max(0, Math.floor((rawMin - pad) / 5) * 5),
      maxY: Math.ceil((rawMax + pad) / 5) * 5,
    };
  }, [sortedPoints, metric]);

  const getX = (index: number, total: number) => {
    if (total <= 1) return padLeft + innerW / 2;
    return padLeft + (index / (total - 1)) * innerW;
  };

  const getY = (value: number) => {
    const span = maxY - minY || 1;
    return padTop + innerH - ((value - minY) / span) * innerH;
  };

  const activePoint = activeIndex !== null ? sortedPoints[activeIndex] : sortedPoints[sortedPoints.length - 1];

  return (
    <div className="ee-card bg-white rounded-3xl border border-[#E6DFD3] p-6 sm:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[#14274E]">
          {t.health.chartTitle}
        </h2>

        <div className="inline-flex p-1 rounded-xl bg-[#FAF7F2] border border-[#E6DFD3] self-start">
          {(
            [
              { id: 'bp', label: t.health.tabBP },
              { id: 'sugar', label: t.health.tabSugar },
              { id: 'weight', label: t.health.tabWeight },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMetric(tab.id);
                setActiveIndex(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap min-h-[40px] ${
                metric === tab.id
                  ? 'bg-[#14274E] text-white'
                  : 'text-[#4A5568] hover:text-[#14274E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {sortedPoints.length === 0 ? (
        <div className="rounded-2xl bg-[#FAF7F2] border border-dashed border-[#E6DFD3] p-8 text-center">
          <p className="text-base text-[#4A5568]">{t.health.noChartData}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Point Summary Readout */}
          {activePoint && (
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-[#EEF4FD] border border-[#E6DFD3]">
              <div className="flex flex-wrap items-center gap-4">
                {metric === 'bp' && (
                  <p className="font-numeric text-xl font-bold text-[#14274E]">
                    {activePoint.systolic}/{activePoint.diastolic} <span className="text-sm font-sans font-normal text-[#4A5568]">mmHg</span>
                  </p>
                )}
                {metric === 'sugar' && (
                  <p className="font-numeric text-xl font-bold text-[#14274E]">
                    {activePoint.blood_sugar} <span className="text-sm font-sans font-normal text-[#4A5568]">mg/dL · {activePoint.sugar_context}</span>
                  </p>
                )}
                {metric === 'weight' && (
                  <p className="font-numeric text-xl font-bold text-[#14274E]">
                    {activePoint.weight_kg} <span className="text-sm font-sans font-normal text-[#4A5568]">kg</span>
                  </p>
                )}
                {activePoint.heart_rate !== null && (
                  <p className="font-numeric text-sm font-semibold text-[#4A5568]">
                    HR: {activePoint.heart_rate} bpm
                  </p>
                )}
              </div>
              <p className="font-numeric text-sm text-[#4A5568]">
                {formatFullDate(activePoint.recorded_at)}
              </p>
            </div>
          )}

          {/* Responsive Interactive SVG Chart */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full min-w-[460px] h-auto select-none"
              role="img"
              aria-label={t.health.chartTitle}
            >
              {/* Horizontal grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padTop + innerH * (1 - ratio);
                const labelVal = Math.round(minY + (maxY - minY) * ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={width - padRight}
                      y2={y}
                      stroke="#E6DFD3"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-[#4A5568] text-[11px] font-numeric"
                    >
                      {labelVal}
                    </text>
                  </g>
                );
              })}

              {/* Line paths */}
              {metric === 'bp' && sortedPoints.length > 1 && (
                <>
                  <polyline
                    fill="none"
                    stroke="#14274E"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={sortedPoints
                      .map((p, i) => `${getX(i, sortedPoints.length)},${getY(p.systolic!)}`)
                      .join(' ')}
                  />
                  <polyline
                    fill="none"
                    stroke="#D49425"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={sortedPoints
                      .map((p, i) => `${getX(i, sortedPoints.length)},${getY(p.diastolic!)}`)
                      .join(' ')}
                  />
                </>
              )}

              {metric === 'sugar' && sortedPoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#0E7490"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sortedPoints
                    .map((p, i) => `${getX(i, sortedPoints.length)},${getY(p.blood_sugar!)}`)
                    .join(' ')}
                />
              )}

              {metric === 'weight' && sortedPoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#2F855A"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sortedPoints
                    .map((p, i) => `${getX(i, sortedPoints.length)},${getY(p.weight_kg!)}`)
                    .join(' ')}
                />
              )}

              {/* Interactive Data Points */}
              {sortedPoints.map((p, i) => {
                const cx = getX(i, sortedPoints.length);
                const isSelected = activePoint?.id === p.id;
                return (
                  <g
                    key={p.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => setActiveIndex(i)}
                  >
                    {metric === 'bp' && (
                      <>
                        <circle
                          cx={cx}
                          cy={getY(p.systolic!)}
                          r={isSelected ? 7 : 5}
                          fill="#14274E"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                        <circle
                          cx={cx}
                          cy={getY(p.diastolic!)}
                          r={isSelected ? 7 : 5}
                          fill="#D49425"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                      </>
                    )}
                    {metric === 'sugar' && (
                      <circle
                        cx={cx}
                        cy={getY(p.blood_sugar!)}
                        r={isSelected ? 7 : 5}
                        fill="#0E7490"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                    )}
                    {metric === 'weight' && (
                      <circle
                        cx={cx}
                        cy={getY(p.weight_kg!)}
                        r={isSelected ? 7 : 5}
                        fill="#2F855A"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                    )}

                    {/* X-axis label */}
                    {(sortedPoints.length <= 7 ||
                      i === 0 ||
                      i === sortedPoints.length - 1 ||
                      i % Math.ceil(sortedPoints.length / 6) === 0) && (
                      <text
                        x={cx}
                        y={height - 10}
                        textAnchor="middle"
                        className="fill-[#4A5568] text-[11px] font-numeric"
                      >
                        {formatShortDate(p.recorded_at)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Chart Legend */}
          {metric === 'bp' && (
            <div className="flex items-center gap-6 text-sm font-semibold text-[#4A5568]">
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#14274E]" aria-hidden="true" />
                <span>{t.health.systolic}</span>
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#D49425]" aria-hidden="true" />
                <span>{t.health.diastolic}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
