/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ComplaintRecord, FilterState, StepType, TrendInfo, DetectedSignal } from './types';
import { SIGNAL_RULES, SAMPLE_DATA, DEPARTMENTS, STORAGE_KEY, getTodayString } from './constants/rules';
import { analyzeProfanity } from './utils/profanity';
import { TrendChart } from './components/TrendChart';
import { DangerList } from './components/DangerList';
import { FilterBar } from './components/FilterBar';
import { StatsSummary } from './components/StatsSummary';
import { ResultPanel } from './components/ResultPanel';
import { HighlightCard } from './components/HighlightCard';

export default function App() {
  // Form input states
  const [title, setTitle] = useState<string>('');
  const [dept, setDept] = useState<string>(DEPARTMENTS[0]);
  const [content, setContent] = useState<string>('');

  // Active analysis result
  const [activeResult, setActiveResult] = useState<ComplaintRecord | null>(null);

  // Stored complaints history
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    keyword: '',
    dept: 'all',
    step: 'all',
    date: '',
  });

  // Load initial data from localStorage or seed
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const today = getTodayString();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // ensure backward compatibility for items without date
          const validated = parsed.map((item: ComplaintRecord) => ({
            ...item,
            date: item.date || today,
          }));
          setComplaints(validated);
          return;
        }
      }

      // Seed initial samples
      const initialSamples: ComplaintRecord[] = [
        {
          id: 1,
          date: today,
          time: '09:30',
          title: SAMPLE_DATA.safe.title,
          dept: SAMPLE_DATA.safe.dept,
          content: SAMPLE_DATA.safe.content,
          emotionScore: 12,
          urgencyScore: 10,
          compositeScore: 12,
          step: 'safe',
          hasThreat: false,
          detectedSignals: [],
          foundWords: [],
        },
        {
          id: 2,
          date: today,
          time: '11:15',
          title: SAMPLE_DATA.caution.title,
          dept: SAMPLE_DATA.caution.dept,
          content: SAMPLE_DATA.caution.content,
          emotionScore: 48,
          urgencyScore: 45,
          compositeScore: 48,
          step: 'caution',
          hasThreat: false,
          detectedSignals: [
            { category: '반복 민원', level: 'normal', count: 2, examples: ['몇 번째', '지난번에도'] },
          ],
          foundWords: ['몇 번째', '지난번에도'],
        },
        {
          id: 3,
          date: today,
          time: '14:20',
          title: SAMPLE_DATA.warning.title,
          dept: SAMPLE_DATA.warning.dept,
          content: SAMPLE_DATA.warning.content,
          emotionScore: 68,
          urgencyScore: 72,
          compositeScore: 72,
          step: 'warning',
          hasThreat: false,
          detectedSignals: [
            { category: '신고/고발', level: 'warning', count: 2, examples: ['감사원', '국민권익위'] },
            { category: '즉시 처리 요구', level: 'warning', count: 1, examples: ['오늘 안으로'] },
          ],
          foundWords: ['감사원', '국민권익위', '오늘 안으로'],
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSamples));
      setComplaints(initialSamples);
    } catch (e) {
      console.error('Failed to load complaints from localStorage', e);
    }
  }, []);

  // Sync to localStorage
  const saveToStorage = (newRecord: ComplaintRecord) => {
    setComplaints((prev) => {
      const updated = [...prev, newRecord];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save complaints to localStorage', e);
      }
      return updated;
    });
  };

  // Analysis engine
  const executeAnalysis = useCallback((rawTitle: string, rawDept: string, rawContent: string) => {
    const trimmedTitle = rawTitle.trim();
    const trimmedContent = rawContent.trim();

    if (!trimmedTitle || !trimmedContent) {
      alert('민원 제목과 본문 내용을 모두 입력해주세요.');
      return;
    }

    const fullText = `${trimmedTitle} ${trimmedContent}`;
    let rawEmotion = 0;
    let rawUrgency = 0;
    const detectedSignals: DetectedSignal[] = [];
    const foundWords: string[] = [];
    let hasThreat = false;

    // 1) Specialized profanity, choseong, and masked abuse analysis
    const profanityAnalysis = analyzeProfanity(fullText);
    const hasProfanity = profanityAnalysis.hasProfanity;

    if (hasProfanity) {
      profanityAnalysis.matchedWords.forEach((word) => {
        if (!foundWords.includes(word)) {
          foundWords.push(word);
        }
      });

      // Repetition compounding:
      // 1 profanity: 45
      // 2 profanities: 70
      // 3+ profanities: 90+
      let profanityEmotionWeight = 45;
      if (profanityAnalysis.count === 2) {
        profanityEmotionWeight = 70;
      } else if (profanityAnalysis.count >= 3) {
        profanityEmotionWeight = Math.min(100, 70 + (profanityAnalysis.count - 2) * 20);
      }

      rawEmotion += profanityEmotionWeight;
      rawUrgency += 20 + Math.min(30, profanityAnalysis.count * 10);

      detectedSignals.push({
        category: '욕설/비속어',
        level: 'danger',
        count: profanityAnalysis.count,
        examples: profanityAnalysis.ruleExamples,
      });
    }

    // 2) Keyword matching (excluding 'profanity' since handled comprehensively by analyzeProfanity)
    for (const [ruleKey, rule] of Object.entries(SIGNAL_RULES)) {
      if (ruleKey === 'profanity') continue;

      let matchCount = 0;
      const matchedKeywordsInRule: string[] = [];

      rule.keywords.forEach((kw) => {
        if (fullText.includes(kw)) {
          matchCount++;
          matchedKeywordsInRule.push(kw);
          if (!foundWords.includes(kw)) {
            foundWords.push(kw);
          }
        }
      });

      if (matchCount > 0) {
        rawEmotion += rule.weightEmotion * matchCount;
        rawUrgency += rule.weightUrgency * matchCount;

        if (rule.category === '위협') {
          hasThreat = true;
        }

        detectedSignals.push({
          category: rule.category,
          level: rule.level,
          count: matchCount,
          examples: matchedKeywordsInRule,
        });
      }
    }

    // 3) Punctuation pattern matching (! / ?)
    const exclamationCount = (fullText.match(/!{2,}/g) || []).length;
    const questionCount = (fullText.match(/\?{2,}/g) || []).length;

    if (exclamationCount > 0 || questionCount > 0) {
      rawEmotion += exclamationCount * 12 + questionCount * 8;
      if (!detectedSignals.some((s) => s.category.includes('격앙'))) {
        detectedSignals.push({
          category: '격앙(부호 중복)',
          level: 'normal',
          count: exclamationCount + questionCount,
          examples: ['!/? 연속 부호'],
        });
      }
    }

    // 4) Criteria evaluation:
    // 초성 욕설이나 명확한 비속어가 있으면 일반 문장보다 감정 강도를 높게 평가 (최소 55점)
    if (hasProfanity) {
      rawEmotion = Math.max(rawEmotion, 55);
    }

    // 욕설 + 협박·모욕·공격적 표현(비하, 즉시 처리 요구)이 함께 있으면 매우 높은 단계(danger, 85점 이상)로 평가
    const hasDemean = detectedSignals.some((s) => s.category === '비하');
    const hasUrgentDemand = detectedSignals.some((s) => s.category === '즉시 처리 요구');
    const hasAttackCombo = hasProfanity && (hasThreat || hasDemean || hasUrgentDemand);

    let emotionScore = Math.min(100, Math.round(rawEmotion));
    let urgencyScore = Math.min(100, Math.round(rawUrgency));

    if (hasAttackCombo) {
      emotionScore = Math.max(emotionScore, 88);
      urgencyScore = Math.max(urgencyScore, 82);
    }

    const compositeScore = Math.max(emotionScore, urgencyScore);

    let step: StepType = 'safe';
    if (compositeScore >= 80) {
      step = 'danger';
    } else if (compositeScore >= 60) {
      step = 'warning';
    } else if (compositeScore >= 40) {
      step = 'caution';
    } else {
      step = 'safe';
    }

    const newRecord: ComplaintRecord = {
      id: Date.now(),
      date: getTodayString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: trimmedTitle,
      dept: rawDept,
      content: trimmedContent,
      emotionScore,
      urgencyScore,
      compositeScore,
      step,
      hasThreat,
      hasProfanity,
      detectedSignals,
      foundWords,
    };

    setActiveResult(newRecord);
    saveToStorage(newRecord);
  }, []);

  // Form submit handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeAnalysis(title, dept, content);
  };

  // Sample data loader
  const handleLoadSample = (sampleType: StepType) => {
    const sample = SAMPLE_DATA[sampleType];
    if (!sample) return;
    setTitle(sample.title);
    setDept(sample.dept);
    setContent(sample.content);
    executeAnalysis(sample.title, sample.dept, sample.content);
  };

  // Danger list item click: restores form and active result
  const handleSelectComplaint = (record: ComplaintRecord) => {
    setTitle(record.title);
    setDept(record.dept);
    setContent(record.content);
    setActiveResult(record);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter change handlers
  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      keyword: '',
      dept: 'all',
      step: 'all',
      date: '',
    });
  };

  // Reset entire history
  const handleResetHistory = () => {
    if (window.confirm('누적된 분석 기록을 모두 초기화하시겠습니까?')) {
      localStorage.removeItem(STORAGE_KEY);
      setComplaints([]);
      handleResetFilters();
      alert('기록이 초기화되었습니다.');
    }
  };

  // Filtered complaints list (real-time synchronized)
  const filteredComplaints = useMemo(() => {
    const kw = filters.keyword.trim().toLowerCase();
    return complaints.filter((item) => {
      // 1. Keyword search
      if (kw && !item.title.toLowerCase().includes(kw)) {
        return false;
      }
      // 2. Department filter
      if (filters.dept !== 'all' && item.dept !== filters.dept) {
        return false;
      }
      // 3. Step filter
      if (filters.step !== 'all' && item.step !== filters.step) {
        return false;
      }
      // 4. Date filter (YYYY-MM-DD)
      if (filters.date && item.date !== filters.date) {
        return false;
      }
      return true;
    });
  }, [complaints, filters]);

  // Rising trend calculation
  const trendInfo: TrendInfo = useMemo(() => {
    if (!filteredComplaints || filteredComplaints.length < 3) {
      return { isRising: false, count: 0 };
    }

    let consecutiveRise = 0;
    for (let i = filteredComplaints.length - 1; i > 0; i--) {
      const currentScore = filteredComplaints[i].compositeScore;
      const prevScore = filteredComplaints[i - 1].compositeScore;

      if (currentScore > prevScore) {
        consecutiveRise++;
      } else {
        break;
      }
    }

    const isRising = consecutiveRise >= 2;
    return {
      isRising,
      count: consecutiveRise + 1,
    };
  }, [filteredComplaints]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const total = filteredComplaints.length;
    let cautionCount = 0;
    let warningCount = 0;
    let dangerCount = 0;
    let totalEmotion = 0;

    filteredComplaints.forEach((item) => {
      if (item.step === 'caution') cautionCount++;
      else if (item.step === 'warning') warningCount++;
      else if (item.step === 'danger') dangerCount++;
      totalEmotion += item.emotionScore;
    });

    const avgTemp = total > 0 ? Math.round(totalEmotion / total) : 0;

    return {
      total,
      cautionCount,
      warningCount,
      dangerCount,
      avgTemp,
    };
  }, [filteredComplaints]);

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#191f28] py-8 px-4 font-sans">
      <div className="max-w-[1080px] mx-auto">
        {/* 상단 헤더 */}
        <header className="mb-7">
          <span className="inline-block text-[13px] font-bold text-[#3182f6] bg-[#3182f6]/10 px-2.5 py-1 rounded-lg mb-2">
            공공업무 민원 지원
          </span>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#111] mb-1.5">
            민원 감정 시그널
          </h1>
          <p className="text-[15px] text-[#6b7684]">
            민원의 어조와 위험 표현을 분석하여 감정 강도와 긴급도를 계산하고, 안전한 대응 가이드를 제공합니다.
          </p>
        </header>

        {/* 상단 메인 2단 그리드 */}
        <main className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-5 mb-6">
          {/* 좌측: 입력 폼 */}
          <section className="bg-white rounded-[24px] p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.03] flex flex-col justify-between">
            <div>
              <div className="text-[19px] font-bold mb-4 flex items-center justify-between">
                <span>민원 접수 및 분석</span>
              </div>

              {/* 테스트용 가상 샘플 버튼 4종 */}
              <label className="block text-[13px] font-bold text-[#6b7684] mb-2">
                예시 데이터로 빠른 체험
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  className="bg-[#f2f4f6] hover:bg-[#e5e8eb] text-[#6b7684] hover:text-[#191f28] font-semibold text-[13px] px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  onClick={() => handleLoadSample('safe')}
                >
                  🌱 [안정] 도로 보수
                </button>
                <button
                  type="button"
                  className="bg-[#f2f4f6] hover:bg-[#e5e8eb] text-[#6b7684] hover:text-[#191f28] font-semibold text-[13px] px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  onClick={() => handleLoadSample('caution')}
                >
                  ⚠️ [주의] 반복 지연
                </button>
                <button
                  type="button"
                  className="bg-[#f2f4f6] hover:bg-[#e5e8eb] text-[#6b7684] hover:text-[#191f28] font-semibold text-[13px] px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  onClick={() => handleLoadSample('warning')}
                >
                  📢 [경계] 감사원 제보
                </button>
                <button
                  type="button"
                  className="bg-[#f2f4f6] hover:bg-[#e5e8eb] text-[#6b7684] hover:text-[#191f28] font-semibold text-[13px] px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  onClick={() => handleLoadSample('danger')}
                >
                  🚨 [긴급] 폭언·신변 위협
                </button>
              </div>

              <form id="signalForm" onSubmit={handleFormSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr] gap-3 mb-4">
                  <div>
                    <label htmlFor="compTitle" className="block text-[13px] font-bold text-[#6b7684] mb-2">
                      민원 제목
                    </label>
                    <input
                      type="text"
                      id="compTitle"
                      placeholder="예: 도로 포장 파손 보수 요청의 건"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#f9fafb] border border-transparent focus:border-[#3182f6] focus:bg-white rounded-2xl px-4 py-3 text-[15px] outline-none focus:ring-4 focus:ring-[#3182f6]/10 transition-all text-[#191f28]"
                    />
                  </div>
                  <div>
                    <label htmlFor="compDept" className="block text-[13px] font-bold text-[#6b7684] mb-2">
                      담당 부서
                    </label>
                    <select
                      id="compDept"
                      value={dept}
                      onChange={(e) => setDept(e.target.value)}
                      className="w-full bg-[#f9fafb] border border-transparent focus:border-[#3182f6] focus:bg-white rounded-2xl px-4 py-3 text-[15px] outline-none focus:ring-4 focus:ring-[#3182f6]/10 transition-all text-[#191f28]"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d === '기타' ? '기타 행정부서' : d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="compContent" className="block text-[13px] font-bold text-[#6b7684] mb-2">
                    민원 본문 내용
                  </label>
                  <textarea
                    id="compContent"
                    placeholder="접수된 민원 본문을 붙여넣거나 입력하세요."
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full min-h-[160px] bg-[#f9fafb] border border-transparent focus:border-[#3182f6] focus:bg-white rounded-2xl px-4 py-3 text-[15px] leading-relaxed outline-none focus:ring-4 focus:ring-[#3182f6]/10 transition-all resize-y text-[#191f28]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#3182f6] hover:bg-[#1b64da] text-white font-bold text-[16px] py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-[0.99] shadow-sm"
                >
                  <span>⚡ 감정 분석 실행</span>
                </button>
              </form>

              {/* 감지 키워드 하이라이트 영역 */}
              {activeResult && (
                <HighlightCard
                  content={activeResult.content}
                  foundWords={activeResult.foundWords}
                />
              )}
            </div>
          </section>

          {/* 우측: 분석 결과 대시보드 */}
          <ResultPanel data={activeResult} />
        </main>

        {/* 누적 통계 대시보드 섹션 */}
        <section className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[21px] font-extrabold tracking-tight text-[#111]">
              📊 실시간 누적 민원 대시보드
            </h2>
            <button
              type="button"
              className="text-[#8b95a1] hover:text-[#191f28] text-[13px] font-semibold underline px-2 py-1 transition-colors cursor-pointer"
              onClick={handleResetHistory}
            >
              기록 초기화
            </button>
          </div>

          {/* [신규 추가] 대시보드 검색 및 필터 바 */}
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />

          {/* 요약 수치 카드 5종 & 3연속 상승 배너 */}
          <StatsSummary
            total={stats.total}
            cautionCount={stats.cautionCount}
            warningCount={stats.warningCount}
            dangerCount={stats.dangerCount}
            avgTemp={stats.avgTemp}
            trendInfo={trendInfo}
          />

          {/* 추이 그래프 및 위험 민원 2열 배치 */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-5">
            {/* 좌측: 감정 강도 & 긴급도 추이 그래프 */}
            <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.03]">
              <div className="text-[19px] font-bold text-[#191f28] mb-4">
                <span>📈 감정 강도 · 긴급도 추이</span>
              </div>
              <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-4 text-[12px] font-bold text-[#6b7684]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3182f6]" />
                    <span>감정 강도</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f75532]" />
                    <span>긴급도</span>
                  </div>
                </div>
                {trendInfo.isRising && (
                  <span
                    id="chartTrendTag"
                    className="text-[12px] font-bold text-[#ea580c] bg-[#ffedd5] px-2 py-0.5 rounded-md"
                  >
                    🔥 최근 {trendInfo.count}건 연속 감정 상승 중
                  </span>
                )}
              </div>
              <TrendChart list={filteredComplaints} trendInfo={trendInfo} />
            </div>

            {/* 우측: 최근 위험 민원 리스트 */}
            <div className="bg-white rounded-[24px] p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/[0.03]">
              <div className="text-[19px] font-bold text-[#191f28] mb-4">
                <span>⚠️ 최근 위험 민원 (우선 대응)</span>
              </div>
              <DangerList
                list={filteredComplaints}
                currentStepFilter={filters.step}
                onSelectComplaint={handleSelectComplaint}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
