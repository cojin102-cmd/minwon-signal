import React from 'react';

interface HighlightCardProps {
  content: string;
  foundWords: string[];
}

export const HighlightCard: React.FC<HighlightCardProps> = ({ content, foundWords }) => {
  if (!foundWords || foundWords.length === 0 || !content.trim()) {
    return null;
  }

  // Create regex from unique foundWords
  const uniqueWords: string[] = Array.from(new Set(foundWords)).filter((w): w is string => typeof w === 'string' && w.length > 0);
  if (uniqueWords.length === 0) return null;

  // Escape special regex chars
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(${uniqueWords.map(escapeRegex).join('|')})`, 'gi');

  const parts = content.split(pattern);

  return (
    <div
      id="highlightCard"
      className="mt-5 bg-white rounded-[20px] p-5 border border-[#e5e8eb] shadow-sm"
    >
      <div className="text-[14px] font-bold text-[#6b7684] mb-2.5 flex items-center gap-1.5">
        <span>🔍</span>
        <span>민원 본문 위험 표현 하이라이트</span>
      </div>
      <div
        id="highlightContent"
        className="text-[15px] leading-relaxed text-[#2b303b] break-words whitespace-pre-wrap font-sans"
      >
        {parts.map((part: string, index: number) => {
          const isMatch = uniqueWords.some(
            (w: string) => w.toLowerCase() === part.toLowerCase()
          );
          if (isMatch) {
            return (
              <span key={index} className="hl-badge">
                {part}
              </span>
            );
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </div>
    </div>
  );
};
