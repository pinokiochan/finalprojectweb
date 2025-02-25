# 🌍 Full-Stack Weather App with Authentication & CRUD
### 🚀 A full-stack web application with user authentication, weather forecasting, QR code generation, email sending, and task management (CRUD).

## 🔥 Features
* ✅ User Authentication (Sign Up, Login, Logout, Password Hashing)
* ✅ Weather Forecast (Current weather, 5-day forecast, timezone, and map integration)
* ✅ QR Code Generator (Generate QR codes from user input)
* ✅ Email Sending (Send emails using Nodemailer)
* ✅ BMI Calculator (Calculate Body Mass Index)
* ✅ Task Manager (Create, update, and delete tasks)
* ✅ Secure Backend (MongoDB, Express.js, Sessions, Bcrypt for password hashing)

## 🛠 Tech Stack
* 🔹 Frontend: HTML, CSS, JavaScript, Leaflet.js for map
* 🔹 Backend: Node.js, Express.js, MongoDB, Mongoose
* 🔹 APIs Used: OpenWeatherMap, AccuWeather, TimeZoneDB, Nodemailer, QRCode
* 🔹 Security: Bcrypt for password hashing, Sessions for authentication
* 🔹 Package Manager: npm

## 🚀 Installation & Setup
* 1️⃣ Clone the repository
bash
```
git clone <https://github.com/pinokiochan/finalprojectweb.git>
cd finalprojectweb
```
* 2️⃣ Install dependencies
bash
```
npm install
```
* 3️⃣ Create a .env file in the project root and add your API keys
```
env
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
WEATHER_API_KEY=your_openweathermap_api_key
TIMEZONE_API_KEY=your_timezonedb_api_key
ACCUWEATHER_API_KEY=your_accuweather_api_key
PORT=3000
```
* 4️⃣ Start the server
bash
```
node server.js
🔹 Server will run on: http://localhost:3000
```
## 🛠 Project Structure
bash
```
dir /weather-app
│── dir /frontend
│   ├── index.html          # Homepage
│   ├── login.html          # Login Page
│   ├── register.html       # Register Page
│   ├── dashboard.html      # Main User Dashboard
│   ├── weather.html        # Weather API Page
│   ├── qr-code.html        # QR Code Generator Page
│   ├── nodemailer.html     # Email Sending Page
│   ├── bmi.html            # BMI Calculator Page
│   ├── crud.html           # Task Manager (CRUD)
│   ├── dir /css                # Styles
│   ├── dir /js                 # JavaScript logic
│── .env                    # Environment Variables
│── package.json            # Project Dependencies
├── server.js               # Main Server File
│── README.md               # Project Documentation
```
## 🌍 API Endpoints
#### Authentication
* POST /register → Register a new user
* POST /login → Login
* GET /logout → Logout
* Weather & Timezone
* POST /get-weather → Get current weather, forecast, and timezone
* QR Code
* POST /generate-qr → Generate a QR code
* Email Sending
* POST /send-email → Send an email
* Task Manager (CRUD)
* GET /tasks → Get all tasks
* POST /add-task → Add a new task
* POST /update-task/:id → Update task status
* DELETE /delete-task/:id → Delete task

### ⚡ Upcoming Features
* 🔹 Dark Mode Support
* 🔹 User Profile & Settings
* 🔹 More Weather Details (Air Quality, UV Index)
* 🔹 Google OAuth Authentication

## ❤️ Contributing
* Fork the repository
* Create a new branch (git checkout -b feature-branch)
* Commit your changes (git commit -m "Add new feature")
* Push to the branch (git push origin feature-branch)
* Open a Pull Request
* 📜 License
* 📝 MIT License – Free to use and modify.

🤝 Connect with Me
📧 Email: pinokiochan_n@icloud.com
🌍 Website: <notyet.com>
🚀 GitHub: <github.com/pinokiochan>

>🔥 Give a ⭐ if you like this project! 🚀







