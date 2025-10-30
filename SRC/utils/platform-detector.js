/**
 * 🔧 Platform Detector
 * Cross-platform detection and optimization
 */

export default class PlatformDetector {
    constructor() {
        this.platformInfo = this.detectPlatform();
        this.capabilities = this.detectCapabilities();
        this.optimizationProfile = this.generateOptimizationProfile();
        
        console.log(`🔧 Platform Detector - ${this.platformInfo.os} ${this.platformInfo.browser} Detected`);
    }

    detectPlatform() {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        
        return {
            // Operating System
            os: this.detectOS(userAgent, platform),
            osVersion: this.detectOSVersion(userAgent),
            
            // Browser
            browser: this.detectBrowser(userAgent),
            browserVersion: this.detectBrowserVersion(userAgent),
            
            // Device
            device: this.detectDevice(userAgent),
            deviceType: this.detectDeviceType(userAgent),
            
            // Architecture
            architecture: this.detectArchitecture(),
            
            // Additional info
            userAgent: userAgent,
            language: navigator.language,
            languages: navigator.languages,
            cookieEnabled: navigator.cookieEnabled,
            javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
            
            // Performance
            hardwareConcurrency: navigator.hardwareConcurrency || 1,
            deviceMemory: navigator.deviceMemory || 4,
            maxTouchPoints: navigator.maxTouchPoints || 0
        };
    }

    detectOS(userAgent, platform) {
        if (/Windows/.test(userAgent)) {
            if (/Windows NT 10.0/.test(userAgent)) return 'Windows 10/11';
            if (/Windows NT 6.3/.test(userAgent)) return 'Windows 8.1';
            if (/Windows NT 6.2/.test(userAgent)) return 'Windows 8';
            if (/Windows NT 6.1/.test(userAgent)) return 'Windows 7';
            return 'Windows';
        }
        
        if (/Macintosh|Mac OS X/.test(userAgent)) {
            return 'macOS';
        }
        
        if (/Linux/.test(userAgent)) {
            if (/Android/.test(userAgent)) return 'Android';
            return 'Linux';
        }
        
        if (/iOS|iPhone|iPad|iPod/.test(userAgent)) {
            return 'iOS';
        }
        
        if (/CrOS/.test(userAgent)) {
            return 'Chrome OS';
        }
        
        return 'Unknown OS';
    }

    detectOSVersion(userAgent) {
        const matches = {
            windows: /Windows NT (\d+\.\d+)/,
            mac: /Mac OS X (\d+[._]\d+[._]\d+)/,
            android: /Android (\d+\.\d+)/,
            ios: /OS (\d+_\d+(_\d+)?)/
        };

        for (const [os, regex] of Object.entries(matches)) {
            const match = userAgent.match(regex);
            if (match) {
                return match[1].replace(/_/g, '.');
            }
        }

        return 'Unknown';
    }

    detectBrowser(userAgent) {
        if (/Edg\/|Edge\//.test(userAgent)) return 'Microsoft Edge';
        if (/Chrome\/|CriOS\//.test(userAgent)) return 'Chrome';
        if (/Firefox\/|FxiOS\//.test(userAgent)) return 'Firefox';
        if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) return 'Safari';
        if (/OPR\/|Opera\//.test(userAgent)) return 'Opera';
        if (/SamsungBrowser\//.test(userAgent)) return 'Samsung Internet';
        if (/UCBrowser\//.test(userAgent)) return 'UC Browser';
        
        return 'Unknown Browser';
    }

    detectBrowserVersion(userAgent) {
        const browser = this.detectBrowser(userAgent).toLowerCase();
        const versionPatterns = {
            chrome: /Chrome\/([\d.]+)/,
            firefox: /Firefox\/([\d.]+)/,
            safari: /Version\/([\d.]+)/,
            edge: /Edg\/([\d.]+)/,
            opera: /OPR\/([\d.]+)/
        };

        for (const [browserName, pattern] of Object.entries(versionPatterns)) {
            if (userAgent.includes(browserName)) {
                const match = userAgent.match(pattern);
                if (match) return match[1];
            }
        }

        return 'Unknown';
    }

    detectDevice(userAgent) {
        if (/Mobile|Android|iPhone|iPad|iPod/.test(userAgent)) {
            if (/iPad/.test(userAgent)) return 'Tablet';
            return 'Mobile';
        }
        return 'Desktop';
    }

    detectDeviceType(userAgent) {
        // More specific device detection
        if (/iPhone/.test(userAgent)) return 'iPhone';
        if (/iPad/.test(userAgent)) return 'iPad';
        if (/iPod/.test(userAgent)) return 'iPod';
        if (/Android/.test(userAgent)) return 'Android Device';
        if (/Windows Phone/.test(userAgent)) return 'Windows Phone';
        
        return 'Desktop Computer';
    }

    detectArchitecture() {
        // Limited client-side architecture detection
        if (navigator.userAgent.includes('Win64') || navigator.userAgent.includes('x64')) {
            return 'x64';
        }
        if (navigator.userAgent.includes('WOW64') || navigator.userAgent.includes('win32')) {
            return 'x86';
        }
        if (navigator.userAgent.includes('ARM')) {
            return 'ARM';
        }
        
        return 'Unknown';
    }

    detectCapabilities() {
        return {
            // Web APIs
            serviceWorker: 'serviceWorker' in navigator,
            webGL: this.detectWebGL(),
            webRTC: this.detectWebRTC(),
            webAssembly: this.detectWebAssembly(),
            webGPU: this.detectWebGPU(),
            
            // Storage
            localStorage: this.testLocalStorage(),
            sessionStorage: this.testSessionStorage(),
            indexedDB: this.testIndexedDB(),
            
            // Media
            mediaDevices: 'mediaDevices' in navigator,
            getDisplayMedia: 'getDisplayMedia' in navigator.mediaDevices,
            
            // Performance
            performance: 'performance' in window,
            performanceObserver: 'PerformanceObserver' in window,
            
            // Graphics
            canvas: this.testCanvas(),
            svg: this.testSVG(),
            
            // Advanced features
            geolocation: 'geolocation' in navigator,
            notifications: 'Notification' in window,
            pushManager: 'PushManager' in window,
            share: 'share' in navigator,
            clipboard: 'clipboard' in navigator,
            
            // Sensors
            deviceOrientation: 'DeviceOrientationEvent' in window,
            deviceMotion: 'DeviceMotionEvent' in window,
            vibration: 'vibrate' in navigator
        };
    }

    detectWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                     (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    detectWebRTC() {
        return !!(navigator.getUserMedia || 
                 navigator.webkitGetUserMedia || 
                 navigator.mozGetUserMedia || 
                 navigator.msGetUserMedia);
    }

    detectWebAssembly() {
        return 'WebAssembly' in window;
    }

    detectWebGPU() {
        return 'gpu' in navigator;
    }

    testLocalStorage() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    }

    testSessionStorage() {
        try {
            sessionStorage.setItem('test', 'test');
            sessionStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    }

    testIndexedDB() {
        return 'indexedDB' in window;
    }

    testCanvas() {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext && canvas.getContext('2d'));
    }

    testSVG() {
        return !!document.createElementNS && 
               !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;
    }

    generateOptimizationProfile() {
        const profile = {
            graphicsQuality: this.determineGraphicsQuality(),
            animationComplexity: this.determineAnimationComplexity(),
            particleCount: this.determineParticleCount(),
            resolutionScale: this.determineResolutionScale(),
            featureFlags: this.determineFeatureFlags()
        };

        console.log('🔧 Optimization Profile Generated:', profile);
        return profile;
    }

    determineGraphicsQuality() {
        const { deviceType, hardwareConcurrency, deviceMemory } = this.platformInfo;
        const { webGL, webGPU } = this.capabilities;

        if (deviceType === 'Mobile') {
            if (hardwareConcurrency >= 6 && deviceMemory >= 4) return 'MEDIUM';
            return 'LOW';
        }

        if (webGPU) return 'ULTRA';
        if (webGL && hardwareConcurrency >= 8 && deviceMemory >= 8) return 'HIGH';
        if (webGL && hardwareConcurrency >= 4 && deviceMemory >= 4) return 'MEDIUM';
        
        return 'LOW';
    }

    determineAnimationComplexity() {
        const { deviceType, hardwareConcurrency } = this.platformInfo;
        
        if (deviceType === 'Mobile') {
            return hardwareConcurrency >= 6 ? 'MEDIUM' : 'LOW';
        }
        
        return hardwareConcurrency >= 8 ? 'HIGH' : 'MEDIUM';
    }

    determineParticleCount() {
        const { deviceType, hardwareConcurrency, deviceMemory } = this.platformInfo;
        
        if (deviceType === 'Mobile') {
            if (hardwareConcurrency >= 6 && deviceMemory >= 4) return 500;
            return 200;
        }
        
        if (hardwareConcurrency >= 8 && deviceMemory >= 8) return 2000;
        if (hardwareConcurrency >= 4 && deviceMemory >= 4) return 1000;
        
        return 500;
    }

    determineResolutionScale() {
        const { deviceType } = this.platformInfo;
        
        if (deviceType === 'Mobile') {
            return window.devicePixelRatio > 2 ? 0.75 : 1.0;
        }
        
        return window.devicePixelRatio > 1.5 ? 1.0 : 1.5;
    }

    determineFeatureFlags() {
        return {
            advancedVisualizations: this.capabilities.webGL,
            realTimeProcessing: this.platformInfo.hardwareConcurrency >= 4,
            backgroundServices: this.capabilities.serviceWorker,
            sensorIntegration: this.capabilities.deviceOrientation,
            highPrecisionGraphics: this.capabilities.webGPU
        };
    }

    // Performance recommendations
    getPerformanceRecommendations() {
        const recommendations = [];
        const { graphicsQuality, featureFlags } = this.optimizationProfile;

        if (graphicsQuality === 'LOW') {
            recommendations.push('Consider reducing visual effects for better performance');
        }

        if (!featureFlags.advancedVisualizations) {
            recommendations.push('WebGL not available - some visualizations may be limited');
        }

        if (this.platformInfo.deviceType === 'Mobile') {
            recommendations.push('Mobile device detected - battery optimization enabled');
        }

        return recommendations;
    }

    // Compatibility checking
    checkFeatureCompatibility(features) {
        const results = {};
        
        features.forEach(feature => {
            results[feature] = this.isFeatureSupported(feature);
        });
        
        return results;
    }

    isFeatureSupported(feature) {
        const featureSupport = {
            '3d-graphics': this.capabilities.webGL,
            'real-time-audio': 'AudioContext' in window,
            'video-processing': 'createMediaElementSource' in (window.AudioContext || window.webkitAudioContext),
            'file-system': 'showDirectoryPicker' in window,
            'speech-recognition': 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
        };

        return featureSupport[feature] || false;
    }

    // Export platform data
    getPlatformReport() {
        return {
            platform: this.platformInfo,
            capabilities: this.capabilities,
            optimization: this.optimizationProfile,
            recommendations: this.getPerformanceRecommendations(),
            timestamp: new Date()
        };
    }

    // Static utility methods
    static getScreenInfo() {
        return {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
            orientation: screen.orientation || {}
        };
    }

    static getViewportInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            touchPoints: navigator.maxTouchPoints || 0
        };
    }

    static getConnectionInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        
        return {
            effectiveType: 'unknown',
            downlink: 0,
            rtt: 0,
            saveData: false
        };
    }
}

// Export singleton instance
export const platformDetector = new PlatformDetector();
