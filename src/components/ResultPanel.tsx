import React from 'react';
import { ComplaintRecord } from '../types';

interface ResultPanelProps {
  data: ComplaintRecord | null;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({ data }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--step-danger, #e9253c)';
    if (score >= 60) return 'var(--step-warning, #f75532)';
    if (score >= 40) return 'var(--step-caution, #ff9800)';
    return 'var(--step-safe, #00b06b)';
  };

  const getGuideText = (step: string) => {
    switch (step) {
      case 'safe':
        return '표준 행정 절차에 맞춰 친절하고 명확하게 답변을 작성하세요.';
      case 'caution':
        return '처리 지연 사유를 정중히 설명하고 구체적인 처리 예정 일자를 고지하여 추가 감정 악화를 예방하세요.';
      case 'warning':
        return '팀장 및 부서장에게 사전 공유 후 관련 법령 근거를 면밀히 재검토하여 공식적인 어조로 답변을 준비하세요.';
      case 'danger':
        return "즉시 관리자에게 보고하십시오. 통화 시 '녹음 고지'를 즉각 실시하고, 물리적 방문 위협 시 청사 방호팀 및 경찰 연계 조치를 신속히 취하십시오.";
      default:
        return '일반적인 행정 절차에 따라 답변을 등록하세요.';
    }
  };

  const getStepDetails = (step: string) => {
    switch (step) {
      case 'safe':
        return {
          emoji: '🟢',
          title: '안정 단계 (0~39점)',
          desc: '통상적인 민원입니다. 표준 절차대로 응대하세요.',
          className: 'bg-[var(--step-safe-bg,#e6f7ef)] text-[var(--step-safe,#00b06b)]',
        };
      case 'caution':
        return {
          emoji: '🟡',
          title: '주의 단계 (40~59점)',
          desc: '경미한 불만 또는 지연 항의가 있습니다.',
          className: 'bg-[var(--step-caution-bg,#fff6e8)] text-[var(--step-caution,#ff9800)]',
        };
      case 'warning':
        return {
          emoji: '🟠',
          title: '경계 단계 (60~79점)',
          desc: '강한 격앙, 법적 조치 또는 상급 기관 제보 예고 민원입니다.',
          className: 'bg-[var(--step-warning-bg,#feeee9)] text-[var(--step-warning,#f75532)]',
        };
      case 'danger':
      default:
        return {
          emoji: '🔴',
          title: '긴급 단계 (80~100점)',
          desc: '극심한 폭언 또는 신변 위협이 감지된 초고위험 민원입니다.',
          className: 'bg-[var(--step-danger-bg,#fde8ea)] text-[var(--step-danger,#e9253c)]',
        };
    }
  };

  return (
    <section id="resultCard" className="bg-white rounded-[24px] p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.03]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[19px] font-bold text-[#191f28]">시그널 분석 결과</span>
        <span id="targetDeptBadge" className="text-[13px] text-[#8b95a1] font-medium">
          {data ? `부서: ${data.dept}` : ''}
        </span>
      </div>

      {!data ? (
        <div id="emptyView" className="text-center py-16 px-5 text-[#8b95a1]">
          <div className="text-[42px] mb-3 opacity-60">📊</div>
          <p className="text-[15px] leading-relaxed">
            민원 정보를 입력하고<br />
            <strong className="text-[#191f28]">[감정 분석 실행]</strong> 버튼을 눌러주세요.
          </p>
        </div>
      ) : (
        <div id="resultView" className="space-y-4">
          {/* 80점 이상 시 강조 배너 */}
          {(data.compositeScore >= 80 || data.step === 'danger') && (
            <div
              id="priorityAlertBanner"
              className="animate-pulse-alert bg-gradient-to-br from-[#e9253c] to-[#c01427] text-white rounded-[18px] p-4 sm:p-5 shadow-[0_8px_24px_rgba(233,37,60,0.28)]"
            >
              <div className="flex items-center gap-2.5 text-[17px] font-black tracking-tight">
                <span>🚨</span>
                <span>긴급 · 우선 대응 필요 (80점 이상)</span>
              </div>
              <div className="text-[13px] opacity-95 mt-1 leading-relaxed pl-7">
                민원인의 위험 수위가 매우 높습니다. 지체 없이 관리자에게 보고하고 필수 보호 조치를 시행하세요.
              </div>
            </div>
          )}

          {/* 위협 표현 감지 별도 경고 */}
          {(data.hasThreat || (data.detectedSignals && data.detectedSignals.some((s) => s.category === '위협'))) && (
            <div
              id="threatWarningBox"
              className="bg-[#fff0f2] border-[1.5px] border-[#ffccd2] rounded-2xl p-4 text-[#b91c1c]"
            >
              <div className="flex items-center gap-2 text-[14px] font-extrabold mb-1">
                <span>⚠️</span>
                <span>신체 및 신변 위협 표현 감지</span>
              </div>
              <div className="text-[13px] leading-relaxed text-[#991b1b]">
                폭력, 방화, 위해 등 직접적인 위협 표현이 식별되었습니다. 통화 녹음 고지를 시행하고 필요 시 청사 방호팀 및 경찰 연계 조치를 즉시 준비하십시오.
              </div>
            </div>
          )}

          {/* 욕설/비속어 감지 별도 경고 */}
          {(data.hasProfanity || (data.detectedSignals && data.detectedSignals.some((s) => s.category.includes('욕설')))) && (
            <div
              id="profanityWarningBox"
              className="bg-[#fff7ed] border-[1.5px] border-[#fed7aa] rounded-2xl p-4 text-[#c2410c]"
            >
              <div className="flex items-center gap-2 text-[14px] font-extrabold mb-1">
                <span>🤬</span>
                <span>욕설/비속어 감지</span>
              </div>
              <div className="text-[13px] leading-relaxed text-[#9a3412]">
                초성 욕설, 변형 비속어 또는 모욕적 표현이 식별되었습니다. 감정 강도 및 대응 단계가 상향 평가되었습니다.
              </div>
            </div>
          )}

          {/* 개편된 4단계 대응 배너 */}
          {(() => {
            const stepInfo = getStepDetails(data.step);
            return (
              <div
                id="stepBanner"
                className={`flex items-center justify-between rounded-[18px] p-4 sm:p-5 transition-all ${stepInfo.className}`}
              >
                <div className="flex items-center gap-3">
                  <span id="stepEmoji" className="text-[32px]">{stepInfo.emoji}</span>
                  <div>
                    <div id="stepName" className="text-[19px] font-extrabold">{stepInfo.title}</div>
                    <div id="stepDesc" className="text-[13px] mt-0.5 opacity-90">{stepInfo.desc}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 감정 강도 게이지 */}
          <div className="pt-2">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[14px] font-bold text-[#6b7684]">감정 강도 (분노/격앙도)</span>
              <span id="emotionScore" className="text-[18px] font-extrabold text-[#191f28]">
                {data.emotionScore}점
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#eceff2] rounded-full overflow-hidden">
              <div
                id="emotionGauge"
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${data.emotionScore}%`,
                  backgroundColor: getScoreColor(data.emotionScore),
                }}
              />
            </div>
          </div>

          {/* 긴급도 게이지 */}
          <div className="pt-1">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-[14px] font-bold text-[#6b7684]">긴급도 (즉시 조치 필요성)</span>
              <span id="urgencyScore" className="text-[18px] font-extrabold text-[#191f28]">
                {data.urgencyScore}점
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#eceff2] rounded-full overflow-hidden">
              <div
                id="urgencyGauge"
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${data.urgencyScore}%`,
                  backgroundColor: getScoreColor(data.urgencyScore),
                }}
              />
            </div>
          </div>

          {/* 감지된 위험 감정 및 패턴 */}
          <div className="pt-4 border-t border-[#e5e8eb]">
            <div className="text-[13px] font-bold text-[#6b7684] mb-2.5">감지된 위험 감정 및 패턴</div>
            <div id="detectedTags" className="flex flex-wrap gap-2">
              {!data.detectedSignals || data.detectedSignals.length === 0 ? (
                <span className="bg-[#f1f3f5] text-[#191f28] px-3 py-1.5 rounded-xl text-[13px] font-semibold inline-flex items-center">
                  위험 키워드 없음 (통상 민원)
                </span>
              ) : (
                data.detectedSignals.map((sig, idx) => {
                  const isDanger = sig.level === 'danger';
                  const isWarning = sig.level === 'warning';
                  const badgeClass = isDanger
                    ? 'bg-[#feecef] text-[#e9253c]'
                    : isWarning
                    ? 'bg-[#fff3e6] text-[#ff7d00]'
                    : 'bg-[#f1f3f5] text-[#191f28]';
                  return (
                    <span
                      key={idx}
                      className={`px-3 py-1.5 rounded-xl text-[13px] font-semibold inline-flex items-center gap-1.5 ${badgeClass}`}
                    >
                      #{sig.category} ({sig.examples.slice(0, 2).join(', ')})
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* 단계별 권장 조치 가이드 */}
          <div id="guideBox" className="bg-[#f8f9fa] rounded-2xl p-4 text-[13px] text-[#6b7684] leading-relaxed">
            <strong className="text-[#191f28] block mb-1 font-bold">📋 담당자 대응 가이드</strong>
            <span id="guideText">{getGuideText(data.step)}</span>
          </div>
        </div>
      )}
    </section>
  );
};
