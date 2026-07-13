const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const ticketList = document.getElementById("ticketList");

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
    meta.innerHTML = `
      <span>HR-${ticket.id} · ${ticket.email} · ${formatDate(ticket.created_at)}</span>
      <span class="ticket-badge ${ticket.status}">${ticket.status === "answered" ? "답변완료" : "미답변"}</span>
    `;
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

loadTickets();
