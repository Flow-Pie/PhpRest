/*****************************
 *        INITIALIZATION      *
 *****************************/

let loggedInUser = 2;//simulate logged in user
let tasks = [],currentFilter = 'all',currentSort = 'default';


/*****************************
 *       FETCH FUNCTIONS      *
 *****************************/

const fetchData = async (url, callback) => {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        callback(data);
    } catch (err) {
        console.error(`Error fetching ${url}:`, err);
    }
};

const fetchTasks = () => fetchData(`http://localhost/PhpRest/api/tasks`, data => { 
    tasks = data.filter(task => task.user_id == loggedInUser); // Get only tasks for logged-in user
    renderTasks(tasks);
});

const fetchUsers = () => fetchData('http://localhost/PhpRest/api/users', setUserProfile);


/*****************************
 *       SETTER METHODS       *
 *****************************/

// 1.Set User Profile
const setUserProfile = users => {
    const user = users.find(u => u.user_id == loggedInUser);
    if (user) {
        document.querySelector('#current-user span').textContent = user.first_name;
        document.querySelector('#access-level span').textContent = user.role === 'admin' ? 'SUDO' : 'High';
    }
};


/*****************************
 *        UI UPDATES          *
 *****************************/
const updateUIElement = (id, content) => {
    const element = document.getElementById(id);
    if (element) element.innerHTML = content;
};

const renderTasks = tasks => {
    const taskList = document.querySelector('.task-list');
    if (!taskList) { taskList.innerHTML = "No tasks"; return; }    
    taskList.innerHTML = tasks.map(task => `
        <div class="task-item" style="background-color: ${task.status === 'complete' ? 'rgb(235,235,228)' : ''};">
            <label>
                <input type="checkbox" aria-label="Mark Task as Complete" ${task.status === 'complete' ? 'checked' : ''}
                    onchange="confirmMarkAsDone(${task.task_id}, '${escapeHTML(task.task_title)}')">
                ${task.status === 'complete' ? `<s>${escapeHTML(task.task_title)}</s>` : escapeHTML(task.task_title)}
            </label>
            <div class="time">
                <span>${escapeHTML(task.task_date)}</span>
                <div class="status-tag ${task.status}-tag">
                    ${task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                </div>
                <div class="dropdown">
                    <button class="dropdown-toggle" aria-label="Task Options" aria-haspopup="true" aria-expanded="false"
                        onclick="toggleDropdown(event)">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                    <div class="dropdown-content" role="menu">
                        <button onclick="edit(${task.task_id}, '${escapeHTML(task.task_title)}', '${escapeHTML(task.task_description)}', '${task.task_date}', '${task.status}', '${task.priority}')">
                            <i class="fa-regular fa-pen-to-square"></i>Edit
                        </button>
                        <button onclick="confirmDeleteTask(${task.task_id}, '${escapeHTML(task.task_title)}')">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                        <button onclick="confirmMarkAsDone(${task.task_id}, '${escapeHTML(task.task_title)}')">
                            <i class="fa-regular fa-circle-check"></i> Mark Complete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
};




/*****************************
 *    FILTERING & SORTING     *
 *****************************/

const filterTaskByStatus = filter => {
    currentFilter = filter;
    updateUIElement('active-filter', `
        <i class="fa-solid ${filter === 'complete' ? 'fa-check' : filter === 'pending' ? 'fa-clock' : 'fa-list'}"></i>
        ${filter === 'complete' ? 'Completed' : filter === 'pending' ? 'Pending' : 'All'}
    `);
    applyFilterAndSort();
};

const sortTasks = sortBy => {
    currentSort = sortBy;
    updateUIElement('active-sort', sortBy.charAt(0).toUpperCase() + sortBy.slice(1));
    applyFilterAndSort();
};

const applyFilterAndSort = () => {
    const filteredTasks = tasks.filter(task => currentFilter === 'all' || task.status === currentFilter);
    const sortedTasks = filteredTasks.sort((a, b) => {
        if (currentSort === 'name') return a.task_title.localeCompare(b.task_title);
        if (currentSort === 'date') return new Date(b.task_date) - new Date(a.task_date);
        if (currentSort === 'status') return b.status.localeCompare(a.status);
        return 0;
    });
    renderTasks(sortedTasks);
};

const escapeHTML = str => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');


/*****************************
 *     DROPDOWN HANDLING      *
 *****************************/
 

function toggleDropdown(event) {
    event.stopPropagation(); 
    const dropdown = event.currentTarget.closest('.task-item').querySelector('.dropdown-content');
    const taskItem = event.currentTarget.closest('.task-item');

    dropdown.classList.toggle('visible');

    if (dropdown.classList.contains('visible')) {     
        taskItem.style.height = 'auto'; 
    }
}

document.addEventListener('click', () => document.querySelectorAll('.dropdown-content.visible').forEach(d => d.classList.remove('visible')));


/*****************************
 *      HELPER METHODS        *
 *****************************/
const editTaskHelper = async (taskId, updatedTask) => {
    await fetch(`http://localhost/PhpRest/api/tasks?task_id=${taskId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask)
    });
    fetchTasks();
};

const deleteTaskHelper = async taskId => {
    await fetch(`http://localhost/PhpRest/api/tasks/${taskId}`, { method: 'DELETE' });
    fetchTasks();
};

const markAsDoneHelper = async taskId => {
    await fetch(`http://localhost/PhpRest/api/tasks?task_id=${taskId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'complete' })
    });
    fetchTasks();
};

const confirmAction = (message, action) => { if (confirm(message)) action(); };
const confirmDeleteTask = (taskId, title) => confirmAction(`Delete task ${title}?`, () => deleteTaskHelper(taskId));
const confirmMarkAsDone = (taskId, title) => confirmAction(`Mark task ${title} as done?`, () => markAsDoneHelper(taskId));


/*****************************
 *       FORM HANDLER         *
 *****************************/

const edit = (taskId, title, description, date, status, priority) => {
    const editPanel = document.querySelector('#editTaskModal');
    const form = document.querySelector('#editTaskForm');

    form.querySelector('#task_id').value = taskId;
    form.querySelector('#task_id').readOnly = true;
    form.querySelector('#task_title').value = title;
    form.querySelector('#task_description').value = description;
    form.querySelector('#task_date').value = date ? new Date(date).toISOString().slice(0, 16) : '';
    form.querySelector('#status').value = status;
    form.querySelector('#priority').value = priority;

    editPanel.classList.add('active');

    form.onsubmit = async event => {
        event.preventDefault();
        if (confirm(`Are you sure you want to edit task "${title}"?`)) {
            await editTaskHelper(taskId, {
                task_id: taskId,
                task_title: form.querySelector('#task_title').value,
                task_description: form.querySelector('#task_description').value,
                task_date: form.querySelector('#task_date').value,
                status: form.querySelector('#status').value,
                priority: form.querySelector('#priority').value
            });
            editPanel.classList.remove('active');
        }
    };
};


/*****************************
 *       TIME & MENU          *
 *****************************/
const updateTime = () => {
    const now = new Date();
    document.querySelector('.profile-info div:last-child span').textContent = `
        ${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}
        ${now.getHours() >= 12 ? 'PM' : 'AM'}
    `;
};
setInterval(updateTime, 1000);

function setActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop(); 
    const menuItems = document.querySelectorAll('.menu a');

    menuItems.forEach(item => {
        const itemPage = item.getAttribute('href').split('/').pop();
        item.classList.toggle('active', itemPage === currentPage);
    });
}


/*****************************
 *      EVENT LISTENERS       *
 *****************************/
document.querySelector('.menu-toggle').addEventListener('click', () => {
    document.querySelectorAll('.menu a').forEach(link => link.style.visibility = link.style.visibility === 'hidden' ? 'visible' : 'hidden');
});

document.addEventListener('DOMContentLoaded', setActiveMenu);


/*****************************
 *   INITIALIZATION & SETUP   *
 *****************************/
document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();
    fetchTasks();
    setActiveMenu();
});