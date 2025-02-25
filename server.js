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
import MongoStore from 'connect-mongo';
import path from 'path';

process.removeAllListeners('warning');

// Устанавливаем strictQuery перед подключением к MongoDB
mongoose.set('strictQuery', true);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Подключение к MongoDB с отключенными предупреждениями
mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  autoIndex: true // Для производительности можно установить false в продакшене
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ Could not connect to MongoDB:', err));

// Определение моделей MongoDB
const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  password: String
}), 'users');

const Task = mongoose.model('Task', new mongoose.Schema({
  title: String,
  completed: Boolean
}));

// Single session configuration with MongoStore
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    ttl: 60 * 60 // 1 hour
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, 
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

// Middleware для проверки аутентификации
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

// Промежуточное ПО для проверки защищенных статических файлов
const checkProtectedFile = (req, res, next) => {
  const protectedPages = ['/dashboard', '/bmi', '/crud', '/nodemailer', '/qr-code', '/weather'];
  const requestPath = req.path;
  
  // Проверяем, является ли запрашиваемый путь защищенным
  if (protectedPages.some(page => requestPath.startsWith(page))) {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
  }
  next();
};

// Применяем проверку перед раздачей статических файлов
app.use(checkProtectedFile);
app.use(express.static('frontend'));

// Маршруты для публичных страниц
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'frontend', 'index.html'));
});

app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.sendFile(path.join(process.cwd(), 'frontend', 'login.html'));
});

// Регистрация
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Авторизация
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user._id;
      res.json({ message: 'Logged in successfully' });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Выход
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Error logging out' });
    res.clearCookie('connect.sid', { path: '/' });
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.json({ message: 'Logged out successfully', logout: true });
  });
});

// Защищенные маршруты
const protectedPages = ['/dashboard', '/bmi', '/crud', '/nodemailer', '/qr-code', '/weather'];
protectedPages.forEach(route => {
  app.get(route, requireAuth, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend', `${route.substring(1)}.html`));
  });
});



// Генерация QR-кода
app.post('/generate-qr', requireAuth, async (req, res) => {
  try {
    const url = await QRCode.toDataURL(req.body.text);
    res.json({ qrCodeUrl: url });
  } catch (err) {
    res.status(500).json({ message: 'Error generating QR code' });
  }
});

// Отправка email
app.post('/send-email', requireAuth, async (req, res) => {
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

async function getWeatherData(city) {
  const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`);
  const data = response.data;

  if (!data || data.cod !== 200) {
    throw new Error("Ошибка получения данных о погоде");
  }

  return {
    city: data.name,
    country: data.sys?.country || "Unknown",
    countryCode: data.sys?.country || "Unknown",
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

// Получение качества воздуха
async function getAirQuality(lat, lon) {
  const response = await axios.get(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.WEATHER_API_KEY}`);
  return response.data.list[0].main.aqi;
}

// Получение прогноза погоды
async function getForecastData(city) {
  const locationResponse = await axios.get(`http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${process.env.ACCUWEATHER_API_KEY}&q=${city}`);
  const locationData = locationResponse.data;
  if (!locationData.length) throw new Error("Город не найден");

  const locationKey = locationData[0].Key;
  const forecastResponse = await axios.get(`http://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=${process.env.ACCUWEATHER_API_KEY}&metric=true`);
  const forecastData = forecastResponse.data;

  return forecastData.DailyForecasts.map(day => ({
    date: day.Date,
    minTemp: day.Temperature.Minimum.Value,
    maxTemp: day.Temperature.Maximum.Value,
    dayPhrase: day.Day.IconPhrase,
    nightPhrase: day.Night.IconPhrase
  }));
}

// Получение информации о часовом поясе
async function getTimezoneData(lat, lon) {
  const response = await axios.get(`http://api.timezonedb.com/v2.1/get-time-zone?key=${process.env.TIMEZONE_API_KEY}&format=json&by=position&lat=${lat}&lng=${lon}`);
  return { zoneName: response.data.zoneName, localTime: response.data.formatted };
}

// Получение информации о погоде, часовом поясе, флаге и качестве воздуха
app.post('/get-weather', requireAuth, async (req, res) => {
  try {
    const { city } = req.body;
    console.log("Запрошен город:", city);

    const weatherData = await getWeatherData(city);
    const forecastData = await getForecastData(city);
    const timezoneData = await getTimezoneData(weatherData.coord.lat, weatherData.coord.lon);
    const airQuality = await getAirQuality(weatherData.coord.lat, weatherData.coord.lon);

    const flagUrl = `https://flagcdn.com/w320/${weatherData.countryCode.toLowerCase()}.png`;

    res.json({
      weather: weatherData,
      forecast: forecastData,
      timezone: timezoneData,
      airQuality,
      flag: flagUrl,
      mapCoord: weatherData.coord
    });
  } catch (error) {
    console.error("Ошибка получения данных:", error.message);
    res.status(500).json({ error: error.message || "Ошибка при получении данных" });
  }
});



// CRUD задачи
app.get('/tasks', requireAuth, async (req, res) => res.json(await Task.find()));
app.post('/add-task', requireAuth, async (req, res) => res.json(await new Task({ title: req.body.title, completed: false }).save()));
app.post('/update-task/:id', requireAuth, async (req, res) => {
  const task = await Task.findById(req.params.id);
  task.completed = !task.completed;
  res.json(await task.save());
});
app.delete('/delete-task/:id', requireAuth, async (req, res) => res.json(await Task.findByIdAndDelete(req.params.id) ? { message: 'Task deleted' } : { message: 'Task not found' }));

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
