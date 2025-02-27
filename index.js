const loggedInUser = 1;


async function fetchData() {
    try {
        const res = await fetch('http://localhost/PhpRest/api/tasks');
        if (!res.ok) {
            throw new Error('Network response was not ok. Failed to fetch');
        }
        const tasks = await res.json();    
        console.log("DEBUGGING: ", tasks);
        renderTasks(tasks);
        return tasks;
    } catch (err) {
        console.error("ERROR fetching tasks: ", err);
    }
}

fetchData();



function renderTasks(tasks) {
    const taskList = document.querySelector('.task-list');
    if (!taskList) {
        console.error("Task list container not found!");
        return;
    }
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        taskItem.setAttribute('role', 'listitem');

        taskItem.innerHTML = `
            <label>
                <input type="checkbox" aria-label="Mark Task as Complete" id="task${task.task_id}-checkbox">
                ${task.task_title}
            </label>
            <div class="time">
                <span>⏰ ${task.task_date}</span>
                <div class="dropdown">
                    <button type="button" class="dropdown-toggle" aria-label="Task Options" aria-haspopup="true"
                        aria-expanded="false" id="task${task.task_id}-dropdown-toggle">
                        <i class="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                    <div class="dropdown-content" id="task${task.task_id}-dropdown-content">
                        <button type="button" aria-label="Edit Task" onclick="edit(${task.task_id}, '${task.task_title}', '${task.task_description}', '${task.task_date}', '${task.status}', '${task.priority}')">
                            Edit <i class="fa-regular fa-pen-to-square"></i>
                        </button>

                        <button type="button" aria-label="Delete Task" onclick="confirmDeleteTask(${task.task_id}, '${task.task_title}')">Delete<i class="fa-solid fa-trash"></i></button>
                        <button type="button" aria-label="Mark Task as Done" onclick="confirmMarkAsDone(${task.task_id})">Mark as Done<i class="fa-regular fa-circle-check"></i></button>
                    </div>
                </div>
            </div>
        `;
        taskList.appendChild(taskItem);
    });
}

function toggleMenu() { // For small screens
    const menuToggle = document.querySelector('.menu-toggle');
    const menuLinks = document.querySelectorAll('.menu a');

    let isMenuVisible = false;

    menuToggle.addEventListener('click', () => {
        menuLinks.forEach(link => {
            if (isMenuVisible) {
                link.style.visibility = 'hidden';
            } else {
                link.style.visibility = 'visible';
            }
        });

        // Update the state of the menu toggle
        isMenuVisible = !isMenuVisible;
        menuToggle.setAttribute('aria-expanded', isMenuVisible);
    });
}

function updateTime() {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const timeString = `${hours}:${minutes}:${seconds} ${ampm}`;
    document.querySelector('.profile-info div:last-child span').textContent = timeString;
}

setInterval(updateTime, 1000);

async function editTaskHelper(taskId, updatedTask) {
    try {
        const response = await fetch(`http://localhost/PhpRest/api/tasks?task_id=${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedTask),
        });
        if (!response.ok) {
            throw new Error('Failed to update task');
        }
        const result = await response.json();
        console.log('Task updated:', result);
        fetchData(); // Refresh the task list
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

function edit(taskId, title, description, date, status, priority) {
    const editPanel = document.querySelector('#editTaskModal');
    const taskTitle = document.querySelector('#task_title');
    const taskDescription = document.querySelector('#task_description');
    const taskDate = document.querySelector('#task_date');
    const taskStatus = document.querySelector('#status');
    const taskPriority = document.querySelector('#priority');
   
    taskTitle.value = title;
    taskDescription.value = description;
    if (date) {
        const formattedDate = new Date(date).toISOString().slice(0, 16);
        taskDate.value = formattedDate; 
    }   
    taskStatus.value = status; 
    taskPriority.value = priority;
   

    editPanel.classList.add('active');

    const form = document.querySelector('#editTaskForm');
    const handleSubmit = async (event) => {
        event.preventDefault();

        const isConfirmed = confirm("Are you sure you want to edit task " + title + "?");
        if (isConfirmed) {
            const updatedTask = {
                task_id: taskId,
                task_title: taskTitle.value,
                task_description: taskDescription.value,
                task_date: taskDate.value,
                status: taskStatus.value, 
                priority: taskPriority.value,
            };

            await editTaskHelper(taskId, updatedTask);
            editPanel.classList.remove('active');
            form.removeEventListener('submit', handleSubmit);
        } else {
            console.log("Edit cancelled for task: " + taskId);
        }
    };

    form.addEventListener('submit', handleSubmit);
}

async function deleteTaskHelper(taskId) {
    try {
        const response = await fetch(`http://localhost/PhpRest/api/tasks/${taskId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete task');
        }else{
            const result = await response.json();
            console.log('Task deleted:', result);
            fetchData()// Refresh the task list
        }
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

function confirmDeleteTask(taskId, title) {
    const isConfirmed = confirm("Are you sure you want to delete task " + title + "?");
    if (isConfirmed) {
        deleteTaskHelper(taskId); 
    } else {
        console.log("Deletion cancelled for task: " + title);
    }
}

async function markAsDone(taskId) {
    try {
        const response = await fetch(`http://localhost/PhpRest/api/tasks?task_id=${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'complete' }),
        });
        if (!response.ok) {
            throw new Error('Failed to mark task as done');
        }
        const result = await response.json();
        console.log('Task marked as done:', result);
        fetchData(); // Refresh the task list
    } catch (error) {
        console.error('Error marking task as done:', error);
    }
}

function confirmMarkAsDone(taskId) {
    const isConfirmed = confirm("Are you sure you want to mark task " + taskId + " as done?");
    if (isConfirmed) {
        markAsDone(taskId); // Call the async function to mark the task as done
    } else {
        console.log("Marking as done cancelled for task: " + taskId);
    }
}

updateTime();
toggleMenu();