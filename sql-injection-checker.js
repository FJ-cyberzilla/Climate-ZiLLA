export default class SQLInjectionChecker {
    constructor() {
        this.patterns = this.loadAttackPatterns();
        this.whitelist = this.loadWhitelist();
        this.attackLog = new Map();
        
        console.log('🛡️ SQL Injection Checker - ACTIVATED');
    }

    loadAttackPatterns() {
        return [
            // Basic SQL Injection
            /(\bUNION\b.*\bSELECT\b)/i,
            /(\bDROP\b.*\bTABLE\b)/i,
            /(\bINSERT\b.*\bINTO\b)/i,
            /(\bDELETE\b.*\bFROM\b)/i,
            /(\bUPDATE\b.*\bSET\b)/i,
            /(\bALTER\b.*\bTABLE\b)/i,
            /(\bCREATE\b.*\bTABLE\b)/i,
            /(\bEXEC\b.*\b\(@)/i,
            
            // Tautologies
            /(\bOR\b.*=.*\bOR\b)/i,
            /(\bOR\b.*1=1)/i,
            /(\bAND\b.*1=1)/i,
            
            // Comments and termination
            /(';\s*(DROP|DELETE|UPDATE|INSERT))/i,
            /(--[\s\S]*$)/,
            /(;\s*--)/,
            /(#[\s\S]*$)/,
            
            // Time-based attacks
            /(\bWAITFOR\b.*\bDELAY\b)/i,
            /(\bSLEEP\b.*\b\([0-9]\))/i,
            /(\bBENCHMARK\b.*\b\([0-9])/i,
            
            // Union-based attacks
            /(\bUNION\b.*\bALL\b.*\bSELECT\b)/i,
            /(\bUNION\b.*\bSELECT\b.*\bFROM\b)/i,
            
            // System procedures
            /(\bXP_)\w+/i,
            /(\bsp_)\w+/i,
            /(\bMSys\w+)/i,
            
            // Information schema
            /(\bINFORMATION_SCHEMA\b)/i,
            /(\bSYSOBJECTS\b)/i,
            /(\bSYSCOLUMNS\b)/i,
            
            // Encoding and obfuscation
            /(CHAR\s*\(\s*\d+\s*\))/i,
            /(0x[0-9a-fA-F]+)/i,
            /(BASE64\b)/i,
            /(FROM_BASE64\b)/i,
            
            // File system access
            /(\bLOAD_FILE\b)/i,
            /(\bINTO\b.*\bOUTFILE\b)/i,
            /(\bINTO\b.*\bDUMPFILE\b)/i,
            
            // Advanced techniques
            /(\bIF\b.*\b\(\s*SELECT\b)/i,
            /(\bCASE\b.*\bWHEN\b.*\bTHEN\b)/i,
            /(\bEXISTS\b.*\bSELECT\b)/i,
            
            // NoSQL injection patterns
            /(\$where\b)/i,
            /(\$ne\b)/i,
            /(\$gt\b)/i,
            /(\$lt\b)/i,
            /(\$in\b)/i,
            /(\$nin\b)/i,
            
            // Additional dangerous patterns
            /(\bSHUTDOWN\b)/i,
            /(\bSHUTDOWN\b.*\bWITH\b.*\bNOWAIT\b)/i,
            /(\bKILL\b)/i,
            /(\bRECONFIGURE\b)/i,
            
            // JavaScript injection (prevention)
            /(<script\b[^>]*>)/i,
            /(javascript:)/i,
            /(on\w+\s*=)/i,
            
            // Command injection
            /(\|\s*\w+)/i,
            /(;\s*\w+)/i,
            /(\$\s*\(\s*\))/i,
            /(`\s*\w+)/i
        ];
    }

    loadWhitelist() {
        return [
            'union station',
            'select committee',
            'drop box',
            'insert coin',
            'create table', // In non-SQL context
            'alter ego',
            'delete key',
            'update available'
        ];
    }

    scanInput(input, context = 'unknown') {
        if (!input) return { safe: true, threats: [] };
        
        const inputString = typeof input === 'string' ? input : JSON.stringify(input);
        const threats = [];
        
        // Check against whitelist first
        if (this.isWhitelisted(inputString)) {
            return { safe: true, threats: [], whitelisted: true };
        }
        
        // Scan for SQL injection patterns
        this.patterns.forEach((pattern, index) => {
            if (pattern.test(inputString)) {
                const threat = {
                    type: 'SQL_INJECTION',
                    pattern: pattern.toString(),
                    input: this.sanitizeForLog(inputString),
                    context,
                    severity: this.calculateSeverity(pattern, inputString),
                    timestamp: new Date()
                };
                
                threats.push(threat);
                this.logThreat(threat);
            }
        });
        
        // Additional heuristic checks
        const heuristicThreats = this.heuristicAnalysis(inputString, context);
        threats.push(...heuristicThreats);
        
        return {
            safe: threats.length === 0,
            threats,
            inputLength: inputString.length,
            scanTimestamp: new Date()
        };
    }

    heuristicAnalysis(input, context) {
        const threats = [];
        
        // Check for excessive length in specific contexts
        if (context === 'username' && input.length > 50) {
            threats.push({
                type: 'SUSPICIOUS_LENGTH',
                message: 'Input length exceeds normal bounds for context',
                severity: 'MEDIUM',
                context,
                timestamp: new Date()
            });
        }
        
        // Check for unusual character sequences
        if (this.hasUnusualSequences(input)) {
            threats.push({
                type: 'UNUSUAL_SEQUENCES',
                message: 'Input contains unusual character sequences',
                severity: 'HIGH',
                context,
                timestamp: new Date()
            });
        }
        
        // Check for encoding attempts
        if (this.hasEncodingAttempts(input)) {
            threats.push({
                type: 'ENCODING_ATTEMPT',
                message: 'Input contains potential encoding attempts',
                severity: 'HIGH',
                context,
                timestamp: new Date()
            });
        }
        
        return threats;
    }

    hasUnusualSequences(input) {
        const unusualPatterns = [
            /('''''')/, // Multiple quotes
            /(;;;)/,    // Multiple semicolons
            /(--\s*--)/, // Multiple comments
            /(==)/,     // Double equals
            /(\|\|)/,   // Double pipe
            /(&&)/      // Double ampersand
        ];
        
        return unusualPatterns.some(pattern => pattern.test(input));
    }

    hasEncodingAttempts(input) {
        const encodingPatterns = [
            /(%[0-9a-fA-F]{2}){3,}/, // URL encoding
            /(&#x[0-9a-fA-F]+;)/,    // HTML hex entities
            /(&#[0-9]+;)/,           // HTML decimal entities
            /(\\x[0-9a-fA-F]{2}){3,}/, // Hex escapes
            /(\\u[0-9a-fA-F]{4}){3,}/  // Unicode escapes
        ];
        
        return encodingPatterns.some(pattern => pattern.test(input));
    }

    calculateSeverity(pattern, input) {
        const patternStr = pattern.toString();
        
        // High severity patterns
        if (patternStr.includes('DROP') || 
            patternStr.includes('DELETE') || 
            patternStr.includes('SHUTDOWN') ||
            patternStr.includes('XP_')) {
            return 'CRITICAL';
        }
        
        // Medium severity patterns
        if (patternStr.includes('UNION') || 
            patternStr.includes('SELECT') || 
            patternStr.includes('INSERT') ||
            patternStr.includes('UPDATE')) {
            return 'HIGH';
        }
        
        // Low severity patterns
        if (patternStr.includes('OR') || 
            patternStr.includes('AND') || 
            patternStr.includes('--')) {
            return 'MEDIUM';
        }
        
        return 'LOW';
    }

    isWhitelisted(input) {
        return this.whitelist.some(whitelisted => 
            input.toLowerCase().includes(whitelisted.toLowerCase())
        );
    }

    logThreat(threat) {
        const threatId = this.generateThreatId();
        this.attackLog.set(threatId, {
            ...threat,
            id: threatId,
            ip: this.getClientIP(),
            userAgent: navigator.userAgent
        });
        
        // Keep only recent threats
        if (this.attackLog.size > 1000) {
            const firstKey = this.attackLog.keys().next().value;
            this.attackLog.delete(firstKey);
        }
        
        console.log(`🚨 SQL Injection Threat Detected:`, threat);
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/[<>"']/g, '') // Remove dangerous characters
            .replace(/\s+/g, ' ')   // Normalize whitespace
            .trim()                 // Trim whitespace
            .substring(0, 1000);    // Limit length
    }

    sanitizeForLog(input) {
        // Sanitize input for logging (prevent log injection)
        return String(input)
            .replace(/[\n\r\t]/g, ' ')
            .replace(/[<>"']/g, '')
            .substring(0, 200);
    }

    // Real-time monitoring
    startMonitoring() {
        // Monitor all form submissions
        document.addEventListener('submit', (e) => {
            const formData = new FormData(e.target);
            let hasThreat = false;
            
            for (let [name, value] of formData.entries()) {
                const scanResult = this.scanInput(value, `form.${name}`);
                if (!scanResult.safe) {
                    hasThreat = true;
                    e.preventDefault();
                    this.handleThreat(scanResult.threats[0], e.target);
                    break;
                }
            }
        });
        
        // Monitor AJAX requests
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const [url, options = {}] = args;
            
            // Check request body for SQL injection
            if (options.body) {
                const scanResult = this.scanInput(options.body, `fetch.${url}`);
                if (!scanResult.safe) {
                    throw new Error(`Security violation: ${scanResult.threats[0].type}`);
                }
            }
            
            return originalFetch.apply(this, args);
        }.bind(this);
        
        console.log('🛡️ SQL Injection real-time monitoring activated');
    }

    handleThreat(threat, element) {
        // Block the action and notify user
        alert('Security violation detected: Potential SQL injection attempt');
        
        // Log to security system
        this.reportToSecuritySystem(threat);
        
        // Clear the suspicious input
        if (element && element.tagName === 'FORM') {
            element.reset();
        }
    }

    reportToSecuritySystem(threat) {
        // In production, send to security information and event management (SIEM)
        const securityEvent = {
            type: 'SQL_INJECTION_ATTEMPT',
            threat,
            timestamp: new Date(),
            sessionId: this.getSessionId(),
            url: window.location.href
        };
        
        // Store locally
        this.storeSecurityEvent(securityEvent);
        
        // Send to backend (if available)
        this.sendToBackend(securityEvent);
    }

    // Utility methods
    generateThreatId() {
        return 'SQL_THREAT_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getClientIP() {
        // In real implementation, get from headers or service
        return 'unknown';
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('securitySessionId');
        if (!sessionId) {
            sessionId = 'SESS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('securitySessionId', sessionId);
        }
        return sessionId;
    }

    storeSecurityEvent(event) {
        const events = JSON.parse(localStorage.getItem('securityEvents') || '[]');
        events.push(event);
        
        if (events.length > 100) {
            events.shift();
        }
        
        localStorage.setItem('securityEvents', JSON.stringify(events));
    }

    async sendToBackend(event) {
        try {
            await fetch('/api/security/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.warn('Failed to send security event to backend:', error);
        }
    }

    // Reporting and status
    getSecurityStatus() {
        return {
            threatsDetected: this.attackLog.size,
            patternsLoaded: this.patterns.length,
            lastThreat: this.attackLog.size > 0 ? 
                Array.from(this.attackLog.values()).pop().timestamp : null,
            monitoringActive: true
        };
    }

    getThreatReport() {
        return Array.from(this.attackLog.values())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
    }
}
