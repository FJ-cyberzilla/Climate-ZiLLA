export default class PlatformDetector {
    constructor() {
        this.platformInfo = null;
        this.capabilities = new Map();
        this.performanceMetrics = new Map();
        
        this.detectPlatform();
        this.analyzeCapabilities();
        this.measurePerformance();
        
        console.log('🖥️ Platform Detector - INITIALIZED');
    }

    detectPlatform() {
        const platform = {
            // OPERATING SYSTEM
            os: this.detectOS(),
            osVersion: this.detectOSVersion(),
            architecture: this.detectArchitecture(),
            
            // BROWSER/ENGINE
            browser: this.detectBrowser(),
            browserVersion: this.detectBrowserVersion(),
            engine: this.detectEngine(),
            
            // HARDWARE
            device: this.detectDevice(),
            cpu: this.detectCPU(),
            memory: this.detectMemory(),
            gpu: this.detectGPU(),
            
            // DISPLAY
            display: this.detectDisplay(),
            touch: this.detectTouch(),
            
            // NETWORK
            network: this.detectNetwork(),
            connection: this.detectConnection(),
            
            // ENVIRONMENT
            language: this.detectLanguage(),
            timezone: this.detectTimezone(),
            locale: this.detectLocale(),
            
            timestamp: new Date(),
            userAgent: navigator.userAgent
        };

        this.platformInfo = platform;
        console.log('🖥️ Platform detected:', platform);
        return platform;
    }

    // OPERATING SYSTEM DETECTION
    detectOS() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('win')) return 'Windows';
        if (userAgent.includes('mac')) return 'macOS';
        if (userAgent.includes('linux')) return 'Linux';
        if (userAgent.includes('android')) return 'Android';
        if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) return 'iOS';
        if (userAgent.includes('cros')) return 'ChromeOS';
        
        return 'Unknown';
    }

    detectOSVersion() {
        const userAgent = navigator.userAgent;
        
        // Windows version detection
        if (userAgent.includes('Windows NT 10.0')) return '10/11';
        if (userAgent.includes('Windows NT 6.3')) return '8.1';
        if (userAgent.includes('Windows NT 6.2')) return '8';
        if (userAgent.includes('Windows NT 6.1')) return '7';
        
        // macOS version detection
        const macMatch = userAgent.match(/Mac OS X (\d+[._]\d+)/);
        if (macMatch) return macMatch[1].replace('_', '.');
        
        // Android version detection
        const androidMatch = userAgent.match(/Android (\d+)/);
        if (androidMatch) return androidMatch[1];
        
        return 'Unknown';
    }

    detectArchitecture() {
        if (navigator.userAgent.includes('Win64') || navigator.userAgent.includes('x64')) {
            return 'x64';
        }
        if (navigator.userAgent.includes('ARM') || navigator.userAgent.includes('aarch64')) {
            return 'ARM';
        }
        if (navigator.userAgent.includes('x86') || navigator.userAgent.includes('i686')) {
            return 'x86';
        }
        
        // Check for Apple Silicon
        if (navigator.platform.includes('Mac') && navigator.userAgent.includes('Apple')) {
            return 'ARM64';
        }
        
        return 'Unknown';
    }

    // BROWSER DETECTION
    detectBrowser() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Edg')) return 'Edge';
        if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
        if (userAgent.includes('Brave')) return 'Brave';
        
        return 'Unknown';
    }

    detectBrowserVersion() {
        const userAgent = navigator.userAgent;
        const browser = this.detectBrowser();
        
        let versionMatch;
        switch (browser) {
            case 'Chrome':
                versionMatch = userAgent.match(/Chrome\/(\d+)/);
                break;
            case 'Firefox':
                versionMatch = userAgent.match(/Firefox\/(\d+)/);
                break;
            case 'Safari':
                versionMatch = userAgent.match(/Version\/(\d+)/);
                break;
            case 'Edge':
                versionMatch = userAgent.match(/Edg\/(\d+)/);
                break;
        }
        
        return versionMatch ? versionMatch[1] : 'Unknown';
    }

    detectEngine() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.includes('AppleWebKit') && !userAgent.includes('Chrome')) {
            return 'WebKit';
        }
        if (userAgent.includes('Gecko') && !userAgent.includes('WebKit')) {
            return 'Gecko';
        }
        if (userAgent.includes('Blink')) {
            return 'Blink';
        }
        
        return 'Unknown';
    }

    // HARDWARE DETECTION
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
            return 'Mobile';
        }
        if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
            return 'Tablet';
        }
        
        return 'Desktop';
    }

    detectCPU() {
        const cores = navigator.hardwareConcurrency || 'Unknown';
        const architecture = this.detectArchitecture();
        
        return {
            cores: cores,
            architecture: architecture,
            // Additional CPU info would require more advanced detection
        };
    }

    detectMemory() {
        // Note: This API is not widely supported
        if (navigator.deviceMemory) {
            return {
                total: navigator.deviceMemory + ' GB',
                level: this.getMemoryLevel(navigator.deviceMemory)
            };
        }
        
        return {
            total: 'Unknown',
            level: 'UNKNOWN'
        };
    }

    detectGPU() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                return {
                    vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                    renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
                };
            }
        }
        
        return {
            vendor: 'Unknown',
            renderer: 'Unknown'
        };
    }

    // DISPLAY DETECTION
    detectDisplay() {
        return {
            resolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth + ' bits',
            pixelDepth: screen.pixelDepth + ' bits',
            availableResolution: `${screen.availWidth}x${screen.availHeight}`,
            orientation: screen.orientation ? screen.orientation.type : 'Unknown',
            devicePixelRatio: window.devicePixelRatio || 1
        };
    }

    detectTouch() {
        return {
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            pointerSupport: 'PointerEvent' in window,
            gestureSupport: 'ongesturestart' in window
        };
    }

    // NETWORK DETECTION
    detectNetwork() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return {
                type: connection.type || 'Unknown',
                effectiveType: connection.effectiveType || 'Unknown',
                downlink: connection.downlink + ' Mbps',
                rtt: connection.rtt + ' ms',
                saveData: connection.saveData || false
            };
        }
        
        return {
            type: 'Unknown',
            effectiveType: 'Unknown',
            downlink: 'Unknown',
            rtt: 'Unknown',
            saveData: false
        };
    }

    detectConnection() {
        return {
            online: navigator.onLine,
            language: navigator.language,
            languages: navigator.languages,
            cookieEnabled: navigator.cookieEnabled,
            javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false
        };
    }

    // ENVIRONMENT DETECTION
    detectLanguage() {
        return navigator.language || 'Unknown';
    }

    detectTimezone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    detectLocale() {
        return {
            language: navigator.language,
            languages: navigator.languages,
            timezone: this.detectTimezone(),
            region: this.detectRegion()
        };
    }

    detectRegion() {
        try {
            const formatter = new Intl.DateTimeFormat();
            const options = formatter.resolvedOptions();
            return options.locale;
        } catch (error) {
            return 'Unknown';
        }
    }

    // CAPABILITY ANALYSIS
    analyzeCapabilities() {
        const capabilities = new Map();
        
        // GRAPHICS CAPABILITIES
        capabilities.set('WEBGL', this.testWebGL());
        capabilities.set('WEBGL2', this.testWebGL2());
        capabilities.set('CANVAS', this.testCanvas());
        capabilities.set('SVG', this.testSVG());
        capabilities.set('CSS3', this.testCSS3());
        
        // MULTIMEDIA CAPABILITIES
        capabilities.set('VIDEO', this.testVideo());
        capabilities.set('AUDIO', this.testAudio());
        capabilities.set('WEBRTC', this.testWebRTC());
        capabilities.set('MEDIA_SOURCE', this.testMediaSource());
        
        // STORAGE CAPABILITIES
        capabilities.set('LOCAL_STORAGE', this.testLocalStorage());
        capabilities.set('SESSION_STORAGE', this.testSessionStorage());
        capabilities.set('INDEXED_DB', this.testIndexedDB());
        capabilities.set('CACHE_API', this.testCacheAPI());
        
        // PERFORMANCE CAPABILITIES
        capabilities.set('WORKERS', this.testWorkers());
        capabilities.set('SERVICE_WORKERS', this.testServiceWorkers());
        capabilities.set('PERFORMANCE_API', this.testPerformanceAPI());
        
        // SECURITY CAPABILITIES
        capabilities.set('CRYPTO', this.testCrypto());
        capabilities.set('HTTPS', this.testHTTPS());
        capabilities.set('CSP', this.testCSP());
        
        this.capabilities = capabilities;
        return capabilities;
    }

    // CAPABILITY TESTING METHODS
    testWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                     (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    testWebGL2() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
        } catch (e) {
            return false;
        }
    }

    testCanvas() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext && canvas.getContext('2d'));
        } catch (e) {
            return false;
        }
    }

    testSVG() {
        return !!document.createElementNS && 
               !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;
    }

    testCSS3() {
        return {
            flexbox: 'flex' in document.documentElement.style,
            grid: 'grid' in document.documentElement.style,
            transform: 'transform' in document.documentElement.style,
            transition: 'transition' in document.documentElement.style,
            animation: 'animation' in document.documentElement.style
        };
    }

    testVideo() {
        const video = document.createElement('video');
        return {
            supported: !!video.canPlayType,
            h264: !!video.canPlayType('video/mp4; codecs="avc1.42E01E"'),
            webm: !!video.canPlayType('video/webm; codecs="vp8, vorbis"'),
            ogg: !!video.canPlayType('video/ogg; codecs="theora"')
        };
    }

    testAudio() {
        const audio = document.createElement('audio');
        return {
            supported: !!audio.canPlayType,
            mp3: !!audio.canPlayType('audio/mpeg'),
            wav: !!audio.canPlayType('audio/wav'),
            ogg: !!audio.canPlayType('audio/ogg')
        };
    }

    testWebRTC() {
        return !!(navigator.getUserMedia || 
                 navigator.webkitGetUserMedia || 
                 navigator.mozGetUserMedia || 
                 navigator.msGetUserMedia);
    }

    testLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    testSessionStorage() {
        try {
            const test = 'test';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    testIndexedDB() {
        return !!window.indexedDB;
    }

    testCacheAPI() {
        return !!window.caches;
    }

    testWorkers() {
        return !!window.Worker;
    }

    testServiceWorkers() {
        return !!navigator.serviceWorker;
    }

    testPerformanceAPI() {
        return !!window.performance;
    }

    testCrypto() {
        return !!window.crypto && !!crypto.subtle;
    }

    testHTTPS() {
        return window.location.protocol === 'https:';
    }

    testCSP() {
        // Check if Content Security Policy is supported
        return 'securityPolicy' in document;
    }

    // PERFORMANCE MEASUREMENT
    measurePerformance() {
        const metrics = new Map();
        
        if (window.performance) {
            const perf = window.performance;
            
            // Navigation timing
            if (perf.timing) {
                const timing = perf.timing;
                metrics.set('PAGE_LOAD_TIME', timing.loadEventEnd - timing.navigationStart);
                metrics.set('DOM_LOAD_TIME', timing.domContentLoadedEventEnd - timing.navigationStart);
                metrics.set('NETWORK_LATENCY', timing.responseEnd - timing.requestStart);
            }
            
            // Memory usage (Chrome only)
            if (perf.memory) {
                metrics.set('MEMORY_USAGE', perf.memory.usedJSHeapSize);
                metrics.set('MEMORY_LIMIT', perf.memory.jsHeapSizeLimit);
            }
            
            // Paint timing
            if (perf.getEntriesByType) {
                const paintEntries = perf.getEntriesByType('paint');
                paintEntries.forEach(entry => {
                    metrics.set(entry.name.toUpperCase() + '_TIME', entry.startTime);
                });
            }
        }
        
        // Device performance class
        metrics.set('PERFORMANCE_CLASS', this.calculatePerformanceClass());
        
        this.performanceMetrics = metrics;
        return metrics;
    }

    calculatePerformanceClass() {
        let score = 0;
        
        // CPU cores
        const cores = navigator.hardwareConcurrency || 1;
        if (cores >= 8) score += 3;
        else if (cores >= 4) score += 2;
        else if (cores >= 2) score += 1;
        
        // Memory
        const memory = navigator.deviceMemory || 2;
        if (memory >= 8) score += 3;
        else if (memory >= 4) score += 2;
        else if (memory >= 2) score += 1;
        
        // GPU capabilities
        if (this.testWebGL2()) score += 2;
        else if (this.testWebGL()) score += 1;
        
        // Network
        const connection = this.detectNetwork();
        if (connection.effectiveType === '4g') score += 2;
        else if (connection.effectiveType === '3g') score += 1;
        
        if (score >= 8) return 'HIGH_END';
        if (score >= 5) return 'MID_RANGE';
        return 'LOW_END';
    }

    // OPTIMIZATION RECOMMENDATIONS
    getOptimizationRecommendations() {
        const recommendations = [];
        const platform = this.platformInfo;
        const capabilities = this.capabilities;
        const performance = this.performanceMetrics;
        
        // Performance recommendations
        if (performance.get('PERFORMANCE_CLASS') === 'LOW_END') {
            recommendations.push({
                type: 'PERFORMANCE',
                priority: 'HIGH',
                message: 'Device has limited resources. Consider reducing visual effects for better performance.',
                action: 'REDUCE_VISUAL_COMPLEXITY'
            });
        }
        
        // Browser-specific recommendations
        if (platform.browser === 'Safari' && !capabilities.get('WEBGL2')) {
            recommendations.push({
                type: 'COMPATIBILITY',
                priority: 'MEDIUM',
                message: 'Safari has limited WebGL2 support. Some advanced visualizations may not work optimally.',
                action: 'USE_WEBGL_FALLBACKS'
            });
        }
        
        // Network recommendations
        const network = this.detectNetwork();
        if (network.effectiveType === 'slow-2g' || network.effectiveType === '2g') {
            recommendations.push({
                type: 'NETWORK',
                priority: 'HIGH',
                message: 'Slow network connection detected. Data usage will be optimized.',
                action: 'ENABLE_DATA_SAVING'
            });
        }
        
        // Memory recommendations
        if (platform.device === 'Mobile' && platform.memory?.level === 'LOW') {
            recommendations.push({
                type: 'MEMORY',
                priority: 'MEDIUM',
                message: 'Mobile device with limited memory. Background processes will be optimized.',
                action: 'OPTIMIZE_MEMORY_USAGE'
            });
        }
        
        return recommendations;
    }

    // UTILITY METHODS
    getMemoryLevel(memoryGB) {
        if (memoryGB >= 8) return 'HIGH';
        if (memoryGB >= 4) return 'MEDIUM';
        return 'LOW';
    }

    isMobile() {
        return this.platformInfo.device === 'Mobile';
    }

    isTablet() {
        return this.platformInfo.device === 'Tablet';
    }

    isDesktop() {
        return this.platformInfo.device === 'Desktop';
    }

    supportsFeature(feature) {
        return this.capabilities.get(feature) || false;
    }

    getPerformanceScore() {
        return this.performanceMetrics.get('PERFORMANCE_CLASS') || 'UNKNOWN';
    }

    // STATUS AND REPORTING
    getPlatformReport() {
        return {
            platform: this.platformInfo,
            capabilities: Object.fromEntries(this.capabilities),
            performance: Object.fromEntries(this.performanceMetrics),
            recommendations: this.getOptimizationRecommendations(),
            timestamp: new Date()
        };
    }

    getSystemRequirements() {
        return {
            minimum: {
                memory: '2GB RAM',
                browser: 'Chrome 80+, Firefox 75+, Safari 13+',
                webgl: 'WebGL 1.0',
                network: '3G connection'
            },
            recommended: {
                memory: '4GB+ RAM',
                browser: 'Chrome 90+, Firefox 85+, Sa
