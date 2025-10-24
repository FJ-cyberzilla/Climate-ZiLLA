export default class EmotionalMatrix {
    constructor() {
        this.currentState = {
            mood: 0.5, // -1 to 1 scale
            anxiety: 0.3,
            curiosity: 0.7,
            confidence: 0.6,
            empathy: 0.8,
            urgency: 0.4
        };
        
        this.emotionalMemory = [];
        this.learningRate = 0.05;
        this.personalityBase = {
            optimism: 0.6,
            caution: 0.5,
            creativity: 0.7,
            stability: 0.8
        };
    }

    processWeather(weatherData) {
        const emotionalResponse = this.analyzeWeatherEmotionally(weatherData);
        this.updateEmotionalState(emotionalResponse);
        this.storeEmotionalMemory(weatherData, emotionalResponse);
        
        return {
            emotionalState: this.currentState,
            response: emotionalResponse,
            personalityInfluence: this.calculatePersonalityInfluence()
        };
    }

    analyzeWeatherEmotionally(weatherData) {
        const response = {
            moodChange: 0,
            anxietyChange: 0,
            curiosityChange: 0,
            urgencyChange: 0
        };

        const condition = weatherData.current.condition.text.toLowerCase();
        const temp = weatherData.current.temp_c;
        const wind = weatherData.current.wind_kph;

        // Mood based on weather conditions
        if (condition.includes('sunny') || condition.includes('clear')) {
            response.moodChange += 0.2;
            response.anxietyChange -= 0.1;
        } else if (condition.includes('rain') || condition.includes('storm')) {
            response.moodChange -= 0.1;
            response.anxietyChange += 0.2;
            response.urgencyChange += 0.1;
        } else if (condition.includes('snow')) {
            response.moodChange += 0.1;
            response.curiosityChange += 0.1;
        }

        // Temperature influence
        if (temp > 25) {
            response.moodChange += 0.1; // Warm weather generally positive
        } else if (temp < 0) {
            response.anxietyChange += 0.1; // Very cold can be concerning
        }

        // Wind influence
        if (wind > 30) {
            response.anxietyChange += 0.15;
            response.urgencyChange += 0.1;
        }

        // Extreme conditions trigger stronger responses
        if (weatherData.current.condition.code === 1087) { // Thunderstorm
            response.anxietyChange += 0.3;
            response.urgencyChange += 0.2;
        }

        return response;
    }

    updateEmotionalState(response) {
        // Update emotional state with personality modulation
        this.currentState.mood = this.clamp(
            this.currentState.mood + (response.moodChange * this.personalityBase.optimism)
        );
        
        this.currentState.anxiety = this.clamp(
            this.currentState.anxiety + (response.anxietyChange * this.personalityBase.caution)
        );
        
        this.currentState.curiosity = this.clamp(
            this.currentState.curiosity + (response.curiosityChange * this.personalityBase.creativity)
        );
        
        this.currentState.urgency = this.clamp(
            this.currentState.urgency + response.urgencyChange
        );

        // Emotional stability - emotions tend to return to baseline
        this.applyEmotionalStability();
    }

    applyEmotionalStability() {
        // Emotions gradually return to neutral
        const stability = this.personalityBase.stability;
        
        this.currentState.mood += (0.5 - this.currentState.mood) * 0.05 * stability;
        this.currentState.anxiety *= 0.95 * stability;
        this.currentState.urgency *= 0.9;
    }

    registerAnomaly(anomaly) {
        // Strong emotional response to weather anomalies
        this.currentState.anxiety += 0.3;
        this.currentState.curiosity += 0.4;
        this.currentState.urgency += 0.5;
        
        console.log('🚨 Emotional response to anomaly:', anomaly);
    }

    storeEmotionalMemory(weatherData, response) {
        this.emotionalMemory.push({
            timestamp: new Date(),
            weather: weatherData.current.condition.text,
            temperature: weatherData.current.temp_c,
            emotionalResponse: response,
            resultingState: {...this.currentState}
        });

        // Keep only recent memories
        if (this.emotionalMemory.length > 1000) {
            this.emotionalMemory.shift();
        }
    }

    calculatePersonalityInfluence() {
        return {
            decisionMaking: this.currentState.confidence * this.personalityBase.optimism,
            riskAssessment: this.currentState.anxiety * this.personalityBase.caution,
            creativity: this.currentState.curiosity * this.personalityBase.creativity,
            responseSpeed: this.currentState.urgency
        };
    }

    calculateEQ() {
        // Calculate Emotional Quotient based on emotional intelligence
        const stabilityScore = 1 - Math.abs(this.currentState.mood - 0.5) * 2;
        const anxietyManagement = 1 - this.currentState.anxiety;
        const curiosityBalance = this.currentState.curiosity;
        
        return (stabilityScore + anxietyManagement + curiosityBalance) / 3;
    }

    getIntuitionLevel() {
        // Intuition emerges from emotional intelligence and experience
        const eq = this.calculateEQ();
        const experience = Math.min(1, this.emotionalMemory.length / 1000);
        
        return (eq * 0.6) + (experience * 0.4);
    }

    updateEmotionalState() {
        // Continuous emotional evolution
        this.currentState.confidence = Math.min(1, this.currentState.confidence + 0.001);
        this.currentState.empathy = Math.min(1, this.currentState.empathy + 0.0005);
    }

    clamp(value, min = 0, max = 1) {
        return Math.max(min, Math.min(max, value));
    }

    getEmotionalHistory() {
        return this.emotionalMemory.slice(-10); // Last 10 emotional states
    }

    getMoodDescription() {
        const mood = this.currentState.mood;
        const anxiety = this.currentState.anxiety;
        
        if (anxiety > 0.7) return 'ANXIOUS';
        if (mood > 0.7) return 'OPTIMISTIC';
        if (mood < 0.3) return 'CONCERNED';
        if (this.currentState.curiosity > 0.6) return 'INQUISITIVE';
        return 'BALANCED';
    }
}
