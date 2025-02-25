const API_URL = "http://localhost:3000"

// Register
const registerForm = document.getElementById("registerForm")
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const username = document.getElementById("username").value
        const password = document.getElementById("password").value
        try {
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            })
            const data = await response.json()
            alert(data.message)
            window.location.href = "login.html"
        } catch (error) {
            console.error("Error:", error)
        }
    })
}

// Login
const loginForm = document.getElementById("loginForm")
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const username = document.getElementById("username").value
        const password = document.getElementById("password").value
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            })
            const data = await response.json()
            if (response.ok) {
                alert(data.message)
                window.location.href = "dashboard.html"
            } else {
                alert(data.message)
            }
        } catch (error) {
            console.error("Error:", error)
        }
    })
}

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            const response = await fetch(`${API_URL}/logout`, { credentials: "include" }); // Отправляем запрос с куками
            const data = await response.json();

            // Очищаем токен и сессию на клиенте
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");

            alert(data.message);
            window.location.href = "index.html"; // Редирект на страницу входа
        } catch (error) {
            console.error("Error:", error);
        }
    });
}


// QR Code Generator
const qrForm = document.getElementById("qrForm")
if (qrForm) {
    qrForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const text = document.getElementById("qrText").value
        try {
            const response = await fetch(`${API_URL}/generate-qr`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            })
            const data = await response.json()
            const qrCodeContainer = document.getElementById("qrCodeContainer")
            qrCodeContainer.innerHTML = `<img src="${data.qrCodeUrl}" alt="QR Code">`
        } catch (error) {
            console.error("Error:", error)
        }
    })
}

// Email Sender
const emailForm = document.getElementById("emailForm")
if (emailForm) {
    emailForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const to = document.getElementById("to").value
        const subject = document.getElementById("subject").value
        const text = document.getElementById("text").value
        try {
            const response = await fetch(`${API_URL}/send-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ to, subject, text }),
            })
            const data = await response.json()
            document.getElementById("emailResult").textContent = data.message
        } catch (error) {
            console.error("Error:", error)
        }
    })
}

// BMI Calculator
const bmiForm = document.getElementById("bmiForm")
if (bmiForm) {
    bmiForm.addEventListener("submit", (e) => {
        e.preventDefault()
        const weight = Number.parseFloat(document.getElementById("weight").value)
        const height = Number.parseFloat(document.getElementById("height").value) / 100 // convert cm to m
        const bmi = weight / (height * height)
        document.getElementById("bmiResult").textContent = `Your BMI is ${bmi.toFixed(2)}`
    })
}

// Weather, Timezone and Forecast API
let map;

const weatherForm = document.getElementById("weatherForm");
if (weatherForm) {
    weatherForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const city = document.getElementById("city").value;
        try {
            const response = await fetch(`${API_URL}/get-weather`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ city })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch weather data');
            }

            const data = await response.json();

            displayWeatherInfo(data.weather, data.flag, data.airQuality);
            displayTimezoneInfo(data.timezone);
            displayForecastInfo(data.forecast);
            initializeMap(data.mapCoord);

        } catch (error) {
            console.error("Error:", error);
            document.getElementById("weatherResult").innerHTML = `<p>Error: ${error.message}</p>`;
        }
    });
}

function displayWeatherInfo(weather, flag, airQuality) {
    const weatherInfo = document.getElementById("weatherResult");
    const iconUrl = `http://openweathermap.org/img/wn/${weather.icon}@2x.png`;

    const airQualityText = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];

    weatherInfo.innerHTML = `
        <h2>Weather in ${weather.city}, ${weather.country}</h2>
        <img src="${flag}" alt="Flag of ${weather.country}" style="width:100px;"/>
        <img src="${iconUrl}" alt="${weather.description}" />
        <p>Temperature: ${weather.temperature}°C</p>
        <p>Feels like: ${weather.feelsLike}°C</p>
        <p>Description: ${weather.description}</p>
        <p>Humidity: ${weather.humidity}%</p>
        <p>Pressure: ${weather.pressure} hPa</p>
        <p>Wind Speed: ${weather.windSpeed} m/s</p>
        <p>Rain (last 3h): ${weather.rain !== undefined ? weather.rain : "No data"} mm</p>
        <p>Air Quality: ${airQualityText[airQuality - 1] || "Unknown"}</p>
    `;
}

function displayTimezoneInfo(timezone) {
    const timezoneInfo = document.getElementById("timezoneResult");
    timezoneInfo.innerHTML = `
        <h2>Timezone Information</h2>
        <p>Timezone: ${timezone.zoneName}</p>
        <p>Local Time: ${timezone.localTime}</p>
    `;
}

function displayForecastInfo(forecast) {
    const forecastInfo = document.getElementById("forecastResult");
    if (!forecast || forecast.length === 0) {
        forecastInfo.innerHTML = "<p>No forecast data available</p>";
        return;
    }

    let forecastHtml = '<h2>5-Day Forecast</h2>';

    forecast.forEach(day => {
        const date = new Date(day.date);
        forecastHtml += `
            <div class="forecast-day">
                <h3>${date.toDateString()}</h3>
                <p>Min: ${day.minTemp}°C</p>
                <p>Max: ${day.maxTemp}°C</p>
                <p>Day: ${day.dayPhrase}</p>
                <p>Night: ${day.nightPhrase}</p>
            </div>
        `;
    });

    forecastInfo.innerHTML = forecastHtml;
}
function initializeMap(coord) {
    if (map) {
        map.remove();
    }

    map = L.map('map').setView([coord.lat, coord.lon], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    L.marker([coord.lat, coord.lon]).addTo(map)
        .bindPopup('City Location')
        .openPopup();
}


// CRUD Operations
const taskForm = document.getElementById("taskForm")
const taskList = document.getElementById("taskList")

if (taskForm && taskList) {
    // Load tasks
    const loadTasks = async () => {
        try {
            const response = await fetch(`${API_URL}/tasks`)
            const tasks = await response.json()
            taskList.innerHTML = ""
            tasks.forEach((task) => {
                const li = document.createElement("li")
                li.innerHTML = `
                    ${task.title}
                    <span>
                        <button onclick="updateTask('${task._id}')" class="btn">${task.completed ? "Undo" : "Complete"}</button>
                        <button onclick="deleteTask('${task._id}')" class="btn">Delete</button>
                    </span>
                `
                taskList.appendChild(li)
            })
        } catch (error) {
            console.error("Error:", error)
        }
    }

    // Add task
    taskForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const title = document.getElementById("taskTitle").value
        try {
            await fetch(`${API_URL}/add-task`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title }),
            })
            document.getElementById("taskTitle").value = ""
            loadTasks()
        } catch (error) {
            console.error("Error:", error)
        }
    })

    // Update task
    window.updateTask = async (id) => {
        try {
            await fetch(`${API_URL}/update-task/${id}`, { method: "POST" })
            loadTasks()
        } catch (error) {
            console.error("Error:", error)
        }
    }

    // Delete task
    window.deleteTask = async (id) => {
        try {
            await fetch(`${API_URL}/delete-task/${id}`, { method: "DELETE" })
            loadTasks()
        } catch (error) {
            console.error("Error:", error)
        }
    }

    // Initial load
    loadTasks()
}

