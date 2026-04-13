const outputTickets = document.getElementById("output-tickets");
const outputEvents = document.getElementById("output-events");
const tripsContainer = document.getElementById("trips-container");

async function api(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 204) return { status: 204, data: null };
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// FORMAT
function formatMoney(m) { return new Intl.NumberFormat('vi-VN').format(m) + " đ"; }

// COMMAND: BOOK TICKET
document.getElementById("book-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    tripId: document.getElementById("b-tripId").value.trim(),
    passengerName: document.getElementById("b-passenger").value.trim(),
    seatNumber: document.getElementById("b-seat").value.trim(),
    price: document.getElementById("b-price").value
  };

  const res = await api("/tickets/book", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  if(res.status >= 400) alert("Error! " + res.data.message);
  else {
    alert("Booked Ticket ID: " + res.data.id);
    document.getElementById("b-seat").value = "";
    loadTickets();
    activateTab("tickets");
  }
});

// COMMAND: CANCEL TICKET
document.getElementById("cancel-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("c-id").value.trim();
  const res = await api(`/tickets/${encodeURIComponent(id)}/cancel`, { method: "PATCH" });
  if(res.status >= 400) alert("Error: " + res.data.message);
  else {
    alert("Cancelled perfectly.");
    loadTickets();
    activateTab("tickets");
  }
});

// QUERY: SEARCH TRIPS
document.getElementById("search-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = document.getElementById("search-q").value.trim();
  loadTrips(q);
});

async function loadTrips(q = "") {
  const res = await api("/trips?q=" + encodeURIComponent(q));
  const trips = res.data || [];
  if (trips.length === 0) {
    tripsContainer.innerHTML = "<p style='color:var(--text-muted)'>No trips found.</p>";
    return;
  }
  tripsContainer.innerHTML = trips.map(t => `
    <div class="trip-item fade-in">
      <div class="trip-info">
        <h4>[${t.id}] ${t.train} &rarr; ${t.from} to ${t.to}</h4>
        <p>Depart: ${t.expectedDeparture} | Arrive: ${t.expectedArrival}</p>
      </div>
      <div><span style="background:var(--primary); padding:3px 8px; border-radius:12px; font-size:11px; font-weight:bold;">${t.initialSeats} SEATS</span></div>
    </div>
  `).join("");
}

// QUERY: TICKETS 
async function loadTickets() {
  const res = await api("/tickets");
  outputTickets.textContent = JSON.stringify(res.data, null, 2);
}
document.getElementById("refresh-tickets").addEventListener("click", loadTickets);

// QUERY: EVENTS
async function loadEvents() {
  const res = await api("/events");
  const events = res.data || [];
  if (events.length === 0) {
    outputEvents.innerHTML = '<p style="color:var(--text-muted);">No events recorded yet.</p>';
    return;
  }
  outputEvents.innerHTML = events.slice().reverse().map(ev => {
    const isBook = ev.type === "TICKET_BOOKED";
    const statusColor = isBook ? "var(--success-text)" : "var(--danger)";
    return `
      <div class="event-item fade-in" style="border-left-color: ${statusColor};">
        <div>
          <span class="event-type">${ev.type}</span>
          <span class="event-time">&nbsp;— ${new Date(ev.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="event-details">Ticket #${ev.payload.id} · Trip ${ev.payload.tripId} · ${ev.payload.passengerName} (Seat: ${ev.payload.seatNumber})</div>
      </div>
    `;
  }).join("");
}
document.getElementById("refresh-events").addEventListener("click", loadEvents);

// TABS
const tabs = document.querySelectorAll(".tab-btn");
function activateTab(name) {
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  document.getElementById("tab-trips").style.display = name === "trips" ? "" : "none";
  document.getElementById("tab-tickets").style.display = name === "tickets" ? "" : "none";
  document.getElementById("tab-events").style.display = name === "events" ? "" : "none";
  if(name === "trips") loadTrips();
  if(name === "tickets") loadTickets();
  if(name === "events") loadEvents();
}
tabs.forEach(t => t.addEventListener("click", () => activateTab(t.dataset.tab)));

// INIT
loadTrips();
