import { SignalRule, StepType } from '../types';

export const SIGNAL_RULES: Record<string, SignalRule> = {
  profanity: {
    category: "욕설",
    level: "danger",
    weightEmotion: 35,
    weightUrgency: 15,
    keywords: ["시발", "씨발", "개새끼", "개소리", "지랄", "닥쳐", "병신", "미친놈", "미친년", "존나", "좆같", "쓰레기같은"]
  },
  threat: {
    category: "위협",
    level: "danger",
    weightEmotion: 45,
    weightUrgency: 50,
    keywords: ["죽여버린다", "죽고싶냐", "가만두지 않겠다", "찾아간다", "불지른다", "밤길 조심", "칼", "피를 보", "맞을래", "패버린다", "찢어"]
  },
  demean: {
    category: "비하",
    level: "warning",
    weightEmotion: 25,
    weightUrgency: 10,
    keywords: ["세금 도둑", "밥값도 못", "자격도 없는", "뇌가 없", "멍청한", "대가리", "놀고먹는", "철밥통", "이딴 식", "공무원새끼"]
  },
  report: {
    category: "신고/고발",
    level: "warning",
    weightEmotion: 20,
    weightUrgency: 30,
    keywords: ["감사원", "국민권익위", "언론 제보", "기자", "방송국", "고소", "고발", "소송", "직무유기", "법적 조치", "손해배상", "청와대"]
  },
  urgentDemand: {
    category: "즉시 처리 요구",
    level: "warning",
    weightEmotion: 15,
    weightUrgency: 30,
    keywords: ["지금 당장", "오늘 안으로", "1시간 내", "당장 와라", "즉각", "전화 끊지 마", "바로 해결", "지체 없이", "즉시 처리"]
  },
  repeat: {
    category: "반복 민원",
    level: "normal",
    weightEmotion: 15,
    weightUrgency: 15,
    keywords: ["몇 번째", "도대체 몇 번", "지난번에도", "또 이러네", "저번에도", "매번", "귀틀어막", "언제까지"]
  },
  rage: {
    category: "격앙",
    level: "normal",
    weightEmotion: 20,
    weightUrgency: 10,
    keywords: ["어이가 없네", "화가 난다", "참을 수가", "미치겠네", "폭발하기 직전", "기가 차서", "개판", "장난하냐"]
  }
};

export const SAMPLE_DATA: Record<StepType, { dept: string; title: string; content: string }> = {
  safe: {
    dept: "도로교통과",
    title: "중앙로 사거리 보도블럭 파손 수리 건의",
    content: "안녕하세요. 수고 많으십니다.\n중앙로 123 앞 인도 보도블록 일부가 파손되어 있어 노약자 통행 시 넘어질 위험이 있어 보입니다. 다음 주 중에 시간 되실 때 현장 확인 부탁드립니다. 늘 고생하십니다."
  },
  caution: {
    dept: "도시환경과",
    title: "골목길 쓰레기 무단투기 단속 재요청",
    content: "저번에도 말씀드렸는데 도대체 몇 번째 말해야 됩니까? 지난번에도 치워주신다더니 아직도 그대로네요. 매번 지나갈 때마다 냄새 때문에 머리가 아픕니다. 신속한 조치 확인 바랍니다."
  },
  warning: {
    dept: "세무행정과",
    title: "위법 부과된 과태료 즉시 취소 요구 및 감사원 제보 건",
    content: "공무원들이 법도 모르고 세금을 부과합니까? 직무유기 아닙니까? 오늘 안으로 당장 취소하지 않으면 내일 아침 국민권익위와 감사원에 정식 감사 청구하고 언론사에도 모두 제보할 것입니다."
  },
  danger: {
    dept: "복지정책과",
    title: "지원금 지급 중단 담당자 가만두지 않는다",
    content: "야 이 개새끼들아 밥값도 못하는 세금 도둑 새끼들이 장난쳐? 당장 오늘 안으로 돈 입금해라. 안 그러면 내일 사무실 찾아가서 다 불지르고 죽여버린다. 가만두지 않겠다."
  }
};

export const DEPARTMENTS = [
  "도로교통과",
  "도시환경과",
  "복지정책과",
  "세무행정과",
  "민원여권과",
  "기타"
];

export const STORAGE_KEY = "complaint_signals_history";

export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
