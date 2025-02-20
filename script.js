// Load tasks and settings from localStorage
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let points = parseInt(localStorage.getItem('points')) || 0;
let streak = parseInt(localStorage.getItem('streak')) || 0;
let lastStreakDate = localStorage.getItem('lastStreakDate') || null;

// DOM elements
const taskInput = document.getElementById('taskInput');
const dueDate = document.getElementById('dueDate');
const categoryFilter = document.getElementById('categoryFilter');
const taskList = document.getElementById('taskList');
const pointsDisplay = document.getElementById('points');
const streakDisplay = document.getElementById('streak');
const themeToggle = document.getElementById('themeToggle');

// Initialize Chart.js
const ctx = document.getElementById('progressChart').getContext('2d');
let progressChart = new Chart(ctx, {
    type: 'pie',
    data: {
        labels: ['Completed', 'Pending'],
        datasets: [{
            data: [0, 0],
            backgroundColor: ['#00ffcc', '#3a3a3a']
        }]
    },
    options: { responsive: true }
});

// Load theme preference
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light');
    themeToggle.checked = true;
}

// Theme toggle
themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

// Add task
function addTask() {
    const taskText = taskInput.value.trim();
    const taskDate = dueDate.value;
    const category = categoryFilter.value;
    if (taskText) {
        const task = { text: taskText, date: taskDate, category: category, completed: false };
        tasks.push(task);
        saveTasks();
        renderTasks();
        taskInput.value = '';
        dueDate.value = '';
        requestNotification(task);
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateProgress();
}

// Render tasks
function renderTasks() {
    taskList.innerHTML = '';
    const filter = categoryFilter.value;
    tasks.filter(task => filter === 'all' || task.category === filter).forEach((task, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span style="${task.completed ? 'text-decoration: line-through;' : ''}">${task.text} (${task.date || 'No due date'})</span>
            <button onclick="toggleTask(${index})">${task.completed ? 'Undo' : 'Done'}</button>
        `;
        taskList.appendChild(li);
    });
}

// Toggle task completion
function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    if (tasks[index].completed) {
        points += 10;
        updateStreak();
    }
    saveTasks();
    renderTasks();
    pointsDisplay.textContent = points;
    localStorage.setItem('points', points);
}

// Update streak
function updateStreak() {
    const today = new Date().toDateString();
    if (lastStreakDate !== today) {
        streak++;
        lastStreakDate = today;
        localStorage.setItem('streak', streak);
        localStorage.setItem('lastStreakDate', lastStreakDate);
    }
    streakDisplay.textContent = streak;
}

// Update progress chart
function updateProgress() {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    progressChart.data.datasets[0].data = [completed, total - completed];
    progressChart.update();
}

// Request notification permission and schedule
function requestNotification(task) {
    if (task.date && Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') scheduleNotification(task);
        });
    } else if (task.date) {
        scheduleNotification(task);
    }
}

function scheduleNotification(task) {
    const due = new Date(task.date);
    const now = new Date();
    const timeUntil = due - now;
    if (timeUntil > 0) {
        setTimeout(() => {
            new Notification('Task Reminder', { body: `Due: ${task.text}` });
        }, timeUntil);
    }
}

// Share progress
function shareProgress() {
    const text = `I've earned ${points} points and a ${streak}-day streak on TaskMaster Apex!`;
    if (navigator.share) {
        navigator.share({ title: 'TaskMaster Apex', text: text, url: window.location.href });
    } else {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
    }
}

// Initial render
renderTasks();
pointsDisplay.textContent = points;
streakDisplay.textContent = streak;