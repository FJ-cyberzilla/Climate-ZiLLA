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
        } else if (service.includes('ipinfo.io')) {
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
