import React, { useEffect, useRef, useState } from 'react';
import { ComplaintRecord, TrendInfo } from '../types';

interface TrendChartProps {
  list: ComplaintRecord[];
  trendInfo: TrendInfo;
}

export const TrendChart: React.FC<TrendChartProps> = ({ list, trendInfo }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(480);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (!list || list.length === 0) {
    return (
      <div 
        id="trendChartContainer"
        ref={containerRef}
        className="w-full h-[200px] flex items-center justify-center text-[13px] text-[#8b95a1]"
      >
        조건에 맞는 민원 데이터가 없습니다.
      </div>
    );
  }

  const recent = list.slice(-10);
  const width = Math.max(containerWidth, 320);
  const height = 200;
  const padding = { top: 28, right: 28, bottom: 25, left: 38 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const getX = (idx: number) => {
    if (recent.length === 1) return padding.left + chartW / 2;
    return padding.left + (idx / (recent.length - 1)) * chartW;
  };

  const getY = (score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    return padding.top + chartH - (clamped / 100) * chartH;
  };

  const emotionPoints = recent.map((d, i) => `${getX(i)},${getY(d.emotionScore)}`).join(' ');
  const urgencyPoints = recent.map((d, i) => `${getX(i)},${getY(d.urgencyScore)}`).join(' ');

  // Trend highlight box
  let trendBox = null;
  if (trendInfo.isRising && recent.length >= 2) {
    const riseCount = Math.min(trendInfo.count, recent.length);
    const startIdx = recent.length - riseCount;
    const startX = Math.max(padding.left - 5, getX(startIdx) - 10);
    const endX = Math.min(width - padding.right + 10, getX(recent.length - 1) + 10);
    const boxWidth = Math.max(24, endX - startX);

    trendBox = (
      <g>
        <rect
          x={startX}
          y={padding.top - 14}
          width={boxWidth}
          height={chartH + 24}
          rx="10"
          fill="rgba(234, 88, 12, 0.08)"
          stroke="#ea580c"
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />
        <text
          x={endX}
          y={padding.top - 4}
          fontSize="10"
          fill="#ea580c"
          fontWeight="700"
          textAnchor="end"
        >
          ▲ 감정 상승 흐름
        </text>
      </g>
    );
  }

  const gridYValues = [0, 40, 60, 80, 100];

  return (
    <div 
      id="trendChartContainer" 
      ref={containerRef} 
      className="w-full h-[200px] relative select-none"
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Grid lines */}
        {gridYValues.map((val) => {
          const y = getY(val);
          const isDanger = val === 80;
          const isBorder = val === 0 || val === 100;
          return (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke={isDanger ? '#ffd2d7' : isBorder ? '#e5e8eb' : '#f2f4f6'}
                strokeDasharray={isDanger ? '3,3' : isBorder ? '3,3' : '2,2'}
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                fontSize="10"
                fill={val === 80 ? '#e9253c' : val === 40 ? '#ff9800' : '#8b95a1'}
                fontWeight={val === 80 ? '700' : '400'}
                textAnchor="end"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Rising Trend Box */}
        {trendBox}

        {/* Emotion line */}
        <polyline
          fill="none"
          stroke="#3182f6"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={emotionPoints}
        />

        {/* Urgency line */}
        <polyline
          fill="none"
          stroke="#f75532"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={urgencyPoints}
        />

        {/* Interactive Dots */}
        {recent.map((d, i) => {
          const x = getX(i);
          const yEmotion = getY(d.emotionScore);
          const yUrgency = getY(d.urgencyScore);
          const isHovered = hoveredIdx === i;

          return (
            <g key={d.id ?? i} className="cursor-pointer">
              {/* Emotion Dot */}
              <circle
                cx={x}
                cy={yEmotion}
                r={isHovered ? 6 : 4.5}
                fill="#3182f6"
                stroke="#fff"
                strokeWidth="2"
                className="transition-all duration-150"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
              {/* Urgency Dot */}
              <circle
                cx={x}
                cy={yUrgency}
                r={isHovered ? 6 : 4.5}
                fill="#f75532"
                stroke="#fff"
                strokeWidth="2"
                className="transition-all duration-150"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
              {/* Invisible touch/hover column */}
              <rect
                x={x - 12}
                y={padding.top}
                width={24}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip on hover */}
      {hoveredIdx !== null && recent[hoveredIdx] && (
        <div
          className="absolute z-20 pointer-events-none bg-[#191f28] text-white text-[12px] px-3 py-2 rounded-xl shadow-lg transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${getX(hoveredIdx)}px`,
            top: `${Math.min(getY(recent[hoveredIdx].emotionScore), getY(recent[hoveredIdx].urgencyScore)) - 8}px`,
          }}
        >
          <div className="font-bold truncate max-w-[180px]">{recent[hoveredIdx].title}</div>
          <div className="text-[11px] text-gray-300 mt-0.5">
            {recent[hoveredIdx].dept} · {recent[hoveredIdx].date}
          </div>
          <div className="flex items-center gap-2 mt-1 font-semibold">
            <span className="text-[#60a5fa]">감정: {recent[hoveredIdx].emotionScore}점</span>
            <span className="text-[#fb7185]">긴급: {recent[hoveredIdx].urgencyScore}점</span>
          </div>
        </div>
      )}
    </div>
  );
};
