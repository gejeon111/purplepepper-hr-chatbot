// 퍼플페퍼 HR 챗봇 - 답변 데이터
// 새 질문을 추가하려면 아래 qna 배열에 { keywords, question, answer } 형태로 추가하면 됩니다.
// keywords: 사용자가 입력할 만한 단어들 (여러 개 등록할수록 잘 알아들어요)
const QNA_DATA = {
  companyName: "퍼플페퍼",
  qna: [
    {
      id: "wifi-2f",
      keywords: ["2층", "와이파이", "wifi", "wi-fi", "비밀번호", "비번"],
      question: "2층 와이파이 비밀번호가 뭔가요?",
      answer: "📶 2층 와이파이\n- SSID: PurplePepper_2F\n- 비밀번호: pp2f-2024!!\n\n(관리자: data/qna.js 에서 실제 값으로 수정하세요)"
    },
    {
      id: "wifi-3f",
      keywords: ["3층", "와이파이", "wifi", "wi-fi", "비밀번호", "비번"],
      question: "3층 와이파이 비밀번호가 뭔가요?",
      answer: "📶 3층 와이파이\n- SSID: PurplePepper_3F\n- 비밀번호: pp3f-2024!!"
    },
    {
      id: "annual-leave",
      keywords: ["연차", "휴가", "월차", "신청"],
      question: "연차는 어떻게 신청하나요?",
      answer: "🗓️ 연차 신청 방법\n1. 사내 그룹웨어 > 근태관리 > 연차신청\n2. 사용일 최소 1일 전 신청\n3. 팀장 승인 후 자동 반영\n\n문의: 인사팀 (hr@purplepepper.com)"
    },
    {
      id: "expense",
      keywords: ["경비", "법인카드", "정산", "영수증"],
      question: "경비 정산은 어떻게 하나요?",
      answer: "💳 경비 정산\n1. 그룹웨어 > 경비관리 > 정산신청\n2. 영수증 사진 첨부 필수\n3. 매월 25일 마감\n\n문의: 재무팀 (finance@purplepepper.com)"
    },
    {
      id: "hr-contact",
      keywords: ["인사팀", "연락처", "담당자", "문의"],
      question: "인사팀 연락처가 어떻게 되나요?",
      answer: "☎️ 인사팀 연락처\n- 이메일: hr@purplepepper.com\n- 내선: 1234\n- 위치: 5층 인사팀"
    },
    {
      id: "meeting-room",
      keywords: ["회의실", "예약"],
      question: "회의실 예약은 어떻게 하나요?",
      answer: "📅 회의실 예약\n그룹웨어 > 회의실예약 메뉴에서 원하는 시간대를 선택해 예약할 수 있어요."
    },
    {
      id: "onboarding",
      keywords: ["신입", "온보딩", "입사", "첫날"],
      question: "입사 첫날 무엇을 준비해야 하나요?",
      answer: "🎉 입사 환영합니다!\n1. 신분증 지참\n2. 5층 인사팀에서 사원증 발급\n3. IT팀에서 노트북/계정 세팅\n\n궁금한 점은 언제든 인사팀에 문의하세요."
    }
  ],
  fallback: "죄송해요, 아직 그 질문에 대한 답을 몰라요. 인사팀(hr@purplepepper.com)에 직접 문의해주시겠어요? 🙏\n\n※ 관리자: data/qna.js 파일에 질문/키워드/답변을 추가하면 챗봇이 답할 수 있어요."
};
