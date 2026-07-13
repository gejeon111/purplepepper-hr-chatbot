// Purple Pepper Chatbot - 답변 데이터
// 새 질문을 추가하려면 qna 배열에 { category, keywords, question, answer } 형태로 추가하면 됩니다.
// category는 아래 categories 배열의 id 중 하나여야 카테고리 메뉴에 노출됩니다.
const QNA_DATA = {
  companyName: "퍼플페퍼",
  categories: [
    { id: "wifi", label: "📶 와이파이" },
    { id: "leave", label: "🗓️ 연차 및 휴가" },
    { id: "supplies", label: "🖇️ 사무실 물품" },
    { id: "contact", label: "✉️ 인사팀 문의" }
  ],
  qna: [
    {
      id: "wifi-2f",
      category: "wifi",
      keywords: ["2층", "와이파이", "wifi", "wi-fi", "비밀번호", "비번"],
      question: "2층 와이파이 비밀번호가 뭔가요?",
      answer: "📶 2층 와이파이\n- SSID: PurplePepper_2F\n- 비밀번호: pp2f-2024!!\n\n(관리자: data/qna.js 에서 실제 값으로 수정하세요)"
    },
    {
      id: "wifi-3f",
      category: "wifi",
      keywords: ["3층", "와이파이", "wifi", "wi-fi", "비밀번호", "비번"],
      question: "3층 와이파이 비밀번호가 뭔가요?",
      answer: "📶 3층 와이파이\n- SSID: PurplePepper_3F\n- 비밀번호: pp3f-2024!!"
    },
    {
      id: "leave-accrual",
      category: "leave",
      keywords: ["연차", "발생", "며칠", "몇개"],
      question: "연차는 언제, 며칠 생기나요?",
      answer: "🗓️ 연차 발생 기준\n- 입사일 기준 1개월 만근 시 연차 1일 생성\n- 입사 1년 후 다음날 기준 연차 15일 생성 (출근율 80% 이상 시)"
    },
    {
      id: "leave-usage",
      category: "leave",
      keywords: ["연차", "휴가", "반차", "신청", "사용"],
      question: "연차/반차는 어떻게 사용하나요?",
      answer: "🗓️ 연차 사용 방법\n- 반차·반반차·연차 사용 가능\n- 사용 전 팀 내 사전 공유 필수\n- 연차 당겨쓰기는 불가 (팀장 승인 시 협의 가능)\n- FLEX > 휴가 메뉴에서 신청"
    },
    {
      id: "supplies-request",
      category: "supplies",
      keywords: ["비품", "사무용품", "신청", "물품"],
      question: "사무용품은 어떻게 신청하나요?",
      answer: "🖇️ 비품 신청\nFLEX > 워크플로우 > 사무용품신청서를 작성하시면 됩니다."
    },
    {
      id: "supplies-equipment",
      category: "supplies",
      keywords: ["노트북", "장비", "지급", "자산"],
      question: "입사 시 노트북/장비는 어떻게 받나요?",
      answer: "🖇️ 장비 지급\n입사 시 회사 자산(노트북 등) 지급 신청서를 FLEX에서 작성하시면 지급받을 수 있습니다."
    }
  ],
  fallback: "죄송해요, 아직 그 질문에 대한 답을 몰라요. 아래 '인사팀 문의'를 통해 직접 문의해주시겠어요? 🙏\n\n※ 관리자: data/qna.js 파일에 질문/키워드/답변을 추가하면 챗봇이 답할 수 있어요."
};
