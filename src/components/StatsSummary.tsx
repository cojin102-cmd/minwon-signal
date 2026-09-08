import React from 'react';
import { TrendInfo } from '../types';

interface StatsSummaryProps {
  total: number;
  cautionCount: number;
  warningCount: number;
  dangerCount: number;
  avgTemp: number;
  trendInfo: TrendInfo;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({
  total,
  cautionCount,
  warningCount,
  dangerCount,
  avgTemp,
  trendInfo,
}) => {
  return (
    <>
      {/* 3연속 상승 시 경고 배너 */}
      {trendInfo.isRising && (
        <div
          id="trendWarningBanner"
          className="flex items-center justify-between gap-3 bg-[#fff6e8] border-[1.5px] border-[#fed7aa] rounded-2xl px-5 py-3.5 mb-4 text-[#9a3412] transition-all"
        >
          <div className="flex items-center gap-2.5 font-bold text-[14px]">
            <span className="text-[18px]">🔥</span>
            <span>
              <strong>「감정 상승 추세」 경고</strong> : 최근 민원의 감정 점수가 연속 상승 중입니다. 부서 차원의 모니터링이 필요합니다.
            </span>
          </div>
          <span
            id="trendConsecutiveCount"
            className="bg-[#ea580c] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm"
          >
            {trendInfo.count}건 연속 상승
          </span>
        </div>
      )}

      {/* 요약 수치 카드 5종 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-5">
        {/* 전체 민원 */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.03] flex flex-col justify-between">
          <div className="text-[13px] font-semibold text-[#6b7684] mb-2 flex items-center gap-1.5">
            📁 전체 민원 수
          </div>
          <div className="text-[26px] font-extrabold tracking-tight text-[#191f28]">
            <span id="statTotal">{total}</span>
            <span className="text-[14px] font-medium text-[#6b7684] ml-1">건</span>
          </div>
        </div>

        {/* 주의 */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.03] flex flex-col justify-between">
          <div className="text-[13px] font-semibold text-[#6b7684] mb-2 flex items-center gap-1.5">
            🟡 주의 (40~59)
          </div>
          <div className="text-[26px] font-extrabold tracking-tight text-[#ff9800]">
            <span id="statCaution">{cautionCount}</span>
            <span className="text-[14px] font-medium text-[#6b7684] ml-1">건</span>
          </div>
        </div>

        {/* 경계 */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.03] flex flex-col justify-between">
          <div className="text-[13px] font-semibold text-[#6b7684] mb-2 flex items-center gap-1.5">
            🟠 경계 (60~79)
          </div>
          <div className="text-[26px] font-extrabold tracking-tight text-[#f75532]">
            <span id="statWarning">{warningCount}</span>
            <span className="text-[14px] font-medium text-[#6b7684] ml-1">건</span>
          </div>
        </div>

        {/* 긴급 */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.03] flex flex-col justify-between">
          <div className="text-[13px] font-semibold text-[#6b7684] mb-2 flex items-center gap-1.5">
            🔴 긴급 (80~100)
          </div>
          <div className="text-[26px] font-extrabold tracking-tight text-[#e9253c]">
            <span id="statDanger">{dangerCount}</span>
            <span className="text-[14px] font-medium text-[#6b7684] ml-1">건</span>
          </div>
        </div>

        {/* 평균 감정 온도 */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.03] flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="text-[13px] font-semibold text-[#6b7684] mb-2 flex items-center gap-1.5">
            🌡️ 평균 감정 온도
          </div>
          <div className="text-[26px] font-extrabold tracking-tight text-[#3182f6]">
            <span id="statAvgTemp">{avgTemp}</span>
            <span className="text-[14px] font-medium text-[#6b7684] ml-1">℃</span>
          </div>
        </div>
      </div>
    </>
  );
};
