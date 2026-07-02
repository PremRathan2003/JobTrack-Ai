const $ = (id) => document.getElementById(id);

// Restore saved config; prefill from page title
chrome.storage.local.get(['token', 'apiUrl'], (v) => {
  if (v.token) $('token').value = v.token;
  if (v.apiUrl) $('apiUrl').value = v.apiUrl;
});

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.title) return;
  // Common patterns: "Job Title - Company | Site" / "Job Title at Company"
  const m = tab.title.match(/^(.*?)\s+(?:-|at|\|)\s+(.*?)(?:\s*[|\-–].*)?$/);
  if (m) { $('title').value = m[1].trim(); $('company').value = m[2].trim(); }
  $('notes').value = tab.url || '';
});

$('save').addEventListener('click', async () => {
  const token = $('token').value.trim();
  const apiUrl = $('apiUrl').value.trim().replace(/\/$/, '');
  const msg = $('msg');
  msg.textContent = '';
  if (!token || !apiUrl || !$('company').value || !$('title').value) {
    msg.textContent = 'Token, API URL, company and title are required.';
    msg.className = 'msg err';
    return;
  }
  chrome.storage.local.set({ token, apiUrl });
  $('save').disabled = true;
  try {
    const res = await fetch(`${apiUrl}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        company: $('company').value,
        jobTitle: $('title').value,
        location: $('location').value || null,
        notes: $('notes').value || null,
        source: 'extension',
      }),
    });
    if (!res.ok) throw new Error((await res.json()).error || res.statusText);
    msg.textContent = 'Saved!';
    msg.className = 'msg ok';
  } catch (e) {
    msg.textContent = e.message;
    msg.className = 'msg err';
  } finally {
    $('save').disabled = false;
  }
});
