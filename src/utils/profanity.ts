export interface ProfanityDetectionResult {
  hasProfanity: boolean;
  count: number;
  matchedWords: string[];
  choseongWords: string[];
  maskedWords: string[];
  standardWords: string[];
  ruleExamples: string[];
}

/**
 * Korean profanity and abusive language analyzer.
 * Detects:
 * 1. Choseong profanities (ㅅㅂ, ㅆㅂ, ㅈㄹ, ㅂㅅ, ㅈㄴ, ㅁㅊ, ㄲㅈ, etc.)
 * 2. Masked profanities (시X, 씨X, 병X, 미X, 개XX, etc.)
 * 3. Variations with spaces and special characters (시 발, 씨~발, 개 새 끼, etc.)
 * 4. Contextual safeguards to prevent false positives (e.g., '시발점', '개선', '개발', '미치는')
 */
export function analyzeProfanity(fullText: string): ProfanityDetectionResult {
  const matchedWords: string[] = [];
  const choseongWords: string[] = [];
  const maskedWords: string[] = [];
  const standardWords: string[] = [];

  const addMatch = (word: string, category: 'choseong' | 'masked' | 'standard') => {
    const clean = word.trim();
    if (!clean) return;
    if (!matchedWords.includes(clean)) {
      matchedWords.push(clean);
    }
    if (category === 'choseong' && !choseongWords.includes(clean)) {
      choseongWords.push(clean);
    } else if (category === 'masked' && !maskedWords.includes(clean)) {
      maskedWords.push(clean);
    } else if (category === 'standard' && !standardWords.includes(clean)) {
      standardWords.push(clean);
    }
  };

  // 1. Choseong regexes (초성 욕설)
  // Matching isolated jamo groups with spaces, dots, dashes, or tildes
  const choseongRegexes = [
    { reg: /(?:^|[^가-힣a-zA-Z0-9])([ㅅㅆ][\s._~*^!@#$%^-]*ㅂ(?:ㄹㅁ)?)(?=$|[^가-힣a-zA-Z0-9])/gi, name: 'ㅅㅂ' },
    { reg: /(?:^|[^가-힣a-zA-Z0-9])(ㅈ[\s._~*^!@#$%^-]*ㄹ)(?=$|[^가-힣a-zA-Z0-9])/gi, name: 'ㅈㄹ' },
    { reg: /(?:^|[^가-힣a-zA-Z0-9])(ㅂ[\s._~*^!@#$%^-]*ㅅ)(?=$|[^가-힣a-zA-Z0-9])/gi, name: 'ㅂㅅ' },
    { reg: /(?:^|[^가-힣a-zA-Z0-9])(ㅈ[\s._~*^!@#$%^-]*ㄴ)(?=$|[^가-힣a-zA-Z0-9])/gi, name: 'ㅈㄴ' },
    { reg: /(?:^|[^가-힣a-zA-Z0-9])(ㅁ[\s._~*^!@#$%^-]*ㅊ)(?=$|[^가-힣a-zA-Z0-9])/gi, name: 'ㅁㅊ' },
    { reg: /(?:^|[^가-힣a-zA-Z0-9])(ㄲ[\s._~*^!@#$%^-]*ㅈ)(?=$|[^가-힣a-zA-Z0-9])/gi, name: 'ㄲㅈ' },
  ];

  for (const item of choseongRegexes) {
    let m: RegExpExecArray | null;
    while ((m = item.reg.exec(fullText)) !== null) {
      if (m[1]) {
        addMatch(m[1], 'choseong');
      }
    }
  }

  // 2. 시X / 씨X / 시 발 / 씨 발 variations
  // Safeguard: do not match '시발점'
  const sibalRegex = /(?:시|씨|쒸|쉬)[\s._~*^!@#$%^&-]*([발벌바빨빠]|x|X|\*|#|@)/g;
  let mSib: RegExpExecArray | null;
  while ((mSib = sibalRegex.exec(fullText)) !== null) {
    const matchStr = mSib[0];
    const matchEndIdx = mSib.index + matchStr.length;
    // Context check: '시발점' is standard Korean for starting point
    if (fullText.substring(matchEndIdx, matchEndIdx + 1) === '점') {
      continue;
    }
    const isMask = /[xX*#@]/.test(matchStr);
    addMatch(matchStr, isMask ? 'masked' : 'standard');
  }

  // 3. 개XX / 개 새 끼 / 개자식 / 개소리 variations
  // Safeguard: does not match '개인', '개최', '개선', '개발'
  const gaeRegex = /개[\s._~*^!@#$%^&-]*([새세][\s._~*^!@#$%^&-]*[끼기]?|[xX*#@]{1,3}|자식|소리|수작|돼지)/g;
  let mGae: RegExpExecArray | null;
  while ((mGae = gaeRegex.exec(fullText)) !== null) {
    const matchStr = mGae[0];
    const isMask = /[xX*#@]/.test(matchStr);
    addMatch(matchStr, isMask ? 'masked' : 'standard');
  }

  // 4. 병X / 병 신 variations
  const byeongRegex = /(?:병|빙)[\s._~*^!@#$%^&-]*([신선]|x|X|\*|#|@)|등[\s._~*^!@#$%^&-]*신/g;
  let mByeong: RegExpExecArray | null;
  while ((mByeong = byeongRegex.exec(fullText)) !== null) {
    const matchStr = mByeong[0];
    const isMask = /[xX*#@]/.test(matchStr);
    addMatch(matchStr, isMask ? 'masked' : 'standard');
  }

  // 5. 미X / 미친놈 / 미쳤냐 variations
  // Safeguard: does not match '미치는 영향'
  const michinRegex = /미[\s._~*^!@#$%^&-]*([xX*#@]|친[\s._~*^!@#$%^&-]*(?:놈|년|새끼|새키|자식|인간|것)|쳤(?:냐|나|어|구만|네)|쳐(?:가지고|돌아|서))/g;
  let mMichin: RegExpExecArray | null;
  while ((mMichin = michinRegex.exec(fullText)) !== null) {
    const matchStr = mMichin[0];
    const isMask = /[xX*#@]/.test(matchStr);
    addMatch(matchStr, isMask ? 'masked' : 'standard');
  }

  // 6. 지X / 지 랄 variations
  const jiralRegex = /지[\s._~*^!@#$%^&-]*([랄럴]|x|X|\*|#|@)/g;
  let mJiral: RegExpExecArray | null;
  while ((mJiral = jiralRegex.exec(fullText)) !== null) {
    const matchStr = mJiral[0];
    const isMask = /[xX*#@]/.test(matchStr);
    addMatch(matchStr, isMask ? 'masked' : 'standard');
  }

  // 7. 존X / 존나 / 좆 variations
  const jonnaRegex = /(?:존|졸)[\s._~*^!@#$%^&-]*([나너]|x|X|\*|#|@)|좆[\s._~*^!@#$%^&-]*([같까도]|x|X|\*|#|@)?/g;
  let mJonna: RegExpExecArray | null;
  while ((mJonna = jonnaRegex.exec(fullText)) !== null) {
    const matchStr = mJonna[0];
    const isMask = /[xX*#@]/.test(matchStr);
    addMatch(matchStr, isMask ? 'masked' : 'standard');
  }

  // 8. 닥쳐 / 꺼져 / 기타 모욕
  const othersRegex = /(?:닥|닾)[\s._~*^!@#$%^&-]*([쳐처]|x|X|\*|#|@)|(?:꺼|꼬)[\s._~*^!@#$%^&-]*([져저]|x|X|\*|#|@)|아가리|싸가지\s*없는|처먹/g;
  let mOthers: RegExpExecArray | null;
  while ((mOthers = othersRegex.exec(fullText)) !== null) {
    const matchStr = mOthers[0];
    const isMask = /[xX*#@]/.test(matchStr);
    addMatch(matchStr, isMask ? 'masked' : 'standard');
  }

  const hasProfanity = matchedWords.length > 0;
  const count = matchedWords.length;
  const ruleExamples = matchedWords.slice(0, 4);

  return {
    hasProfanity,
    count,
    matchedWords,
    choseongWords,
    maskedWords,
    standardWords,
    ruleExamples,
  };
}
