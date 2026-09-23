const $ = id => document.getElementById(id);
const notes = $('notes');
let generating = false;
let lastPhase = 'idle';
let lastResult = null;
const sample = 'Flight control basics\n\nAn aircraft rotates around three axes: longitudinal, lateral, and vertical. Roll is rotation about the longitudinal axis and is controlled by the ailerons. Pitch is rotation about the lateral axis and is controlled by the elevator. Yaw is rotation about the vertical axis and is controlled by the rudder.\n\nThe four main forces on an aircraft are lift, weight, thrust, and drag. In steady, level, unaccelerated flight, lift balances weight and thrust balances drag. Lift acts perpendicular to the relative airflow. Drag acts parallel to the relative airflow and opposes motion.';

function showError(message) { $('error').textContent = message || ''; $('error').hidden = !message; }
function updateCount() { $('count').textContent = `${notes.value.length.toLocaleString()} / 6,000`; }
notes.addEventListener('input', updateCount);
$('sample').addEventListener('click', () => { notes.value = sample; updateCount(); notes.focus(); });

async function request(path, data) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed.');
  return res;
}

async function refreshStatus() {
  try {
    const response = await fetch('/api/status');
    if (!response.ok) throw new Error('Status unavailable');
    const state = await response.json();
    const labels = { idle: 'Ready to load on your computer', loading: state.progress === null ? 'Preparing model… first load may take a while' : `Downloading model · ${state.progress.toFixed(0)}%`, ready: 'Model ready · running on this computer', error: 'Model could not load. You can retry.' };
    $('model-state').textContent = labels[state.phase];
    $('load').disabled = state.phase === 'loading' || state.phase === 'ready' || generating;
    $('load').textContent = state.phase === 'ready' ? '✓ Local model ready' : state.phase === 'error' ? 'Retry model load ↗' : 'Load local model ↗';
    $('progress').hidden = state.phase !== 'loading';
    if (state.progress === null) $('progress').removeAttribute('value');
    else $('progress').value = state.progress;
    if (state.phase === 'error' && lastPhase !== 'error') showError(state.error);
    lastPhase = state.phase;
  } catch { $('model-state').textContent = 'Cannot reach the local app. Check the terminal.'; }
}
$('load').addEventListener('click', async () => {
  showError('');
  $('load').disabled = true;
  try { await request('/api/load', {}); await refreshStatus(); }
  catch (error) { showError(error.message); $('load').disabled = false; }
});

$('generate').addEventListener('click', async () => {
  if (generating) return;
  if (!notes.value.trim()) { showError('Paste your notes or try the example first.'); notes.focus(); return; }
  generating = true;
  lastResult = null;
  for (const id of ['copy', 'export', 'file', 'clear']) $(id).disabled = true;
  showError('');
  for (const id of ['generate', 'sample', 'mode']) $(id).disabled = true;
  notes.readOnly = true;
  $('output').textContent = '';
  $('output').hidden = false;
  $('empty').hidden = true;
  $('activity').textContent = 'Preparing your local model…';
  $('result-badge').textContent = 'GENERATING';
  let completed = false;
  try {
    const res = await request('/api/generate', { notes: notes.value, mode: $('mode').value });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    function consume(line) {
      if (!line.trim()) return;
      const event = JSON.parse(line);
      if (event.type === 'error') throw new Error(event.message);
      if (event.type === 'token') {
        $('output').textContent += event.text;
        $('activity').textContent = 'Thinking on your computer…';
      }
      if (event.type === 'done') {
        completed = true;
        lastResult = { text: $('output').textContent, mode: $('mode').selectedOptions[0].textContent };
        $('copy').disabled = false;
        $('export').disabled = false;
        $('activity').textContent = `Made locally · ${event.seconds.toFixed(1)} seconds`;
        $('result-badge').textContent = 'LOCAL AI OUTPUT';
      }
    }
    try {
      while (true) {
        const { value, done } = await reader.read();
        buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
        let newline;
        while ((newline = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newline);
          buffer = buffer.slice(newline + 1);
          consume(line);
        }
        if (done) break;
      }
      if (buffer.trim()) consume(buffer);
      if (!completed) throw new Error('The connection ended before generation finished. Please retry.');
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  } catch (error) {
    showError(error.message);
    $('activity').textContent = 'Generation did not finish. Retry when ready.';
    $('result-badge').textContent = 'INCOMPLETE';
  } finally {
    generating = false;
    for (const id of ['generate', 'sample', 'mode']) $(id).disabled = false;
    notes.readOnly = false;
    $('file').disabled = false;
    $('clear').disabled = false;
    await refreshStatus();
  }
});
refreshStatus();
setInterval(refreshStatus, 1500);

$('file').addEventListener('change', async event => {
  const file = event.target.files[0];
  try {
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) throw new Error('Choose a .txt or .md file.');
    if (file.size > 24000) throw new Error('Choose a smaller file (up to 6,000 characters).');
    const content = await file.text();
    if (content.length > 6000) throw new Error('This file is longer than 6,000 characters. Paste a shorter excerpt.');
    notes.value = content;
    updateCount();
    showError('');
  } catch (error) { showError(error.message); }
  finally { event.target.value = ''; }
});
$('copy').addEventListener('click', async () => {
  if (!lastResult) return;
  try { await navigator.clipboard.writeText(lastResult.text); $('activity').textContent = 'Copied to your clipboard.'; }
  catch { showError('Clipboard unavailable. Select the result text and copy it manually.'); }
});
$('export').addEventListener('click', () => {
  if (!lastResult) return;
  const markdown = `# Recall Desk — ${lastResult.mode}\n\n${lastResult.text}\n\n---\nGenerated locally with QVAC. Verify against your original notes.\n`;
  const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'recall-desk-study.md';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('clear').addEventListener('click', () => {
  if (generating) return;
  notes.value = '';
  updateCount();
  lastResult = null;
  $('output').textContent = '';
  $('output').hidden = true;
  $('empty').hidden = false;
  $('result-badge').textContent = 'YOUR SPACE';
  $('activity').textContent = 'Session cleared. Model stays loaded.';
  $('copy').disabled = true;
  $('export').disabled = true;
  showError('');
});
