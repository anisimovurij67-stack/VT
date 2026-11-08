const STORAGE_KEY = 'tasks';
const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const dateInput = document.getElementById('task-date');
const taskList = document.getElementById('task-list');
const filterSelect = document.getElementById('filter');
const summaryEl = document.getElementById('summary');
let tasks = [];
let currentFilter = 'all';
function init() {
    loadTasks();
    renderTasks();
}

function loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (e) {
            console.error('Ошибка парсинга JSON', e);
            tasks = [];
        }
    }
}

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
}

function isOverdue(dateStr, status) {
    if (status === 'done') return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const [year, month, day] = dateStr.split('-');
    const taskDate = new Date(year, month - 1, day);
    
    return taskDate < today;
}

function renderTasks() {
    let filteredTasks = tasks.filter(task => {
        if (currentFilter === 'all') return true;
        return task.status === currentFilter;
    });

    filteredTasks.sort((a, b) => new Date(a.date) - new Date(b.date));

    taskList.innerHTML = '';

    filteredTasks.forEach(task => {
        const overdue = isOverdue(task.date, task.status);
        
        const taskEl = document.createElement('div');
        taskEl.className = `task-item ${overdue ? 'overdue' : ''}`;
        
        const titleEl = document.createElement('h3');
        titleEl.textContent = task.title;

        taskEl.innerHTML = `
            <div class="task-info">
                <h3>${escapeHtml(task.title)}</h3>
                <span class="task-date">📅 ${formatDate(task.date)}</span>
            </div>
            <div class="task-actions">
                <select class="status-select" data-id="${task.id}">
                    <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>В работе</option>
                    <option value="done" ${task.status === 'done' ? 'selected' : ''}>Выполнено</option>
                    <option value="postponed" ${task.status === 'postponed' ? 'selected' : ''}>Отложено</option>
                </select>
                <button class="btn-delete" data-id="${task.id}">Удалить</button>
            </div>
        `;
        
        taskList.appendChild(taskEl);
    });

    updateSummary();
}

function updateSummary() {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const overdue = tasks.filter(t => isOverdue(t.date, t.status)).length;
    
    summaryEl.textContent = `Всего: ${total} | Выполнено: ${done} | Просрочено: ${overdue}`;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const date = dateInput.value;

    // Валидация
    if (!title) {
        alert('Введите название задачи!');
        return;
    }
    if (title.length > 100) {
        alert('Название не должно превышать 100 символов!');
        return;
    }
    if (!date) {
        alert('Выберите дату!');
        return;
    }

      const newTask = {
        id: Date.now(), 
        title: title,
        date: date,
        status: 'todo'
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    form.reset();
});

taskList.addEventListener('change', (e) => {
    if (e.target.classList.contains('status-select')) {
        const id = Number(e.target.dataset.id);
        const newStatus = e.target.value;
        
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.status = newStatus;
            saveTasks();
            renderTasks(); 
        }
    }
});

taskList.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-delete')) {
        const id = Number(e.target.dataset.id);
        const task = tasks.find(t => t.id === id);
        
        if (task) {
            const confirmDelete = confirm(`Вы уверены, что хотите удалить задачу "${task.title}"?`);
            if (confirmDelete) {
                tasks = tasks.filter(t => t.id !== id);
                saveTasks();
                renderTasks();
            }
        }
    }
});

filterSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderTasks();
});init();