import React from 'react';
import { FilterState } from '../types';
import { DEPARTMENTS } from '../constants/rules';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  return (
    <div className="bg-white rounded-[20px] p-4 sm:p-5 mb-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-black/[0.03]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-2.5 items-center">
        {/* 1. 제목 검색 */}
        <div>
          <input
            type="text"
            id="filterKeyword"
            className="w-full px-3.5 py-2.5 text-[13.5px] rounded-xl bg-[#f9fafb] border border-transparent focus:border-[#3182f6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3182f6]/20 transition-all text-[#191f28] placeholder:text-[#8b95a1]"
            placeholder="🔍 민원 제목 검색..."
            value={filters.keyword}
            onChange={(e) => onFilterChange('keyword', e.target.value)}
          />
        </div>

        {/* 2. 담당 부서 필터 */}
        <div>
          <select
            id="filterDept"
            className="w-full px-3.5 py-2.5 text-[13.5px] rounded-xl bg-[#f9fafb] border border-transparent focus:border-[#3182f6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3182f6]/20 transition-all text-[#191f28]"
            value={filters.dept}
            onChange={(e) => onFilterChange('dept', e.target.value)}
          >
            <option value="all">부서 전체</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept === '기타' ? '기타 부서' : dept}
              </option>
            ))}
          </select>
        </div>

        {/* 3. 대응 단계 필터 */}
        <div>
          <select
            id="filterStep"
            className="w-full px-3.5 py-2.5 text-[13.5px] rounded-xl bg-[#f9fafb] border border-transparent focus:border-[#3182f6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3182f6]/20 transition-all text-[#191f28]"
            value={filters.step}
            onChange={(e) => onFilterChange('step', e.target.value)}
          >
            <option value="all">단계 전체</option>
            <option value="safe">안정 (0~39)</option>
            <option value="caution">주의 (40~59)</option>
            <option value="warning">경계 (60~79)</option>
            <option value="danger">긴급 (80~100)</option>
          </select>
        </div>

        {/* 4. 날짜 필터 */}
        <div>
          <input
            type="date"
            id="filterDate"
            className="w-full px-3.5 py-2.5 text-[13.5px] rounded-xl bg-[#f9fafb] border border-transparent focus:border-[#3182f6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3182f6]/20 transition-all text-[#191f28]"
            title="접수 날짜 선택"
            value={filters.date}
            onChange={(e) => onFilterChange('date', e.target.value)}
          />
        </div>

        {/* 5. 필터 초기화 버튼 */}
        <div>
          <button
            type="button"
            className="w-full sm:w-auto bg-[#f2f4f6] hover:bg-[#e5e8eb] text-[#6b7684] hover:text-[#191f28] font-bold text-[13px] px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-colors flex items-center justify-center gap-1 cursor-pointer"
            onClick={onResetFilters}
          >
            <span>↺ 필터 초기화</span>
          </button>
        </div>
      </div>
    </div>
  );
};
