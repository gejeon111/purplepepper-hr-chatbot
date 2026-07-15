const messagesEl = document.getElementById("messages");
const inputForm = document.getElementById("inputForm");
const userInput = document.getElementById("userInput");

let CATEGORIES = [];
let pollingInterval = null;

function formatTicketNo(n) {
  return String(n).padStart(4, "0");
}

function getSavedIdentity() {
  try {
    return {
      name: localStorage.getItem("pp_name") || "",
      phone: localStorage.getItem("pp_phone") || ""
    };
  } catch (e) {
    return { name: "", phone: "" };
  }
}

function saveIdentity(name, phone) {
  try {
    localStorage.setItem("pp_name", name);
    localStorage.setItem("pp_phone", phone);
  } catch (e) {
    // localStorage unavailable (e.g. private browsing) - skip saving
  }
}

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

function createMenuCard() {
  const card = document.createElement("div");
  card.className = "bubble bot menu-card";
  messagesEl.appendChild(card);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return card;
}

function addMenuButtonTo(card, label, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "menu-btn";
  btn.textContent = label;
  btn.addEventListener("click", () => {
    card.querySelectorAll("button").forEach((b) => {
      b.disabled = true;
    });
    onClick();
  });
  card.appendChild(btn);
  return btn;
}

function showCategoryMenu() {
  const card = createMenuCard();
  CATEGORIES.filter((cat) => !cat.parent_id).forEach((cat) => {
    addMenuButtonTo(card, cat.label, () => selectCategory(cat));
  });
}

function backToMenu() {
  stopPolling();
  showCategoryMenu();
}

function selectCategory(category) {
  addBubble(category.label, "user");

  if (category.is_system) {
    const card = createMenuCard();
    addMenuButtonTo(card, "새 문의 남기기", () => {
      addBubble("새 문의 남기기", "user");
      setTimeout(() => renderTicketForm(), 200);
    });
    addMenuButtonTo(card, "◀ 메뉴로", backToMenu);
    return;
  }

  const subcategories = CATEGORIES.filter((c) => c.parent_id === category.id);
  const directItems = QNA_DATA.qna.filter((item) => item.category_id === category.id);

  setTimeout(() => {
    addBubble("궁금한 항목을 선택해주세요.", "bot");
    const card = createMenuCard();
    subcategories.forEach((sub) => {
      addMenuButtonTo(card, sub.label, () => selectSubcategory(sub));
    });
    directItems.forEach((item) => {
      addMenuButtonTo(card, item.question, () => selectQuestion(item));
    });
    addMenuButtonTo(card, "◀ 메뉴로", backToMenu);
  }, 300);
}

function selectSubcategory(subcategory) {
  addBubble(subcategory.label, "user");
  setTimeout(() => {
    addBubble("궁금한 항목을 선택해주세요.", "bot");
    const card = createMenuCard();
    const items = QNA_DATA.qna.filter((item) => item.category_id === subcategory.id);
    items.forEach((item) => {
      addMenuButtonTo(card, item.question, () => selectQuestion(item));
    });
    addMenuButtonTo(card, "◀ 메뉴로", backToMenu);
  }, 300);
}

function selectQuestion(item) {
  addBubble(item.question, "user");
  setTimeout(() => {
    addBubble(item.answer, "bot");
    setTimeout(() => {
      addBubble("다른 궁금한 점이 있으신가요?", "bot");
      showCategoryMenu();
    }, 400);
  }, 300);
}

function attachPhoneAutoFormat(inputEl) {
  inputEl.addEventListener("input", () => {
    const digits = inputEl.value.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 3 && digits.length <= 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else if (digits.length > 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }
    inputEl.value = formatted;
  });
}

function appendBackToMenuButton() {
  const card = createMenuCard();
  addMenuButtonTo(card, "◀ 메뉴로", backToMenu);
}

function renderTicketForm() {
  const card = document.createElement("div");
  card.className = "bubble bot ticket-form";

  const intro = document.createElement("div");
  intro.className = "ticket-form-intro";
  intro.textContent = "인사팀에 궁금한 점을 남겨주세요.";
  card.appendChild(intro);

  const saved = getSavedIdentity();

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "이름";
  nameInput.value = saved.name;
  card.appendChild(nameInput);

  const phoneInput = document.createElement("input");
  phoneInput.type = "tel";
  phoneInput.placeholder = "연락처 (예: 010-1234-5678)";
  phoneInput.value = saved.phone;
  attachPhoneAutoFormat(phoneInput);
  card.appendChild(phoneInput);

  const notifyEmailInput = document.createElement("input");
  notifyEmailInput.type = "email";
  notifyEmailInput.placeholder = "이메일 (선택사항)";
  card.appendChild(notifyEmailInput);

  const notifyNotice = document.createElement("div");
  notifyNotice.className = "ticket-form-notice";
  notifyNotice.textContent =
    "※ 이메일을 남기셔도 답변 도착 알림은 현재 발송되지 않아요. 문의 제출 후 이 창에서 바로 답변을 확인하실 수 있어요.";
  card.appendChild(notifyNotice);

  const textarea = document.createElement("textarea");
  textarea.placeholder = "문의 내용을 입력해주세요";
  textarea.rows = 3;
  card.appendChild(textarea);

  const consentBox = document.createElement("div");
  consentBox.className = "consent-box";

  const consentText = document.createElement("div");
  consentText.className = "consent-text";
  consentText.textContent =
    "[개인정보 수집·이용 안내]\n" +
    "- 수집 항목: 이름, 연락처, 이메일(선택), 문의 내용\n" +
    "- 수집 목적: 문의 접수 및 답변 제공\n" +
    "- 보유 기간: 문의 처리 완료 후 파기\n" +
    "동의를 거부하실 수 있으며, 거부 시 문의 접수가 제한됩니다.";
  consentBox.appendChild(consentText);

  const consentLabel = document.createElement("label");
  consentLabel.className = "consent-label";
  const consentCheckbox = document.createElement("input");
  consentCheckbox.type = "checkbox";
  consentLabel.appendChild(consentCheckbox);
  consentLabel.append(" 개인정보 수집 및 이용에 동의합니다 (필수)");
  consentBox.appendChild(consentLabel);

  card.appendChild(consentBox);

  const errorMsg = document.createElement("div");
  errorMsg.className = "ticket-form-error";
  card.appendChild(errorMsg);

  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.textContent = "문의 제출";
  card.appendChild(submitBtn);

  submitBtn.addEventListener("click", async () => {
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const notifyEmail = notifyEmailInput.value.trim();
    const question = textarea.value.trim();
    errorMsg.textContent = "";

    if (!name || !phone || !question) {
      errorMsg.textContent = "이름, 연락처, 문의 내용을 모두 입력해주세요.";
      return;
    }

    if (!consentCheckbox.checked) {
      errorMsg.textContent = "개인정보 수집 및 이용에 동의해주셔야 문의를 접수할 수 있어요.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "제출 중...";

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, notifyEmail, question })
      });
      if (!res.ok) throw new Error("submit failed");
      const data = await res.json();
      saveIdentity(name, phone);

      card.remove();
      addBubble(`✅ 문의가 접수되었습니다! 문의번호: HR-${formatTicketNo(data.displayNo)}`, "bot");
      renderThreadView(data.displayNo, phone, [
        { sender: "user", body: question, created_at: new Date().toISOString() }
      ]);
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = "문의 제출";
      errorMsg.textContent = "제출에 실패했어요. 잠시 후 다시 시도해주세요.";
    }
  });

  messagesEl.appendChild(card);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  appendBackToMenuButton();
}

function renderThreadMessage(container, m) {
  const bubble = document.createElement("div");
  bubble.className = `thread-msg ${m.sender === "hr" ? "hr" : "user"}`;
  bubble.textContent = m.body;
  container.appendChild(bubble);
}

function renderThreadView(ticketId, phone, initialMessages) {
  stopPolling();

  const container = document.createElement("div");
  container.className = "bubble bot ticket-form thread-view";

  const title = document.createElement("div");
  title.className = "ticket-form-intro";
  title.textContent = `문의번호 HR-${formatTicketNo(ticketId)} 확인`;
  container.appendChild(title);

  const threadMessages = document.createElement("div");
  threadMessages.className = "thread-messages";
  container.appendChild(threadMessages);

  messagesEl.appendChild(container);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  let renderedCount = 0;

  function renderAll(msgs) {
    threadMessages.innerHTML = "";
    msgs.forEach((m) => renderThreadMessage(threadMessages, m));
    if (!msgs.some((m) => m.sender === "hr")) {
      const waiting = document.createElement("div");
      waiting.className = "thread-msg hr waiting";
      waiting.textContent = "아직 답변 전이에요. 답변이 등록되면 자동으로 여기에 표시돼요.";
      threadMessages.appendChild(waiting);
    }
    renderedCount = msgs.length;
    threadMessages.scrollTop = threadMessages.scrollHeight;
  }

  renderAll(initialMessages);

  async function refresh() {
    try {
      const res = await fetch(
        `/api/tickets/lookup?id=${encodeURIComponent(ticketId)}&phone=${encodeURIComponent(phone)}`
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

  pollingInterval = setInterval(refresh, 3000);

  appendBackToMenuButton();
}

async function loadCategories() {
  try {
    const res = await fetch("/api/categories");
    if (!res.ok) return;
    const data = await res.json();
    CATEGORIES = data.categories;
  } catch (err) {
    CATEGORIES = [];
  }
}

async function loadFaqItems() {
  try {
    const res = await fetch("/api/faq");
    if (!res.ok) return;
    const data = await res.json();
    QNA_DATA.qna = data.items.map((item) => ({
      id: item.id,
      category_id: item.category_id,
      question: item.question,
      answer: item.answer,
      keywords: (item.keywords || "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    }));
  } catch (err) {
    QNA_DATA.qna = [];
  }
}

(async () => {
  await Promise.all([loadCategories(), loadFaqItems()]);
  addBubble(`안녕하세요!\n${QNA_DATA.companyName}입니다. 무엇을 도와드릴까요?`, "bot");
  showCategoryMenu();
})();
