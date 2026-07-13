const messagesEl = document.getElementById("messages");
const quickQuestionsEl = document.getElementById("quickQuestions");
const inputForm = document.getElementById("inputForm");
const userInput = document.getElementById("userInput");

document.getElementById("companyTitle").textContent = `${QNA_DATA.companyName} HR 챗봇`;

function addBubble(text, sender) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${sender}`;
  bubble.textContent = text;
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function normalize(str) {
  return str.toLowerCase().replace(/\s+/g, "");
}

function findAnswer(userText) {
  const normalizedInput = normalize(userText);
  let bestMatch = null;
  let bestScore = 0;

  for (const item of QNA_DATA.qna) {
    let score = 0;
    for (const keyword of item.keywords) {
      if (normalizedInput.includes(normalize(keyword))) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestScore > 0 ? bestMatch.answer : QNA_DATA.fallback;
}

function handleUserMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  addBubble(trimmed, "user");
  const answer = findAnswer(trimmed);
  setTimeout(() => addBubble(answer, "bot"), 300);
}

inputForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleUserMessage(userInput.value);
  userInput.value = "";
  userInput.focus();
});

function renderQuickQuestions() {
  QNA_DATA.qna.slice(0, 5).forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quick-btn";
    btn.textContent = item.question;
    btn.addEventListener("click", () => handleUserMessage(item.question));
    quickQuestionsEl.appendChild(btn);
  });
}

renderQuickQuestions();
addBubble(`안녕하세요! ${QNA_DATA.companyName} HR 챗봇이에요. 무엇이든 물어보세요 👋`, "bot");
