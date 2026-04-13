// ── DOM refs ────────────────────────────────────────────────────────────
const outputOrders = document.getElementById("output-orders");
const outputEventsContainer = document.getElementById("output-events");
const outputEventsRaw = document.getElementById("output-events-raw");

// ── helpers ─────────────────────────────────────────────────────────────
function show(el, data) {
  el.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

async function callApi(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 204) return { status: 204, data: null };
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function formatCurrency(n) {
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

// ── item row management ─────────────────────────────────────────────────
const itemsContainer = document.getElementById("items-container");

function createItemRow() {
  const div = document.createElement("div");
  div.className = "item-row fade-in";
  div.innerHTML = `
    <input type="text" placeholder="Product name" class="item-name" required />
    <input type="number" placeholder="Qty" class="item-qty" min="1" value="1" required />
    <input type="number" placeholder="Price" class="item-price" min="0" step="1000" value="50000" required />
    <button type="button" class="btn-danger remove-item" title="Remove">✕</button>
  `;
  return div;
}

document.getElementById("add-item-btn").addEventListener("click", () => {
  itemsContainer.appendChild(createItemRow());
});

itemsContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-item")) {
    const rows = itemsContainer.querySelectorAll(".item-row");
    if (rows.length > 1) {
      e.target.closest(".item-row").remove();
    }
  }
});

// ── Create Order ────────────────────────────────────────────────────────
document.getElementById("create-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const customerName = document.getElementById("customer-name").value.trim();

  const rows = itemsContainer.querySelectorAll(".item-row");
  const items = [];
  for (const row of rows) {
    items.push({
      name: row.querySelector(".item-name").value.trim(),
      quantity: Number(row.querySelector(".item-qty").value),
      price: Number(row.querySelector(".item-price").value)
    });
  }

  const result = await callApi("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerName, items })
  });

  show(outputOrders, result);
  activateTab("orders");
});

// ── Cancel Order ────────────────────────────────────────────────────────
document.getElementById("cancel-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("cancel-id").value.trim();
  const result = await callApi(`/orders/${encodeURIComponent(id)}/cancel`, {
    method: "PATCH"
  });
  show(outputOrders, result);
  activateTab("orders");
});

// ── Get Order By Id ─────────────────────────────────────────────────────
document.getElementById("detail-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("detail-id").value.trim();
  const result = await callApi(`/orders/${encodeURIComponent(id)}`);
  show(outputOrders, result);
  activateTab("orders");
});

// ── Refresh orders ──────────────────────────────────────────────────────
document.getElementById("refresh-btn").addEventListener("click", async () => {
  const result = await callApi("/orders");
  show(outputOrders, result);
});

// ── Refresh events ──────────────────────────────────────────────────────
document.getElementById("refresh-events-btn").addEventListener("click", loadEvents);

async function loadEvents() {
  const result = await callApi("/events");
  const events = result.data;

  if (!Array.isArray(events) || events.length === 0) {
    outputEventsContainer.innerHTML = '<p style="color:var(--muted);">No events recorded yet.</p>';
    return;
  }

  outputEventsContainer.innerHTML = events
    .slice()
    .reverse()
    .map((ev) => {
      const isCreate = ev.type === "ORDER_CREATED";
      return `
        <div class="event-item fade-in" style="border-left-color: ${isCreate ? "var(--success-text)" : "var(--danger)"};">
          <div>
            <span class="event-type">${ev.type}</span>
            <span class="event-time">&nbsp;— ${new Date(ev.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="event-details">Order #${ev.payload.id} · ${ev.payload.customerName} · ${formatCurrency(ev.payload.totalAmount || 0)}</div>
        </div>`;
    })
    .join("");
}

// ── tabs ────────────────────────────────────────────────────────────────
const tabBtns = document.querySelectorAll(".tab-btn");
const tabOrders = document.getElementById("tab-orders");
const tabEvents = document.getElementById("tab-events");

function activateTab(name) {
  tabBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === name));
  tabOrders.style.display = name === "orders" ? "" : "none";
  tabEvents.style.display = name === "events" ? "" : "none";
  if (name === "events") loadEvents();
}

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});
