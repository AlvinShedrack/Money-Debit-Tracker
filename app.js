const STORAGE_KEY = "offline_money_debt_tracker_records_v2";

const toggleFormBtn = document.getElementById("toggleFormBtn");
const formContainer = document.getElementById("formContainer");
const form = document.getElementById("debtForm");
const editId = document.getElementById("editId");
const personName = document.getElementById("personName");
const amount = document.getElementById("amount");
const borrowDate = document.getElementById("borrowDate");
const debtType = document.getElementById("debtType");
const statusField = document.getElementById("status");
const notes = document.getElementById("notes");
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");

const recordsTable = document.getElementById("recordsTable");
const weeklyTable = document.getElementById("weeklyTable");
const personTotalsTable = document.getElementById("personTotalsTable");
const personNamesList = document.getElementById("personNamesList");
const filterType = document.getElementById("filterType");
const filterStatus = document.getElementById("filterStatus");
const searchInput = document.getElementById("searchInput");

const installBtn = document.getElementById("installBtn");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const clearAllBtn = document.getElementById("clearAllBtn");

let records = loadRecords();
let deferredPrompt = null;

borrowDate.valueAsDate = new Date();

function loadRecords() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    // Normalize older records to current schema/values
    const normalized = raw.map((r) => {
      const record = Object.assign({}, r);

      // Normalize status: accept 'Not paid', 'not paid', 'open' -> 'open'; 'paid' -> 'paid'
      if (typeof record.status === 'string') {
        const s = record.status.trim().toLowerCase();
        if (s === 'paid') record.status = 'paid';
        else record.status = 'open';
      } else {
        record.status = 'open';
      }

      // Normalize type values
      if (typeof record.type === 'string') {
        const t = record.type.trim().toLowerCase();
        if (t === 'owed_to_me' || t === 'demandd_to_me' || t === 'people_owe_me' || t === 'borrowed_from_me') {
          record.type = 'owed_to_me';
        } else if (t === 'i_owe' || t === 'i_demand' || t === 'i borrowed' || t === 'i borrowed from') {
          record.type = 'i_owe';
        } else {
          // default to owed_to_me for safety
          record.type = 'owed_to_me';
        }
      } else {
        record.type = 'owed_to_me';
      }

      // Ensure amount is number and date is string
      record.amount = Number(record.amount) || 0;
      record.date = record.date || new Date().toISOString().slice(0, 10);
      record.name = record.name || '';
      record.notes = record.notes || '';

      return record;
    });

    // If normalization changed anything, persist back
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (e) {
      // ignore write errors
    }

    return normalized;
  } catch (error) {
    console.error("Could not read local records", error);
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "";
  return new Date(value + "T00:00:00").toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getWeekStart(dateString) {
  const date = new Date(dateString + "T00:00:00");
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function isCurrentWeek(dateString) {
  return getWeekStart(dateString) === getWeekStart(new Date().toISOString().slice(0, 10));
}

function getFilteredRecords() {
  const type = filterType.value;
  const status = filterStatus.value;
  const search = searchInput.value.trim().toLowerCase();

  return records.filter((record) => {
    const typeMatch = type === "all" || record.type === type;
    const statusMatch = status === "all" || record.status === status;
    const searchMatch =
      !search ||
      record.name.toLowerCase().includes(search) ||
      (record.notes || "").toLowerCase().includes(search);

    return typeMatch && statusMatch && searchMatch;
  });
}

function calculateTotals(sourceRecords) {
  return sourceRecords.reduce(
    (totals, record) => {
      if (record.status !== "open") return totals;

      if (record.type === "owed_to_me") {
        totals.owedToMe += Number(record.amount);
      }

      if (record.type === "i_owe") {
        totals.iOwe += Number(record.amount);
      }

      return totals;
    },
    { owedToMe: 0, iOwe: 0 }
  );
}

function renderSummary() {
  const openTotals = calculateTotals(records);
  const currentWeekRecords = records.filter((record) => record.status === "open" && isCurrentWeek(record.date));
  const weekTotals = calculateTotals(currentWeekRecords);

  document.getElementById("totalOwedToMe").textContent = formatMoney(openTotals.owedToMe);
  document.getElementById("totalIOwe").textContent = formatMoney(openTotals.iOwe);
  document.getElementById("netBalance").textContent = formatMoney(openTotals.owedToMe - openTotals.iOwe);
  document.getElementById("recordCount").textContent = records.length;

  document.getElementById("weekOwedToMe").textContent = formatMoney(weekTotals.owedToMe);
  document.getElementById("weekIOwe").textContent = formatMoney(weekTotals.iOwe);
  document.getElementById("weekNet").textContent = formatMoney(weekTotals.owedToMe - weekTotals.iOwe);
}

function renderRecords() {
  const filtered = getFilteredRecords().sort((a, b) => b.date.localeCompare(a.date));

  if (!filtered.length) {
    recordsTable.innerHTML = `<tr><td colspan="7" class="empty">No records found.</td></tr>`;
    return;
  }

  recordsTable.innerHTML = filtered
    .map((record) => {
      const typeLabel = record.type === "owed_to_me" ? "Credit" : "Debit";
      const typeClass = record.type === "owed_to_me" ? "in" : "out";
      const statusLabel = record.status === "open" ? "Not paid" : "Paid";
      const statusClass = record.status === "open" ? "not-paid" : "paid";

      return `
        <tr>
          <td><strong>${escapeHtml(record.name)}</strong></td>
          <td><span class="badge ${typeClass}">${typeLabel}</span></td>
          <td><strong>${formatMoney(record.amount)}</strong></td>
          <td>${formatDate(record.date)}</td>
          <td><span class="badge ${statusClass}">${statusLabel}</span></td>
          <td>${escapeHtml(record.notes || "-")}</td>
          <td>
            <div class="action-buttons">
              <button class="icon-btn" onclick="editRecord('${record.id}')">Edit</button>
              <button class="icon-btn delete" onclick="deleteRecord('${record.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function updatePersonNameSuggestions() {
  const names = [...new Set(records.map((record) => record.name.trim()).filter((name) => name))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  personNamesList.innerHTML = names.map((name) => `<option value="${escapeHtml(name)}"></option>`).join("");
}

function renderWeeklyTotals() {
  const grouped = {};

  records.forEach((record) => {
    if (record.status !== "open") return;

    const week = getWeekStart(record.date);
    const key = `${week}||${record.name.trim()}`;

    if (!grouped[key]) {
      grouped[key] = {
        week,
        name: record.name.trim(),
        owedToMe: 0,
        iOwe: 0
      };
    }

    if (record.type === "owed_to_me") {
      grouped[key].owedToMe += Number(record.amount);
    } else {
      grouped[key].iOwe += Number(record.amount);
    }
  });

  const rows = Object.values(grouped).sort((a, b) => {
    if (a.week !== b.week) return b.week.localeCompare(a.week);
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  if (!rows.length) {
    weeklyTable.innerHTML = `<tr><td colspan="5" class="empty">No unpaid weekly totals yet.</td></tr>`;
    return;
  }

  weeklyTable.innerHTML = rows
    .map((data) => {
      const net = data.owedToMe - data.iOwe;
      const netClass = net >= 0 ? 'positive' : 'negative';
      const creditClass = data.owedToMe > 0 ? 'positive' : '';
      const debitClass = data.iOwe > 0 ? 'negative' : '';

      return `
        <tr>
          <td><strong>${formatDate(data.week)}</strong></td>
          <td>${escapeHtml(data.name)}</td>
          <td><strong class="${netClass}">${formatMoney(net)}</strong></td>
          <td class="${creditClass}">${formatMoney(data.owedToMe)}</td>
          <td class="${debitClass}">${formatMoney(data.iOwe)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderPersonTotals() {
  const grouped = {};

  records.forEach((record) => {
    if (record.status !== "open") return;

    const name = record.name.trim();
    if (!name) return;

    if (!grouped[name]) {
      grouped[name] = { owedToMe: 0, iOwe: 0 };
    }

    if (record.type === "owed_to_me") {
      grouped[name].owedToMe += Number(record.amount);
    } else {
      grouped[name].iOwe += Number(record.amount);
    }
  });

  const people = Object.keys(grouped).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  if (!people.length) {
    personTotalsTable.innerHTML = `<tr><td colspan="4" class="empty">No unpaid person totals yet.</td></tr>`;
    return;
  }

  personTotalsTable.innerHTML = people
    .map((name) => {
      const totals = grouped[name];
      const net = totals.owedToMe - totals.iOwe;
      const netClass = net >= 0 ? 'positive' : 'negative';
      const creditClass = totals.owedToMe > 0 ? 'positive' : '';
      const debitClass = totals.iOwe > 0 ? 'negative' : '';

      return `
        <tr>
          <td><strong>${escapeHtml(name)}</strong></td>
          <td><strong class="${netClass}">${formatMoney(net)}</strong></td>
          <td class="${creditClass}">${formatMoney(totals.owedToMe)}</td>
          <td class="${debitClass}">${formatMoney(totals.iOwe)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderAll() {
  renderSummary();
  renderRecords();
  renderWeeklyTotals();
  renderPersonTotals();
  updatePersonNameSuggestions();
}

function resetForm() {
  form.reset();
  editId.value = "";
  borrowDate.valueAsDate = new Date();
  saveBtn.textContent = "Save Record";
}

function editRecord(id) {
  const record = records.find((item) => item.id === id);
  if (!record) return;

  editId.value = record.id;
  personName.value = record.name;
  amount.value = record.amount;
  borrowDate.value = record.date;
  debtType.value = record.type;
  statusField.value = record.status;
  notes.value = record.notes || "";
  saveBtn.textContent = "Update Record";
  formContainer.classList.add("active");
  toggleFormBtn.querySelector(".toggle-text").textContent = "- Add Record";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteRecord(id) {
  const confirmed = confirm("Delete this record?");
  if (!confirmed) return;

  records = records.filter((record) => record.id !== id);
  saveRecords();
  renderAll();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const cleanName = personName.value.trim();
  const cleanAmount = Number(amount.value);

  if (!cleanName || cleanAmount <= 0 || !borrowDate.value) {
    alert("Please enter a valid name, amount, and date.");
    return;
  }

  const record = {
    id: editId.value || crypto.randomUUID(),
    name: cleanName,
    amount: cleanAmount,
    date: borrowDate.value,
    type: debtType.value,
    status: statusField.value,
    notes: notes.value.trim(),
    updatedAt: new Date().toISOString()
  };

  if (editId.value) {
    records = records.map((item) => (item.id === editId.value ? record : item));
  } else {
    records.push(record);
  }

  saveRecords();
  resetForm();
  renderAll();
  formContainer.classList.remove("active");
});

resetBtn.addEventListener("click", resetForm);

toggleFormBtn.addEventListener("click", () => {
  formContainer.classList.toggle("active");
  const isActive = formContainer.classList.contains("active");
  toggleFormBtn.querySelector(".toggle-text").textContent = isActive ? "- Add Record" : "+ Add Record";
});

filterType.addEventListener("change", renderRecords);
filterStatus.addEventListener("change", renderRecords);
searchInput.addEventListener("input", renderRecords);

exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `money-debt-tracker-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();

  URL.revokeObjectURL(url);
});

importFile.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());

    if (!Array.isArray(imported)) {
      alert("Invalid import file.");
      return;
    }

    records = imported;
    saveRecords();
    renderAll();
    alert("Records imported successfully.");
  } catch (error) {
    alert("Could not import this file.");
  }

  importFile.value = "";
});

clearAllBtn.addEventListener("click", () => {
  const confirmed = confirm("This will permanently delete all records saved on this device. Continue?");
  if (!confirmed) return;

  records = [];
  saveRecords();
  renderAll();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;

  deferredPrompt = null;
  installBtn.classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
  });
}

renderAll();
