const messagesEl = document.getElementById("messages");
const quickQuestionsEl = document.getElementById("quickQuestions");
const inputForm = document.getElementById("inputForm");
const userInput = document.getElementById("userInput");

let currentCategory = null;
let pollingInterval = null;

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

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
  addMenuButton("◀ 메뉴로", backToMenu);
}

function backToMenu() {
  stopPolling();
  currentCategory = null;
  renderMenu();
}

function selectCategory(categoryId) {
  const category = QNA_DATA.categories.find((c) => c.id === categoryId);
  addBubble(category.label, "user");
  currentCategory = categoryId;

  if (categoryId === "contact") {
    clearMenu();
    addMenuButton("새 문의 남기기", () => {
      addBubble("새 문의 남기기", "user");
      clearMenu();
      addMenuButton("◀ 메뉴로", backToMenu);
      setTimeout(() => renderTicketForm(), 200);
    });
    addMenuButton("문의 확인하기", () => {
      addBubble("문의 확인하기", "user");
      clearMenu();
      addMenuButton("◀ 메뉴로", backToMenu);
      setTimeout(() => renderLookupForm(), 200);
    });
    addMenuButton("◀ 메뉴로", backToMenu);
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
      const data = await res.json();

      card.innerHTML = "";
      card.classList.remove("ticket-form");
      card.textContent = `✅ 문의가 접수되었습니다! 문의번호: HR-${data.id}\n나중에 '문의 확인하기'에서 이 번호와 이메일로 답변을 확인하실 수 있어요.`;
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = "문의 제출";
      errorMsg.textContent = "제출에 실패했어요. 잠시 후 다시 시도해주세요.";
    }
  });

  messagesEl.appendChild(card);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderLookupForm() {
  const card = document.createElement("div");
  card.className = "bubble bot ticket-form";

  const intro = document.createElement("div");
  intro.className = "ticket-form-intro";
  intro.textContent = "문의번호와 접수 시 입력한 이메일을 입력해주세요.";
  card.appendChild(intro);

  const idInput = document.createElement("input");
  idInput.type = "text";
  idInput.placeholder = "문의번호 (예: HR-12)";
  card.appendChild(idInput);

  const emailInput = document.createElement("input");
  emailInput.type = "email";
  emailInput.placeholder = "이메일 주소";
  card.appendChild(emailInput);

  const errorMsg = document.createElement("div");
  errorMsg.className = "ticket-form-error";
  card.appendChild(errorMsg);

  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.textContent = "조회";
  card.appendChild(submitBtn);

  submitBtn.addEventListener("click", async () => {
    const rawId = idInput.value.trim().replace(/^HR-/i, "");
    const email = emailInput.value.trim();
    errorMsg.textContent = "";

    if (!rawId || !email) {
      errorMsg.textContent = "문의번호와 이메일을 모두 입력해주세요.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "조회 중...";

    try {
      const res = await fetch(
        `/api/tickets/lookup?id=${encodeURIComponent(rawId)}&email=${encodeURIComponent(email)}`
      );
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      card.remove();
      renderThreadView(rawId, email, data.messages);
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = "조회";
      errorMsg.textContent = "문의를 찾을 수 없어요. 문의번호와 이메일을 확인해주세요.";
    }
  });

  messagesEl.appendChild(card);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderThreadMessage(container, m) {
  const bubble = document.createElement("div");
  bubble.className = `thread-msg ${m.sender === "hr" ? "hr" : "user"}`;
  bubble.textContent = m.body;
  container.appendChild(bubble);
}

function renderThreadView(ticketId, email, initialMessages) {
  stopPolling();

  const container = document.createElement("div");
  container.className = "bubble bot ticket-form thread-view";

  const title = document.createElement("div");
  title.className = "ticket-form-intro";
  title.textContent = `문의번호 HR-${ticketId} 대화`;
  container.appendChild(title);

  const threadMessages = document.createElement("div");
  threadMessages.className = "thread-messages";
  container.appendChild(threadMessages);

  const inputRow = document.createElement("div");
  inputRow.className = "thread-input-row";
  const msgInput = document.createElement("input");
  msgInput.type = "text";
  msgInput.placeholder = "추가로 남길 말을 입력하세요";
  const sendBtn = document.createElement("button");
  sendBtn.type = "button";
  sendBtn.textContent = "전송";
  inputRow.appendChild(msgInput);
  inputRow.appendChild(sendBtn);
  container.appendChild(inputRow);

  messagesEl.appendChild(container);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  let renderedCount = 0;

  function renderAll(msgs) {
    threadMessages.innerHTML = "";
    msgs.forEach((m) => renderThreadMessage(threadMessages, m));
    renderedCount = msgs.length;
    threadMessages.scrollTop = threadMessages.scrollHeight;
  }

  renderAll(initialMessages);

  async function refresh() {
    try {
      const res = await fetch(
        `/api/tickets/lookup?id=${encodeURIComponent(ticketId)}&email=${encodeURIComponent(email)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.messages.length !== renderedCount) {
        renderAll(data.messages);
      }
    } catch (err) {
      // ignore transient polling errors
    }
  }

  pollingInterval = setInterval(refresh, 10000);

  sendBtn.addEventListener("click", async () => {
    const message = msgInput.value.trim();
    if (!message) return;
    sendBtn.disabled = true;

    try {
      const res = await fetch("/api/tickets/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, email, message })
      });
      if (!res.ok) throw new Error("send failed");
      const data = await res.json();
      renderAll(data.messages);
      msgInput.value = "";
    } catch (err) {
      msgInput.placeholder = "전송 실패, 다시 시도해주세요";
    } finally {
      sendBtn.disabled = false;
    }
  });
}

async function loadFaqItems() {
  try {
    const res = await fetch("/api/faq");
    if (!res.ok) return;
    const data = await res.json();
    QNA_DATA.qna = data.items.map((item) => ({
      id: item.id,
      category: item.category,
      question: item.question,
      answer: item.answer,
      keywords: (item.keywords || "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    }));
  } catch (err) {
    // keep QNA_DATA.qna empty if FAQ fails to load; menu/free-text search will just find nothing
  }
}

(async () => {
  await loadFaqItems();
  renderMenu();
  addBubble(`안녕하세요!\n${QNA_DATA.companyName}입니다. 무엇을 도와드릴까요?`, "bot");
})();
