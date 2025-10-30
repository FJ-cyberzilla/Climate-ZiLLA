/**
 * 🌤️ Enterprise Weather API Integration
 * Production-ready multi-provider weather data integration
 * Real weather APIs - no simulations or placeholders
 */

import { DataQualityEngine } from './data-quality-engine.js';
import { EnterpriseCache } from '../utils/enterprise-cache.js';

export default class WeatherAPIIntegration {
    constructor() {
        this.weatherProviders = this.initializeWeatherProviders();
        this.qualityEngine = new DataQualityEngine();
        this.cache = new EnterpriseCache('weather-data', 2000, 10 * 60 * 1000); // 10 min cache
        this.rateLimiters = new Map();
        this.forecastModels = new Map();
        
        this.initializeWeatherClients();
        this.startRealTimeWeatherMonitoring();
        
        console.log('🌤️ Enterprise Weather API Integration - PRODUCTION ACTIVE');
    }

    initializeWeatherProviders() {
        return {
            // OpenWeatherMap - Comprehensive global coverage
            OPENWEATHER: {
                name: 'OpenWeatherMap',
                baseURL: 'https://api.openweathermap.org/data/2.5',
                endpoints: {
                    current: '/weather',
                    forecast: '/forecast',
                    onecall: '/onecall',
                    history: '/onecall/timemachine'
                },
                apiKey: process.env.OPENWEATHER_API_KEY,
                rateLimit: 1000,
                priority: 'HIGH',
                coverage: 'GLOBAL',
                features: ['current', 'forecast', 'historical', 'alerts']
            },

            // WeatherAPI - Reliable commercial service
            WEATHERAPI: {
                name: 'WeatherAPI.com',
                baseURL: 'http://api.weatherapi.com/v1',
                endpoints: {
                    current: '/current.json',
                    forecast: '/forecast.json',
                    history: '/history.json',
                    astronomy: '/astronomy.json',
                    timezone: '/timezone.json'
                },
                apiKey: process.env.WEATHERAPI_KEY,
                rateLimit: 1000000, // High limit for commercial
                priority: 'HIGH',
                coverage: 'GLOBAL',
                features: ['current', 'forecast', 'astronomy', 'alerts']
            },

            // AccuWeather - Enterprise-grade weather data
            ACCUWEATHER: {
                name: 'AccuWeather',
                baseURL: 'http://dataservice.accuweather.com',
                endpoints: {
                    locations: '/locations/v1',
                    current: '/currentconditions/v1',
                    forecast: '/forecasts/v1/daily/5day',
                    hourly: '/forecasts/v1/hourly/12hour'
                },
                apiKey: process.env.ACCUWEATHER_API_KEY,
                rateLimit: 50, // Strict limit
                priority: 'HIGH',
                coverage: 'GLOBAL',
                features: ['current', 'forecast', 'locations', 'indices']
            },

            // Weather.gov - US Government data (free)
            WEATHER_GOV: {
                name: 'National Weather Service',
                baseURL: 'https://api.weather.gov',
                endpoints: {
                    points: '/points/{lat},{lon}',
                    forecast: '/gridpoints/{office}/{gridX},{gridY}/forecast',
                    hourly: '/gridpoints/{office}/{gridX},{gridY}/forecast/hourly',
                    alerts: '/alerts/active'
                },
                rateLimit: 1000,
                priority: 'HIGH',
                coverage: 'UNITED_STATES',
                features: ['forecast', 'alerts', 'radar', 'stations']
            },

            // Tomorrow.io - Advanced weather intelligence
            TOMORROW: {
                name: 'Tomorrow.io',
                baseURL: 'https://api.tomorrow.io/v4',
                endpoints: {
                    timeline: '/timeline',
                    weather: '/weather/realtime',
                    forecast: '/weather/forecast'
                },
                apiKey: process.env.TOMORROW_API_KEY,
                rateLimit: 1000,
                priority: 'MEDIUM',
                coverage: 'GLOBAL',
                features: ['ai_forecasts', 'pollen', 'air_quality', 'fire_index']
            },

            // Climacell (Now Tomorrow.io) - Historical provider
            CLIMACELL: {
                name: 'Climacell',
                baseURL: 'https://data.climacell.co/v4',
                endpoints: {
                    realtime: '/weather/realtime',
                    forecast: '/weather/forecast',
                    historical: '/weather/historical'
                },
                apiKey: process.env.CLIMACELL_API_KEY,
                rateLimit: 1000,
                priority: 'MEDIUM',
                coverage: 'GLOBAL',
                features: ['hyperlocal', 'precipitation', 'road_risk']
            }
        };
    }

    initializeWeatherClients() {
        this.clients = new Map();
        
        Object.entries(this.weatherProviders).forEach(([provider, config]) => {
            this.clients.set(provider, this.createWeatherClient(provider, config));
            this.rateLimiters.set(provider, this.createRateLimiter(config.rateLimit));
        });

        console.log('🌤️ Weather clients initialized for all providers');
    }

    createWeatherClient(provider, config) {
        const headers = {
            'User-Agent': 'Enterprise-Weather-System/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        // Add provider-specific headers
        switch(provider) {
            case 'WEATHERAPI':
                headers['Key'] = config.apiKey;
                break;
            case 'TOMORROW':
            case 'CLIMACELL':
                headers['apikey'] = config.apiKey;
                break;
            case 'ACCUWEATHER':
                // AccuWeather uses query parameter
                break;
        }

        return {
            baseURL: config.baseURL,
            headers,
            timeout: 15000,
            retryAttempts: 3
        };
    }

    createRateLimiter(requestsPerHour) {
        const requestsPerSecond = requestsPerHour / 3600;
        let lastRequest = 0;
        
        return {
            canMakeRequest: () => {
                const now = Date.now();
                const timeSinceLast = now - lastRequest;
                const minInterval = 1000 / requestsPerSecond;
                
                if (timeSinceLast >= minInterval) {
                    lastRequest = now;
                    return true;
                }
                return false;
            },
            getWaitTime: () => {
                const now = Date.now();
                return Math.max(0, (1000 / requestsPerSecond) - (now - lastRequest));
            }
        };
    }

    // Main weather data acquisition method
    async getWeatherData(location, options = {}) {
        const { lat, lon, type = 'current' } = location;
        const cacheKey = `weather_${type}_${lat}_${lon}_${Date.now()}`;
        
        // Check cache first
        const cached = await this.cache.get(cacheKey);
        if (cached && !options.forceRefresh) {
            console.log('🌤️ Using cached weather data');
            return cached;
        }

        try {
            await this.checkRateLimits();
            
            const weatherData = await this.fetchMultiProviderWeather(location, type, options);
            
            // Process and fuse data
            const processedWeather = await this.processWeatherData(weatherData, location, type);
            
            // Validate data quality
            const qualityReport = await this.qualityEngine.validateWeatherData(processedWeather);
            
            if (qualityReport.score >= 0.8) {
                // Cache successful data
                await this.cache.set(cacheKey, processedWeather);
                return processedWeather;
            } else {
                throw new Error(`Weather data quality insufficient: ${qualityReport.issues.join(', ')}`);
            }
            
        } catch (error) {
            console.error('Weather data acquisition failed:', error);
            throw this.enhanceWeatherError(error, 'getWeatherData');
        }
    }

    async fetchMultiProviderWeather(location, type, options) {
        const providerPromises = [];
        
        // Select providers based on location and type
        const selectedProviders = this.selectProvidersForLocation(location, type);
        
        selectedProviders.forEach(provider => {
            providerPromises.push(
                this.fetchFromProvider(provider, location, type, options)
                    .catch(error => {
                        console.warn(`Provider ${provider} fetch failed:`, error);
                        return this.createProviderErrorResult(provider, error);
                    })
            );
        });

        const results = await Promise.allSettled(providerPromises);
        
        const providerData = {};
        results.forEach((result, index) => {
            const provider = selectedProviders[index];
            if (result.status === 'fulfilled') {
                providerData[provider] = result.value;
            } else {
                providerData[provider] = this.createProviderErrorResult(provider, result.reason);
            }
        });

        return providerData;
    }

    selectProvidersForLocation(location, type) {
        const { lat, lon } = location;
        const providers = [];
        
        // Always include OpenWeatherMap and WeatherAPI for global coverage
        providers.push('OPENWEATHER', 'WEATHERAPI');
        
        // Add location-specific providers
        if (this.isInUnitedStates(lat, lon)) {
            providers.push('WEATHER_GOV'); // Best for US coverage
        }
        
        // Add premium providers if available
        if (this.weatherProviders.ACCUWEATHER.apiKey) {
            providers.push('ACCUWEATHER');
        }
        
        if (this.weatherProviders.TOMORROW.apiKey) {
            providers.push('TOMORROW');
        }
        
        return providers.slice(0, 4); // Limit to 4 providers
    }

    isInUnitedStates(lat, lon) {
        // Simple geographic check for US territory
        return lat >= 24.0 && lat <= 50.0 && lon >= -125.0 && lon <= -65.0;
    }

    async fetchFromProvider(provider, location, type, options) {
        await this.checkRateLimit(provider);
        
        const client = this.clients.get(provider);
        const providerConfig = this.weatherProviders[provider];
        const startTime = Date.now();
        
        try {
            let data;
            
            switch (type) {
                case 'current':
                    data = await this.fetchCurrentWeather(provider, location, options);
                    break;
                case 'forecast':
                    data = await this.fetchWeatherForecast(provider, location, options);
                    break;
                case 'historical':
                    data = await this.fetchHistoricalWeather(provider, location, options);
                    break;
                default:
                    throw new Error(`Unknown weather type: ${type}`);
            }
            
            return {
                provider,
                type,
                data,
                metadata: {
                    fetchTime: Date.now() - startTime,
                    success: true,
                    timestamp: new Date()
                }
            };
            
        } catch (error) {
            return {
                provider,
                type,
                data: null,
                error: error.message,
                metadata: {
                    fetchTime: Date.now() - startTime,
                    success: false,
                    timestamp: new Date()
                }
            };
        }
    }

    async fetchCurrentWeather(provider, location, options) {
        const { lat, lon } = location;
        const client = this.clients.get(provider);
        
        switch (provider) {
            case 'OPENWEATHER':
                const owmParams = new URLSearchParams({
                    lat: lat.toString(),
                    lon: lon.toString(),
                    appid: this.weatherProviders.OPENWEATHER.apiKey,
                    units: 'metric',
                    lang: 'en'
                });
                
                const owmResponse = await fetch(
                    `${client.baseURL}${this.weatherProviders.OPENWEATHER.endpoints.current}?${owmParams}`,
                    { method: 'GET', headers: client.headers, signal: AbortSignal.timeout(client.timeout) }
                );
                
                if (!owmResponse.ok) throw new Error(`OpenWeather error: ${owmResponse.status}`);
                return await owmResponse.json();
                
            case 'WEATHERAPI':
                const waParams = new URLSearchParams({
                    key: this.weatherProviders.WEATHERAPI.apiKey,
                    q: `${lat},${lon}`,
                    aqi: 'yes'
                });
                
                const waResponse = await fetch(
                    `${client.baseURL}${this.weatherProviders.WEATHERAPI.endpoints.current}?${waParams}`,
                    { method: 'GET', headers: client.headers, signal: AbortSignal.timeout(client.timeout) }
                );
                
                if (!waResponse.ok) throw new Error(`WeatherAPI error: ${waResponse.status}`);
                return await waResponse.json();
                
            case 'WEATHER_GOV':
                // First get grid point
                const pointsResponse = await fetch(
                    `${client.baseURL}${this.weatherProviders.WEATHER_GOV.endpoints.points.replace('{lat},{lon}', `${lat},${lon}`)}`,
                    { method: 'GET', headers: client.headers, signal: AbortSignal.timeout(client.timeout) }
                );
                
                if (!pointsResponse.ok) throw new Error(`Weather.gov points error: ${pointsResponse.status}`);
                const pointsData = await pointsResponse.json();
                
                // Then get forecast
                const forecastResponse = await fetch(
                    pointsData.properties.forecast,
                    { method: 'GET', headers: client.headers, signal: AbortSignal.timeout(client.timeout) }
                );
                
                if (!forecastResponse.ok) throw new Error(`Weather.gov forecast error: ${forecastResponse.status}`);
                return await forecastResponse.json();
                
            default:
                throw new Error(`Current weather not supported for provider: ${provider}`);
        }
    }

    async fetchWeatherForecast(provider, location, options) {
        const { lat, lon, days = 5 } = location;
        const client = this.clients.get(provider);
        
        switch (provider) {
            case 'OPENWEATHER':
                const owmParams = new URLSearchParams({
                    lat: lat.toString(),
                    lon: lon.toString(),
                    appid: this.weatherProviders.OPENWEATHER.apiKey,
                    units: 'metric',
                    cnt: Math.min(days * 8, 40).toString() // 3-hour intervals
                });
                
                const owmResponse = await fetch(
                    `${client.baseURL}${this.weatherProviders.OPENWEATHER.endpoints.forecast}?${owmParams}`,
                    { method: 'GET', headers: client.headers, signal: AbortSignal.timeout(client.timeout) }
                );
                
                if (!owmResponse.ok) throw new Error(`OpenWeather forecast error: ${owmResponse.status}`);
                return await owmResponse.json();
                
            case 'WEATHERAPI':
                const waParams = new URLSearchParams({
                    key: this.weatherProviders.WEATHERAPI.apiKey,
                    q: `${lat},${lon}`,
                    days: days.toString(),
                    aqi: 'yes',
                    alerts: 'yes'
                });
                
                const waResponse = await fetch(
                    `${client.baseURL}${this.weatherProviders.WEATHERAPI.endpoints.forecast}?${waParams}`,
                    { method: 'GET', headers: client.headers, signal: AbortSignal.timeout(client.timeout) }
                );
                
                if (!waResponse.ok) throw new Error(`WeatherAPI forecast error: ${waResponse.status}`);
                return await waResponse.json();
                
            default:
                throw new Error(`Forecast not supported for provider: ${provider}`);
        }
    }

    // Data processing methods
    async processWeatherData(providerData, location, type) {
        const processed = {
            location,
            type,
            timestamp: new Date(),
            providers: Object.keys(providerData).filter(provider => providerData[provider].metadata.success),
            data: {},
            analysis: {},
            alerts: []
        };

        // Process data from successful providers
        Object.entries(providerData).forEach(([provider, result]) => {
            if (result.metadata.success && result.data) {
                processed.data[provider] = this.normalizeProviderData(result.data, provider, type);
            }
        });

        // Perform data fusion
        processed.fusedData = await this.fuseWeatherData(processed.data, type);
        
        // Generate weather analysis
        processed.analysis = await this.analyzeWeatherData(processed.fusedData, location, type);
        
        // Extract alerts
        processed.alerts = await this.extractWeatherAlerts(processed.data);
        
        // Calculate quality metrics
        processed.quality = this.calculateWeatherQuality(processed);
        
        return processed;
    }

    normalizeProviderData(data, provider, type) {
        switch (provider) {
            case 'OPENWEATHER':
                return this.normalizeOpenWeatherData(data, type);
            case 'WEATHERAPI':
                return this.normalizeWeatherAPIData(data, type);
            case 'WEATHER_GOV':
                return this.normalizeWeatherGovData(data, type);
            default:
                return data;
        }
    }

    normalizeOpenWeatherData(data, type) {
        if (type === 'current') {
            return {
                temperature: data.main.temp,
                feelsLike: data.main.feels_like,
                humidity: data.main.humidity,
                pressure: data.main.pressure,
                visibility: data.visibility,
                wind: {
                    speed: data.wind.speed,
                    direction: data.wind.deg,
                    gust: data.wind.gust
                },
                clouds: data.clouds.all,
                weather: data.weather[0],
                rain: data.rain,
                snow: data.snow,
                timestamp: new Date(data.dt * 1000)
            };
        } else if (type === 'forecast') {
            return {
                city: data.city,
                list: data.list.map(item => ({
                    timestamp: new Date(item.dt * 1000),
                    temperature: item.main.temp,
                    feelsLike: item.main.feels_like,
                    humidity: item.main.humidity,
                    pressure: item.main.pressure,
                    weather: item.weather[0],
                    clouds: item.clouds.all,
                    wind: item.wind,
                    precipitation: item.pop, // Probability 
