/**
 * 📊 Enterprise Performance Monitor
 * Production-ready system performance tracking and analytics
 * Real metrics, no simulations - enterprise grade monitoring
 */

export default class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.performanceObservers = new Map();
        this.resourceTimings = [];
        this.navigationTimings = [];
        this.customMetrics = new Map();
        
        this.alertThresholds = this.initializeAlertThresholds();
        this.reportingIntervals = this.initializeReportingIntervals();
        this.historicalData = new Map();
        
        this.startTime = Date.now();
        this.sessionId = this.generateSessionId();
        
        this.initializePerformanceTracking();
        this.startRealTimeMonitoring();
        
        console.log('📊 Enterprise Performance Monitor - PRODUCTION ACTIVE');
    }

    initializeAlertThresholds() {
        return {
            // Core Web Vitals thresholds (Google's standards)
            LCP: { // Largest Contentful Paint
                GOOD: 2500,
                NEEDS_IMPROVEMENT: 4000,
                POOR: 4000
            },
            FID: { // First Input Delay
                GOOD: 100,
                NEEDS_IMPROVEMENT: 300,
                POOR: 300
            },
            CLS: { // Cumulative Layout Shift
                GOOD: 0.1,
                NEEDS_IMPROVEMENT: 0.25,
                POOR: 0.25
            },
            
            // Custom application thresholds
            MEMORY_USAGE: {
                WARNING: 0.7, // 70% of available memory
                CRITICAL: 0.9 // 90% of available memory
            },
            CPU_USAGE: {
                WARNING: 0.8, // 80% CPU usage
                CRITICAL: 0.95 // 95% CPU usage
            },
            NETWORK_LATENCY: {
                WARNING: 1000, // 1 second
                CRITICAL: 3000 // 3 seconds
            }
        };
    }

    initializeReportingIntervals() {
        return {
            REAL_TIME: 5000, // 5 seconds
            SHORT_TERM: 60000, // 1 minute
            LONG_TERM: 300000, // 5 minutes
            HISTORICAL: 3600000 // 1 hour
        };
    }

    initializePerformanceTracking() {
        // Core Web Vitals monitoring
        this.initializeCoreWebVitals();
        
        // Resource timing monitoring
        this.initializeResourceTiming();
        
        // Navigation timing monitoring
        this.initializeNavigationTiming();
        
        // Memory monitoring (if available)
        this.initializeMemoryMonitoring();
        
        // Custom metrics collection
        this.initializeCustomMetrics();
        
        // Error tracking
        this.initializeErrorTracking();
    }

    initializeCoreWebVitals() {
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            this.recordMetric('LCP', lastEntry.startTime, {
                element: lastEntry.element?.tagName || 'unknown',
                url: lastEntry.url || 'unknown',
                size: lastEntry.size || 0
            });
            
            this.checkThreshold('LCP', lastEntry.startTime);
        }).observe({type: 'largest-contentful-paint', buffered: true});

        // First Input Delay (FID)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                this.recordMetric('FID', entry.processingStart - entry.startTime, {
                    name: entry.name,
                    target: entry.target?.nodeName || 'unknown'
                });
                
                this.checkThreshold('FID', entry.processingStart - entry.startTime);
            });
        }).observe({type: 'first-input', buffered: true});

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    this.recordMetric('CLS', clsValue, {
                        sources: entry.sources?.map(s => s.nodeName) || []
                    });
                    
                    this.checkThreshold('CLS', clsValue);
                }
            });
        }).observe({type: 'layout-shift', buffered: true});
    }

    initializeResourceTiming() {
        // Monitor all resource loads
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                this.resourceTimings.push({
                    name: entry.name,
                    duration: entry.duration,
                    size: entry.transferSize || 0,
                    type: entry.initiatorType,
                    startTime: entry.startTime,
                    responseEnd: entry.responseEnd
                });
                
                this.analyzeResourcePerformance(entry);
            });
        }).observe({type: 'resource', buffered: true});
    }

    initializeNavigationTiming() {
        // Navigation performance
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                this.navigationTimings.push({
                    type: entry.type,
                    duration: entry.duration,
                    domComplete: entry.domComplete,
                    loadComplete: entry.loadEventEnd,
                    redirectCount: entry.redirectCount
                });
                
                this.analyzeNavigationPerformance(entry);
            });
        }).observe({type: 'navigation', buffered: true});
    }

    initializeMemoryMonitoring() {
        // Memory usage monitoring (if available)
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                this.recordMetric('MEMORY_USAGE', 
                    memory.usedJSHeapSize / memory.totalJSHeapSize,
                    {
                        used: this.formatBytes(memory.usedJSHeapSize),
                        total: this.formatBytes(memory.totalJSHeapSize),
                        limit: this.formatBytes(memory.jsHeapSizeLimit)
                    }
                );
                
                this.checkMemoryThresholds(memory);
            }, this.reportingIntervals.REAL_TIME);
        }
    }

    initializeCustomMetrics() {
        // Custom application-specific metrics
        this.customMetrics.set('AI_PROCESSING_TIME', []);
        this.customMetrics.set('DATA_FETCH_LATENCY', []);
        this.customMetrics.set('RENDER_PERFORMANCE', []);
        this.customMetrics.set('SECURITY_SCAN_TIME', []);
    }

    initializeErrorTracking() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'RUNTIME_ERROR',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack,
                timestamp: new Date()
            });
        });

        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'PROMISE_REJECTION',
                reason: event.reason,
                timestamp: new Date()
            });
        });
    }

    startRealTimeMonitoring() {
        // Real-time performance data collection
        this.monitoringInterval = setInterval(() => {
            this.collectRealTimeMetrics();
            this.generatePerformanceReport();
            this.checkSystemHealth();
        }, this.reportingIntervals.REAL_TIME);

        // Historical data aggregation
        this.historicalInterval = setInterval(() => {
            this.aggregateHistoricalData();
        }, this.reportingIntervals.HISTORICAL);

        console.log('📊 Real-time performance monitoring started');
    }

    collectRealTimeMetrics() {
        // Collect comprehensive performance metrics
        const metrics = {
            timestamp: Date.now(),
            navigation: performance.getEntriesByType('navigation')[0],
            resources: performance.getEntriesByType('resource'),
            paint: performance.getEntriesByType('paint'),
            longtasks: performance.getEntriesByType('longtask')
        };

        // Calculate key performance indicators
        const kpis = this.calculateKPIs(metrics);
        this.recordMetric('REAL_TIME_KPIS', kpis);
        
        // Monitor frame rate
        this.monitorFrameRate();
        
        // Monitor network conditions
        this.monitorNetworkConditions();
    }

    calculateKPIs(metrics) {
        const navigation = metrics.navigation;
        
        return {
            // Load performance
            pageLoadTime: navigation.loadEventEnd - navigation.navigationStart,
            domReadyTime: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            firstContentfulPaint: this.getFirstContentfulPaint(),
            firstMeaningfulPaint: this.getFirstMeaningfulPaint(),
            
            // Resource performance
            totalResourceSize: metrics.resources.reduce((sum, res) => sum + (res.transferSize || 0), 0),
            resourceCount: metrics.resources.length,
            averageResourceLoadTime: metrics.resources.reduce((sum, res) => sum + res.duration, 0) / metrics.resources.length,
            
            // User experience
            longTaskCount: metrics.longtasks.length,
            totalBlockingTime: this.calculateTotalBlockingTime(metrics.longtasks)
        };
    }

    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : 0;
    }

    getFirstMeaningfulPaint() {
        // Simplified FMP calculation - in production, use more sophisticated detection
        const navigationEntry = performance.getEntriesByType('navigation')[0];
        return navigationEntry.domContentLoadedEventEnd - navigationEntry.navigationStart;
    }

    calculateTotalBlockingTime(longtasks) {
        return longtasks.reduce((total, task) => {
            return total + Math.max(task.duration - 50, 0); // Tasks over 50ms contribute to TBT
        }, 0);
    }

    monitorFrameRate() {
        let lastTime = performance.now();
        let frames = 0;
        
        const calculateFPS = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frames * 1000) / (currentTime - lastTime));
                this.recordMetric('FPS', fps);
                
                frames = 0;
                lastTime = currentTime;
                
                // Alert if FPS drops below threshold
                if (fps < 30) {
                    this.triggerAlert('LOW_FPS', { fps, threshold: 30 });
                }
            }
            
            requestAnimationFrame(calculateFPS);
        };
        
        requestAnimationFrame(calculateFPS);
    }

    monitorNetworkConditions() {
        if (navigator.connection) {
            const connection = navigator.connection;
            
            this.recordMetric('NETWORK_TYPE', connection.effectiveType, {
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            });
            
            // Monitor connection changes
            connection.addEventListener('change', () => {
                this.recordMetric('NETWORK_CHANGE', {
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt
                });
            });
        }
    }

    // Custom metric recording
    recordMetric(name, value, metadata = {}) {
        const timestamp = Date.now();
        const metric = {
            name,
            value,
            timestamp,
            sessionId: this.sessionId,
            metadata
        };

        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }

        this.metrics.get(name).push(metric);
        
        // Keep only recent metrics (1 hour)
        const oneHourAgo = timestamp - 3600000;
        this.metrics.set(name, 
            this.metrics.get(name).filter(m => m.timestamp > oneHourAgo)
        );

        // Check thresholds for alerting
        this.checkThreshold(name, value);
        
        return metric;
    }

    recordCustomMetric(name, value, metadata = {}) {
        if (!this.customMetrics.has(name)) {
            this.customMetrics.set(name, []);
        }
        
        const metric = {
            value,
            timestamp: Date.now(),
            metadata
        };
        
        this.customMetrics.get(name).push(metric);
        
        // Keep reasonable history
        if (this.customMetrics.get(name).length > 1000) {
            this.customMetrics.set(name, this.customMetrics.get(name).slice(-500));
        }
        
        return metric;
    }

    recordError(errorData) {
        const errorMetric = {
            type: 'ERROR',
            ...errorData,
            sessionId: this.sessionId,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.recordMetric('ERRORS', errorMetric);
        
        // Trigger error alert
        this.triggerAlert('APPLICATION_ERROR', errorMetric);
        
        return errorMetric;
    }

    // Threshold checking and alerting
    checkThreshold(metricName, value) {
        const thresholds = this.alertThresholds[metricName];
        if (!thresholds) return;

        let severity = 'GOOD';
        
        if (value >= thresholds.POOR) {
            severity = 'POOR';
        } else if (value >= thresholds.NEEDS_IMPROVEMENT) {
            severity = 'NEEDS_IMPROVEMENT';
        }

        if (severity !== 'GOOD') {
            this.triggerAlert(`${metricName}_THRESHOLD`, {
                metric: metricName,
                value,
                threshold: thresholds[severity],
                severity
            });
        }
    }

    checkMemoryThresholds(memory) {
        const usageRatio = memory.usedJSHeapSize / memory.totalJSHeapSize;
        
        if (usageRatio >= this.alertThresholds.MEMORY_USAGE.CRITICAL) {
            this.triggerAlert('CRITICAL_MEMORY_USAGE', {
                usage: usageRatio,
                used: this.formatBytes(memory.usedJSHeapSize),
                total: this.formatBytes(memory.totalJSHeapSize),
                threshold: this.alertThresholds.MEMORY_USAGE.CRITICAL
            });
        } else if (usageRatio >= this.alertThresholds.MEMORY_USAGE.WARNING) {
            this.triggerAlert('HIGH_MEMORY_USAGE', {
                usage: usageRatio,
                used: this.formatBytes(memory.usedJSHeapSize),
                total: this.formatBytes(memory.totalJSHeapSize),
                threshold: this.alertThresholds.MEMORY_USAGE.WARNING
            });
        }
    }

    triggerAlert(type, data) {
        const alert = {
            type,
            severity: this.determineAlertSeverity(type),
            timestamp: new Date(),
            data,
            sessionId: this.sessionId
        };

        // Store alert
        this.recordMetric('ALERTS', alert);
        
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.warn(`🚨 Performance Alert [${type}]:`, data);
        }
        
        // In production, this would send to monitoring service
        this.sendToMonitoringService(alert);
        
        return alert;
    }

    determineAlertSeverity(alertType) {
        const criticalAlerts = [
            'CRITICAL_MEMORY_USAGE', 
            'APPLICATION_ERROR',
            'LCP_THRESHOLD',
            'FID_THRESHOLD'
        ];
        
        const warningAlerts = [
            'HIGH_MEMORY_USAGE',
            'CLS_THRESHOLD',
            'LOW_FPS'
        ];
        
        if (criticalAlerts.includes(alertType)) return 'CRITICAL';
        if (warningAlerts.includes(alertType)) return 'WARNING';
        return 'INFO';
    }

    // Analysis and reporting
    generatePerformanceReport() {
        const report = {
            timestamp: new Date(),
            sessionId: this.sessionId,
            coreWebVitals: this.getCoreWebVitals(),
            resourcePerformance: this.getResourcePerformance(),
            userExperience: this.getUserExperienceMetrics(),
            systemHealth: this.getSystemHealth(),
            customMetrics: this.getCustomMetricsSummary(),
            alerts: this.getRecentAlerts(10)
        };

        // Store historical report
        this.storeHistoricalReport(report);
        
        return report;
    }

    getCoreWebVitals() {
        const lcp = this.getMetricStats('LCP');
        const fid = this.getMetricStats('FID');
        const cls = this.getMetricStats('CLS');
        
        return {
            LCP: lcp,
            FID: fid,
            CLS: cls,
            overallScore: this.calculatePerformanceScore(lcp, fid, cls)
        };
    }

    getMetricStats(metricName) {
        const metrics = this.metrics.get(metricName) || [];
        const values = metrics.map(m => m.value).filter(v => v != null);
        
        if (values.length === 0) return null;
        
        return {
            current: values[values.length - 1],
            average: values.reduce((a, b) => a + b) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            percentile95: this.calculatePercentile(values, 95),
            sampleSize: values.length
        };
    }

    calculatePerformanceScore(lcp, fid, cls) {
        let score = 100;
        
        if (lcp) {
            if (lcp.current > 4000) score -= 30;
            else if (lcp.current > 2500) score -= 15;
        }
        
        if (fid) {
            if (fid.current > 300) score -= 30;
            else if (fid.current > 100) score -= 15;
        }
        
        if (cls) {
            if (cls.current > 0.25) score -= 30;
            else if (cls.current > 0.1) score -= 15;
        }
        
        return Math.max(0, score);
    }

    getResourcePerformance() {
        const resources = this.resourceTimings.slice(-100); // Last 100 resources
        
        return {
            totalResources: resources.length,
            averageLoadTime: resources.reduce((sum, res) => sum + res.duration, 0) / resources.length,
            totalSize: resources.reduce((sum, res) => sum + res.size, 0),
            slowestResources: resources
                .sort((a, b) => b.duration - a.duration)
                .slice(0, 5)
        };
    }

    getUserExperienceMetrics() {
        return {
            fps: this.getMetricStats('FPS'),
            longTasks: performance.getEntriesByType('longtask').length,
            totalBlockingTime: this.calculateTotalBlockingTime(performance.getEntriesByType('longtask')),
            networkType: this.getCurrentNetworkType()
        };
    }

    getSystemHealth() {
        const health = {
            uptime: Date.now() - this.startTime,
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
            
