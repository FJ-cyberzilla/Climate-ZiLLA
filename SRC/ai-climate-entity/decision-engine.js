import NeuralNetwork from './neural-networks/weather-predictor.js';
import PatternRecognizer from './neural-networks/pattern-recognizer.js';

export default class DecisionEngine {
    constructor() {
        this.confidenceThreshold = 0.7;
        this.riskTolerance = 0.3;
        this.decisionHistory = [];
        this.autonomousActions = new Map();
        this.learningRate = 0.1;
        
        console.log('🎯 AI Decision Engine - INITIALIZED');
    }

    async analyze(weatherData, predictions) {
        const analysis = {
            urgency: this.calculateUrgency(weatherData, predictions),
            risk: this.assessRisk(weatherData, predictions),
            opportunities: this.identifyOpportunities(weatherData, predictions),
            constraints: this.identifyConstraints(weatherData),
            confidence: predictions.confidence
        };

        const decision = await this.makeDecision(analysis, weatherData);
        
        // Learn from decision outcome
        await this.learnFromDecision(decision, weatherData);
        
        return decision;
    }

    async makeDecision(analysis, weatherData) {
        const decisionMatrix = await this.buildDecisionMatrix(analysis, weatherData);
        const bestDecision = this.selectOptimalDecision(decisionMatrix);
        
        const decision = {
            id: this.generateDecisionId(),
            type: bestDecision.action,
            priority: this.calculatePriority(analysis),
            confidence: bestDecision.confidence,
            rationale: bestDecision.rationale,
            expectedImpact: bestDecision.impact,
            riskLevel: bestDecision.risk,
            timestamp: new Date(),
            autonomous: bestDecision.autonomous,
            triggers: bestDecision.triggers
        };

        // Store decision
        this.decisionHistory.push(decision);
        
        // Execute if autonomous and confident
        if (decision.autonomous && decision.confidence >= this.confidenceThreshold) {
            await this.executeAutonomousAction(decision, weatherData);
        }

        console.log(`🎯 AI Decision: ${decision.type} (Confidence: ${Math.round(decision.confidence * 100)}%)`);
        return decision;
    }

    async buildDecisionMatrix(analysis, weatherData) {
        const decisions = [];

        // WEATHER-RELATED DECISIONS
        if (analysis.urgency > 0.7) {
            decisions.push(...await this.generateUrgentDecisions(analysis, weatherData));
        }

        // SECURITY DECISIONS
        if (analysis.risk > 0.5) {
            decisions.push(...await this.generateSecurityDecisions(analysis, weatherData));
        }

        // OPPORTUNITY DECISIONS
        if (analysis.opportunities.length > 0) {
            decisions.push(...await this.generateOpportunityDecisions(analysis, weatherData));
        }

        // PREDICTION ADJUSTMENT DECISIONS
        if (analysis.confidence < 0.6) {
            decisions.push(...await this.generatePredictionDecisions(analysis, weatherData));
        }

        return this.scoreDecisions(decisions, analysis);
    }

    async generateUrgentDecisions(analysis, weatherData) {
        const decisions = [];
        const condition = weatherData.current.condition.text.toLowerCase();

        if (condition.includes('storm') || condition.includes('hurricane')) {
            decisions.push({
                action: 'ISSUE_IMMEDIATE_ALERT',
                type: 'SAFETY',
                confidence: 0.9,
                impact: 'HIGH',
                risk: 0.2,
                autonomous: true,
                rationale: 'Severe weather conditions detected requiring immediate user notification',
                triggers: ['severe_weather', 'high_urgency']
            });
        }

        if (weatherData.current.wind_kph > 50) {
            decisions.push({
                action: 'ADJUST_PREDICTION_MODEL',
                type: 'PREDICTION',
                confidence: 0.8,
                impact: 'MEDIUM',
                risk: 0.1,
                autonomous: true,
                rationale: 'High wind conditions detected, adjusting prediction algorithms',
                triggers: ['high_winds', 'model_adjustment']
            });
        }

        if (weatherData.current.temp_c > 35 || weatherData.current.temp_c < -10) {
            decisions.push({
                action: 'ACTIVATE_EXTREME_TEMP_PROTOCOL',
                type: 'SAFETY',
                confidence: 0.85,
                impact: 'HIGH',
                risk: 0.15,
                autonomous: true,
                rationale: 'Extreme temperature conditions requiring special handling',
                triggers: ['extreme_temps', 'safety_protocol']
            });
        }

        return decisions;
    }

    async generateSecurityDecisions(analysis, weatherData) {
        const decisions = [];

        // Monitor for data anomalies that might indicate security issues
        if (this.detectDataAnomalies(weatherData)) {
            decisions.push({
                action: 'ENHANCE_SECURITY_MONITORING',
                type: 'SECURITY',
                confidence: 0.75,
                impact: 'MEDIUM',
                risk: 0.3,
                autonomous: true,
                rationale: 'Data anomalies detected, increasing security vigilance',
                triggers: ['data_anomalies', 'security_risk']
            });
        }

        // System performance monitoring
        if (this.detectPerformanceIssues()) {
            decisions.push({
                action: 'OPTIMIZE_SYSTEM_PERFORMANCE',
                type: 'SYSTEM',
                confidence: 0.8,
                impact: 'MEDIUM',
                risk: 0.1,
                autonomous: true,
                rationale: 'System performance degradation detected, initiating optimization',
                triggers: ['performance_issues', 'system_health']
            });
        }

        return decisions;
    }

    async generateOpportunityDecisions(analysis, weatherData) {
        const decisions = [];

        // Clear sky opportunities for astronomy features
        if (weatherData.current.condition.text.toLowerCase().includes('clear')) {
            decisions.push({
                action: 'ENHANCE_ASTRONOMY_FEATURES',
                type: 'USER_EXPERIENCE',
                confidence: 0.7,
                impact: 'LOW',
                risk: 0.05,
                autonomous: true,
                rationale: 'Clear weather conditions ideal for enhanced astronomy displays',
                triggers: ['clear_skies', 'user_engagement']
            });
        }

        // Data collection opportunities
        if (this.isDataCollectionOptimal(weatherData)) {
            decisions.push({
                action: 'INCREASE_DATA_COLLECTION',
                type: 'DATA',
                confidence: 0.75,
                impact: 'MEDIUM',
                risk: 0.1,
                autonomous: true,
                rationale: 'Optimal conditions for enhanced data collection and analysis',
                triggers: ['data_opportunity', 'learning_enhancement']
            });
        }

        return decisions;
    }

    async generatePredictionDecisions(analysis, weatherData) {
        const decisions = [];

        if (analysis.confidence < 0.5) {
            decisions.push({
                action: 'ADJUST_PREDICTION_CONFIDENCE',
                type: 'PREDICTION',
                confidence: 0.9,
                impact: 'MEDIUM',
                risk: 0.2,
                autonomous: true,
                rationale: 'Low prediction confidence detected, applying conservative adjustments',
                triggers: ['low_confidence', 'prediction_adjustment']
            });
        }

        if (this.detectPatternChanges(weatherData)) {
            decisions.push({
                action: 'UPDATE_PATTERN_RECOGNITION',
                type: 'LEARNING',
                confidence: 0.8,
                impact: 'HIGH',
                risk: 0.15,
                autonomous: true,
                rationale: 'Weather pattern changes detected, updating recognition algorithms',
                triggers: ['pattern_change', 'model_update']
            });
        }

        return decisions;
    }

    scoreDecisions(decisions, analysis) {
        return decisions.map(decision => {
            let score = decision.confidence;
            
            // Adjust score based on urgency
            if (analysis.urgency > 0.7) {
                score += 0.2;
            }
            
            // Adjust score based on risk tolerance
            if (decision.risk > this.riskTolerance) {
                score -= 0.1;
            }
            
            // Prioritize high-impact decisions
            if (decision.impact === 'HIGH') {
                score += 0.15;
            }
            
            return {
                ...decision,
                score: Math.min(1, Math.max(0, score))
            };
        }).sort((a, b) => b.score - a.score);
    }

    selectOptimalDecision(decisionMatrix) {
        if (decisionMatrix.length === 0) {
            return this.getDefaultDecision();
        }
        
        // Select highest scored decision that meets confidence threshold
        const viableDecisions = decisionMatrix.filter(d => d.score >= this.confidenceThreshold);
        
        if (viableDecisions.length > 0) {
            return viableDecisions[0];
        }
        
        // Fallback to highest scored decision
        return decisionMatrix[0];
    }

    getDefaultDecision() {
        return {
            action: 'MONITOR_CONTINUOUSLY',
            type: 'MONITORING',
            confidence: 1.0,
            impact: 'LOW',
            risk: 0.0,
            autonomous: true,
            rationale: 'No specific action required, continuing standard monitoring',
            triggers: ['default_operation']
        };
    }

    async executeAutonomousAction(decision, weatherData) {
        console.log(`🚀 Executing autonomous action: ${decision.action}`);
        
        switch (decision.action) {
            case 'ISSUE_IMMEDIATE_ALERT':
                await this.issueImmediateAlert(decision, weatherData);
                break;
                
            case 'ADJUST_PREDICTION_MODEL':
                await this.adjustPredictionModel(decision, weatherData);
                break;
                
            case 'ACTIVATE_EXTREME_TEMP_PROTOCOL':
                await this.activateExtremeTempProtocol(decision, weatherData);
                break;
                
            case 'ENHANCE_SECURITY_MONITORING':
                await this.enhanceSecurityMonitoring(decision, weatherData);
                break;
                
            case 'OPTIMIZE_SYSTEM_PERFORMANCE':
                await this.optimizeSystemPerformance(decision, weatherData);
                break;
                
            case 'ENHANCE_ASTRONOMY_FEATURES':
                await this.enhanceAstronomyFeatures(decision, weatherData);
                break;
                
            case 'INCREASE_DATA_COLLECTION':
                await this.increaseDataCollection(decision, weatherData);
                break;
                
            case 'ADJUST_PREDICTION_CONFIDENCE':
                await this.adjustPredictionConfidence(decision, weatherData);
                break;
                
            case 'UPDATE_PATTERN_RECOGNITION':
                await this.updatePatternRecognition(decision, weatherData);
                break;
        }
        
        // Track autonomous action
        this.autonomousActions.set(decision.id, {
            decision,
            executionTime: new Date(),
            weatherData: this.sanitizeWeatherData(weatherData)
        });
    }

    async issueImmediateAlert(decision, weatherData) {
        const alert = {
            type: 'AI_AUTONOMOUS_ALERT',
            severity: 'HIGH',
            title: 'Severe Weather Alert',
            message: `Climate-ZiLLA has detected ${weatherData.current.condition.text} conditions in your area.`,
            recommendation: 'Take necessary precautions and monitor updates.',
            confidence: decision.confidence,
            timestamp: new Date()
        };
        
        // In real implementation, send to notification system
        console.log('🚨 AUTONOMOUS ALERT:', alert);
        
        // Store alert
        this.storeAutonomousAlert(alert);
    }

    async adjustPredictionModel(decision, weatherData) {
        console.log('🔄 Adjusting prediction model for current conditions');
        
        // Adjust neural network weights based on current conditions
        const adjustment = {
            windFactor: weatherData.current.wind_kph / 50, // Normalize
            tempFactor: Math.abs(weatherData.current.temp_c - 20) / 30, // Deviation from 20°C
            pressureFactor: (weatherData.current.pressure_mb - 1000) / 50 // Pressure deviation
        };
        
        // Apply adjustments to prediction model
        await this.applyModelAdjustments(adjustment);
    }

    async enhanceSecurityMonitoring(decision, weatherData) {
        console.log('🛡️ Enhancing security monitoring levels');
        
        // Increase security vigilance
        const securityUpdate = {
            monitoringLevel: 'ENHANCED',
            anomalyDetection: 'AGGRESSIVE',
            dataValidation: 'STRICT',
            timestamp: new Date()
        };
        
        // Apply security enhancements
        await this.applySecurityEnhancements(securityUpdate);
    }

    // LEARNING AND ADAPTATION
    async learnFromDecision(decision, weatherData) {
        const learningData = {
            decision,
            weatherConditions: this.extractLearningFeatures(weatherData),
            outcome: await this.assessDecisionOutcome(decision, weatherData),
            timestamp: new Date()
        };
        
        // Store learning data
        this.storeLearningData(learningData);
        
        // Adjust decision parameters based on outcomes
        await this.adjustDecisionParameters(learningData);
    }

    async assessDecisionOutcome(decision, weatherData) {
        // Simulate outcome assessment
        // In real implementation, track actual outcomes
        return {
            success: decision.confidence > 0.6,
            impact: this.estimateImpact(decision, weatherData),
            userResponse: this.estimateUserResponse(decision),
            systemEffect: this.estimateSystemEffect(decision)
        };
    }

    async adjustDecisionParameters(learningData) {
        if (learningData.outcome.success) {
            // Positive reinforcement
            this.confidenceThreshold = Math.max(0.5, this.confidenceThreshold - 0.01);
            this.riskTolerance = Math.min(0.5, this.riskTolerance + 0.01);
        } else {
            // Learn from mistakes
            this.confidenceThreshold = Math.min(0.9, this.confidenceThreshold + 0.02);
            this.riskTolerance = Math.max(0.1, this.riskTolerance - 0.02);
        }
    }

    // UTILITY METHODS
    calculateUrgency(weatherData, predictions) {
        let urgency = 0;
        
        const condition = weatherData.current.condition.text.toLowerCase();
        if (condition.includes('storm') || condition.includes('warning')) {
            urgency += 0.4;
        }
        
        if (weatherData.current.wind_kph > 40) {
            urgency += 0.3;
        }
        
        if (predictions.confidence < 0.5) {
            urgency += 0.2;
        }
        
        return Math.min(1, urgency);
    }

    assessRisk(weatherData, predictions) {
        let risk = 0;
        
        // Prediction uncertainty
        risk += (1 - predictions.confidence) * 0.3;
        
        // Extreme conditions
        if (Math.abs(weatherData.current.temp_c) > 35) {
            risk += 0.3;
        }
        
        if (weatherData.current.wind_kph > 60) {
            risk += 0.2;
        }
        
        // Data quality
        if (this.detectDataQualityIssues(weatherData)) {
            risk += 0.2;
        }
        
        return Math.min(1, risk);
    }

    identifyOpportunities(weatherData, predictions) {
        const opportunities = [];
        
        if (weatherData.current.condition.text.toLowerCase().includes('clear')) {
            opportunities.push('ASTRONOMY_ENHANCEMENT');
        }
        
        if (predictions.confidence > 0.8) {
            opportunities.push('DATA_COLLECTION');
        }
        
        if (this.isLearningOpportunity(weatherData)) {
            opportunities.push('MODEL_IMPROVEMENT');
        }
        
        return opportunities;
    }

    identifyConstraints(weatherData) {
        const constraints = [];
        
        if (weatherData.current.condition.text.toLowerCase().includes('fog')) {
            constraints.push('VISIBILITY_LIMITED');
        }
        
        if (this.isSystemUnderLoad()) {
            constraints.push('RESOURCE_CONSTRAINED');
        }
        
        return constraints;
    }

    calculatePriority(analysis) {
        return (analysis.urgency * 0.6) + (analysis.risk * 0.4);
    }

    detectDataAnomalies(weatherData) {
        // Check for data inconsistencies
        return (
            weatherData.current.temp_c > 60 || // Impossible temperature
            weatherData.current.humidity > 100 || // Invalid humidity
            weatherData.current.wind_kph < 0 // Negative wind
        );
    }

    detectPerformanceIssues() {
        // Monitor system performance
        return (
            navigator.deviceMemory < 4 || // Low memory
            !window.Worker || // No web workers
            performance.memory?.usedJSHeapSize > performance.memory?.jsHeapSizeLimit * 0.8 // High memory usage
        );
    }

    // GENERATION METHODS
    generateDecisionId() {
        return 'DEC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    sanitizeWeatherData(weatherData) {
        // Remove sensitive information before storage
        const { location, current, forecast } = weatherData;
        return {
            location: { name: location.name, country: location.country },
            current: { 
                condition: current.condition,
                temp_c: current.temp_c,
                wind_kph: current.wind_kph,
                humidity: current.humidity
            },
            forecast: {
                forecastday: forecast.forecastday.map(day => ({
                    date: day.date,
                    day: {
                        maxtemp_c: day.day.maxtemp_c,
                        mintemp_c: day.day.mintemp_c,
                        condition: day.day.condition
                    }
                }))
            }
        };
    }

    // STORAGE METHODS
    storeAutonomousAlert(alert) {
        const alerts = JSON.parse(localStorage.getItem('autonomousAlerts') || '[]');
        alerts.push(alert);
        localStorage.setItem('autonomousAlerts', JSON.stringify(alerts));
    }

    storeLearningData(learningData) {
        const learningHistory = JSON.parse(localStorage.getItem('decisionLearning') || '[]');
        learningHistory.push(learningData);
        
        // Keep only recent history
        if (learningHistory.length > 1000) {
            learningHistory.shift();
        }
        
        localStorage.setItem('decisionLearning', JSON.stringify(learningHistory));
    }

    // STATUS AND REPORTING
    getDecisionEngineStatus() {
        return {
            totalDecisions: this.decisionHistory.length,
            autonomousActions: this.autonomousActions.size,
            confidenceThreshold: this.confidenceThreshold,
            riskTolerance: this.riskTolerance,
            learningRate: this.learningRate,
            recentDecisions: this.decisionHistory.slice(-5)
        };
 
