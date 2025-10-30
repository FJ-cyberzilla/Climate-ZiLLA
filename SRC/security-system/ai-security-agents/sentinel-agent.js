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
export default class SentinelAgent {
    constructor() {
        this.threatDatabase = new Map();
        this.behavioralBaseline = this.establishBaseline();
        this.learningRate = 0.1;
        this.confidence = 0.8;
        this.analysisHistory = [];
        
        this.loadThreatPatterns();
        console.log('🛡️ Sentinel AI Agent - ACTIVATED');
    }

    async processThreat(threatData) {
        console.log(`🛡️ Sentinel analyzing threat: ${threatData.type}`);
        
        const analysis = await this.analyzeThreat(threatData);
        const response = await this.determineResponse(analysis);
        const execution = await this.executeResponse(response, threatData);
        
        // Learn from this threat
        await this.learnFromThreat(threatData, analysis, response);
        
        return {
            analysis,
            response,
            execution,
            confidence: this.confidence,
            timestamp: new Date()
        };
    }

    async analyzeThreat(threatData) {
        const analysis = {
            threatLevel: this.calculateThreatLevel(threatData),
            sophistication: this.assessSophistication(threatData),
            pattern: this.identifyPattern(threatData),
            origin: await this.analyzeOrigin(threatData),
            intent: this.inferIntent(threatData),
            potentialImpact: this.estimateImpact(threatData),
            confidence: this.confidence
        };

        this.analysisHistory.push(analysis);
        return analysis;
    }

    calculateThreatLevel(threatData) {
        let level = 0;
        
        // Base level from threat type
        const baseLevels = {
            'SQL_INJECTION_ATTEMPT': 0.7,
            'POSSIBLE_DDoS': 0.9,
            'BEHAVIORAL_ANOMALY': 0.5,
            'UNAUTHORIZED_ACCESS': 0.8
        };
        
        level += baseLevels[threatData.type] || 0.3;
        
        // Adjust based on sophistication
        level += this.assessSophistication(threatData) * 0.2;
        
        // Adjust based on frequency
        level += this.calculateFrequencyFactor(threatData.details.ip) * 0.1;
        
        return Math.min(1, level);
    }

    assessSophistication(threatData) {
        let sophistication = 0;
        
        if (threatData.details.payload) {
            const payload = threatData.details.payload;
            
            // Advanced SQL injection techniques
            if (payload.includes('UNION SELECT')) sophistication += 0.3;
            if (payload.includes('WAITFOR DELAY')) sophistication += 0.2;
            if (payload.includes('EXEC xp_cmdshell')) sophistication += 0.4;
            
            // Obfuscation techniques
            if (payload.includes('CHAR(')) sophistication += 0.2;
            if (payload.includes('BASE64')) sophistication += 0.3;
        }
        
        // Behavioral sophistication
        if (this.detectAdvancedBehavior(threatData)) {
            sophistication += 0.3;
        }
        
        return Math.min(1, sophistication);
    }

    identifyPattern(threatData) {
        const patterns = [];
        
        if (threatData.type.includes('SQL_INJECTION')) {
            if (threatData.details.payload?.includes('UNION')) {
                patterns.push('UNION_BASED_INJECTION');
            }
            if (threatData.details.payload?.includes('OR 1=1')) {
                patterns.push('TAUTOLOGY_ATTACK');
            }
            if (threatData.details.payload?.includes('WAITFOR')) {
                patterns.push('TIME_BASED_BLIND');
            }
        }
        
        if (threatData.type === 'BEHAVIORAL_ANOMALY') {
            patterns.push('RECONNAISSANCE');
        }
        
        return patterns.length > 0 ? patterns : ['UNKNOWN_PATTERN'];
    }

    async analyzeOrigin(threatData) {
        const origin = {
            ip: threatData.details.ip,
            geographic: await this.geolocateIP(threatData.details.ip),
            reputation: await this.checkIPReputation(threatData.details.ip),
            previousActivity: this.checkPreviousActivity(threatData.details.ip)
        };
        
        return origin;
    }

    inferIntent(threatData) {
        const intents = [];
        
        if (threatData.type.includes('SQL_INJECTION')) {
            intents.push('DATA_EXFILTRATION');
        }
        
        if (threatData.type === 'POSSIBLE_DDoS') {
            intents.push('SERVICE_DISRUPTION');
        }
        
        if (threatData.type === 'BEHAVIORAL_ANOMALY') {
            intents.push('RECONNAISSANCE');
        }
        
        return intents.length > 0 ? intents : ['UNKNOWN_INTENT'];
    }

    estimateImpact(threatData) {
        const impacts = [];
        
        if (threatData.type.includes('SQL_INJECTION')) {
            impacts.push('DATA_BREACH');
            impacts.push('SYSTEM_COMPROMISE');
        }
        
        if (threatData.type === 'POSSIBLE_DDoS') {
            impacts.push('SERVICE_UNAVAILABILITY');
            impacts.push('RESOURCE_EXHAUSTION');
        }
        
        if (threatData.level === 'CRITICAL') {
            impacts.push('SYSTEM_SHUTDOWN');
        }
        
        return impacts;
    }

    async determineResponse(analysis) {
        const response = {
            immediateActions: [],
            mediumTermActions: [],
            longTermActions: [],
            confidence: analysis.confidence,
            rationale: this.generateRationale(analysis)
        };

        // IMMEDIATE ACTIONS (0-5 minutes)
        if (analysis.threatLevel > 0.7) {
            response.immediateActions.push('BLOCK_IP_IMMEDIATELY');
            response.immediateActions.push('ACTIVATE_HONEYPOT');
            response.immediateActions.push('ENHANCE_MONITORING');
        }

        if (analysis.sophistication > 0.6) {
            response.immediateActions.push('DEPLOY_COUNTERMEASURES');
            response.immediateActions.push('ALERT_SECURITY_TEAM');
        }

        // MEDIUM TERM ACTIONS (5-60 minutes)
        if (analysis.pattern.includes('UNION_BASED_INJECTION')) {
            response.mediumTermActions.push('UPDATE_WAF_RULES');
            response.mediumTermActions.push('ENHANCE_INPUT_VALIDATION');
        }

        if (analysis.origin.reputation === 'MALICIOUS') {
            response.mediumTermActions.push('BLOCK_IP_RANGE');
        }

        // LONG TERM ACTIONS (1+ hours)
        response.longTermActions.push('ANALYZE_ATTACK_PATTERN');
        response.longTermActions.push('UPDATE_THREAT_INTELLIGENCE');
        response.longTermActions.push('IMPROVE_DETECTION_ALGORITHMS');

        return response;
    }

    async executeResponse(response, threatData) {
        const execution = {
            executedActions: [],
            results: [],
            timestamp: new Date()
        };

        // Execute immediate actions
        for (const action of response.immediateActions) {
            const result = await this.executeAction(action, threatData);
            execution.executedActions.push(action);
            execution.results.push(result);
        }

        // Schedule medium and long term actions
        this.scheduleActions(response.mediumTermActions, threatData, 'MEDIUM');
        this.scheduleActions(response.longTermActions, threatData, 'LONG');

        return execution;
    }

    async executeAction(action, threatData) {
        switch (action) {
            case 'BLOCK_IP_IMMEDIATELY':
                return await this.blockIP(threatData.details.ip);
                
            case 'ACTIVATE_HONEYPOT':
                return await this.activateHoneypot(threatData.details.ip);
                
            case 'DEPLOY_COUNTERMEASURES':
                return await this.deployCountermeasures(threatData);
                
            case 'ALERT_SECURITY_TEAM':
                return await this.alertSecurityTeam(threatData);
                
            default:
                return { action, status: 'SCHEDULED' };
        }
    }

    async blockIP(ip) {
        console.log(`🚫 Sentinel blocking IP: ${ip}`);
        
        // Implement IP blocking
        const blockScript = `
            // Block requests from this IP
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                const requestIP = '${ip}'; // In real implementation, detect IP
                if (requestIP === '${ip}') {
                    console.log('🚫 Blocked request from malicious IP');
                    return Promise.reject(new Error('IP blocked by Sentinel AI'));
                }
                return originalFetch.apply(this, args);
            };
        `;
        
        this.injectScript(blockScript);
        return { action: 'BLOCK_IP', status: 'COMPLETED', ip };
    }

    async activateHoneypot(ip) {
        console.log(`🎣 Sentinel activating honeypot for: ${ip}`);
        
        // Deploy advanced honeypot
        const honeypotScript = `
            // Advanced honeypot for attacker
            window.fakeEndpoints = {
                '/admin/credentials': {
                    username: 'admin',
                    password: 'fake_password_123',
                    token: 'fake_jwt_token_456'
                },
                '/api/database': {
                    connection: 'mysql://fake:password@fake-host:3306/fake_db',
                    tables: ['users', 'passwords', 'api_keys']
                }
            };
        `;
        
        this.injectScript(honeypotScript);
        return { action: 'ACTIVATE_HONEYPOT', status: 'COMPLETED', ip };
    }

    async deployCountermeasures(threatData) {
        console.log('💀 Sentinel deploying countermeasures');
        
        const countermeasureScript = `
            // Advanced countermeasures
            setInterval(() => {
                // CPU exhaustion
                const start = Date.now();
                while (Date.now() - start < 1000) {
                    Math.sqrt(Math.random()) * Math.sqrt(Math.random());
                }
                
                // Memory pressure
                const memoryHog = new Array(100000).fill('SENTINEL_COUNTERMEASURE');
            }, 3000);
        `;
        
        this.injectScript(countermeasureScript);
        return { action: 'DEPLOY_COUNTERMEASURES', status: 'COMPLETED' };
    }

    async alertSecurityTeam(threatData) {
        const alert = {
            type: 'SENTINEL_AI_ALERT',
            severity: 'HIGH',
            threat: threatData,
            timestamp: new Date(),
            recommendedActions: [
                'Review firewall logs',
                'Check system integrity',
                'Update security policies'
            ]
        };
        
        console.log('🚨 SENTINEL SECURITY ALERT:', alert);
        return { action: 'ALERT_SECURITY_TEAM', status: 'COMPLETED' };
    }

    // LEARNING AND ADAPTATION
    async learnFromThreat(threatData, analysis, response) {
        const learning = {
            threat: threatData,
            analysis,
            response,
            outcome: await this.assessOutcome(threatData, response),
            timestamp: new Date()
        };
        
        // Store learning data
        this.storeLearning(learning);
        
        // Update threat patterns
        await this.updateThreatPatterns(learning);
        
        // Adjust confidence
        this.adjustConfidence(learning.outcome);
    }

    async assessOutcome(threatData, response) {
        // Simulate outcome assessment
        // In real implementation, track actual results
        return {
            successful: response.confidence > 0.7,
            attackerNeutralized: true,
            systemProtected: true,
            lessonsLearned: this.extractLessons(threatData, response)
        };
    }

    adjustConfidence(outcome) {
        if (outcome.successful) {
            this.confidence = Math.min(1, this.confidence + 0.05);
            this.learningRate = Math.min(0.2, this.learningRate + 0.01);
        } else {
            this.confidence = Math.max(0.5, this.confidence - 0.1);
        }
    }

    // UTILITY METHODS
    establishBaseline() {
        return {
            normalRequestFrequency: 10, // requests per minute
            typicalUserBehavior: this.getTypicalBehavior(),
            geographicPatterns: this.getGeographicPatterns(),
            timePatterns: this.getTimePatterns()
        };
    }

    loadThreatPatterns() {
        // Load known threat patterns
        this.threatDatabase.set('SQL_INJECTION', {
            patterns: [
                /(\bUNION\b.*\bSELECT\b)/i,
                /(\bDROP\b.*\bTABLE\b)/i,
                /(';\s*(DROP|DELETE|UPDATE))/i
            ],
            severity: 'HIGH',
            response: 'IMMEDIATE_BLOCK'
        });
        
        this.threatDatabase.set('DDoS', {
            patterns: [/high_request_frequency/],
            severity: 'CRITICAL',
            response: 'RATE_LIMITING'
        });
    }

    calculateFrequencyFactor(ip) {
        const recentThreats = this.analysisHistory.filter(
            analysis => analysis.origin?.ip === ip
        ).length;
        
        return Math.min(1, recentThreats / 10);
    }

    detectAdvancedBehavior(threatData) {
        // Detect advanced attacker behavior
        return (
            threatData.details.payload?.includes('CHAR(') || // Obfuscation
            threatData.details.payload?.includes('0x') ||    // Hex encoding
            this.hasStealthPatterns(threatData)              // Stealth techniques
        );
    }

    async geolocateIP(ip) {
        try {
            const response = await fetch(`https://ipapi.co/${ip}/json/`);
            const data = await response.json();
            return {
                country: data.country_name,
                city: data.city,
                isp: data.org,
                threatLevel: this.assessGeographicThreat(data.country_code)
            };
        } catch (error) {
            return { country: 'Unknown', threatLevel: 'UNKNOWN' };
        }
    }

    assessGeographicThreat(countryCode) {
        const highThreatCountries = ['CN', 'RU', 'KP', 'IR', 'BR'];
        return highThreatCountries.includes(countryCode) ? 'HIGH' : 'MEDIUM';
    }

    async checkIPReputation(ip) {
        // Check IP against threat intelligence
        // In real implementation, query threat intelligence APIs
        return Math.random() > 0.7 ? 'MALICIOUS' : 'CLEAN';
    }

    checkPreviousActivity(ip) {
        const previous = this.analysisHistory.filter(
            analysis => analysis.origin?.ip === ip
        );
        
        return {
            count: previous.length,
            lastSeen: previous.length > 0 ? previous[previous.length - 1].timestamp : null,
            patterns: previous.map(p => p.pattern).flat()
        };
    }

    generateRationale(analysis) {
        return `Threat level ${Math.round(analysis.threatLevel * 100)}% - ${analysis.pattern.join(', ')} detected from ${analysis.origin.geographic.country}. Intent: ${analysis.intent.join(', ')}`;
    }

    scheduleActions(actions, threatData, timeframe) {
        actions.forEach(action => {
            setTimeout(() => {
                this.executeAction(action, threatData);
            }, timeframe === 'MEDIUM' ? 300000 : 3600000); // 5 min or 1 hour
        });
    }

    injectScript(scriptContent) {
        try {
            const script = document.createElement('script');
            script.textContent = scriptContent;
            document.head.appendChild(script);
        } catch (error) {
            console.error('Sentinel failed to inject script:', error);
        }
    }

    storeLearning(learning) {
        const learningHistory = JSON.parse(localStorage.getItem('sentinelLearning') || '[]');
        learningHistory.push(learning);
        
        if (learningHistory.length > 500) {
            learningHistory.shift();
        }
        
        localStorage.setItem('sentinelLearning', JSON.stringify(learningHistory));
    }

    // STATUS AND REPORTING
    getSentinelStatus() {
        return {
            confidence: this.confidence,
            learningRate: this.learningRate,
            threatsAnalyzed: this.analysisHistory.length,
            activeCountermeasures: this.getActiveCountermeasures(),
            threatPatterns: this.threatDatabase.size
        };
    }

    getActiveCountermeasures() {
        return Array.from(this.threatDatabase.values())
            .filter(pattern => pattern.response === 'IMMEDIATE_BLOCK')
            .length;
    }

    getLearningHistory() {
        return JSON.parse(localStorage.getItem('sentinelLearning') || '[]');
    }
}
