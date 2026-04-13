const QUERY_URL = "http://localhost:3005";
const COMMAND_URL = "http://localhost:3004";

const outputOrders = document.getElementById("output-orders");
const outputEvents = document.getElementById("output-events");

async function api(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 204) return { status: 204, data: null };
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function formatCurrency(n) { return new Intl.NumberFormat("vi-VN").format(n) + " ₫"; }

// ---------- COMMAND SERVICE (Port 3004) ----------

document.getElementById("create-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const customerName = document.getElementById("customer-name").value.trim();
  // using fixed mock items for simplicity
  const items = [{ name: "Mock Product", quantity: 1, price: 100000 }];

  const res = await api(`${COMMAND_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customerName, items })
  });

  if (res.status >= 400) alert("Error creating: " + res.data.message);
  else {
    alert(`Order Created successfully (ID: ${res.data.id}) on Port 3004.\nThe Query Service should receive the event soon!`);
    loadOrders();
  }
});

document.getElementById("cancel-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("cancel-id").value.trim();
  const res = await api(`${COMMAND_URL}/orders/${encodeURIComponent(id)}/cancel`, { method: "PATCH" });
  if (res.status >= 400) alert("Error canceling: " + res.data.message);
  else {
    alert("Order Cancelled effectively on Port 3004.");
    loadOrders();
  }
});

// ---------- QUERY SERVICE (Port 3005) ----------

async function loadOrders() {
  const res = await api(`${QUERY_URL}/orders`);
  outputOrders.textContent = JSON.stringify(res.data, null, 2);
}
document.getElementById("refresh-btn").addEventListener("click", loadOrders);

async function loadEvents() {
  const res = await api(`${QUERY_URL}/events`);
  const events = res.data;
  if (!events || events.length === 0) {
    outputEvents.innerHTML = '<p style="color:var(--text-muted);">No events recorded yet in Broker.</p>';
    return;
  }
  outputEvents.innerHTML = events.slice().reverse().map(ev => {
    const isCreate = ev.type === "ORDER_CREATED";
    return `
      <div class="event-item fade-in" style="border-left-color: ${isCreate ? "var(--success-text)" : "var(--danger)"};">
        <div>
          <span class="event-type">${ev.type}</span>
          <span class="event-time">&nbsp;— ${new Date(ev.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="event-details">Order #${ev.payload.id} · ${ev.payload.customerName} · ${formatCurrency(ev.payload.totalAmount)}</div>
      </div>
    `;
  }).join("");
}
document.getElementById("refresh-events-btn").addEventListener("click", loadEvents);


// ---------- TABS ----------
const tabBtns = document.querySelectorAll(".tab-btn");
function activateTab(name) {
  tabBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === name));
  document.getElementById("tab-orders").style.display = name === "orders" ? "" : "none";
  document.getElementById("tab-events").style.display = name === "events" ? "" : "none";
  if (name === "orders") loadOrders();
  if (name === "events") loadEvents();
}

tabBtns.forEach(btn => btn.addEventListener("click", () => activateTab(btn.dataset.tab)));

// Init fetch
loadOrders();
