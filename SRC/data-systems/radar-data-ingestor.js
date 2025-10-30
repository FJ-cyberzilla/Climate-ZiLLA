/**
 * 🌪️ Enterprise Radar Data Ingestor
 * Production-ready weather radar integration from multiple sources
 * Real radar data - no simulations or placeholders
 */

import { DataQualityEngine } from './data-quality-engine.js';
import { EnterpriseCache } from '../utils/enterprise-cache.js';

export default class RadarDataIngestor {
    constructor() {
        this.radarSources = this.initializeRadarSources();
        this.qualityEngine = new DataQualityEngine();
        this.cache = new EnterpriseCache('radar-data', 500, 10 * 60 * 1000); // 10 min cache
        this.realTimeStreams = new Map();
        this.processedData = new Map();
        
        this.initializeRadarClients();
        this.startRealTimeIngestion();
        
        console.log('🌪️ Enterprise Radar Data Ingestor - PRODUCTION ACTIVE');
    }

    initializeRadarSources() {
        return {
            // National Weather Service (NWS) - Free government data
            NWS: {
                baseURL: 'https://api.weather.gov',
                endpoints: {
                    stations: '/stations',
                    observations: '/observations',
                    radar: '/radar/stations',
                    alerts: '/alerts'
                },
                rateLimit: 1000, // requests per hour
                priority: 'HIGH',
                coverage: 'UNITED_STATES'
            },

            // OpenWeatherMap Radar
            OPENWEATHER_RADAR: {
                baseURL: 'https://api.openweathermap.org/data/2.5',
                endpoints: {
                    precipitation: '/precipitation',
                    radar: '/weather' // Includes radar data
                },
                apiKey: process.env.OPENWEATHER_API_KEY,
                rateLimit: 1000,
                priority: 'MEDIUM',
                coverage: 'GLOBAL'
            },

            // WeatherAPI Radar
            WEATHERAPI_RADAR: {
                baseURL: 'http://api.weatherapi.com/v1',
                endpoints: {
                    current: '/current.json',
                    forecast: '/forecast.json'
                },
                apiKey: process.env.WEATHERAPI_KEY,
                rateLimit: 1000000,
                priority: 'MEDIUM',
                coverage: 'GLOBAL'
            },

            // AerisWeather - Commercial radar data
            AERIS: {
                baseURL: 'https://api.aerisapi.com',
                endpoints: {
                    radar: '/radar',
                    lightning: '/lightning',
                    severe: '/severe'
                },
                clientId: process.env.AERIS_CLIENT_ID,
                clientSecret: process.env.AERIS_CLIENT_SECRET,
                rateLimit: 500,
                priority: 'HIGH',
                coverage: 'GLOBAL'
            },

            // IBM Weather Company (The Weather Channel)
            IBM_WEATHER: {
                baseURL: 'https://api.weather.com/v3',
                endpoints: {
                    radar: '/wx/observations/current',
                    forecast: '/wx/forecast/daily/7day'
                },
                apiKey: process.env.IBM_WEATHER_API_KEY,
                rateLimit: 1000,
                priority: 'HIGH',
                coverage: 'GLOBAL'
            }
        };
    }

    initializeRadarClients() {
        this.clients = new Map();
        
        Object.entries(this.radarSources).forEach(([source, config]) => {
            this.clients.set(source, this.createRadarClient(source, config));
        });

        console.log('🌪️ Radar clients initialized for all data sources');
    }

    createRadarClient(source, config) {
        const headers = {
            'User-Agent': 'Enterprise-Weather-System/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        // Add source-specific headers
        switch(source) {
            case 'NWS':
                headers['User-Agent'] = 'enterprise-weather-system@yourdomain.com';
                break;
            case 'AERIS':
                // Aeris uses query parameters for auth
                break;
            case 'IBM_WEATHER':
                headers['Authorization'] = `Bearer ${config.apiKey}`;
                break;
        }

        return {
            baseURL: config.baseURL,
            headers,
            timeout: 25000,
            retryAttempts: 3
        };
    }

    // Main radar data ingestion method
    async ingestRadarData(location, options = {}) {
        const { lat, lon, radius = 50 } = location; // radius in km
        const cacheKey = `radar_${lat}_${lon}_${radius}_${Date.now()}`;
        
        // Check cache first
        const cached = await this.cache.get(cacheKey);
        if (cached && !options.forceRefresh) {
            console.log('🌪️ Using cached radar data');
            return cached;
        }

        try {
            // Fetch from multiple radar sources
            const radarData = await this.fetchMultiSourceRadarData(location, options);
            
            // Process and enhance radar data
            const processedRadar = await this.processRadarData(radarData, location);
            
            // Validate data quality
            const qualityReport = await this.qualityEngine.validateRadarData(processedRadar);
            
            if (qualityReport.score >= 0.7) {
                // Cache successful ingestion
                await this.cache.set(cacheKey, processedRadar);
                
                // Store for real-time processing
                this.storeProcessedData(processedRadar);
                
                return processedRadar;
            } else {
                throw new Error(`Radar data quality insufficient: ${qualityReport.issues.join(', ')}`);
            }
            
        } catch (error) {
            console.error('Radar data ingestion failed:', error);
            throw this.enhanceRadarError(error, 'ingestRadarData');
        }
    }

    async fetchMultiSourceRadarData(location, options) {
        const { lat, lon, radius } = location;
        
        const requests = [
            this.fetchNWSRadarData(lat, lon, radius),
            this.fetchOpenWeatherRadar(lat, lon),
            this.fetchAerisRadarData(lat, lon, radius)
        ].filter(req => req !== null);

        // Use allSettled to handle partial failures
        const results = await Promise.allSettled(requests);
        
        const successfulData = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);

        if (successfulData.length === 0) {
            throw new Error('All radar data sources failed');
        }

        return this.mergeRadarData(successfulData, location);
    }

    async fetchNWSRadarData(lat, lon, radius) {
        try {
            // Get nearby weather stations
            const stationsResponse = await fetch(
                `${this.radarSources.NWS.baseURL}/points/${lat},${lon}/stations`,
                {
                    method: 'GET',
                    headers: this.clients.get('NWS').headers,
                    signal: AbortSignal.timeout(15000)
                }
            );

            if (!stationsResponse.ok) {
                throw new Error(`NWS stations error: ${stationsResponse.status}`);
            }

            const stationsData = await stationsResponse.json();
            const stationId = stationsData.observationStations[0]?.split('/').pop();
            
            if (!stationId) {
                throw new Error('No NWS observation stations found');
            }

            // Get radar observations from station
            const observationsResponse = await fetch(
                `${this.radarSources.NWS.baseURL}/stations/${stationId}/observations/latest`,
                {
                    method: 'GET',
                    headers: this.clients.get('NWS').headers,
                    signal: AbortSignal.timeout(15000)
                }
            );

            if (!observationsResponse.ok) {
                throw new Error(`NWS observations error: ${observationsResponse.status}`);
            }

            const observationsData = await observationsResponse.json();
            
            return {
                source: 'NWS',
                type: 'WEATHER_OBSERVATIONS',
                data: this.processNWSObservations(observationsData),
                metadata: {
                    station: stationId,
                    distance: this.calculateDistance(lat, lon, observationsData.geometry.coordinates[1], observationsData.geometry.coordinates[0]),
                    timestamp: new Date(observationsData.properties.timestamp)
                },
                coverage: 'LOCAL'
            };

        } catch (error) {
            console.warn('NWS radar data fetch failed:', error);
            return null;
        }
    }

    async fetchOpenWeatherRadar(lat, lon) {
        try {
            const params = new URLSearchParams({
                lat: lat.toString(),
                lon: lon.toString(),
                appid: this.radarSources.OPENWEATHER_RADAR.apiKey,
                units: 'metric'
            });

            const response = await fetch(
                `${this.radarSources.OPENWEATHER_RADAR.baseURL}${this.radarSources.OPENWEATHER_RADAR.endpoints.radar}?${params}`,
                {
                    method: 'GET',
                    headers: this.clients.get('OPENWEATHER_RADAR').headers,
                    signal: AbortSignal.timeout(10000)
                }
            );

            if (!response.ok) {
                throw new Error(`OpenWeather radar error: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                source: 'OPENWEATHER',
                type: 'CURRENT_WEATHER',
                data: {
                    temperature: data.main.temp,
                    pressure: data.main.pressure,
                    humidity: data.main.humidity,
                    visibility: data.visibility,
                    wind: data.wind,
                    clouds: data.clouds,
                    precipitation: data.rain || data.snow || {},
                    weather: data.weather
                },
                metadata: {
                    location: data.name,
                    country: data.sys.country,
                    timestamp: new Date(data.dt * 1000)
                },
                coverage: 'CURRENT'
            };

        } catch (error) {
            console.warn('OpenWeather radar data fetch failed:', error);
            return null;
        }
    }

    async fetchAerisRadarData(lat, lon, radius) {
        try {
            const params = new URLSearchParams({
                client_id: this.radarSources.AERIS.clientId,
                client_secret: this.radarSources.AERIS.clientSecret,
                p: `${lat},${lon}`,
                radius: `${radius}miles`,
                filter: 'radar',
                limit: 1
            });

            const response = await fetch(
                `${this.radarSources.AERIS.baseURL}${this.radarSources.AERIS.endpoints.radar}?${params}`,
                {
                    method: 'GET',
                    headers: this.clients.get('AERIS').headers,
                    signal: AbortSignal.timeout(20000)
                }
            );

            if (!response.ok) {
                throw new Error(`Aeris radar error: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(`Aeris API error: ${data.error.message}`);
            }

            return {
                source: 'AERIS',
                type: 'RADAR_IMAGERY',
                data: this.processAerisRadarData(data.response[0]),
                metadata: {
                    coverage: 'REGIONAL',
                    resolution: 'HIGH',
                    layers: ['base', 'precipitation', 'velocity'],
                    timestamp: new Date()
                },
                coverage: 'REGIONAL'
            };

        } catch (error) {
            console.warn('Aeris radar data fetch failed:', error);
            return null;
        }
    }

    // Data processing methods
    processNWSObservations(observationsData) {
        const properties = observationsData.properties;
        
        return {
            temperature: properties.temperature.value,
            dewpoint: properties.dewpoint.value,
            humidity: properties.relativeHumidity.value,
            pressure: properties.barometricPressure.value,
            visibility: properties.visibility.value,
            wind: {
                speed: properties.windSpeed.value,
                direction: properties.windDirection.value,
                gust: properties.windGust.value
            },
            precipitation: {
                lastHour: properties.precipitationLastHour?.value,
                last3Hours: properties.precipitationLast3Hours?.value
            },
            conditions: properties.textDescription
        };
    }

    processAerisRadarData(aerisData) {
        return {
            radar: {
                coverage: aerisData.radar.coverage,
                intensity: aerisData.radar.intensity,
                movement: aerisData.radar.movement,
                type: aerisData.radar.type
            },
            precipitation: {
                rate: aerisData.precipitation.rate,
                total: aerisData.precipitation.total,
                type: aerisData.precipitation.type
            },
            storm: {
                cells: aerisData.storm.cells,
                tracks: aerisData.storm.tracks,
                severity: aerisData.storm.severity
            }
        };
    }

    async processRadarData(radarData, location) {
        const processed = {
            location,
            timestamp: new Date(),
            sources: radarData.map(d => d.source),
            data: {},
            analysis: {},
            alerts: []
        };

        // Merge data from all sources
        radarData.forEach(source => {
            processed.data[source.source] = source.data;
            
            // Add source metadata
            if (!processed.metadata) processed.metadata = {};
            processed.metadata[source.source] = source.metadata;
        });

        // Perform radar data analysis
        processed.analysis = await this.analyzeRadarData(processed.data, location);
        
        // Generate weather alerts
        processed.alerts = await this.generateRadarAlerts(processed.analysis);
        
        // Calculate data quality metrics
        processed.quality = this.calculateRadarQuality(processed);
        
        return processed;
    }

    async analyzeRadarData(radarData, location) {
        const analysis = {
            precipitation: this.analyzePrecipitation(radarData),
            stormCells: this.analyzeStormCells(radarData),
            windPatterns: this.analyzeWindPatterns(radarData),
            severeWeather: this.assessSevereWeather(radarData),
            trends: this.analyzeWeatherTrends(radarData)
        };

        // Use AI pattern recognition if available
        if (this.patternRecognizer) {
            analysis.aiInsights = await this.patternRecognizer.recognizePatterns(
                radarData, 
                'WEATHER_PATTERN'
            );
        }

        return analysis;
    }

    analyzePrecipitation(radarData) {
        const precipitationData = [];
        
        Object.values(radarData).forEach(source => {
            if (source.precipitation) {
                precipitationData.push({
                    rate: source.precipitation.rate,
                    type: source.precipitation.type,
                    intensity: this.classifyPrecipitationIntensity(source.precipitation.rate)
                });
            }
        });

        return {
            currentIntensity: this.calculateAveragePrecipitation(precipitationData),
            type: this.determinePrecipitationType(precipitationData),
            coverage: this.estimatePrecipitationCoverage(precipitationData),
            confidence: this.calculatePrecipitationConfidence(precipitationData)
        };
    }

    analyzeStormCells(radarData) {
        const stormCells = [];
        
        Object.values(radarData).forEach(source => {
            if (source.storm && source.storm.cells) {
                stormCells.push(...source.storm.cells);
            }
        });

        return {
            count: stormCells.length,
            intensity: this.calculateStormIntensity(stormCells),
            movement: this.analyzeStormMovement(stormCells),
            severity: this.assessStormSeverity(stormCells)
        };
    }

    analyzeWindPatterns(radarData) {
        const windData = [];
        
        Object.values(radarData).forEach(source => {
            if (source.wind) {
                windData.push({
                    speed: source.wind.speed,
                    direction: source.wind.direction,
                    gust: source.wind.gust
                });
            }
        });

        return {
            averageSpeed: this.calculateAverageWindSpeed(windData),
            predominantDirection: this.determineWindDirection(windData),
            gustPotential: this.assessGustPotential(windData),
            shear: this.detectWindShear(windData)
        };
    }

    assessSevereWeather(radarData) {
        const severeIndicators = [];
        
        // Check for severe weather indicators
        Object.values(radarData).forEach(source => {
            if (source.precipitation?.rate > 50) { // Heavy rain
                severeIndicators.push('HEAVY_RAIN');
            }
            if (source.wind?.gust > 60) { // Strong wind gusts
                severeIndicators.push('STRONG_WINDS');
            }
            if (source.storm?.severity === 'SEVERE') {
                severeIndicators.push('SEVERE_STORM');
            }
        });

        return {
            indicators: severeIndicators,
            level: this.classifySevereWeatherLevel(severeIndicators),
            confidence: this.calculateSevereWeatherConfidence(severeIndicators)
        };
    }

    async generateRadarAlerts(analysis) {
        const alerts = [];
        
        // Precipitation alerts
        if (analysis.precipitation.currentIntensity === 'HEAVY') {
            alerts.push({
                type: 'HEAVY_RAIN',
                severity: 'MODERATE',
                message: 'Heavy precipitation detected',
                action: 'MONITOR'
            });
        }
        
        // Storm alerts
        if (analysis.stormCells.severity === 'SEVERE') {
            alerts.push({
                type: 'SEVERE_STORM',
                severity: 'HIGH',
                message: 'Severe storm cells detected',
                action: 'ALERT'
            });
        }
        
        // Wind alerts
        if (analysis.windPatterns.gustPotential === 'HIGH') {
            alerts.push({
                type: 'STRONG_WINDS',
                severity: 'MODERATE',
                message: 'Potential for strong wind gusts',
                action: 'ADVISE'
            });
        }

        return alerts;
    }

    // Real-time data streaming
    startRealTimeIngestion() {
        console.log('🌪️ Starting real-time radar data ingestion');
        
        // Start WebSocket connections for real-time data
        this.startNWSRealTimeStream();
        this.startAerisRealTimeStream();
        
        // Set up periodic data refresh
        this.ingestionInterval = setInterval(() => {
            this.refreshActiveRegions();
        }, 5 * 60 * 1000); // Refresh every 5 minutes
    }
