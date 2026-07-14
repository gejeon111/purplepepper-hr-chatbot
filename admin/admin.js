const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const ticketList = document.getElementById("ticketList");

const ticketsTab = document.getElementById("ticketsTab");
const faqTab = document.getElementById("faqTab");
const categoriesTab = document.getElementById("categoriesTab");
const faqList = document.getElementById("faqList");
const faqCategory = document.getElementById("faqCategory");
const faqQuestion = document.getElementById("faqQuestion");
const faqAnswer = document.getElementById("faqAnswer");
const faqKeywords = document.getElementById("faqKeywords");
const faqAddBtn = document.getElementById("faqAddBtn");
const faqFormError = document.getElementById("faqFormError");
const categoryList = document.getElementById("categoryList");
const categoryLabelInput = document.getElementById("categoryLabel");
const categoryAddBtn = document.getElementById("categoryAddBtn");
const categoryFormError = document.getElementById("categoryFormError");

let CATEGORIES = [];

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR");
}

function renderTickets(tickets) {
  ticketList.innerHTML = "";

  if (tickets.length === 0) {
    ticketList.innerHTML = '<div class="empty-state">접수된 문의가 없습니다.</div>';
    return;
  }

  tickets.forEach((ticket) => {
    const card = document.createElement("div");
    card.className = "ticket-card";

    const meta = document.createElement("div");
    meta.className = "ticket-meta";

    const metaLeft = document.createElement("span");
    const contact = ticket.name ? `${ticket.name} (${ticket.phone})` : ticket.email || "연락처 없음";
    metaLeft.textContent = `HR-${ticket.id} · ${contact} · ${formatDate(ticket.created_at)}`;
    meta.appendChild(metaLeft);

    const badge = document.createElement("span");
    badge.className = `ticket-badge ${ticket.status}`;
    badge.textContent = ticket.status === "answered" ? "답변완료" : "미답변";
    meta.appendChild(badge);

    card.appendChild(meta);

    const thread = document.createElement("div");
    thread.className = "admin-thread";
    (ticket.messages || []).forEach((m) => {
      const bubble = document.createElement("div");
      bubble.className = `thread-msg ${m.sender === "hr" ? "hr" : "user"}`;
      bubble.textContent = m.body;
      thread.appendChild(bubble);
    });
    card.appendChild(thread);

    const replyBox = document.createElement("div");
    replyBox.className = "ticket-reply-box";

    const textarea = document.createElement("textarea");
    textarea.placeholder = "답변을 입력하세요";
    replyBox.appendChild(textarea);

    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.textContent = "답장 보내기";
    replyBox.appendChild(submitBtn);

    const errorMsg = document.createElement("div");
    errorMsg.className = "admin-error";
    replyBox.appendChild(errorMsg);

    submitBtn.addEventListener("click", async () => {
      const reply = textarea.value.trim();
      if (!reply) {
        errorMsg.textContent = "답변 내용을 입력해주세요.";
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "전송 중...";
      try {
        const res = await fetch("/api/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: ticket.id, reply })
        });
        if (!res.ok) throw new Error("reply failed");
        await loadTickets();
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = "답장 보내기";
        errorMsg.textContent = "전송에 실패했어요. 다시 시도해주세요.";
      }
    });

    card.appendChild(replyBox);
    ticketList.appendChild(card);
  });
}

async function loadTickets() {
  const res = await fetch("/api/tickets");
  if (res.status === 401) {
    loginView.style.display = "block";
    dashboardView.style.display = "none";
    return;
  }
  const data = await res.json();
  loginView.style.display = "none";
  dashboardView.style.display = "block";
  renderTickets(data.tickets);
}

loginBtn.addEventListener("click", async () => {
  const password = passwordInput.value;
  loginError.textContent = "";
  if (!password) {
    loginError.textContent = "비밀번호를 입력해주세요.";
    return;
  }
  try {
    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      loginError.textContent = "비밀번호가 올바르지 않습니다.";
      return;
    }
    passwordInput.value = "";
    await loadTickets();
  } catch (err) {
    loginError.textContent = "로그인에 실패했어요. 다시 시도해주세요.";
  }
});

passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginBtn.click();
});

document.querySelectorAll(".admin-tab").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

function switchTab(tab) {
  document.querySelectorAll(".admin-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  ticketsTab.style.display = tab === "tickets" ? "block" : "none";
  faqTab.style.display = tab === "faq" ? "block" : "none";
  categoriesTab.style.display = tab === "categories" ? "block" : "none";
  if (tab === "faq") loadFaq();
  if (tab === "categories") loadCategoryManagement();
}

async function fetchCategories() {
  const res = await fetch("/api/categories");
  const data = await res.json();
  CATEGORIES = data.categories;
  return CATEGORIES;
}

function getAssignableCategories() {
  const tops = CATEGORIES.filter((c) => !c.parent_id && !c.is_system).sort((a, b) => a.sort_order - b.sort_order);
  const result = [];
  tops.forEach((top) => {
    result.push({ id: top.id, displayLabel: top.label });
    const subs = CATEGORIES.filter((c) => c.parent_id === top.id).sort((a, b) => a.sort_order - b.sort_order);
    subs.forEach((sub) => {
      result.push({ id: sub.id, displayLabel: `${top.label} › ${sub.label}` });
    });
  });
  return result;
}

function populateFaqCategorySelect() {
  faqCategory.innerHTML = "";
  getAssignableCategories().forEach((entry) => {
    const opt = document.createElement("option");
    opt.value = entry.id;
    opt.textContent = entry.displayLabel;
    faqCategory.appendChild(opt);
  });
}

function renderFaqItemCard(item) {
  const card = document.createElement("div");
  card.className = "faq-item-card";

  const questionEl = document.createElement("div");
  questionEl.className = "faq-item-question";
  questionEl.textContent = item.question;
  card.appendChild(questionEl);

  const answerEl = document.createElement("div");
  answerEl.className = "faq-item-answer";
  answerEl.textContent = item.answer;
  card.appendChild(answerEl);

  const actions = document.createElement("div");
  actions.className = "faq-item-actions";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.textContent = "수정";
  actions.appendChild(editBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "danger";
  deleteBtn.textContent = "삭제";
  actions.appendChild(deleteBtn);

  card.appendChild(actions);

  editBtn.addEventListener("click", () => renderFaqEditForm(card, item));

  deleteBtn.addEventListener("click", async () => {
    if (!confirm("이 FAQ 항목을 삭제할까요?")) return;
    deleteBtn.disabled = true;
    try {
      const res = await fetch(`/api/faq/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      await loadFaq();
    } catch (err) {
      deleteBtn.disabled = false;
      alert("삭제에 실패했어요. 다시 시도해주세요.");
    }
  });

  return card;
}

function renderFaqEditForm(card, item) {
  card.innerHTML = "";
  card.classList.add("faq-form");

  const categorySelect = document.createElement("select");
  getAssignableCategories().forEach((entry) => {
    const opt = document.createElement("option");
    opt.value = entry.id;
    opt.textContent = entry.displayLabel;
    if (entry.id === item.category_id) opt.selected = true;
    categorySelect.appendChild(opt);
  });
  card.appendChild(categorySelect);

  const questionInput = document.createElement("input");
  questionInput.type = "text";
  questionInput.value = item.question;
  card.appendChild(questionInput);

  const answerInput = document.createElement("textarea");
  answerInput.value = item.answer;
  card.appendChild(answerInput);

  const keywordsInput = document.createElement("input");
  keywordsInput.type = "text";
  keywordsInput.value = item.keywords || "";
  keywordsInput.placeholder = "검색 키워드, 쉼표로 구분";
  card.appendChild(keywordsInput);

  const errorMsg = document.createElement("div");
  errorMsg.className = "admin-error";
  card.appendChild(errorMsg);

  const actions = document.createElement("div");
  actions.className = "faq-item-actions";

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.textContent = "저장";
  actions.appendChild(saveBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "취소";
  actions.appendChild(cancelBtn);

  card.appendChild(actions);

  cancelBtn.addEventListener("click", () => loadFaq());

  saveBtn.addEventListener("click", async () => {
    const categoryId = Number(categorySelect.value);
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();
    const keywords = keywordsInput.value.trim();

    if (!question || !answer) {
      errorMsg.textContent = "질문과 답변을 모두 입력해주세요.";
      return;
    }

    saveBtn.disabled = true;
    try {
      const res = await fetch(`/api/faq/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, question, answer, keywords })
      });
      if (!res.ok) throw new Error("update failed");
      await loadFaq();
    } catch (err) {
      saveBtn.disabled = false;
      errorMsg.textContent = "저장에 실패했어요. 다시 시도해주세요.";
    }
  });
}

function renderFaqList(items) {
  faqList.innerHTML = "";

  if (items.length === 0) {
    faqList.innerHTML = '<div class="empty-state">등록된 FAQ가 없습니다.</div>';
    return;
  }

  const tops = CATEGORIES.filter((c) => !c.parent_id && !c.is_system).sort((a, b) => a.sort_order - b.sort_order);

  tops.forEach((top) => {
    const subs = CATEGORIES.filter((c) => c.parent_id === top.id).sort((a, b) => a.sort_order - b.sort_order);
    const directItems = items.filter((item) => item.category_id === top.id);
    const subGroups = subs
      .map((sub) => ({ sub, subItems: items.filter((item) => item.category_id === sub.id) }))
      .filter((g) => g.subItems.length > 0);
    const topItemCount = directItems.length + subGroups.reduce((sum, g) => sum + g.subItems.length, 0);
    if (topItemCount === 0) return;

    const topGroup = document.createElement("div");
    topGroup.className = "faq-top-group";

    const topTitle = document.createElement("div");
    topTitle.className = "faq-top-title";
    topTitle.textContent = `▸ ${top.label} (${topItemCount})`;
    topGroup.appendChild(topTitle);

    const body = document.createElement("div");
    body.className = "faq-top-body";
    body.style.display = "none";

    if (directItems.length > 0) {
      const group = document.createElement("div");
      group.className = "faq-category-group";
      directItems.forEach((item) => group.appendChild(renderFaqItemCard(item)));
      body.appendChild(group);
    }

    subGroups.forEach(({ sub, subItems }) => {
      const group = document.createElement("div");
      group.className = "faq-category-group";

      const title = document.createElement("div");
      title.className = "faq-category-title";
      title.textContent = sub.label;
      group.appendChild(title);

      subItems.forEach((item) => group.appendChild(renderFaqItemCard(item)));
      body.appendChild(group);
    });

    topTitle.addEventListener("click", () => {
      const isOpen = body.style.display !== "none";
      body.style.display = isOpen ? "none" : "block";
      topTitle.textContent = `${isOpen ? "▸" : "▾"} ${top.label} (${topItemCount})`;
    });

    topGroup.appendChild(body);
    faqList.appendChild(topGroup);
  });
}

async function loadFaq() {
  await fetchCategories();
  populateFaqCategorySelect();
  const res = await fetch("/api/faq");
  const data = await res.json();
  renderFaqList(data.items);
}

faqAddBtn.addEventListener("click", async () => {
  const categoryId = Number(faqCategory.value);
  const question = faqQuestion.value.trim();
  const answer = faqAnswer.value.trim();
  const keywords = faqKeywords.value.trim();
  faqFormError.textContent = "";

  if (!categoryId || !question || !answer) {
    faqFormError.textContent = "카테고리, 질문, 답변을 모두 입력해주세요.";
    return;
  }

  faqAddBtn.disabled = true;
  try {
    const res = await fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, question, answer, keywords })
    });
    if (!res.ok) throw new Error("create failed");
    faqQuestion.value = "";
    faqAnswer.value = "";
    faqKeywords.value = "";
    await loadFaq();
  } catch (err) {
    faqFormError.textContent = "추가에 실패했어요. 다시 시도해주세요.";
  } finally {
    faqAddBtn.disabled = false;
  }
});

async function moveCategory(cat, direction) {
  const siblings = CATEGORIES.filter((c) => (c.parent_id || null) === (cat.parent_id || null)).sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const idx = siblings.findIndex((c) => c.id === cat.id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= siblings.length) return;
  const other = siblings[swapIdx];

  await fetch(`/api/categories/${cat.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sortOrder: other.sort_order })
  });
  await fetch(`/api/categories/${other.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sortOrder: cat.sort_order })
  });
  await loadCategoryManagement();
}

function renderCategoryRow(cat, depth) {
  const card = document.createElement("div");
  card.className = "faq-item-card";
  if (depth > 0) card.style.marginLeft = "24px";

  const labelEl = document.createElement("div");
  labelEl.className = "faq-item-question";
  labelEl.textContent = (depth > 0 ? "└ " : "") + cat.label + (cat.is_system ? " (시스템)" : "");
  card.appendChild(labelEl);

  const actions = document.createElement("div");
  actions.className = "faq-item-actions";

  const upBtn = document.createElement("button");
  upBtn.type = "button";
  upBtn.textContent = "▲";
  upBtn.addEventListener("click", () => moveCategory(cat, "up"));
  actions.appendChild(upBtn);

  const downBtn = document.createElement("button");
  downBtn.type = "button";
  downBtn.textContent = "▼";
  downBtn.addEventListener("click", () => moveCategory(cat, "down"));
  actions.appendChild(downBtn);

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.textContent = "이름 수정";
  actions.appendChild(editBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "danger";
  deleteBtn.textContent = "삭제";
  if (cat.is_system) deleteBtn.disabled = true;
  actions.appendChild(deleteBtn);

  card.appendChild(actions);

  editBtn.addEventListener("click", () => renderCategoryEditForm(card, cat));

  deleteBtn.addEventListener("click", async () => {
    const hasSubs = CATEGORIES.some((c) => c.parent_id === cat.id);
    const msg = hasSubs
      ? `"${cat.label}" 카테고리를 삭제할까요? 하위 카테고리와 그 안의 FAQ 항목도 모두 삭제됩니다.`
      : `"${cat.label}" 카테고리를 삭제할까요? 이 카테고리에 속한 FAQ 항목도 함께 삭제됩니다.`;
    if (!confirm(msg)) return;
    deleteBtn.disabled = true;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      await loadCategoryManagement();
    } catch (err) {
      deleteBtn.disabled = false;
      alert("삭제에 실패했어요. 다시 시도해주세요.");
    }
  });

  return card;
}

function renderAddSubcategoryRow(parentCat) {
  const card = document.createElement("div");
  card.className = "faq-form";
  card.style.marginLeft = "24px";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = `"${parentCat.label}" 안에 하위 카테고리 추가`;
  card.appendChild(input);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "하위 카테고리 추가";
  card.appendChild(btn);

  const errorMsg = document.createElement("div");
  errorMsg.className = "admin-error";
  card.appendChild(errorMsg);

  btn.addEventListener("click", async () => {
    const label = input.value.trim();
    if (!label) {
      errorMsg.textContent = "이름을 입력해주세요.";
      return;
    }
    btn.disabled = true;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, parentId: parentCat.id })
      });
      if (!res.ok) throw new Error("create failed");
      await loadCategoryManagement();
    } catch (err) {
      btn.disabled = false;
      errorMsg.textContent = "추가에 실패했어요. 다시 시도해주세요.";
    }
  });

  return card;
}

function renderCategoryEditForm(card, cat) {
  card.innerHTML = "";
  card.classList.add("faq-form");

  const labelInput = document.createElement("input");
  labelInput.type = "text";
  labelInput.value = cat.label;
  card.appendChild(labelInput);

  const errorMsg = document.createElement("div");
  errorMsg.className = "admin-error";
  card.appendChild(errorMsg);

  const actions = document.createElement("div");
  actions.className = "faq-item-actions";

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.textContent = "저장";
  actions.appendChild(saveBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "취소";
  actions.appendChild(cancelBtn);

  card.appendChild(actions);

  cancelBtn.addEventListener("click", () => loadCategoryManagement());

  saveBtn.addEventListener("click", async () => {
    const label = labelInput.value.trim();
    if (!label) {
      errorMsg.textContent = "카테고리 이름을 입력해주세요.";
      return;
    }
    saveBtn.disabled = true;
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label })
      });
      if (!res.ok) throw new Error("update failed");
      await loadCategoryManagement();
    } catch (err) {
      saveBtn.disabled = false;
      errorMsg.textContent = "저장에 실패했어요. 다시 시도해주세요.";
    }
  });
}

async function loadCategoryManagement() {
  await fetchCategories();
  categoryList.innerHTML = "";
  const tops = CATEGORIES.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  if (tops.length === 0) {
    categoryList.innerHTML = '<div class="empty-state">카테고리가 없습니다.</div>';
    return;
  }
  tops.forEach((top) => {
    categoryList.appendChild(renderCategoryRow(top, 0));
    const subs = CATEGORIES.filter((c) => c.parent_id === top.id).sort((a, b) => a.sort_order - b.sort_order);
    subs.forEach((sub) => categoryList.appendChild(renderCategoryRow(sub, 1)));
    if (!top.is_system) {
      categoryList.appendChild(renderAddSubcategoryRow(top));
    }
  });
}

categoryAddBtn.addEventListener("click", async () => {
  const label = categoryLabelInput.value.trim();
  categoryFormError.textContent = "";

  if (!label) {
    categoryFormError.textContent = "카테고리 이름을 입력해주세요.";
    return;
  }

  categoryAddBtn.disabled = true;
  try {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label })
    });
    if (!res.ok) throw new Error("create failed");
    categoryLabelInput.value = "";
    await loadCategoryManagement();
  } catch (err) {
    categoryFormError.textContent = "추가에 실패했어요. 다시 시도해주세요.";
  } finally {
    categoryAddBtn.disabled = false;
  }
});

loadTickets();
