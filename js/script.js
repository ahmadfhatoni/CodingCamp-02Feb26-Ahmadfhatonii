// Temporary storage for todo items
let todos = [];

// Global variable for storing filtered/sorted todos for display
let displayedTodos = [];

// localStorage key
const STORAGE_KEY = 'todoAppData';

// Function to save todos to localStorage
function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// Function to load todos from localStorage
function loadTodos() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            todos = JSON.parse(savedData);
        } catch (error) {
            console.error('Error loading todos:', error);
            todos = [];
        }
    }
}

// Function to initialize the app on page load
function initializeTodos() {
    loadTodos();
    renderTodos();
}

// Todo item formatter - creates HTML row for a todo item with subtasks
function formatTodoItem(todo) {
    const dueDate = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString('id-ID') : 'No Date';
    const statusClass = todo.status === 'completed' ? 'badge-success' : 'badge-warning';
    const statusText = todo.status === 'completed' ? 'Completed' : 'Pending';
    const subtaskCount = (todo.subtasks && todo.subtasks.length) || 0;
    const isExpanded = todo.expanded !== undefined ? todo.expanded : false;
    const hasSubtasks = subtaskCount > 0;
    const arrowIcon = isExpanded ? 'bx-chevron-down' : 'bx-chevron-right';
    
    let html = `
        <tr>
            <td class="text-left">
                <div class="flex items-center gap-2">
                    ${hasSubtasks ? `
                        <button class="btn btn-xs btn-ghost p-0 h-auto" onclick="toggleSubtaskExpand('${todo.id}')" title="Expand/Collapse">
                            <i class="bx ${arrowIcon} text-lg"></i>
                        </button>
                    ` : '<span class="w-6"></span>'}
                    <div class="flex flex-col">
                        <span>${todo.text}</span>
                        <span class="text-xs text-gray-500">Subtasks: ${subtaskCount}</span>
                    </div>
                </div>
            </td>
            <td class="text-center">${dueDate}</td>
            <td class="text-center"><span class="badge ${statusClass}">${statusText}</span></td>
            <td class="text-center">
                <button class="btn btn-xs btn-success mr-2" onclick="toggleTodoStatus('${todo.id}')" title="Mark completed">
                    <i class="bx bx-check"></i>
                </button>
                <button class="btn btn-xs btn-secondary mr-2" onclick="addSubtask('${todo.id}')" title="Add Subtask">
                    <i class="bx bx-plus"></i>
                </button>
                <button class="btn btn-xs btn-warning mr-2" onclick="editTodoItem('${todo.id}')" title="Edit">
                    <i class="bx bx-edit"></i>
                </button>
                <button class="btn btn-xs btn-error" onclick="deleteTodoById('${todo.id}')" title="Delete">
                    <i class="bx bx-trash"></i>
                </button>
            </td>
        </tr>`;
    
    // Show subtasks if they exist and are expanded
    if (hasSubtasks && isExpanded) {
        todo.subtasks.forEach(subtask => {
            const subtaskStatusClass = subtask.status === 'completed' ? 'badge-success' : 'badge-warning';
            const subtaskStatusText = subtask.status === 'completed' ? 'Completed' : 'Pending';
            const subtaskDue = subtask.dueDate ? new Date(subtask.dueDate).toLocaleDateString('id-ID') : '-';

            html += `
        <tr class="bg-gray-50">
            <td class="text-left pl-12">
                <div class="flex items-center gap-2">
                    <i class="bx bx-circle text-primary"></i>
                    <span>${subtask.text}</span>
                </div>
            </td>
            <td class="text-center text-sm">${subtaskDue}</td>
            <td class="text-center"><span class="badge ${subtaskStatusClass}">${subtaskStatusText}</span></td>
            <td class="text-center">
                <button class="btn btn-xs btn-success mr-2" onclick="toggleSubtaskStatus('${todo.id}', '${subtask.id}')" title="Mark Complete">
                    <i class="bx bx-check"></i>
                </button>
                <button class="btn btn-xs btn-warning mr-2" onclick="editSubtask('${todo.id}', '${subtask.id}')" title="Edit">
                    <i class="bx bx-edit"></i>
                </button>
                <button class="btn btn-xs btn-error" onclick="deleteSubtask('${todo.id}', '${subtask.id}')" title="Delete">
                    <i class="bx bx-trash"></i>
                </button>
            </td>
        </tr>`;
        });
    }
    
    return html;
}

// Function to add a new todo default status is pending
function addTodo() {
    const todoInput = document.getElementById('todo-input');
    const todoDate = document.getElementById('todo-date');
    const todoText = todoInput.value.trim();
    const dueDate = todoDate.value;
    
    // Validation
    if (todoText === '') {
        showAlert('Please enter a todo item!', 'error');
        todoInput.focus();
        return;
    } else if (todoText.length > 100) {
        showAlert('Todo item must be less than 100 characters!', 'error');
        return;
    } else if (todos.some(t => t.text.toLowerCase() === todoText.toLowerCase())) {
        showAlert('This todo item already exists!', 'error');
        todoInput.focus();
        return;
    }
    
    if (!dueDate) {
        showAlert('Please select a due date!', 'error');
        return;
    }
    
    const selectedDate = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showAlert('Due date cannot be in the past!', 'error');
        return;
    }
    
    const todo = {
        id: Date.now().toString(),
        text: todoText,
        status: 'pending',
        dueDate: dueDate,
        subtasks: [],
        expanded: false
    };
    
    todos.push(todo);
    
    // Clear inputs
    todoInput.value = '';
    todoDate.value = '';
    
    // Save to DOM
    renderTodos();
    saveTodos();
    showAlert('Todo added successfully!', 'success');
}


/// Function to render todo items to the DOM
function renderTodos() {
    const todoList = document.getElementById('todo-list');
    displayedTodos = [...todos]; // Reset displayed todos to all todos
    
    todoList.innerHTML = '';
    displayedTodos.forEach(todo => {
        todoList.innerHTML += formatTodoItem(todo);
    });
    
    updateCounters();
}

// Function to update counters and progress bar
function updateCounters() {
    const totalCounter = document.querySelector('.total-counter');
    const completedCounter = document.querySelector('.completed-counter');
    const percentageDisplay = document.querySelector('.percentage-display');
    const progressBar = document.querySelector('.progress-bar');
    const pendingCounter = document.querySelector('.pending-counter');
    // Count todos and subtasks together so counters reflect subtask status changes
    const totalTodos = todos.length;
    const totalSubtasks = todos.reduce((sum, t) => sum + ((t.subtasks && t.subtasks.length) || 0), 0);
    const total = totalTodos + totalSubtasks;

    const completedTodos = todos.filter(t => t.status === 'completed').length;
    const completedSubtasks = todos.reduce((sum, t) => sum + ((t.subtasks && t.subtasks.filter(s => s.status === 'completed').length) || 0), 0);
    const completed = completedTodos + completedSubtasks;

    const pending = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    totalCounter.textContent = total;
    completedCounter.textContent = completed;
    pendingCounter.textContent = pending;
    percentageDisplay.textContent = percentage + '%';
    progressBar.style.width = percentage + '%';
}

// Function to show alert messages with error icons
function showAlert(message, type = 'info') {
    const alertMessage = document.querySelector('.alert-message');
    const alertClass = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info';
    const icon = type === 'error' ? '<i class="bx bx-x-circle"></i>' : type === 'success' ? '<i class="bx bx-check-circle"></i>' : '<i class="bx bx-info-circle"></i>';
    
    alertMessage.innerHTML = `<div class="alert ${alertClass}"><span>${icon} ${message}</span></div>`;
    alertMessage.classList.remove('hide');
    alertMessage.classList.add('show');
    
    setTimeout(() => {
        alertMessage.classList.remove('show');
        alertMessage.classList.add('hide');
    }, 3000);
}

// Function to toggle todo status
function toggleTodoStatus(todoId) {
    const todo = todos.find(t => t.id === todoId);
    if (todo) {
        todo.status = todo.status === 'pending' ? 'completed' : 'pending';
        renderTodos();
        saveTodos();
    }
}
//function to edit todo item
function editTodoItem(todoId) {
    const todo = todos.find(todo => todo.id === todoId);
    if (!todo) {
        showAlert('Todo not found!', 'error');
        return;
    }
    // Use modal input to edit todo text + due date
    openEditModal({
        title: 'Edit Todo',
        text: todo.text,
        date: todo.dueDate || '',
        onSubmit: ({ text: newText, date: newDue }) => {
            if (newText.trim() === '') {
                showAlert('Todo text cannot be empty!', 'error');
                return false;
            }
            if (newText.trim().length > 100) {
                showAlert('Todo text must be less than 100 characters!', 'error');
                return false;
            }
            if (todos.some(t => t.id !== todoId && t.text.toLowerCase() === newText.trim().toLowerCase())) {
                showAlert('A todo with this text already exists!', 'error');
                return false;
            }
            if (!newDue || newDue.trim() === '') {
                showAlert('Due date cannot be empty!', 'error');
                return false;
            }
            const parsed = new Date(newDue);
            const today = new Date();
            today.setHours(0,0,0,0);
            if (isNaN(parsed.getTime())) {
                showAlert('Invalid due date format!', 'error');
                return false;
            }
            if (parsed < today) {
                showAlert('Due date cannot be in the past!', 'error');
                return false;
            }

            todo.text = newText.trim();
            todo.dueDate = newDue;
            renderTodos();
            saveTodos();
            showAlert('Todo updated successfully!', 'success');
            return true;
        }
    });
}

// Function to update the status of a todo item
function updateTodoStatus(todoId, newStatus) {
    const todo = todos.find(todo => todo.id === todoId);
    if (!todo) {
        showAlert('Todo not found!', 'error');
        return;
    }
    
    if (newStatus !== 'pending' && newStatus !== 'completed') {
        showAlert('Invalid status!', 'error');
        return;
    }
    
    todo.status = newStatus;
    renderTodos();
    saveTodos();
    showAlert('Status updated!', 'success');
}

// Function to toggle subtask expand/collapse
function toggleSubtaskExpand(todoId) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) {
        showAlert('Todo not found!', 'error');
        return;
    }
    
    if (!todo.subtasks || todo.subtasks.length === 0) {
        showAlert('No subtasks to show!', 'error');
        return;
    }
    
    todo.expanded = !todo.expanded;
    renderTodos();
    saveTodos();
}

// Function to add a subtask to a todo
function addSubtask(todoId) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) {
        showAlert('Todo not found!', 'error');
        return;
    }

    // default date = today
    const todayStr = new Date().toISOString().slice(0, 10);

    openEditModal({
        title: 'Add Subtask',
        text: '',
        date: todayStr,
        onSubmit: ({ text: subtaskText, date: dueDate }) => {
            if (subtaskText === null) return false;
            if (subtaskText.trim() === '') {
                showAlert('Subtask cannot be empty!', 'error');
                return false;
            }
            if (subtaskText.trim().length > 100) {
                showAlert('Subtask must be less than 100 characters!', 'error');
                return false;
            }
            if (todo.subtasks.some(s => s.text.toLowerCase() === subtaskText.trim().toLowerCase())) {
                showAlert('This subtask already exists!', 'error');
                return false;
            }
            if (!dueDate || dueDate.trim() === '') {
                showAlert('Due date cannot be empty!', 'error');
                return false;
            }
            const parsed = new Date(dueDate);
            const today = new Date();
            today.setHours(0,0,0,0);
            if (isNaN(parsed.getTime())) {
                showAlert('Invalid due date format!', 'error');
                return false;
            }
            if (parsed < today) {
                showAlert('Due date cannot be in the past!', 'error');
                return false;
            }

            const subtask = {
                id: Date.now().toString(),
                text: subtaskText.trim(),
                status: 'pending',
                dueDate: dueDate
            };

            todo.subtasks.push(subtask);
            todo.expanded = true;
            renderTodos();
            saveTodos();
            showAlert('Subtask added successfully!', 'success');
            return true;
        }
    });
}

// Function to toggle subtask status
function toggleSubtaskStatus(todoId, subtaskId) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) {
        showAlert('Todo not found!', 'error');
        return;
    }
    
    const subtask = todo.subtasks.find(s => s.id === subtaskId);
    if (!subtask) {
        showAlert('Subtask not found!', 'error');
        return;
    }
    
    subtask.status = subtask.status === 'pending' ? 'completed' : 'pending';
    renderTodos();
    saveTodos();
    showAlert('Subtask status updated!', 'success');
}

// Modal helper to edit text + date. options: {title, text, date, onSubmit}
function openEditModal(options) {
    const { title = 'Edit', text = '', date = '', onSubmit } = options;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,0.4)';
    overlay.style.zIndex = '10000';

    const panel = document.createElement('div');
    panel.style.background = 'var(--bg, #fff)';
    panel.style.padding = '16px';
    panel.style.borderRadius = '8px';
    panel.style.minWidth = '320px';
    panel.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';

    const h = document.createElement('h3');
    h.textContent = title;
    h.style.marginBottom = '8px';
    panel.appendChild(h);

    const textLabel = document.createElement('label');
    textLabel.textContent = 'Task';
    textLabel.style.display = 'block';
    textLabel.style.fontSize = '12px';
    panel.appendChild(textLabel);

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = text;
    textInput.style.width = '100%';
    textInput.style.padding = '8px';
    textInput.style.marginBottom = '8px';
    panel.appendChild(textInput);

    const dateLabel = document.createElement('label');
    dateLabel.textContent = 'Due date';
    dateLabel.style.display = 'block';
    dateLabel.style.fontSize = '12px';
    panel.appendChild(dateLabel);

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = date;
    dateInput.style.width = '100%';
    dateInput.style.padding = '8px';
    dateInput.style.marginBottom = '12px';
    panel.appendChild(dateInput);

    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.justifyContent = 'flex-end';
    btnRow.style.gap = '8px';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn btn-danger btn-sm';
    cancelBtn.onclick = () => { document.body.removeChild(overlay); };
    btnRow.appendChild(cancelBtn);

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.className = 'btn btn-sm btn-success';
    saveBtn.onclick = () => {
        const res = { text: textInput.value, date: dateInput.value };
        const ok = onSubmit ? onSubmit(res) : true;
        if (ok) document.body.removeChild(overlay);
    };
    btnRow.appendChild(saveBtn);

    panel.appendChild(btnRow);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    textInput.focus();
}

// Function to edit a subtask
function editSubtask(todoId, subtaskId) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) {
        showAlert('Todo not found!', 'error');
        return;
    }
    
    const subtask = todo.subtasks.find(s => s.id === subtaskId);
    if (!subtask) {
        showAlert('Subtask not found!', 'error');
        return;
    }
    // Use modal input to edit subtask text + due date
    openEditModal({
        title: 'Edit Subtask',
        text: subtask.text,
        date: subtask.dueDate || '',
        onSubmit: ({ text: newText, date: newDue }) => {
            if (newText.trim() === '') {
                showAlert('Subtask text cannot be empty!', 'error');
                return false;
            }
            if (newText.trim().length > 100) {
                showAlert('Subtask text must be less than 100 characters!', 'error');
                return false;
            }
            if (todo.subtasks.some(s => s.id !== subtaskId && s.text.toLowerCase() === newText.trim().toLowerCase())) {
                showAlert('A subtask with this text already exists!', 'error');
                return false;
            }
            if (!newDue || newDue.trim() === '') {
                showAlert('Due date cannot be empty!', 'error');
                return false;
            }
            const parsed = new Date(newDue);
            const today = new Date();
            today.setHours(0,0,0,0);
            if (isNaN(parsed.getTime())) {
                showAlert('Invalid due date format!', 'error');
                return false;
            }
            if (parsed < today) {
                showAlert('Due date cannot be in the past!', 'error');
                return false;
            }

            subtask.text = newText.trim();
            subtask.dueDate = newDue;
            renderTodos();
            saveTodos();
            showAlert('Subtask updated successfully!', 'success');
            return true;
        }
    });
}

// Function to delete a subtask
function deleteSubtask(todoId, subtaskId) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) {
        showAlert('Todo not found!', 'error');
        return;
    }
    
    const subtask = todo.subtasks.find(s => s.id === subtaskId);
    if (!subtask) {
        showAlert('Subtask not found!', 'error');
        return;
    }
    openConfirmModal({
        title: 'Delete Subtask',
        message: `Delete subtask "${subtask.text}"?`,
        confirmText: 'Delete',
        onConfirm: () => {
            todo.subtasks = todo.subtasks.filter(s => s.id !== subtaskId);
            renderTodos();
            saveTodos();
            showAlert('Subtask deleted successfully!', 'success');
        }
    });
}

// Confirm modal helper: options {title, message, confirmText, onConfirm}
function openConfirmModal(options) {
    const { title = 'Confirm', message = '', confirmText = 'Confirm', onConfirm } = options;

    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    const panel = document.createElement('div');
    panel.className = 'confirm-panel';

    const h = document.createElement('h3');
    h.textContent = title;
    panel.appendChild(h);

    const p = document.createElement('p');
    p.textContent = message;
    panel.appendChild(p);

    const btnRow = document.createElement('div');
    btnRow.className = 'btn-row';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn cancel';
    cancelBtn.onclick = () => { if (document.body.contains(overlay)) document.body.removeChild(overlay); };
    btnRow.appendChild(cancelBtn);

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = confirmText;
    confirmBtn.className = 'btn confirm-delete';
    confirmBtn.onclick = () => {
        try {
            if (onConfirm) onConfirm();
        } finally {
            if (document.body.contains(overlay)) document.body.removeChild(overlay);
        }
    };
    btnRow.appendChild(confirmBtn);

    panel.appendChild(btnRow);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
}

// Function to delete a specific todo item by id
function deleteTodoById(todoId) {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) {
        showAlert('Todo not found!', 'error');
        return;
    }
    openConfirmModal({
        title: 'Delete Todo',
        message: `Delete "${todo.text}" and all its subtasks?`,
        confirmText: 'Delete',
        onConfirm: () => {
            todos = todos.filter(t => t.id !== todoId);
            renderTodos();
            saveTodos();
            showAlert('Todo deleted successfully!', 'success');
        }
    });
}


// Function to delete all todo items
function deleteAllTodos() {
    if (todos.length === 0) {
        showAlert('No todos to delete!', 'error');
        return;
    }
    openConfirmModal({
        title: 'Delete All Todos',
        message: `Delete all ${todos.length} todo items?`,
        confirmText: 'Delete',
        onConfirm: () => {
            todos = [];
            renderTodos();
            saveTodos();
            showAlert('All todos deleted!', 'success');
        }
    });
}

// Function to sort todo items by date (all, ascending, and descending)
function sortTodos() {
    const sortSelect = document.getElementById('sort-todos');
    const order = sortSelect.value;
    
    if (order === 'default') {
        displayedTodos = [...todos];
    } else if (order === 'date-asc') {
        displayedTodos = [...todos].sort((a, b) => {
            const dateA = new Date(a.dueDate || '9999-12-31');
            const dateB = new Date(b.dueDate || '9999-12-31');
            return dateA - dateB;
        });
    } else if (order === 'date-desc') {
        displayedTodos = [...todos].sort((a, b) => {
            const dateA = new Date(a.dueDate || '9999-12-31');
            const dateB = new Date(b.dueDate || '9999-12-31');
            return dateB - dateA;
        });
    }
    
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';
    displayedTodos.forEach(todo => {
        todoList.innerHTML += formatTodoItem(todo);
    });
}

// Function to filter todo items by status (all, completed, and pending)
function filterTodos() {
    const filterSelect = document.getElementById('filter-status');
    const status = filterSelect.value;
    
    displayedTodos = todos.filter(todo => todo.status === status || status === 'all');
    
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';
    displayedTodos.forEach(todo => {
        todoList.innerHTML += formatTodoItem(todo);
    });
}

// Function to search todo items
function searchTodos() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderTodos();
        return;
    }
    
    displayedTodos = todos.filter(todo => todo.text.toLowerCase().includes(searchTerm));
    
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';
    
    if (displayedTodos.length === 0) {
        todoList.innerHTML = '<tr><td colspan="4" class="text-center text-gray-500">No todos found</td></tr>';
    } else {
        displayedTodos.forEach(todo => {
            todoList.innerHTML += formatTodoItem(todo);
        });
    }
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', initializeTodos);