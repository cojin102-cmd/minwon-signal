import React from 'react';
import { ComplaintRecord } from '../types';

interface DangerListProps {
  list: ComplaintRecord[];
  currentStepFilter: string;
  onSelectComplaint: (record: ComplaintRecord) => void;
}

export const DangerList: React.FC<DangerListProps> = ({
  list,
  currentStepFilter,
  onSelectComplaint,
}) => {
  // If the user explicitly filtered by 'safe', show safe items; otherwise show risk items (!= 'safe')
  let displayList: ComplaintRecord[] = [];

  if (currentStepFilter === 'safe') {
    displayList = list.slice().reverse().slice(0, 5);
  } else {
    displayList = list
      .filter((item) => item.step !== 'safe')
      .slice()
      .reverse()
      .slice(0, 5);
  }

  if (displayList.length === 0) {
    return (
      <div 
        id="dangerList"
        className="py-9 px-3 text-center text-[#8b95a1] text-[13px]"
      >
        조건에 해당하는 위험 민원이 없습니다. ✨
      </div>
    );
  }

  return (
    <div id="dangerList" className="flex flex-col gap-2.5 max-h-[270px] overflow-y-auto pr-1">
      {displayList.map((item) => {
        let badgeClass = 'bg-[#e6f7ef] text-[#00b06b]';
        let badgeText = '안정';

        if (item.step === 'danger' || item.compositeScore >= 80) {
          badgeClass = 'bg-[#fde8ea] text-[#e9253c]';
          badgeText = '긴급';
        } else if (item.step === 'warning') {
          badgeClass = 'bg-[#feeee9] text-[#f75532]';
          badgeText = '경계';
        } else if (item.step === 'caution') {
          badgeClass = 'bg-[#fff6e8] text-[#ff9800]';
          badgeText = '주의';
        }

        return (
          <div
            key={item.id}
            onClick={() => onSelectComplaint(item)}
            className="group bg-[#f9fafb] hover:bg-white rounded-2xl p-3.5 border border-[#e5e8eb] hover:border-[#3182f6] cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            title="클릭 시 해당 민원 본문과 분석 결과를 다시 불러옵니다."
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[14px] font-bold text-[#191f28] group-hover:text-[#3182f6] truncate max-w-[210px] transition-colors">
                {item.title}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {item.hasProfanity && (
                  <span className="text-[11px] font-bold text-[#c2410c] bg-[#ffedd5] px-1.5 py-0.5 rounded" title="욕설/비속어 감지">
                    🤬욕설
                  </span>
                )}
                {item.hasThreat && (
                  <span className="text-[11px] font-bold text-[#e9253c] bg-[#feecef] px-1.5 py-0.5 rounded" title="위협 감지">
                    🚨위협
                  </span>
                )}
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${badgeClass}`}>
                  {badgeText}
                </span>
              </div>
            </div>
            <div className="text-[12px] text-[#6b7684] flex justify-between items-center">
              <span>부서: {item.dept} {item.date && `| ${item.date}`}</span>
              <span className="font-medium text-[#191f28]">
                감정 {item.emotionScore}점 · 긴급 {item.urgencyScore}점
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
