/**
 * 🌊 Enterprise Ocean Buoy Reader
 * Production-ready ocean data integration from global buoy networks
 * Real buoy data - no simulations or placeholders
 */

import { DataQualityEngine } from './data-quality-engine.js';
import { EnterpriseCache } from '../utils/enterprise-cache.js';

export default class OceanBuoyReader {
    constructor() {
        this.buoyNetworks = this.initializeBuoyNetworks();
        this.qualityEngine = new DataQualityEngine();
        this.cache = new EnterpriseCache('ocean-buoy-data', 1000, 15 * 60 * 1000); // 15 min cache
        this.activeBuoys = new Map();
        this.buoyMetadata = new Map();
        
        this.initializeBuoyClients();
        this.startRealTimeBuoyMonitoring();
        
        console.log('🌊 Enterprise Ocean Buoy Reader - PRODUCTION ACTIVE');
    }

    initializeBuoyNetworks() {
        return {
            // NOAA National Data Buoy Center (NDBC) - Primary US buoy network
            NDBC: {
                baseURL: 'https://www.ndbc.noaa.gov',
                endpoints: {
                    stations: '/data/stations/station_table.txt',
                    recent: '/data/realtime2',
                    historical: '/data/historical',
                    spectral: '/data/realtime2'
                },
                rateLimit: 1000,
                priority: 'HIGH',
                coverage: 'GLOBAL',
                dataTypes: ['meteorological', 'oceanographic', 'spectral']
            },

            // Copernicus Marine Service - European global ocean data
            COPERNICUS: {
                baseURL: 'https://marine.copernicus.eu',
                endpoints: {
                    observations: '/api/observations',
                    forecasts: '/api/forecasts',
                    products: '/api/products'
                },
                username: process.env.COPERNICUS_USERNAME,
                password: process.env.COPERNICUS_PASSWORD,
                rateLimit: 500,
                priority: 'HIGH',
                coverage: 'GLOBAL',
                dataTypes: ['temperature', 'salinity', 'currents', 'waves']
            },

            // Australian Ocean Data Network
            AODN: {
                baseURL: 'https://portal.aodn.org.au',
                endpoints: {
                    observations: '/api/observations',
                    sensors: '/api/sensors',
                    deployments: '/api/deployments'
                },
                apiKey: process.env.AODN_API_KEY,
                rateLimit: 300,
                priority: 'MEDIUM',
                coverage: 'SOUTHERN_HEMISPHERE',
                dataTypes: ['temperature', 'salinity', 'biogeochemical']
            },

            // Integrated Ocean Observing System (IOOS)
            IOOS: {
                baseURL: 'https://ioos.noaa.gov',
                endpoints: {
                    sensors: '/api/sensors',
                    observations: '/api/observations',
                    platforms: '/api/platforms'
                },
                rateLimit: 400,
                priority: 'HIGH',
                coverage: 'UNITED_STATES',
                dataTypes: ['meteorological', 'oceanographic', 'water_quality']
            },

            // Argo Float Network - Global profiling floats
            ARGO: {
                baseURL: 'https://argo.ucsd.edu',
                endpoints: {
                    floats: '/api/floats',
                    profiles: '/api/profiles',
                    trajectories: '/api/trajectories'
                },
                rateLimit: 200,
                priority: 'HIGH',
                coverage: 'GLOBAL',
                dataTypes: ['temperature', 'salinity', 'pressure', 'trajectory']
            }
        };
    }

    initializeBuoyClients() {
        this.clients = new Map();
        
        Object.entries(this.buoyNetworks).forEach(([network, config]) => {
            this.clients.set(network, this.createBuoyClient(network, config));
        });

        console.log('🌊 Buoy clients initialized for all ocean networks');
    }

    createBuoyClient(network, config) {
        const headers = {
            'User-Agent': 'Enterprise-Ocean-Monitoring/1.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        // Add network-specific authentication
        switch(network) {
            case 'COPERNICUS':
                headers['Authorization'] = `Basic ${btoa(`${config.username}:${config.password}`)}`;
                break;
            case 'AODN':
                headers['X-API-Key'] = config.apiKey;
                break;
            case 'NDBC':
                // NDBC uses public data, no authentication required
                break;
        }

        return {
            baseURL: config.baseURL,
            headers,
            timeout: 30000,
            retryAttempts: 3
        };
    }

    // Main buoy data ingestion method
    async readBuoyData(location, options = {}) {
        const { lat, lon, radius = 100 } = location; // radius in km
        const cacheKey = `buoy_${lat}_${lon}_${radius}_${Date.now()}`;
        
        // Check cache first
        const cached = await this.cache.get(cacheKey);
        if (cached && !options.forceRefresh) {
            console.log('🌊 Using cached buoy data');
            return cached;
        }

        try {
            // Find buoys near location
            const nearbyBuoys = await this.findNearbyBuoys(location, radius);
            
            if (nearbyBuoys.length === 0) {
                throw new Error(`No buoys found within ${radius}km of location`);
            }

            // Fetch data from all nearby buoys
            const buoyData = await this.fetchBuoyData(nearbyBuoys, options);
            
            // Process and aggregate data
            const processedData = await this.processBuoyData(buoyData, location);
            
            // Validate data quality
            const qualityReport = await this.qualityEngine.validateBuoyData(processedData);
            
            if (qualityReport.score >= 0.7) {
                // Cache successful data
                await this.cache.set(cacheKey, processedData);
                
                // Update active buoys tracking
                this.updateActiveBuoys(nearbyBuoys, processedData);
                
                return processedData;
            } else {
                throw new Error(`Buoy data quality insufficient: ${qualityReport.issues.join(', ')}`);
            }
            
        } catch (error) {
            console.error('Buoy data reading failed:', error);
            throw this.enhanceBuoyError(error, 'readBuoyData');
        }
    }

    async findNearbyBuoys(location, radius) {
        const { lat, lon } = location;
        const nearbyBuoys = [];
        
        try {
            // Get buoy stations from NDBC (most comprehensive list)
            const stationsResponse = await fetch(
                this.buoyNetworks.NDBC.baseURL + this.buoyNetworks.NDBC.endpoints.stations,
                {
                    method: 'GET',
                    headers: this.clients.get('NDBC').headers,
                    signal: AbortSignal.timeout(15000)
                }
            );

            if (!stationsResponse.ok) {
                throw new Error(`NDBC stations error: ${stationsResponse.status}`);
            }

            const stationsText = await stationsResponse.text();
            const stations = this.parseNDBCStations(stationsText);
            
            // Filter stations by distance
            stations.forEach(station => {
                const distance = this.calculateDistance(lat, lon, station.lat, station.lon);
                if (distance <= radius) {
                    nearbyBuoys.push({
                        ...station,
                        distance,
                        network: 'NDBC'
                    });
                }
            });

            // Add buoys from other networks
            const additionalBuoys = await this.findAdditionalBuoys(location, radius);
            nearbyBuoys.push(...additionalBuoys);
            
            return nearbyBuoys.sort((a, b) => a.distance - b.distance);
            
        } catch (error) {
            console.error('Finding nearby buoys failed:', error);
            return [];
        }
    }

    parseNDBCStations(stationsText) {
        const stations = [];
        const lines = stationsText.split('\n');
        
        // Skip header lines and parse data
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = line.split('|').map(part => part.trim());
            if (parts.length >= 8) {
                const station = {
                    id: parts[0],
                    name: parts[1],
                    lat: this.parseCoordinate(parts[2]),
                    lon: this.parseCoordinate(parts[3]),
                    type: parts[4],
                    owner: parts[5],
                    metadata: {
                        established: parts[6],
                        payload: parts[7]
                    }
                };
                
                if (station.lat && station.lon) {
                    stations.push(station);
                }
            }
        }
        
        return stations;
    }

    parseCoordinate(coordStr) {
        // Parse coordinates like "40.712 N" or "74.006 W"
        const match = coordStr.match(/([\d.]+)\s*([NSEW])/i);
        if (match) {
            let value = parseFloat(match[1]);
            const direction = match[2].toUpperCase();
            
            if (direction === 'S' || direction === 'W') {
                value = -value;
            }
            
            return value;
        }
        return null;
    }

    async findAdditionalBuoys(location, radius) {
        const additionalBuoys = [];
        
        try {
            // Search Copernicus marine observations
            const copernicusBuoys = await this.searchCopernicusBuoys(location, radius);
            additionalBuoys.push(...copernicusBuoys);
            
            // Search Argo floats
            const argoFloats = await this.searchArgoFloats(location, radius);
            additionalBuoys.push(...argoFloats);
            
        } catch (error) {
            console.warn('Additional buoy search failed:', error);
        }
        
        return additionalBuoys;
    }

    async fetchBuoyData(buoys, options) {
        const buoyData = [];
        
        // Fetch data from each buoy
        for (const buoy of buoys.slice(0, 10)) { // Limit to 10 nearest buoys
            try {
                const data = await this.fetchSingleBuoyData(buoy, options);
                if (data) {
                    buoyData.push(data);
                }
            } catch (error) {
                console.warn(`Failed to fetch data from buoy ${buoy.id}:`, error);
            }
        }
        
        return buoyData;
    }

    async fetchSingleBuoyData(buoy, options) {
        switch (buoy.network) {
            case 'NDBC':
                return await this.fetchNDBCBuoyData(buoy);
            case 'COPERNICUS':
                return await this.fetchCopernicusBuoyData(buoy);
            case 'ARGO':
                return await this.fetchArgoBuoyData(buoy);
            default:
                return await this.fetchGenericBuoyData(buoy);
        }
    }

    async fetchNDBCBuoyData(buoy) {
        try {
            // Fetch recent data from NDBC
            const response = await fetch(
                `${this.buoyNetworks.NDBC.baseURL}${this.buoyNetworks.NDBC.endpoints.recent}/${buoy.id}.txt`,
                {
                    method: 'GET',
                    headers: this.clients.get('NDBC').headers,
                    signal: AbortSignal.timeout(10000)
                }
            );

            if (!response.ok) {
                throw new Error(`NDBC data error: ${response.status}`);
            }

            const dataText = await response.text();
            const parsedData = this.parseNDBCData(dataText, buoy);
            
            return {
                buoy: buoy,
                network: 'NDBC',
                data: parsedData,
                timestamp: new Date(),
                metadata: {
                    dataPoints: parsedData.length,
                    parameters: this.extractParameters(parsedData)
                }
            };

        } catch (error) {
            console.warn(`NDBC buoy ${buoy.id} data fetch failed:`, error);
            return null;
        }
    }

    parseNDBCData(dataText, buoy) {
        const lines = dataText.split('\n');
        const data = [];
        
        // Skip header lines and parse data
        for (let i = 2; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || line.startsWith('#')) continue;
            
            const parts = line.split(/\s+/);
            if (parts.length >= 10) {
                const observation = {
                    timestamp: this.parseNDBCTimestamp(parts[0], parts[1], parts[2], parts[3], parts[4]),
                    wind: {
                        direction: this.parseNDBCValue(parts[5]),
                        speed: this.parseNDBCValue(parts[6]),
                        gust: this.parseNDBCValue(parts[7])
                    },
                    waves: {
                        height: this.parseNDBCValue(parts[8]),
                        period: this.parseNDBCValue(parts[9]),
                        direction: parts[10] ? this.parseNDBCValue(parts[10]) : null
                    },
                    pressure: this.parseNDBCValue(parts[11]),
                    airTemperature: this.parseNDBCValue(parts[12]),
                    waterTemperature: this.parseNDBCValue(parts[13]),
                    dewpoint: this.parseNDBCValue(parts[14]),
                    visibility: this.parseNDBCValue(parts[15])
                };
                
                // Only include observations with valid data
                if (this.hasValidData(observation)) {
                    data.push(observation);
                }
            }
        }
        
        return data;
    }

    parseNDBCTimestamp(year, month, day, hour, minute) {
        return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute)
        );
    }

    parseNDBCValue(value) {
        if (value === 'MM' || value === '999' || value === '999.0') {
            return null; // Missing data indicator
        }
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    }

    hasValidData(observation) {
        // Check if observation has at least some valid data
        return Object.values(observation).some(value => {
            if (typeof value === 'object' && value !== null) {
                return Object.values(value).some(v => v !== null);
            }
            return value !== null;
        });
    }

    async fetchCopernicusBuoyData(buoy) {
        try {
            const params = new URLSearchParams({
                platform: buoy.id,
                start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
                end: new Date().toISOString(),
                variables: 'TEMP,PSAL,CURR,WAVE'
            });

            const response = await fetch(
                `${this.buoyNetworks.COPERNICUS.baseURL}${this.buoyNetworks.COPERNICUS.endpoints.observations}?${params}`,
                {
                    method: 'GET',
                    headers: this.clients.get('COPERNICUS').headers,
                    signal: AbortSignal.timeout(15000)
                }
            );

            if (!response.ok) {
                throw new Error(`Copernicus data error: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                buoy: buoy,
                network: 'COPERNICUS',
                data: this.processCopernicusData(data),
                timestamp: new Date(),
                metadata: {
                    dataPoints: data.observations?.length || 0,
                    parameters: data.variables || []
                }
            };

        } catch (error) {
            console.warn(`Copernicus buoy ${buoy.id} data fetch failed:`, error);
            return null;
        }
    }

    async fetchArgoBuoyData(buoy) {
        try {
            const response = await fetch(
                `${this.buoyNetworks.ARGO.baseURL}${this.buoyNetworks.ARGO.endpoints.profiles}?float=${buoy.id}&latest=true`,
                {
                    method: 'GET',
                    headers: this.clients.get('ARGO').headers,
                    signal: AbortSignal.timeout(20000)
                }
            );

            if (!response.ok) {
                throw new Error(`Argo data error: ${response.status}`);
            }

            const data = await response.json();
            
            return {
                buoy: buoy,
                network: 'ARGO',
                data: this.processArgoData(data),
                timestamp: new Date(),
                metadata: {
                    profileCount: data.profiles?.length || 0,
                    maxDepth: this.findMaxDepth(data),
                    parameters: ['temperature', 'salinity', 'pressure']
                }
            };

        } catch (error) {
            console.warn(`Argo float ${buoy.id} data fetch failed:`, error);
            return null;
        }
    }

    // Data processing methods
    async processBuoyData(buoyData, location) {
        const processed = {
            location,
            timestamp: new Date(),
            buoys: buoyData.length,
            networks: [...new Set(buoyData.map(d => d.network))],
            data: {},
            analysis: {},
            alerts: []
        };

        // Aggregate data from all buoys
        buoyData.forEach(buoy => {
            processed.data[buoy.buoy.id] = {
                ...buoy,
                location: {
                    lat: buoy.buoy.lat,
                    lon: buoy.buoy.lon,
                    distance: buoy.buoy.distance
                }
            };
        });

        // Perform oceanographic analysis
        processed.analysis = await this.analyzeOceanData(processed.data, location);
        
        // Generate ocean alerts
        processed.alerts = await this.generateOceanAlerts(processed.analysis);
        
        // Calculate data quality metrics
        processed.quality = this.calculateBuoyQuality(processed);
        
        return processed;
    }

    async analyzeOceanData(buoyData, location) {
        const analysis = {
            surfaceConditions: this.analyzeSurfaceConditions(buoyData),
            waterProperties: this.analyzeWaterProperties(buoyData),
            waveAnalysis: this.analyzeWaveConditions(buoyData),
            currentPatterns: this.analyzeCurrentPatterns(buoyData),
            trends: this.analyzeOceanTrends(buoyData)
        };

        return analysis;
    }

    analyzeSurfaceConditions(buoyData) {
        const surfaceData = [];
        
        Object.values(buoyData).forEach(buoy => {
            if (buoy.data && buoy.data.length > 0) {
                const latest = buoy.data[buoy.data.length - 1];
                surfaceData.push({
                    windSpeed: latest.wind?.speed,
                    windDirection: latest.wind?.direction,
                    airTemperature: latest.airTemperature,
                    pressure: latest.pressure
                });
            }
        });

        return {
            averageWind
