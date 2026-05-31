const TABLE_NAME = "cola_survey_answers";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let selectedRating = 0;
let loadedAnswers = [];

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    document.getElementById("surveyPanel").classList.toggle("active-panel", tab.dataset.tab === "survey");
    document.getElementById("adminPanel").classList.toggle("active-panel", tab.dataset.tab === "admin");
  });
});

document.querySelectorAll("#stars button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedRating = Number(button.dataset.value);
    document.getElementById("rating").value = selectedRating;

    document.querySelectorAll("#stars button").forEach((b) => {
      b.classList.toggle("selected", Number(b.dataset.value) <= selectedRating);
    });
  });
});

document.getElementById("surveyForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = document.getElementById("saveMessage");

  if (!selectedRating) {
    message.textContent = "⭐評価を選んでください。";
    return;
  }

  const payload = {
  name: document.getElementById("name").value.trim(),
  rating: selectedRating,
  better: document.getElementById("better").value.trim(),
  use_case: document.getElementById("useCase").value.trim(),
  free_comment: document.getElementById("freeComment").value.trim(),
  user_agent: navigator.userAgent
};

  message.textContent = "保存中です...";

  const { error } = await supabaseClient
    .from(TABLE_NAME)
    .insert(payload);

  if (error) {
    console.error(error);
    message.textContent = "保存に失敗しました。Supabase設定・RLSポリシーを確認してください。";
    return;
  }

  message.textContent = "保存しました！ご協力ありがとうございます。";

  event.target.reset();
  selectedRating = 0;

  document.querySelectorAll("#stars button").forEach((b) => {
    b.classList.remove("selected");
  });
});

document.getElementById("loadAdmin").addEventListener("click", async () => {
  const pass = document.getElementById("adminPass").value;
  const message = document.getElementById("adminMessage");

  if (pass !== ADMIN_PASSCODE) {
    message.textContent = "管理用パスコードが違います。";
    return;
  }

  message.textContent = "Supabaseから回答を取得中です...";

  const { data, error } = await supabaseClient
    .from(TABLE_NAME)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    message.textContent = "取得に失敗しました。select用RLSポリシーを確認してください。";
    return;
  }

  loadedAnswers = data || [];
  renderStats(loadedAnswers);

  document.getElementById("statsArea").classList.remove("hidden");
  message.textContent = `取得しました：${loadedAnswers.length}件`;
});

document.getElementById("downloadCsv").addEventListener("click", () => {
  if (!loadedAnswers.length) {
    alert("CSVにする回答がありません。");
    return;
  }

  const columns = [
  "id",
  "created_at",
  "name",
  "rating",
  "better",
  "use_case",
  "free_comment"
];

  const csv = [
    columns.join(","),
    ...loadedAnswers.map((row) =>
      columns.map((col) => csvEscape(row[col] ?? "")).join(",")
    )
  ].join("\n");

  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const now = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `kanayama_craft_cola_answers_${now}.csv`;
  link.click();

  URL.revokeObjectURL(url);
});

function renderStats(rows) {
  const count = rows.length;
  const ratings = rows.map((r) => Number(r.rating)).filter(Boolean);

  const avg = ratings.length
    ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length
    : 0;

  const max = ratings.length ? Math.max(...ratings) : 0;

  document.getElementById("countStat").textContent = count;
  document.getElementById("avgStat").textContent = avg.toFixed(1);
  document.getElementById("maxStat").textContent = max;

  renderBars("ratingBars", countBy(rows, "rating"), ["5", "4", "3", "2", "1"], "⭐");
  renderBars("tasteBars", countBy(rows, "taste"));
  renderBars("sellBars", countBy(rows, "sellable"));

  const tbody = document.getElementById("answerRows");
  tbody.innerHTML = "";

  rows.forEach((row) => {
    const tr = document.createElement("tr");

   tr.innerHTML = `
  <td>${escapeHtml(formatDate(row.created_at))}</td>
  <td>${escapeHtml(row.name || "")}</td>
  <td>${escapeHtml(row.rating)}</td>
  <td>${escapeHtml(row.free_comment || "")}</td>
`;

    tbody.appendChild(tr);
  });
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = String(row[key] ?? "未回答");
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function renderBars(targetId, counts, preferredOrder = null, suffix = "") {
  const target = document.getElementById(targetId);
  target.innerHTML = "";

  const entries = preferredOrder
    ? preferredOrder.map((key) => [key, counts[key] || 0])
    : Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const max = Math.max(1, ...entries.map(([, value]) => value));

  entries.forEach(([label, value]) => {
    const percent = Math.round((value / max) * 100);

    const row = document.createElement("div");
    row.className = "bar-row";

    row.innerHTML = `
      <span>${escapeHtml(label)}${suffix}</span>
      <div class="bar"><span style="width:${percent}%"></span></div>
      <strong>${value}</strong>
    `;

    target.appendChild(row);
  });
}

function csvEscape(value) {
  return `"${String(value).replace(/"/g, '""').replace(/\r?\n/g, "\n")}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString("ja-JP");
}
