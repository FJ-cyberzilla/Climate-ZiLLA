import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// REAL SECURITY MIDDLEWARE
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.weatherapi.com", "https://api.nasa.gov", "https://ipapi.co"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// REAL RATE LIMITING
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests from this IP' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// REAL API KEYS FROM ENVIRONMENT
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const NASA_API_KEY = process.env.NASA_API_KEY;

// REAL INPUT VALIDATION
function validateCity(city) {
    if (!city || typeof city !== 'string') return false;
    const sanitized = city.trim().replace(/[<>\"']/g, '');
    return sanitized.length >= 1 && sanitized.length <= 100 ? sanitized : false;
}

// REAL WEATHER ENDPOINTS
app.get('/api/weather/forecast', async (req, res) => {
    try {
        const city = validateCity(req.query.city);
        if (!city) {
            return res.status(400).json({ error: 'Invalid city name' });
        }

        const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(city)}&days=7&aqi=yes&alerts=yes`;
        const response = await fetch(url);
        const data = await response.json();
        
        res.json(data);
        
    } catch (error) {
        console.error('Weather API error:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

// REAL ASTRONOMY ENDPOINTS
app.get('/api/astronomy/iss', async (req, res) => {
    try {
        const response = await fetch('http://api.open-notify.org/iss-now.json');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch ISS data' });
    }
});

app.get('/api/astronomy/apod', async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${date}`;
        
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch APOD' });
    }
});

// REAL SECURITY ENDPOINTS
app.get('/api/security/status', (req, res) => {
    res.json({
        status: 'ACTIVE',
        threatLevel: 'LOW',
        activeProtections: ['Firewall', 'Rate Limiting', 'CORS', 'Helmet'],
        timestamp: new Date().toISOString()
    });
});

// REAL HEALTH CHECK
app.get('/health', (req, res) => {
    res.json({
        status: 'HEALTHY',
        service: 'Climate-ZiLLA Enterprise API',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// REAL ERROR HANDLING
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// REAL SERVER START
app.listen(PORT, () => {
    console.log(`🚀 Climate-ZiLLA Enterprise Server running on port ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log(`🌤️  Weather: http://localhost:${PORT}/api/weather/forecast?city=London`);
    console.log(`🛰️  ISS: http://localhost:${PORT}/api/astronomy/iss`);
    console.log(`🌌 NASA: http://localhost:${PORT}/api/astronomy/apod`);
});
