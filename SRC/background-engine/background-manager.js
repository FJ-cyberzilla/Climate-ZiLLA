import HurricaneAnimator from './weather-visuals/hurricane-animator.js';
import WindFlowSimulator from './weather-visuals/wind-flow-simulator.js';
import RainThunderRenderer from './weather-visuals/rain-thunder-renderer.js';
import SatelliteTracker from './weather-visuals/satellite-tracker.js';
import OceanWaveSimulator from './weather-visuals/ocean-wave-simulator.js';
import RadarVisualization from './weather-visuals/radar-visualization.js';
import StarFieldGenerator from './astronomy-backgrounds/star-field-generator.js';
import PlanetOrbitVisualizer from './astronomy-backgrounds/planet-orbit-visualizer.js';
import NebulaRenderer from './astronomy-backgrounds/nebula-renderer.js';
import AuroraSimulator from './astronomy-backgrounds/aurora-simulator.js';
import GalaxyRotation from './astronomy-backgrounds/galaxy-rotation.js';

export default class BackgroundManager {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animations = new Map();
        this.currentWeather = null;
        this.animationFrameId = null;
        this.isInitialized = false;
    }

    async initialize() {
        this.canvas = document.getElementById('weatherCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        this.isInitialized = true;
        
        console.log('🌪️ Climate-ZiLLA Background Engine Initialized');
        this.startAnimationLoop();
    }

    setupCanvas() {
        const resizeCanvas = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    updateBackground(weatherData) {
        this.currentWeather = weatherData;
        this.animations.clear();

        const condition = weatherData.current.condition.text.toLowerCase();
        const isDay = weatherData.current.is_day === 1;
        const windSpeed = weatherData.current.wind_kph;
        const humidity = weatherData.current.humidity;

        // Base background based on time and condition
        this.setBaseBackground(condition, isDay);

        // Weather-specific animations
        if (condition.includes('hurricane') || condition.includes('tropical')) {
            this.animations.set('hurricane', new HurricaneAnimator(this.ctx));
        }

        if (condition.includes('rain') || condition.includes('drizzle') || humidity > 80) {
            this.animations.set('rain', new RainThunderRenderer(this.ctx));
            if (condition.includes('thunder') || condition.includes('storm')) {
                this.animations.set('lightning', true);
            }
        }

        if (windSpeed > 15) {
            this.animations.set('wind', new WindFlowSimulator(this.ctx, windSpeed));
        }

        if (condition.includes('snow') || weatherData.current.temp_c < 0) {
            this.animations.set('snow', true);
        }

        // Always show satellite tracking
        this.animations.set('satellite', new SatelliteTracker(this.ctx));

        // Ocean waves for coastal areas or high humidity
        if (humidity > 70 || condition.includes('coastal')) {
            this.animations.set('ocean', new OceanWaveSimulator(this.ctx));
        }

        // Radar visualization
        this.animations.set('radar', new RadarVisualization(this.ctx));

        // Astronomy for night time
        if (!isDay) {
            this.animations.set('stars', new StarFieldGenerator(this.ctx));
            this.animations.set('planets', new PlanetOrbitVisualizer(this.ctx));
            
            if (Math.random() > 0.7) {
                this.animations.set('aurora', new AuroraSimulator(this.ctx));
            }
            
            this.animations.set('galaxy', new GalaxyRotation(this.ctx));
            this.animations.set('nebula', new NebulaRenderer(this.ctx));
        }

        console.log(`🎨 Background updated for: ${condition}, Animations: ${this.animations.size}`);
    }

    setBaseBackground(condition, isDay) {
        // Set CSS class for base background
        const body = document.body;
        body.className = ''; // Clear existing classes

        if (condition.includes('hurricane') || condition.includes('tornado')) {
            body.classList.add('weather-bg-hurricane');
        } else if (condition.includes('storm') || condition.includes('thunder')) {
            body.classList.add('weather-bg-storm');
        } else if (condition.includes('rain') || condition.includes('drizzle')) {
            body.classList.add('weather-bg-rain');
        } else if (isDay && (condition.includes('sunny') || condition.includes('clear'))) {
            body.classList.add('weather-bg-sunny');
        } else if (!isDay) {
            body.classList.add('weather-bg-clear-night');
        } else {
            body.classList.add('weather-bg-sunny');
        }
    }

    startAnimationLoop() {
        const animate = () => {
            if (!this.isInitialized) return;

            // Clear canvas with fade effect for smooth transitions
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Update and draw all active animations
            this.animations.forEach((animator, key) => {
                if (animator && typeof animator.update === 'function') {
                    animator.update();
                }
            });

            this.animationFrameId = requestAnimationFrame(animate);
        };

        animate();
    }

    stopAnimationLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    getActiveAnimations() {
        return Array.from(this.animations.keys());
    }

    // Cleanup method
    destroy() {
        this.stopAnimationLoop();
        this.animations.clear();
        this.isInitialized = false;
    }
}
