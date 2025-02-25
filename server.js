import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import bcrypt from 'bcrypt';
import cors from 'cors';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import axios from 'axios';
import fetch from 'node-fetch';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Модель пользователя
const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  password: String
}), 'users');

// Модель задач
const Task = mongoose.model('Task', new mongoose.Schema({
  title: String,
  completed: Boolean
}));

// Раздача статических файлов (фронтенд)
app.use(express.static('frontend'));

// Маршруты страниц
const pages = ['/', '/register', '/login', '/dashboard', '/bmi', '/crud', '/nodemailer', '/qr-code', '/weather'];
pages.forEach(route => app.get(route, (req, res) => res.sendFile(process.cwd() + `/frontend${route === '/' ? '/index' : route}.html`)));

// Регистрация
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.json({ message: 'User registered successfully' });
});

// Авторизация
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id;
    res.json({ message: 'Logged in successfully' });
  } else {
    res.status(400).json({ message: 'Invalid credentials' });
  }
});

// Выход
app.get('/logout', (req, res) => {
  req.session.destroy(err => err ? res.status(500).json({ message: 'Error logging out' }) : res.json({ message: 'Logged out successfully' }));
});

// Генерация QR-кода
app.post('/generate-qr', async (req, res) => {
  try {
    const url = await QRCode.toDataURL(req.body.text);
    res.json({ qrCodeUrl: url });
  } catch (err) {
    res.status(500).json({ message: 'Error generating QR code' });
  }
});

// Отправка email
app.post('/send-email', async (req, res) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.mail.me.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });

  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to: req.body.to, subject: req.body.subject, text: req.body.text });
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending email' });
  }
});

// Получение погоды
async function getWeatherData(city) {
  const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`);
  const data = await response.json();

  // Проверяем, что API вернул корректные данные
  if (!data || data.cod !== 200) {
      console.error("Ошибка OpenWeather API:", data.message || "Неизвестная ошибка");
      throw new Error("Ошибка получения данных о погоде");
  }

  return {
      city: data.name || "Unknown",
      country: data.sys?.country || "Unknown",
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      description: data.weather[0]?.description || "No description",
      icon: data.weather[0]?.icon || "",
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      rain: data.rain ? data.rain['3h'] : 0,
      coord: data.coord
  };
}


// Прогноз погоды
async function getForecastData(city) {
  const locationResponse = await fetch(`http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${process.env.ACCUWEATHER_API_KEY}&q=${city}`);
  const locationData = await locationResponse.json();
  if (!locationData.length) throw new Error("Город не найден");

  const locationKey = locationData[0].Key;
  const forecastResponse = await fetch(`http://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=${process.env.ACCUWEATHER_API_KEY}&metric=true`);
  const forecastData = await forecastResponse.json();

  return forecastData.DailyForecasts.map(day => ({
    date: day.Date,
    minTemp: day.Temperature.Minimum.Value,
    maxTemp: day.Temperature.Maximum.Value,
    dayPhrase: day.Day.IconPhrase,
    nightPhrase: day.Night.IconPhrase
  }));
}

// Временная зона
async function getTimezoneData(lat, lon) {
  const response = await fetch(`http://api.timezonedb.com/v2.1/get-time-zone?key=${process.env.TIMEZONE_API_KEY}&format=json&by=position&lat=${lat}&lng=${lon}`);
  const data = await response.json();
  return { zoneName: data.zoneName, localTime: data.formatted };
}

// API погоды + часовой пояс
app.post('/get-weather', async (req, res) => {
  try {
    const { city } = req.body;
    console.log("Запрошен город:", city); // Для проверки, что сервер получает данные

    const weatherData = await getWeatherData(city);
    const forecastData = await getForecastData(city);
    const timezoneData = await getTimezoneData(weatherData.coord.lat, weatherData.coord.lon);

    res.json({ weather: weatherData, forecast: forecastData, timezone: timezoneData, mapCoord: weatherData.coord });
  } catch (error) {
    console.error("Ошибка получения данных:", error.message);
    res.status(500).json({ error: error.message || "Ошибка при получении данных" });
  }
});


// CRUD задачи
app.get('/tasks', async (req, res) => res.json(await Task.find()));
app.post('/add-task', async (req, res) => res.json(await new Task({ title: req.body.title, completed: false }).save()));
app.post('/update-task/:id', async (req, res) => {
  const task = await Task.findById(req.params.id);
  task.completed = !task.completed;
  res.json(await task.save());
});
app.delete('/delete-task/:id', async (req, res) => res.json(await Task.findByIdAndDelete(req.params.id) ? { message: 'Task deleted' } : { message: 'Task not found' }));

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
