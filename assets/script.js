// --- DOM Element Selection ---
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const themeToggleButton = document.getElementById('theme-toggle-button');


// START: NEW TIMER SELECTORS
const timerDisplay = document.getElementById('timer-display');
const startTimerBtn = document.getElementById('start-timer-btn');
const pauseTimerBtn = document.getElementById('pause-timer-btn');
const resetTimerBtn = document.getElementById('reset-timer-btn');

// --- State Management ---
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentTheme = localStorage.getItem('theme') || 'light';

let timerInterval;
let timeInSeconds = 1500; // 25 minutes (25 * 60)
let isTimerRunning = false;

// --- Functions ---

/**
 * Saves the current tasks array to localStorage.
 */
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

/**
 * Renders the tasks from the `tasks` array to the DOM.
 */
function renderTasks() {
    // Clear the existing list
    taskList.innerHTML = '';

    // If there are no tasks, display a message
    if (tasks.length === 0) {
        // Using a list item for consistency in styling
        taskList.innerHTML = '<li class="no-tasks">Your task list is empty!</li>';
        return;
    }

    // Create and append a list item for each task
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.dataset.index = index;
        if (task.completed) {
            li.classList.add('completed');
        }

        const checkboxClass = task.completed ? 'task-checkbox checked' : 'task-checkbox';

        li.innerHTML = `
            <div class="task-content">
                <div class="${checkboxClass}" role="button" aria-pressed="${task.completed}"></div>
                <span class="task-text">${task.text}</span>
            </div>
            <button class="delete-btn" title="Delete task">&times;</button>
        `;

        taskList.appendChild(li);
    });
}



/**
 * Adds a new task to the `tasks` array.
 * @param {string} text - The text content of the task.
 */
function addTask(text) {
    if (text.trim() === '') return; // Don't add empty tasks

    tasks.push({ text: text, completed: false });
    saveTasks();
    renderTasks();
}

/**
 * Toggles the completed status of a task.
 * @param {number} index - The index of the task in the `tasks` array.
 */
function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
}

/**
 * Deletes a task from the `tasks` array.
 * @param {number} index - The index of the task in the `tasks` array.
 */
function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}


// --- THEME SWITCHING FUNCTIONS ---

/**
 * Applies the selected theme to the document.
 * @param {string} theme - The theme to apply ('light' or 'dark').
 */
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleButton.textContent = '☀️'; // Sun emoji
    } else {
        document.body.classList.remove('dark-mode');
        themeToggleButton.textContent = '🌙'; // Moon emoji
    }
}

/**
 * Toggles the theme between light and dark.
 */
function toggleTheme() {
    currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Starts the Pomodoro timer.
 */
function startTimer() {
    if (isTimerRunning) return; // Prevent multiple intervals
    isTimerRunning = true;
    timerInterval = setInterval(() => {
        timeInSeconds--;
        updateTimerDisplay();
        if (timeInSeconds <= 0) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            alert("Focus session complete!");
            // Optionally, you can add a short break timer here later
        }
    }, 1000);
}

/**
 * Pauses the Pomodoro timer.
 */
function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
}

/**
 * Resets the Pomodoro timer to its initial state.
 */
function resetTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    timeInSeconds = 1500; // Reset to 25 minutes
    updateTimerDisplay();
}


// --- Event Listeners ---

// Handle form submission to add a new task
taskForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent default form submission
    addTask(taskInput.value);
    taskInput.value = ''; // Clear the input field
});

// Handle clicks on the task list for completing or deleting tasks
taskList.addEventListener('click', (e) => {
    const target = e.target;
    const taskItem = target.closest('li');

    if (!taskItem || taskItem.classList.contains('no-tasks')) {
        return; // Exit if click isn't on a real task
    }

    const index = parseInt(taskItem.dataset.index, 10);

    if (target.classList.contains('delete-btn')) {
        deleteTask(index);
    } else if (target.closest('.task-content')) {
        toggleTask(index);
    }
});

// New theme toggle event listener
themeToggleButton.addEventListener('click', toggleTheme);

startTimerBtn.addEventListener('click', startTimer);
pauseTimerBtn.addEventListener('click', pauseTimer);
resetTimerBtn.addEventListener('click', resetTimer);


// --- Initial Load ---
// This runs when the page is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(currentTheme); // Apply saved theme on load
    renderTasks();
    updateTimerDisplay();
});