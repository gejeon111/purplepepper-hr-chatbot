// Purple Pepper Chatbot - 고정 메타데이터
// 실제 질문/답변(FAQ) 내용은 관리자 페이지(/admin)의 "FAQ 관리"에서 추가/수정/삭제합니다.
const QNA_DATA = {
  companyName: "퍼플페퍼",
  categories: [
    { id: "wifi", label: "📶 와이파이" },
    { id: "leave", label: "🗓️ 연차 및 휴가" },
    { id: "supplies", label: "🖇️ 사무실 물품" },
    { id: "contact", label: "✉️ 인사팀 문의" }
  ],
  qna: [],
  fallback: "죄송해요, 아직 그 질문에 대한 답을 몰라요. 아래 '인사팀 문의'를 통해 직접 문의해주시겠어요? 🙏"
};
