let tasks = [];
const taskList = document.querySelector('#task-list');
const messageList = document.querySelector('#messages');
const chatInput = document.querySelector('#chat-input');

function apiTask(task) {
  return {
    id: task.id,
    name: task.title,
    course: task.course,
    dueDate: task.dueDate,
    priority: task.priority === 'normal' ? 'medium' : task.priority,
    minutes: task.estimateMinutes,
    completed: task.completed,
  };
}

async function request(path, body) {
  const response = await fetch(path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `The server returned ${response.status}.`);
  return data;
}

async function refreshTasks() {
  tasks = (await request('/api/tasks')).map(apiTask);
  renderTasks();
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function friendlyDate(value) {
  if (!value) return 'No deadline';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(year, month - 1, day));
}

function renderTasks() {
  const openTasks = tasks.filter((task) => !task.completed);
  document.querySelector('#open-count').textContent = openTasks.length;
  const nextTask = [...openTasks].filter((task) => task.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  document.querySelector('#next-deadline').textContent = nextTask
    ? `Next due · ${friendlyDate(nextTask.dueDate)}`
    : openTasks.length ? 'No deadlines set' : 'You’re all caught up';

  if (!openTasks.length) {
    taskList.innerHTML = '<div class="empty-state">All clear. Add an assignment whenever you need to.</div>';
    return;
  }

  taskList.innerHTML = [...openTasks]
    .sort((a, b) => (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31'))
    .map((task) => `
      <article class="task-card">
        <div class="task-topline">
          <h3 class="task-name">${escapeHTML(task.name)}</h3>
          <span class="priority ${escapeHTML(task.priority)}">${escapeHTML(task.priority)}</span>
        </div>
        <div class="task-meta">
          <span class="task-course">${escapeHTML(task.course || 'Personal')}</span>
          <span class="task-due">${friendlyDate(task.dueDate)}</span>
        </div>
        <div class="task-actions">
          <button class="complete-button" type="button" data-complete="${escapeHTML(task.id)}">✓ Mark complete</button>
        </div>
      </article>`).join('');
}

function addMessage(kind, content, options = {}) {
  const article = document.createElement('article');
  article.className = `message ${kind === 'user' ? 'user-message' : 'assistant-message'}`;
  const avatar = kind === 'user' ? 'L' : '✳';
  const speaker = kind === 'user' ? 'You' : 'StudyFlow';
  article.innerHTML = `
    <div class="message-avatar" aria-hidden="true">${avatar}</div>
    <div class="message-content">
      <div class="message-meta"><strong>${speaker}</strong><span>Just now</span></div>
      <div class="message-bubble"><p>${escapeHTML(content)}</p>${options.html || ''}</div>
    </div>`;
  messageList.append(article);
  messageList.scrollTop = messageList.scrollHeight;
}

function planCard(result) {
  if (!result.plan.length) {
    return '<div class="result-card"><div class="result-title">Your study plan</div><p class="result-caption">No complete assignment fits this time window. Try a longer session or add a shorter task.</p></div>';
  }
  const rows = result.plan.map(({ task, minutes, partial }, index) => `
    <div class="plan-row">
      <span class="plan-index">${index + 1}</span>
      <span class="plan-copy"><strong>${escapeHTML(task.name)}</strong><small>${partial ? 'Focused first block' : escapeHTML(task.course || 'Assignment')} · due ${friendlyDate(task.dueDate)}</small></span>
      <span class="plan-time">${minutes} min</span>
    </div>`).join('');
  return `<div class="result-card"><div class="result-title"><span>✦ Your ${result.availableMinutes}-minute plan</span><span class="result-caption">${result.planned} min scheduled</span></div>${rows}</div>`;
}

function taskListCard() {
  const openTasks = tasks.filter((task) => !task.completed);
  if (!openTasks.length) return '<div class="result-card"><div class="result-title">Your assignments</div><p class="result-caption">You’re all caught up. Nice work!</p></div>';
  const rows = openTasks.map((task) => `
    <div class="plan-row">
      <span class="plan-index">${task.priority === 'high' ? '!' : '•'}</span>
      <span class="plan-copy"><strong>${escapeHTML(task.name)}</strong><small>${escapeHTML(task.course || 'Personal')} · ${escapeHTML(task.priority)} priority</small></span>
      <span class="plan-time">${friendlyDate(task.dueDate)}</span>
    </div>`).join('');
  return `<div class="result-card"><div class="result-title"><span>Your open assignments</span><span class="result-caption">${openTasks.length} total</span></div>${rows}</div>`;
}

async function makePlan(availableMinutes) {
  const data = await request('/api/plan', { availableMinutes });
  return {
    availableMinutes: data.availableMinutes,
    planned: data.scheduledMinutes,
    plan: data.tasks.map((task) => ({ task: apiTask(task), minutes: task.plannedMinutes, partial: false })),
  };
}

async function replyTo(message) {
  const text = message.toLowerCase();
  const number = Number(text.match(/\b(\d{1,3})\s*[- ]?\s*(?:minutes?|mins?|m)\b/)?.[1]);
  if (/\b(plan|study plan|study session|revise|revision|work on first|what should i do)\b/.test(text)) {
    const minutes = number > 0 ? Math.min(number, 720) : 60;
    const result = await makePlan(minutes);
    const firstTask = result.plan[0]?.task.name;
    const response = firstTask
      ? `I checked your assignments. Start with ${firstTask}${result.plan.length > 1 ? ' and continue with the next block if you have time' : ''}. Here’s a plan that fits your time:`
      : 'I could not fit a complete assignment into that time. Try a longer session or add a shorter assignment.';
    addMessage('assistant', response, { html: planCard(result) });
    return;
  }
  if (/\b(show|list|see|what are|my assignments|my tasks|tasks)\b/.test(text)) {
    await refreshTasks();
    addMessage('assistant', 'Here’s what you have coming up:', { html: taskListCard() });
    return;
  }
  addMessage('assistant', 'I can plan a study session or review your assignments. Try asking, “Plan a 45-minute study session” or “Show my assignments.”');
}

async function sendPrompt(message) {
  const cleaned = message.trim();
  if (!cleaned) return;
  addMessage('user', cleaned);
  try {
    await replyTo(cleaned);
  } catch (error) {
    addMessage('assistant', `I couldn’t reach the StudyFlow server: ${error.message} Start the server and refresh this page.`);
  }
}

document.querySelector('#chat-form').addEventListener('submit', (event) => {
  event.preventDefault();
  void sendPrompt(chatInput.value);
  chatInput.value = '';
  chatInput.focus();
});

document.querySelectorAll('[data-prompt]').forEach((button) => {
  button.addEventListener('click', () => void sendPrompt(button.dataset.prompt));
});

document.querySelector('#add-task-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    const task = await request('/api/tasks', {
      title: String(form.get('name')).trim(),
      course: String(form.get('course')).trim(),
      dueDate: String(form.get('dueDate')),
      priority: String(form.get('priority')),
      estimateMinutes: Number(form.get('minutes')),
    });
    tasks.push(apiTask(task));
    renderTasks();
    event.currentTarget.reset();
    document.querySelector('.add-task-details').open = false;
    addMessage('assistant', `I’ve added “${task.title}” to your assignments. I’ll include it when we plan your next study session.`);
  } catch (error) {
    addMessage('assistant', `I couldn’t add that assignment: ${error.message}`);
  }
});

taskList.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-complete]');
  if (!button) return;
  try {
    const task = await request(`/api/tasks/${encodeURIComponent(button.dataset.complete)}/complete`, {});
    tasks = tasks.map((item) => item.id === task.id ? apiTask(task) : item);
    renderTasks();
    addMessage('assistant', `Nice work — I marked “${task.title}” complete. Your study plan has been updated.`);
  } catch (error) {
    addMessage('assistant', `I couldn’t update that assignment: ${error.message}`);
  }
});

document.querySelector('#refresh-tasks').addEventListener('click', async () => {
  try {
    await refreshTasks();
    addMessage('assistant', 'Your assignment list is up to date.');
  } catch (error) {
    addMessage('assistant', `I couldn’t refresh the list: ${error.message}`);
  }
});

refreshTasks().catch((error) => {
  addMessage('assistant', `The StudyFlow server is not available: ${error.message} Start it, then refresh this page.`);
});
