// For Node.js URL parsing
import { URL } from "url";
/**
 * 🌍 Enhanced Geo Locator
 * Advanced location services with multiple fallback methods
 */

export default class GeoLocator {
    constructor() {
        this.locationCache = new Map();
        this.locationHistory = [];
        this.maxCacheSize = 1000;
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
        
        this.locationSources = {
            GPS: 'gps',
            IP: 'ip',
            NETWORK: 'network',
            MANUAL: 'manual',
            FALLBACK: 'fallback'
        };
        
        this.initLocationServices();
    }

    initLocationServices() {
        this.watchId = null;
        this.lastKnownPosition = null;
        this.accuracyThreshold = 100; // meters
        this.maxAge = 30000; // 30 seconds
        
        console.log('🌍 Geo Locator - Enhanced Location Services Activated');
    }

    // Main location acquisition method
    async getCurrentLocation(options = {}) {
        const {
            enableHighAccuracy = true,
            timeout = 10000,
            maximumAge = this.maxAge,
            fallbackToIP = true
        } = options;

        // Check cache first
        const cachedLocation = this.getCachedLocation();
        if (cachedLocation && this.isLocationFresh(cachedLocation)) {
            return cachedLocation;
        }

        try {
            // Try GPS first
            const gpsLocation = await this.getGPSLocation({
                enableHighAccuracy,
                timeout,
                maximumAge
            });

            if (gpsLocation && gpsLocation.accuracy <= this.accuracyThreshold) {
                this.cacheLocation(gpsLocation);
                return gpsLocation;
            }

            // Fallback to IP-based location
            if (fallbackToIP) {
                const ipLocation = await this.getIPLocation();
                if (ipLocation) {
                    this.cacheLocation(ipLocation);
                    return ipLocation;
                }
            }

            // Final fallback
            return this.getFallbackLocation();

        } catch (error) {
            console.error('Location acquisition failed:', error);
            return this.getFallbackLocation();
        }
    }

    // GPS-based location
    async getGPSLocation(options) {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = this.processGPSPosition(position);
                    resolve(location);
                },
                (error) => {
                    reject(this.handleGeolocationError(error));
                },
                options
            );
        });
    }

    // IP-based location fallback
    async getIPLocation() {
        try {
            // Try multiple IP location services
            const location = await Promise.any([
                this.fetchIPAPI(),
                this.fetchIPInfo(),
                this.fetchGeolocationAPI()
            ]);

            return {
                latitude: location.lat,
                longitude: location.lon,
                accuracy: 5000, // IP-based accuracy is low
                source: this.locationSources.IP,
                timestamp: new Date(),
                city: location.city,
                country: location.country,
                countryCode: location.countryCode,
                timezone: location.timezone,
                isp: location.isp
            };

        } catch (error) {
            console.warn('All IP location services failed');
            return null;
        }
    }

    // Multiple IP location service providers
    async fetchIPAPI() {
        const response = await fetch('http://ip-api.com/json/');
        const data = await response.json();
        
        if (data.status === 'success') {
            return {
                lat: data.lat,
                lon: data.lon,
                city: data.city,
                country: data.country,
                countryCode: data.countryCode,
                timezone: data.timezone,
                isp: data.isp
            };
        }
        throw new Error('IP-API service failed');
    }

    async fetchIPInfo() {
        try {
            const response = await fetch('https://ipinfo.io/json');
            const data = await response.json();
            
            const [lat, lon] = data.loc.split(',');
            return {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                city: data.city,
                country: data.country,
                countryCode: data.country,
                timezone: data.timezone,
                isp: data.org
            };
        } catch (error) {
            throw new Error('IPInfo service failed');
        }
    }

    async fetchGeolocationAPI() {
        // Another fallback service
        throw new Error('Geolocation API not implemented');
    }

    // Continuous location tracking
    startTracking(callback, options = {}) {
        if (!navigator.geolocation) {
            console.error('Geolocation not available for tracking');
            return null;
        }

        const trackingOptions = {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000,
            ...options
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const location = this.processGPSPosition(position);
                this.cacheLocation(location);
                this.recordLocationHistory(location);
                
                if (callback) {
                    callback(location);
                }
            },
            (error) => {
                console.error('Location tracking error:', this.handleGeolocationError(error));
            },
            trackingOptions
        );

        return this.watchId;
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    // Location processing
    processGPSPosition(position) {
        const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
        
        return {
            latitude,
            longitude,
            accuracy,
            altitude: altitude || null,
            altitudeAccuracy: altitudeAccuracy || null,
            heading: heading || null,
            speed: speed || null,
            source: this.locationSources.GPS,
            timestamp: new Date(position.timestamp),
            satellites: this.estimateSatellites(accuracy)
        };
    }

    estimateSatellites(accuracy) {
        // Rough estimation based on accuracy
        if (accuracy < 10) return 8; // High accuracy
        if (accuracy < 50) return 5; // Medium accuracy
        if (accuracy < 100) return 3; // Low accuracy
        return 1; // Very low accuracy
    }

    // Cache management
    cacheLocation(location) {
        const cacheKey = this.generateCacheKey(location);
        this.locationCache.set(cacheKey, {
            ...location,
            cachedAt: new Date()
        });

        // Manage cache size
        if (this.locationCache.size > this.maxCacheSize) {
            const firstKey = this.locationCache.keys().next().value;
            this.locationCache.delete(firstKey);
        }
    }

    getCachedLocation() {
        if (this.locationCache.size === 0) return null;
        
        // Get most recent cached location
        const locations = Array.from(this.locationCache.values());
        locations.sort((a, b) => new Date(b.cachedAt) - new Date(a.cachedAt));
        
        return locations[0];
    }

    isLocationFresh(location) {
        const age = Date.now() - new Date(location.cachedAt).getTime();
        return age < this.cacheTimeout;
    }

    generateCacheKey(location) {
        return `${location.latitude.toFixed(4)}_${location.longitude.toFixed(4)}_${location.source}`;
    }

    // Location history
    recordLocationHistory(location) {
        this.locationHistory.push({
            ...location,
            recordedAt: new Date()
        });

        // Keep only recent history
        if (this.locationHistory.length > 1000) {
            this.locationHistory = this.locationHistory.slice(-500);
        }
    }

    getLocationHistory(limit = 100) {
        return this.locationHistory.slice(-limit);
    }

    // Distance calculations
    calculateDistance(lat1, lon1, lat2, lon2, unit = 'km') {
        // Haversine formula
        const R = unit === 'km' ? 6371 : 3959; // Earth radius in km or miles
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
            
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance;
    }

    deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    // Location-based services
    async getWeatherStationNearby(location, radiusKm = 50) {
        // This would integrate with weather station APIs
        const stations = await this.fetchNearbyStations(location, radiusKm);
        return stations.sort((a, b) => 
            this.calculateDistance(location.latitude, location.longitude, a.lat, a.lon) -
            this.calculateDistance(location.latitude, location.longitude, b.lat, b.lon)
        )[0];
    }

    async getTimeZone(location) {
        try {
            const response = await fetch(
                `https://api.timezonedb.com/v2.1/get-time-zone?key=YOUR_API_KEY&format=json&by=position&lat=${location.latitude}&lng=${location.longitude}`
            );
            const data = await response.json();
            return data.zoneName;
        } catch (error) {
            // Fallback to calculating from longitude
            return this.estimateTimeZone(location.longitude);
        }
    }

    estimateTimeZone(longitude) {
        // Rough timezone estimation based on longitude
        const offset = Math.round(longitude / 15);
        return `UTC${offset >= 0 ? '+' : ''}${offset}`;
    }

    // Error handling
    handleGeolocationError(error) {
        const errorMessages = {
            1: 'Location access denied by user',
            2: 'Location unavailable',
            3: 'Location request timed out'
        };

        return new Error(errorMessages[error.code] || 'Unknown location error');
    }

    // Fallback methods
    getFallbackLocation() {
        // Return a default location or last known position
        return {
            latitude: 40.7128, // New York City as fallback
            longitude: -74.0060,
            accuracy: 10000,
            source: this.locationSources.FALLBACK,
            timestamp: new Date(),
            city: 'New York',
            country: 'United States',
            countryCode: 'US',
            timezone: 'America/New_York'
        };
    }

    // Utility methods
    isValidLocation(location) {
        return location && 
               typeof location.latitude === 'number' && 
               typeof location.longitude === 'number' &&
               Math.abs(location.latitude) <= 90 &&
               Math.abs(location.longitude) <= 180;
    }

    formatLocation(location, format = 'decimal') {
        if (!this.isValidLocation(location)) return 'Invalid location';
        
        if (format === 'dms') {
            return this.decimalToDMS(location.latitude, location.longitude);
        }
        
        return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }

    decimalToDMS(lat, lon) {
        const latDir = lat >= 0 ? 'N' : 'S';
        const lonDir = lon >= 0 ? 'E' : 'W';
        
        const latAbs = Math.abs(lat);
        const lonAbs = Math.abs(lon);
        
        const latDeg = Math.floor(latAbs);
        const latMin = Math.floor((latAbs - latDeg) * 60);
        const latSec = ((latAbs - latDeg - latMin/60) * 3600).toFixed(1);
        
        const lonDeg = Math.floor(lonAbs);
        const lonMin = Math.floor((lonAbs - lonDeg) * 60);
        const lonSec = ((lonAbs - lonDeg - lonMin/60) * 3600).toFixed(1);
        
        return `${latDeg}°${latMin}'${latSec}"${latDir} ${lonDeg}°${lonMin}'${lonSec}"${lonDir}`;
    }

    // Cleanup
    destroy() {
        this.stopTracking();
        this.locationCache.clear();
        this.locationHistory = [];
        console.log('🌍 Geo Locator - Services stopped');
    }
}
export default class GeoLocator {
    constructor() {
        this.currentLocation = null;
        this.locationHistory = [];
        this.permissionStatus = 'UNKNOWN';
        this.locationServices = new Map();
        
        this.initializeLocationServices();
        console.log('📍 Geo-Locator System - INITIALIZED');
    }

    async initializeLocationServices() {
        // Initialize multiple location services for fallback
        this.locationServices.set('HTML5_GEOLOCATION', this.html5Geolocation.bind(this));
        this.locationServices.set('IP_GEOLOCATION', this.ipGeolocation.bind(this));
        this.locationServices.set('WIFI_POSITIONING', this.wifiPositioning.bind(this));
        this.locationServices.set('CELL_TOWER', this.cellTowerLocation.bind(this));
        
        await this.detectCapabilities();
    }

    async detectCapabilities() {
        const capabilities = {
            html5: 'geolocation' in navigator,
            highAccuracy: false,
            ipFallback: true,
            sensors: this.hasLocationSensors()
        };

        // Test HTML5 accuracy
        if (capabilities.html5) {
            capabilities.highAccuracy = await this.testGeolocationAccuracy();
        }

        this.capabilities = capabilities;
        console.log('📍 Location capabilities:', capabilities);
    }

    async getCurrentLocation(options = {}) {
        const {
            highAccuracy = false,
            timeout = 10000,
            maximumAge = 300000, // 5 minutes
            fallback = true
        } = options;

        console.log('📍 Acquiring current location...');

        try {
            // Try primary method first (HTML5 Geolocation)
            let location = await this.html5Geolocation({ highAccuracy, timeout, maximumAge });
            
            if (!location && fallback) {
                // Fallback to IP-based geolocation
                location = await this.ipGeolocation();
            }

            if (location) {
                await this.storeLocation(location);
                this.currentLocation = location;
                return location;
            }

            throw new Error('All location methods failed');

        } catch (error) {
            console.error('📍 Location acquisition failed:', error);
            return this.getLastKnownLocation();
        }
    }

    async html5Geolocation(options = {}) {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('HTML5 Geolocation not supported'));
                return;
            }

            const geolocationOptions = {
                enableHighAccuracy: options.highAccuracy || false,
                timeout: options.timeout || 10000,
                maximumAge: options.maximumAge || 300000
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = this.processGeolocationPosition(position);
                    resolve(location);
                },
                (error) => {
                    console.error('📍 HTML5 Geolocation error:', error);
                    reject(this.mapGeolocationError(error));
                },
                geolocationOptions
            );
        });
    }

    processGeolocationPosition(position) {
        const { coords, timestamp } = position;
        
        return {
            source: 'HTML5_GEOLOCATION',
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            altitude: coords.altitude,
            altitudeAccuracy: coords.altitudeAccuracy,
            heading: coords.heading,
            speed: coords.speed,
            timestamp: new Date(timestamp),
            address: null,
            city: null,
            country: null,
            timezone: this.getTimezone(coords.latitude, coords.longitude),
            accuracyLevel: this.calculateAccuracyLevel(coords.accuracy)
        };
    }

    async ipGeolocation() {
        try {
            console.log('📍 Attempting IP-based geolocation...');
            
            // Use multiple IP geolocation services for reliability
            const services = [
                'https://ipapi.co/json/',
                'https://ipinfo.io/json',
                'https://api.ipgeolocation.io/ipgeo?apiKey=demo'
            ];

            for (const service of services) {
                try {
                    const response = await fetch(service, { 
                        signal: AbortSignal.timeout(5000) 
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        const location = this.processIPGeolocationData(data, service);
                        
                        if (location.accuracyLevel !== 'LOW') {
                            return location;
                        }
                    }
                } catch (error) {
                    console.warn(`📍 IP geolocation service failed: ${service}`, error);
                    continue;
                }
            }

            throw new Error('All IP geolocation services failed');

        } catch (error) {
            console.error('📍 IP geolocation completely failed:', error);
            return null;
        }
    }

    processIPGeolocationData(data, service) {
        // Normalize data from different IP geolocation services
        let location = {
            source: `IP_GEOLOCATION_${service.split('/')[2]}`,
            accuracy: 50000, // Default accuracy for IP-based (50km)
            accuracyLevel: 'MEDIUM'
        };

        if (service.includes('ipapi.co')) {
            location = {
                ...location,
                latitude: parseFloat(data.latitude),
                longitude: parseFloat(data.longitude),
                city: data.city,
                country: data.country_name,
                region: data.region,
                timezone: data.timezone,
                isp: data.org,
                postal: data.postal
            };
        } else {
            let hostname = "";
            try {
                hostname = (new URL(service)).hostname;
            } catch (e) {
                hostname = "";
            }
            if (hostname === 'ipinfo.io') {
                const [lat, lon] = data.loc?.split(',') || [0, 0];
                location = {
                    ...location,
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon),
                    city: data.city,
                    country: data.country,
                    region: data.region,
                    timezone: data.timezone,
                    isp: data.org,
                    postal: data.postal
                };
            }
        }

        // Enhance with additional data
        location.address = this.generateAddress(location);
        location.accuracyLevel = this.calculateAccuracyLevel(location.accuracy);
        
        return location;
    }

    async wifiPositioning() {
        // WiFi-based positioning (simulated - in real app, use WiFi API if available)
        try {
            if (!this.hasWifiCapability()) {
                throw new Error('WiFi positioning not available');
            }

            console.log('📍 Attempting WiFi-based positioning...');
            
            // In a real implementation, this would scan for WiFi networks
            // and query a positioning service
            const simulatedLocation = {
                source: 'WIFI_POSITIONING',
                latitude: this.currentLocation?.latitude || 0,
                longitude: this.currentLocation?.longitude || 0,
                accuracy: 100, // Meters
                accuracyLevel: 'HIGH',
                timestamp: new Date(),
                networks: this.scanWiFiNetworks() // Simulated
            };

            return simulatedLocation;

        } catch (error) {
            console.warn('📍 WiFi positioning failed:', error);
            return null;
        }
    }

    async cellTowerLocation() {
        // Cell tower triangulation (simulated)
        try {
            console.log('📍 Attempting cell tower positioning...');
            
            const simulatedLocation = {
                source: 'CELL_TOWER',
                latitude: this.currentLocation?.latitude || 0,
                longitude: this.currentLocation?.longitude || 0,
                accuracy: 1000, // Meters
                accuracyLevel: 'MEDIUM',
                timestamp: new Date(),
                towers: this.scanCellTowers() // Simulated
            };

            return simulatedLocation;

        } catch (error) {
            console.warn('📍 Cell tower positioning failed:', error);
            return null;
        }
    }

    // ENHANCED LOCATION SERVICES
    async getEnhancedLocation() {
        // Get location with enhanced data (city, address, etc.)
        const location = await this.getCurrentLocation();
        
        if (location) {
            const enhanced = await this.enhanceLocationData(location);
            return enhanced;
        }
        
        return null;
    }

    async enhanceLocationData(location) {
        // Add reverse geocoding and additional data
        const enhanced = { ...location };

        try {
            // Reverse geocoding to get address
            if (!enhanced.address && enhanced.latitude && enhanced.longitude) {
                const address = await this.reverseGeocode(enhanced.latitude, enhanced.longitude);
                enhanced.address = address;
            }

            // Get weather station proximity
            enhanced.weatherStations = await this.findNearbyWeatherStations(enhanced);

            // Get terrain and elevation data
            enhanced.terrain = await this.getTerrainData(enhanced);

            // Calculate sunrise/sunset times
            enhanced.astronomy = this.calculateAstronomyData(enhanced);

            // Timezone verification
            enhanced.verifiedTimezone = await this.verifyTimezone(enhanced);

        } catch (error) {
            console.warn('📍 Location enhancement failed:', error);
        }

        return enhanced;
    }

    async reverseGeocode(lat, lon) {
        try {
            // Use OpenStreetMap Nominatim for reverse geocoding
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
            );
            
            if (response.ok) {
                const data = await response.json();
                return this.formatAddress(data.address);
            }
        } catch (error) {
            console.warn('📍 Reverse geocoding failed:', error);
        }

        return null;
    }

    formatAddress(addressData) {
        if (!addressData) return null;

        const components = [];
        if (addressData.road) components.push(addressData.road);
        if (addressData.city || addressData.town || addressData.village) {
            components.push(addressData.city || addressData.town || addressData.village);
        }
        if (addressData.state) components.push(addressData.state);
        if (addressData.country) components.push(addressData.country);
        if (addressData.postcode) components.push(addressData.postcode);

        return components.join(', ');
    }

    async findNearbyWeatherStations(location) {
        // Find nearby weather stations for accurate data
        const stations = [];
        
        // Simulated station finding
        stations.push({
            id: 'virtual_station_1',
            name: `${location.city || 'Local'} Weather Station`,
            distance: Math.random() * 10, // km
            reliability: 0.9,
            coordinates: {
                lat: location.latitude + (Math.random() - 0.5) * 0.1,
                lon: location.longitude + (Math.random() - 0.5) * 0.1
            }
        });

        return stations;
    }

    // ACCURACY AND VALIDATION
    calculateAccuracyLevel(accuracyMeters) {
        if (accuracyMeters <= 50) return 'VERY_HIGH';
        if (accuracyMeters <= 200) return 'HIGH';
        if (accuracyMeters <= 1000) return 'MEDIUM';
        if (accuracyMeters <= 5000) return 'LOW';
        return 'VERY_LOW';
    }

    async testGeolocationAccuracy() {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000
                });
            });

            return position.coords.accuracy <= 100; // High accuracy if within 100m

        } catch (error) {
            return false;
        }
    }

    validateLocation(location) {
        if (!location) return false;
        
        const checks = [
            location.latitude >= -90 && location.latitude <= 90,
            location.longitude >= -180 && location.longitude <= 180,
            location.timestamp instanceof Date,
            location.accuracy > 0
        ];

        return checks.every(check => check === true);
    }

    // STORAGE AND HISTORY
    async storeLocation(location) {
        if (!this.validateLocation(location)) {
            console.warn('📍 Invalid location data, not storing');
            return;
        }

        this.locationHistory.push({
            ...location,
            storedAt: new Date(),
            id: this.generateLocationId()
        });

        // Keep only recent history (last 100 locations)
        if (this.locationHistory.length > 100) {
            this.locationHistory.shift();
        }

        // Store in localStorage for persistence
        localStorage.setItem('locationHistory', JSON.stringify(this.locationHistory.slice(-20)));
    }

    getLastKnownLocation() {
        if (this.locationHistory.length > 0) {
            return this.locationHistory[this.locationHistory.length - 1];
        }

        // Try to load from localStorage
        const stored = localStorage.getItem('locationHistory');
        if (stored) {
            const history = JSON.parse(stored);
            if (history.length > 0) {
                return history[history.length - 1];
            }
        }

        return null;
    }

    getLocationHistory(days = 7) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        return this.locationHistory.filter(loc => 
            new Date(loc.timestamp) >= cutoff
        );
    }

    // UTILITY METHODS
    calculateDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula for distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c; // Distance in km
    }

    deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    getTimezone(lat, lon) {
        // Simple timezone estimation based on longitude
        const offset = Math.round(lon / 15);
        return `UTC${offset >= 0 ? '+' : ''}${offset}`;
    }

    hasLocationSensors() {
        return (
            'geolocation' in navigator ||
            'connection' in navigator ||
            'getBattery' in navigator
        );
    }

    hasWifiCapability() {
        // Check if device has WiFi capability
        return 'connection' in navigator && navigator.connection.type === 'wifi';
    }

    scanWiFiNetworks() {
        // Simulated WiFi network scan
        return [
            { ssid: 'Home_Network', strength: -45 },
            { ssid: 'Neighbor_WiFi', strength: -65 },
            { ssid: 'Public_Hotspot', strength: -75 }
        ];
    }

    scanCellTowers() {
        // Simulated cell tower scan
        return [
            { mcc: 310, mnc: 410, lac: 1234, cellid: 56789, strength: -75 },
            { mcc: 310, mnc: 410, lac: 1234, cellid: 56790, strength: -80 }
        ];
    }

    generateAddress(location) {
        if (location.city && location.country) {
            return `${location.city}, ${location.country}`;
        }
        return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }

    mapGeolocationError(error) {
        const errorMap = {
            1: 'PERMISSION_DENIED',
            2: 'POSITION_UNAVAILABLE',
            3: 'TIMEOUT'
        };
        
        return new Error(errorMap[error.code] || 'UNKNOWN_ERROR');
    }

    generateLocationId() {
        return 'LOC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    // PERMISSION MANAGEMENT
    async requestLocationPermission() {
        if (!navigator.permissions) {
            this.permissionStatus = 'GRANTED'; // Assume granted if no permissions API
            return 'GRANTED';
        }

        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            this.permissionStatus = result.state;
            
            result.onchange = () => {
                this.permissionStatus = result.state;
                console.log(`📍 Location permission changed to: ${result.state}`);
            };
            
            return result.state;
        } catch (error) {
            console.warn('📍 Permission API not supported:', error);
            this.permissionStatus = 'UNKNOWN';
            return 'UNKNOWN';
        }
    }

    // STATUS AND REPORTING
    getGeoLocatorStatus() {
        return {
            currentLocation: this.currentLocation,
            permissionStatus: this.permissionStatus,
            capabilities: this.capabilities,
            locationHistory: this.locationHistory.length,
            servicesAvailable: this.locationServices.size
        };
    }

    getAccuracyReport() {
        if (!this.currentLocation) return null;

        return {
            accuracy: this.currentLocation.accuracy,
            accuracyLevel: this.currentLocation.accuracyLevel,
            source: this.currentLocation.source,
            lastUpdated: this.currentLocation.timestamp,
            recommendedImprovements: this.getAccuracyImprovements()
        };
    }

    getAccuracyImprovements() {
        const improvements = [];
        
        if (!this.capabilities.highAccuracy) {
            improvements.push('Enable high accuracy mode for better precision');
        }
        
        if (this.permissionStatus !== 'GRANTED') {
            improvements.push('Grant location permissions for accurate weather data');
        }
        
        if (!this.capabilities.html5) {
            improvements.push('Use a browser that supports HTML5 geolocation');
        }

        return improvements;
    }
}
