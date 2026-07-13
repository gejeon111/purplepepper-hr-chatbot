const messagesEl = document.getElementById("messages");
const quickQuestionsEl = document.getElementById("quickQuestions");
const inputForm = document.getElementById("inputForm");
const userInput = document.getElementById("userInput");

let currentCategory = null;

function addBubble(text, sender) {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${sender}`;
  bubble.textContent = text;
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
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

function handleFreeTextMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  addBubble(trimmed, "user");
  const answer = findAnswer(trimmed);
  setTimeout(() => addBubble(answer, "bot"), 300);
}

inputForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleFreeTextMessage(userInput.value);
  userInput.value = "";
  userInput.focus();
});

function clearMenu() {
  quickQuestionsEl.innerHTML = "";
}

function addMenuButton(label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "quick-btn";
  btn.textContent = label;
  btn.addEventListener("click", onClick);
  quickQuestionsEl.appendChild(btn);
  return btn;
}

function renderMenu() {
  clearMenu();

  if (!currentCategory) {
    QNA_DATA.categories.forEach((cat) => {
      addMenuButton(cat.label, () => selectCategory(cat.id));
    });
    return;
  }

  const items = QNA_DATA.qna.filter((item) => item.category === currentCategory);
  items.forEach((item) => {
    addMenuButton(item.question, () => selectQuestion(item));
  });
  addMenuButton("◀ 메뉴로", () => {
    currentCategory = null;
    renderMenu();
  });
}

function selectCategory(categoryId) {
  const category = QNA_DATA.categories.find((c) => c.id === categoryId);
  addBubble(category.label, "user");
  currentCategory = categoryId;

  if (categoryId === "contact") {
    setTimeout(() => renderTicketForm(), 300);
    clearMenu();
    addMenuButton("◀ 메뉴로", () => {
      currentCategory = null;
      renderMenu();
    });
    return;
  }

  setTimeout(() => addBubble("궁금한 항목을 선택해주세요.", "bot"), 300);
  renderMenu();
}

function selectQuestion(item) {
  addBubble(item.question, "user");
  setTimeout(() => {
    addBubble(item.answer, "bot");
    setTimeout(() => {
      addBubble("다른 궁금한 점이 있으신가요?", "bot");
      currentCategory = null;
      renderMenu();
    }, 400);
  }, 300);
}

function renderTicketForm() {
  const card = document.createElement("div");
  card.className = "bubble bot ticket-form";

  const intro = document.createElement("div");
  intro.className = "ticket-form-intro";
  intro.textContent = "인사팀에 궁금한 점을 남겨주세요. 답변은 이메일로 보내드려요.";
  card.appendChild(intro);

  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.placeholder = "답변 받으실 이메일 주소";
  emailInput.required = true;
  card.appendChild(emailInput);

  const textarea = document.createElement("textarea");
  textarea.placeholder = "문의 내용을 입력해주세요";
  textarea.rows = 3;
  textarea.required = true;
  card.appendChild(textarea);

  const errorMsg = document.createElement("div");
  errorMsg.className = "ticket-form-error";
  card.appendChild(errorMsg);

  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.textContent = "문의 제출";
  card.appendChild(submitBtn);

  submitBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const question = textarea.value.trim();
    errorMsg.textContent = "";

    if (!email || !question) {
      errorMsg.textContent = "이메일과 문의 내용을 모두 입력해주세요.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "제출 중...";

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, question })
      });
      if (!res.ok) throw new Error("submit failed");

      card.innerHTML = "";
      card.classList.remove("ticket-form");
      card.textContent = "✅ 문의가 접수되었습니다. 답변은 입력하신 이메일로 발송됩니다.";
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = "문의 제출";
      errorMsg.textContent = "제출에 실패했어요. 잠시 후 다시 시도해주세요.";
    }
  });

  messagesEl.appendChild(card);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

renderMenu();
addBubble(`안녕하세요!\n${QNA_DATA.companyName}입니다. 무엇을 도와드릴까요?`, "bot");
