const API_URL = '/api/tasks';

const state = {
  tasks: [],
  filter: 'all',
  search: '',
  editingId: null,
  deletingId: null
};

const elements = {
  taskList: document.getElementById('task-list'),
  emptyState: document.getElementById('empty-state'),
  appError: document.getElementById('app-error'),
  searchInput: document.getElementById('search-input'),
  addTaskBtn: document.getElementById('add-task-btn'),
  taskDialog: document.getElementById('task-dialog'),
  deleteDialog: document.getElementById('delete-dialog'),
  taskForm: document.getElementById('task-form'),
  deleteForm: document.getElementById('delete-form'),
  dialogTitle: document.getElementById('dialog-title'),
  formError: document.getElementById('form-error'),
  deleteMessage: document.getElementById('delete-message'),
  titleInput: document.getElementById('title-input'),
  descriptionInput: document.getElementById('description-input'),
  priorityInput: document.getElementById('priority-input'),
  statusInput: document.getElementById('status-input'),
  dueDateInput: document.getElementById('due-date-input'),
  cancelFormBtn: document.getElementById('cancel-form-btn'),
  cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
  countTotal: document.getElementById('count-total'),
  countActive: document.getElementById('count-active'),
  countCompleted: document.getElementById('count-completed')
};

function showAppError(message) {
  elements.appError.textContent = message;
  elements.appError.hidden = !message;
}

function showFormError(message) {
  elements.formError.textContent = message;
  elements.formError.hidden = !message;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDueDate(dueDate) {
  if (!dueDate) {
    return 'No due date';
  }

  const date = new Date(`${dueDate}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function isOverdue(task) {
  if (!task.due_date || task.status === 'completed') {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${task.due_date}T00:00:00`) < today;
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  let payload = null;
  const text = await response.text();
  if (text) {
    payload = JSON.parse(text);
  }

  if (!response.ok) {
    const message = payload && payload.error ? payload.error : 'Request failed.';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function loadTasks() {
  const tasks = await request(API_URL);
  state.tasks = Array.isArray(tasks) ? tasks : [];
}

function visibleTasks() {
  const query = state.search.trim().toLowerCase();

  return state.tasks.filter((task) => {
    const matchesFilter = state.filter === 'all' || task.status === state.filter;
    const matchesSearch = task.title.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });
}

function updateCounters() {
  const total = state.tasks.length;
  const active = state.tasks.filter((task) => task.status === 'active').length;
  const completed = state.tasks.filter((task) => task.status === 'completed').length;

  elements.countTotal.textContent = String(total);
  elements.countActive.textContent = String(active);
  elements.countCompleted.textContent = String(completed);
}

function renderTasks() {
  const tasks = visibleTasks();
  updateCounters();

  elements.taskList.innerHTML = tasks
    .map((task) => {
      const overdue = isOverdue(task);
      return `
        <article class="task-card ${task.status}" data-id="${task.id}">
          <input
            class="checkbox"
            type="checkbox"
            data-action="toggle"
            ${task.status === 'completed' ? 'checked' : ''}
            aria-label="Mark ${escapeHtml(task.title)} as ${task.status === 'completed' ? 'active' : 'completed'}"
          />
          <div class="task-main">
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            <p class="task-description">${escapeHtml(task.description || 'No description')}</p>
            <div class="task-meta">
              <span class="badge priority-${escapeHtml(task.priority)}">${escapeHtml(task.priority)} priority</span>
              <span class="badge status-${escapeHtml(task.status)}">${escapeHtml(task.status)}</span>
              <span class="badge ${overdue ? 'overdue' : 'due'}">${overdue ? 'Overdue · ' : ''}${escapeHtml(formatDueDate(task.due_date))}</span>
            </div>
          </div>
          <div class="task-actions">
            <button type="button" class="icon-btn" data-action="edit">Edit</button>
            <button type="button" class="icon-btn" data-action="delete">Delete</button>
          </div>
        </article>
      `;
    })
    .join('');

  elements.emptyState.hidden = tasks.length > 0;
}

async function refresh() {
  await loadTasks();
  renderTasks();
}

function openCreateDialog() {
  state.editingId = null;
  elements.dialogTitle.textContent = 'Add task';
  elements.taskForm.reset();
  elements.priorityInput.value = 'medium';
  elements.statusInput.value = 'active';
  showFormError('');
  elements.taskDialog.showModal();
  elements.titleInput.focus();
}

function openEditDialog(task) {
  state.editingId = task.id;
  elements.dialogTitle.textContent = 'Edit task';
  elements.titleInput.value = task.title;
  elements.descriptionInput.value = task.description || '';
  elements.priorityInput.value = task.priority;
  elements.statusInput.value = task.status;
  elements.dueDateInput.value = task.due_date || '';
  showFormError('');
  elements.taskDialog.showModal();
  elements.titleInput.focus();
}

function openDeleteDialog(task) {
  state.deletingId = task.id;
  elements.deleteMessage.textContent = `Delete “${task.title}”? This action cannot be undone.`;
  elements.deleteDialog.showModal();
}

function findTask(id) {
  return state.tasks.find((task) => String(task.id) === String(id));
}

function readFormData() {
  const title = elements.titleInput.value.trim();
  if (!title) {
    throw new Error('Title is required.');
  }

  return {
    title,
    description: elements.descriptionInput.value.trim(),
    priority: elements.priorityInput.value,
    status: elements.statusInput.value,
    due_date: elements.dueDateInput.value || null
  };
}

async function saveTask(event) {
  event.preventDefault();
  showFormError('');

  try {
    const payload = readFormData();

    if (state.editingId) {
      await request(`${API_URL}/${state.editingId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      await request(API_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    elements.taskDialog.close();
    showAppError('');
    await refresh();
  } catch (error) {
    showFormError(error.message);
  }
}

async function deleteTask(event) {
  event.preventDefault();

  try {
    await request(`${API_URL}/${state.deletingId}`, { method: 'DELETE' });
    elements.deleteDialog.close();
    showAppError('');
    await refresh();
  } catch (error) {
    elements.deleteDialog.close();
    showAppError(error.message);
  }
}

async function toggleTask(task) {
  const nextStatus = task.status === 'completed' ? 'active' : 'completed';

  await request(`${API_URL}/${task.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status: nextStatus })
  });

  await refresh();
}

elements.searchInput.addEventListener('input', (event) => {
  state.search = event.target.value;
  renderTasks();
});

document.querySelectorAll('.filter-btn').forEach((button) => {
  button.addEventListener('click', () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach((item) => {
      item.classList.toggle('is-active', item === button);
    });
    renderTasks();
  });
});

elements.addTaskBtn.addEventListener('click', openCreateDialog);
elements.cancelFormBtn.addEventListener('click', () => elements.taskDialog.close());
elements.cancelDeleteBtn.addEventListener('click', () => elements.deleteDialog.close());
elements.taskForm.addEventListener('submit', saveTask);
elements.deleteForm.addEventListener('submit', deleteTask);

elements.taskList.addEventListener('click', async (event) => {
  const card = event.target.closest('.task-card');
  if (!card) {
    return;
  }

  const task = findTask(card.dataset.id);
  if (!task) {
    return;
  }

  const action = event.target.dataset.action;
  try {
    if (action === 'edit') {
      openEditDialog(task);
    } else if (action === 'delete') {
      openDeleteDialog(task);
    } else if (action === 'toggle') {
      await toggleTask(task);
    }
  } catch (error) {
    showAppError(error.message);
  }
});

refresh().catch((error) => {
  showAppError(error.message);
});
