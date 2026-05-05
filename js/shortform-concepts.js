// shortform-concepts.js — 강의 핵심 개념 단일 source (F5)
// 모든 숏폼 워크북·끝내기 도구에서 이 데이터를 참조합니다.
// id 값은 기존 저장 데이터와 호환 유지 — 절대 변경 금지.

const SHORTFORM_CONCEPTS = {
  // 풀링 원고 템플릿 4종 (강의 2강)
  pullingTemplates: [
    { id: 'list',     icon: '📋', label: '나열형',      example: '"X하는 5가지 방법"',        source: 'guide.html#2' },
    { id: 'sequence', icon: '📝', label: '순서형',      example: '"X 단계별 절차"',            source: 'guide.html#2' },
    { id: 'story',    icon: '🎬', label: '스토리형',    example: '"내가 X한 경험"',            source: 'guide.html#2' },
    { id: 'argue',    icon: '💪', label: '주장 설득형', example: '"X해야 한다 — 이유 N가지"', source: 'guide.html#2' }
  ],

  // 도입 화면 8유형 (강의 3강)
  introScreens: [
    { id: 'admire',   icon: '😲', label: '감탄' },
    { id: 'curious',  icon: '🤔', label: '신기' },
    { id: 'shock',    icon: '😱', label: '엽기' },
    { id: 'fear',     icon: '😨', label: '공포' },
    { id: 'progress', icon: '⏩', label: '진행' },
    { id: 'sympathy', icon: '🤝', label: '공감' },
    { id: 'twist',    icon: '🔄', label: '반전' },
    { id: 'beauty',   icon: '💖', label: '예쁨' }
  ],

  // 문구 강화 5종 (강의 3강)
  enhanceTechniques: [
    { id: 'word',     label: '단어',      desc: '강한 단어 사용' },
    { id: 'number',   label: '수치',      desc: '구체 숫자 ("5가지", "30초")' },
    { id: 'expr',     label: '표현',      desc: '비유·은유' },
    { id: 'simplify', label: '단순화',    desc: '짧게' },
    { id: 'target',   label: '타겟 지칭', desc: '칵테일 파티 효과 ("3년차 직장인")' }
  ],

  // 키 템플릿 6종 (강의 5강)
  keyTemplates: [
    { id: 'problem',     icon: '🩹', label: '문제 해결형', example: '"문제 보여주고 → 우리 솔루션"',         source: 'guide.html#5' },
    { id: 'pulling-key', icon: '🪝', label: '풀링+키',     example: '"풀링 콘텐츠 → 자연스럽게 키로 전환"', source: 'guide.html#5' },
    { id: 'recommend',   icon: '👍', label: '제품 추천형', example: '"내가 써봤는데 좋더라"',               source: 'guide.html#5' },
    { id: 'demo',        icon: '🎬', label: '시연형',      example: '"이렇게 사용한다"',                     source: 'guide.html#5' },
    { id: 'review',      icon: '👤', label: '1인칭 리뷰',  example: '"솔직 후기"',                          source: 'guide.html#5' },
    { id: 'compare',     icon: '⚖️', label: '타사 차이점', example: '"X vs Y 비교"',                        source: 'guide.html#5' }
  ],

  // 설득 꿀팁 4종 (강의 5강)
  persuasionTactics: [
    { id: 'scarcity',  label: '희소성',   desc: '"한정 수량 / 마감 임박"' },
    { id: 'urgency',   label: '긴박감',   desc: '"지금 당장 → 늦으면 손해"' },
    { id: 'bonus',     label: '추가 보상', desc: '"지금 신청하면 추가 증정"' },
    { id: 'guarantee', label: '보증 3종', desc: '"만족 보장 / 환불 / 이행 보증"' }
  ],

  // 관여도 3종 (강의 5강)
  engagementLevels: [
    { id: 'low',  label: '저관여', desc: '직접 판매 (이 숏폼에서 즉시 구매 유도)' },
    { id: 'mid',  label: '중관여', desc: '미드폼 키 콘텐츠 연결' },
    { id: 'high', label: '고관여', desc: 'DB 수집 (이메일/리드)' }
  ],

  // 끝내기 4소스 (강의 4강)
  studySources: [
    { id: 'viewtrap',  label: '뷰트랩' },
    { id: 'vidiq',     label: '합비디오(VidIQ)' },
    { id: 'instagram', label: '인스타' },
    { id: 'tiktok',    label: '틱톡' }
  ]
};
