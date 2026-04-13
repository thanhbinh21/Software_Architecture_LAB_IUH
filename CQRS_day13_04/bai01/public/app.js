const output = document.getElementById("output");

function show(data) {
  output.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

async function callApi(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 204) {
    return { status: 204, data: null };
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

document.getElementById("create-form").addEventListener("submit", async e => {
  e.preventDefault();
  const title = document.getElementById("create-title").value.trim();
  const completed = document.getElementById("create-completed").checked;
  const result = await callApi("/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, completed })
  });
  show(result);
});

document.getElementById("update-form").addEventListener("submit", async e => {
  e.preventDefault();
  const id = document.getElementById("update-id").value.trim();
  const title = document.getElementById("update-title").value.trim();
  const completed = document.getElementById("update-completed").checked;
  const sendCompleted = document.getElementById("update-send-completed").checked;
  const body = {};
  if (title) body.title = title;
  if (sendCompleted) body.completed = completed;

  const result = await callApi(`/todos/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  show(result);
});

document.getElementById("delete-form").addEventListener("submit", async e => {
  e.preventDefault();
  const id = document.getElementById("delete-id").value.trim();
  const result = await callApi(`/todos/${encodeURIComponent(id)}`, { method: "DELETE" });
  show(result);
});

document.getElementById("detail-form").addEventListener("submit", async e => {
  e.preventDefault();
  const id = document.getElementById("detail-id").value.trim();
  const result = await callApi(`/todos/${encodeURIComponent(id)}`);
  show(result);
});

document.getElementById("refresh-btn").addEventListener("click", async () => {
  const result = await callApi("/todos");
  show(result);
});
