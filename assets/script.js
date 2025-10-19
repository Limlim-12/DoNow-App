// --- DOM Element Selection ---
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const themeToggleButton = document.getElementById('theme-toggle-button');
const voiceInputBtn = document.getElementById('voice-input-btn');


// TIMER SELECTORS
const timerDisplay = document.getElementById('timer-display');
const startTimerBtn = document.getElementById('start-timer-btn');
const resetTimerBtn = document.getElementById('reset-timer-btn');
const pomodoroBtn = document.getElementById('pomodoro-btn');
const shortBreakBtn = document.getElementById('short-break-btn');
const longBreakBtn = document.getElementById('long-break-btn');
// NEW: Time adjustment buttons
const increaseTimeBtn = document.getElementById('increase-time-btn');
const decreaseTimeBtn = document.getElementById('decrease-time-btn');
const alarmSound = document.getElementById('alarm-sound');
// --- State Management ---
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentTheme = localStorage.getItem('theme') || 'light';

// Timer state
let timerInterval;
let currentTimerMode = 1500; // Default to 25 minutes (1500 secs)
let timeInSeconds = currentTimerMode;
let isTimerRunning = false;
const modeButtons = [pomodoroBtn, shortBreakBtn, longBreakBtn];
// NEW: Time constants
const MIN_TIME = 60; // 1 minute
const MAX_TIME = 5400; // 90 minutes
const TIME_STEP = 60; // 1 minute step

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
    // (Your existing renderTasks function - no changes)
    taskList.innerHTML = '';
    if (tasks.length === 0) {
        taskList.innerHTML = '<li class="no-tasks">Your task list is empty!</li>';
        return;
    }
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
 */
function addTask(text) {
    if (text.trim() === '') return; // Don't add empty tasks

    // NEW: Add 'completedAt' property
    tasks.push({ text: text, completed: false, completedAt: null });
    saveTasks();
    renderTasks();
    renderDashboard();
}

/**
 * Toggles the completed status of a task.
 */
function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    
    // NEW: Set or clear the completion date
    if (tasks[index].completed) {
        tasks[index].completedAt = new Date().toISOString(); // Save current date
    } else {
        tasks[index].completedAt = null; // Clear date if unchecked
    }

    saveTasks();
    renderTasks();
    renderDashboard(); // NEW: Update the chart when a task is toggled
}

/**
 * Deletes a task from the `tasks` array.
 */
function deleteTask(index) {
    // (Your existing deleteTask function - no changes)
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
    renderDashboard();
}


// --- THEME SWITCHING FUNCTIONS ---

function applyTheme(theme) {
    // (Your existing applyTheme function - no changes)
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleButton.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggleButton.textContent = '🌙';
    }
    if (tasks.length > 0) {
        renderDashboard();
    }  
    
    // Re-render dashboard on theme change
    renderDashboard();
}

function toggleTheme() {
    // (Your existing toggleTheme function - no changes)
    currentTheme = (currentTheme === 'light') ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme(currentTheme);
}

// --- TIMER FUNCTIONS ---

// NEW: Function to play alarm sound
function playAlarmSound() {
    alarmSound.currentTime = 0; // Rewind to the start
    alarmSound.play();
}

function setTimerMode(minutes, activeBtn) {
    pauseTimer(); 
    currentTimerMode = minutes * 60;
    timeInSeconds = currentTimerMode;
    updateTimerDisplay();

    // Update the active button style
    modeButtons.forEach(btn => btn.classList.remove('active'));
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// MODIFIED: updateTimerDisplay to include button states
function updateTimerDisplay() {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // NEW: Disable buttons if timer is at min/max
    decreaseTimeBtn.disabled = (timeInSeconds <= MIN_TIME);
    increaseTimeBtn.disabled = (timeInSeconds >= MAX_TIME);
}

// NEW: Function to manually adjust time
/**
 * Adjusts the timer duration up or down.
 * @param {number} amount - The number of seconds to add (positive or negative).
 */
function adjustTime(amount) {
    if (isTimerRunning) return; // Don't adjust time while running

    let newTime = currentTimerMode + amount;

    // Enforce min and max time limits
    if (newTime < MIN_TIME) {
        newTime = MIN_TIME;
    }
    if (newTime > MAX_TIME) {
        newTime = MAX_TIME;
    }

    // Set the new time
    setTimerMode(newTime / 60, null); // Pass null so no preset button is activated
}

function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    startTimerBtn.textContent = "Pause";
    // NEW: Disable adjustment buttons while running
    increaseTimeBtn.disabled = true;
    decreaseTimeBtn.disabled = true;

    timerInterval = setInterval(() => {
        timeInSeconds--;
        updateTimerDisplay();

        if (timeInSeconds <= 0) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            playAlarmSound(); 
            resetTimer();     
        }
    }, 1000);
}

function pauseTimer() {
    isTimerRunning = false;
    startTimerBtn.textContent = "Start";
    // NEW: Re-enable adjustment buttons when paused
    updateTimerDisplay(); // This will re-check and set button states
    
    clearInterval(timerInterval);
}

function resetTimer() {
    pauseTimer();
    timeInSeconds = currentTimerMode;
    updateTimerDisplay();
}

// --- START: NEW DASHBOARD CHART FUNCTIONS ---

let progressChart = null; // Variable to hold the chart instance

/**
 * Processes task data to count completed vs. pending tasks.
 */
function getPieChartData() {
    let completed = 0;
    let pending = 0;
    
    tasks.forEach(task => {
        if (task.completed) {
            completed++;
        } else {
            pending++;
        }
    });

    // Handle case where there are no tasks
    if (tasks.length === 0) {
        return {
            labels: ['No Tasks'],
            counts: [1],
            colors: [getComputedStyle(document.body).getPropertyValue('--task-bg')]
        };
    }

    return {
        labels: ['Pending', 'Completed'],
        counts: [pending, completed],
        colors: [
            getComputedStyle(document.body).getPropertyValue('--danger-color'),
            getComputedStyle(document.body).getPropertyValue('--accent-color')
        ]
    };
}

/**
 * Renders or updates the progress chart as a Pie Chart.
 */
function renderDashboard() {
    const ctx = document.getElementById('progress-chart');
    if (!ctx) return; // Exit if canvas not found
    
    const chartData = getPieChartData();
    const chartColors = {
        ticks: getComputedStyle(document.body).getPropertyValue('--font-color'),
        grid: getComputedStyle(document.body).getPropertyValue('--border-color')
    };
    
    // Destroy existing chart if it exists
    if (progressChart) {
        progressChart.destroy();
    }

    // Create new Pie chart
    progressChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Tasks',
                data: chartData.counts,
                backgroundColor: chartData.colors,
                borderColor: getComputedStyle(document.body).getPropertyValue('--container-bg'),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: chartColors.ticks,
                        padding: 15,
                        font: {
                            size: 14,
                            family: "'Poppins', sans-serif"
                        }
                    }
                },
                tooltip: {
                    displayColors: false,
                    callbacks: {
                        // Show "X tasks" on tooltip
                        label: function(context) {
                            let label = context.label || '';
                            let value = context.raw || 0;
                            if (label) {
                                label += ': ';
                            }
                            label += value;
                            if (value === 1) {
                                label += ' task';
                            } else {
                                label += ' tasks';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}
// --- END: NEW DASHBOARD CHART FUNCTIONS ---

// --- VOICE RECOGNITION FUNCTIONS ---

function handleVoiceInput() {
    // (Your existing handleVoiceInput function - no changes)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Sorry, your browser doesn't support speech recognition.");
        voiceInputBtn.disabled = true;
        voiceInputBtn.title = "Speech recognition not supported";
        return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
        voiceInputBtn.classList.add('is-listening');
        voiceInputBtn.title = "Listening...";
    };
    recognition.onend = () => {
        voiceInputBtn.classList.remove('is-listening');
        voiceInputBtn.title = "Add task by voice";
    };
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        voiceInputBtn.title = "Error listening";
    };
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        taskInput.value = transcript;
    };
    try {
        recognition.start();
    } catch (error) {
        console.error("Could not start speech recognition:", error);
    }
}

// --- Event Listeners ---

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTask(taskInput.value);
    taskInput.value = '';
});

taskList.addEventListener('click', (e) => {
    // (Your existing taskList listener - no changes)
    const target = e.target;
    const taskItem = target.closest('li');
    if (!taskItem || taskItem.classList.contains('no-tasks')) {
        return;
    }
    const index = parseInt(taskItem.dataset.index, 10);
    if (target.classList.contains('delete-btn')) {
        deleteTask(index);
    } else if (target.closest('.task-content')) {
        toggleTask(index);
    }
});

themeToggleButton.addEventListener('click', toggleTheme);

startTimerBtn.addEventListener('click', () => {
    if (isTimerRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});
resetTimerBtn.addEventListener('click', resetTimer);

// Event listeners for timer modes
pomodoroBtn.addEventListener('click', () => setTimerMode(25, pomodoroBtn));
shortBreakBtn.addEventListener('click', () => setTimerMode(5, shortBreakBtn));
longBreakBtn.addEventListener('click', () => setTimerMode(15, longBreakBtn));

// NEW: Event listeners for time adjustment
increaseTimeBtn.addEventListener('click', () => adjustTime(TIME_STEP));
decreaseTimeBtn.addEventListener('click', () => adjustTime(-TIME_STEP));

voiceInputBtn.addEventListener('click', handleVoiceInput);

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    applyTheme(currentTheme);
    renderTasks();
    updateTimerDisplay(); // Set the initial timer display (and button states)
    renderDashboard(); // <-- ADD THIS LINE
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
        voiceInputBtn.disabled = true;
        voiceInputBtn.title = "Speech recognition not supported";
    }
});