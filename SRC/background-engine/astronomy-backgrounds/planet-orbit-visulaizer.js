export default class PlanetOrbitVisualizer {
    constructor(ctx) {
        this.ctx = ctx;
        this.planets = [];
        this.orbits = [];
        this.timeScale = 0.00001; // Slowed down for visualization
        
        this.initSolarSystem();
    }

    initSolarSystem() {
        // Planet data: name, radius, orbitRadius, speed, color, size
        const planetData = [
            { name: 'Mercury', radius: 80, orbitRadius: 100, speed: 0.004, color: 'rgba(200, 200, 200, 0.8)', size: 2 },
            { name: 'Venus', radius: 120, orbitRadius: 140, speed: 0.003, color: 'rgba(255, 200, 100, 0.8)', size: 3 },
            { name: 'Earth', radius: 160, orbitRadius: 180, speed: 0.002, color: 'rgba(100, 150, 255, 0.8)', size: 3 },
            { name: 'Mars', radius: 200, orbitRadius: 220, speed: 0.0015, color: 'rgba(255, 100, 100, 0.8)', size: 2.5 },
            { name: 'Jupiter', radius: 260, orbitRadius: 280, speed: 0.001, color: 'rgba(255, 200, 150, 0.8)', size: 6 },
            { name: 'Saturn', radius: 320, orbitRadius: 340, speed: 0.0008, color: 'rgba(255, 255, 150, 0.8)', size: 5 },
            { name: 'Uranus', radius: 380, orbitRadius: 400, speed: 0.0006, color: 'rgba(150, 255, 255, 0.8)', size: 4 },
            { name: 'Neptune', radius: 440, orbitRadius: 460, speed: 0.0005, color: 'rgba(100, 100, 255, 0.8)', size: 4 }
        ];

        planetData.forEach(planet => {
            this.planets.push({
                name: planet.name,
                orbitRadius: planet.orbitRadius,
                angle: Math.random() * Math.PI * 2,
                speed: planet.speed,
                color: planet.color,
                size: planet.size,
                radius: planet.radius,
                moons: this.generateMoons(planet.name)
            });

            this.orbits.push({
                radius: planet.radius,
                color: 'rgba(100, 100, 255, 0.1)'
            });
        });
    }

    generateMoons(planetName) {
        const moonCounts = {
            'Earth': 1,
            'Mars': 2,
            'Jupiter': 4,
            'Saturn': 3,
            'Uranus': 2,
            'Neptune': 1
        };

        const count = moonCounts[planetName] || 0;
        const moons = [];

        for (let i = 0; i < count; i++) {
            moons.push({
                orbitRadius: 8 + i * 3,
                angle: Math.random() * Math.PI * 2,
                speed: 0.01 + Math.random() * 0.02,
                size: 0.5 + Math.random() * 0.5
            });
        }

        return moons;
    }

    update() {
        const time = Date.now() * this.timeScale;
        
        this.planets.forEach(planet => {
            planet.angle += planet.speed;
            if (planet.angle > Math.PI * 2) planet.angle -= Math.PI * 2;
            
            // Update moons
            planet.moons.forEach(moon => {
                moon.angle += moon.speed;
                if (moon.angle > Math.PI * 2) moon.angle -= Math.PI * 2;
            });
        });

        this.draw();
    }

    draw() {
        const centerX = this.ctx.canvas.width / 2;
        const centerY = this.ctx.canvas.height / 2;

        this.drawOrbits(centerX, centerY);
        this.drawPlanets(centerX, centerY);
        this.drawLabels(centerX, centerY);
    }

    drawOrbits(centerX, centerY) {
        this.orbits.forEach(orbit => {
            this.ctx.strokeStyle = orbit.color;
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, orbit.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        });

        // Draw Sun in center
        const sunGrad = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 15
        );
        sunGrad.addColorStop(0, 'rgba(255, 255, 200, 1)');
        sunGrad.addColorStop(0.5, 'rgba(255, 200, 100, 0.8)');
        sunGrad.addColorStop(1, 'rgba(255, 150, 50, 0.4)');

        this.ctx.fillStyle = sunGrad;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
        this.ctx.fill();

        // Sun corona
        this.ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawPlanets(centerX, centerY) {
        this.planets.forEach(planet => {
            const planetX = centerX + Math.cos(planet.angle) * planet.radius;
            const planetY = centerY + Math.sin(planet.angle) * planet.radius;

            // Draw planet
            this.ctx.fillStyle = planet.color;
            this.ctx.beginPath();
            this.ctx.arc(planetX, planetY, planet.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Planet glow
            this.ctx.fillStyle = planet.color.replace('0.8', '0.3');
            this.ctx.beginPath();
            this.ctx.arc(planetX, planetY, planet.size * 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw moons
            planet.moons.forEach(moon => {
                const moonX = planetX + Math.cos(moon.angle) * moon.orbitRadius;
                const moonY = planetY + Math.sin(moon.angle) * moon.orbitRadius;

                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.beginPath();
                this.ctx.arc(moonX, moonY, moon.size, 0, Math.PI * 2);
                this.ctx.fill();

                // Moon orbit
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                this.ctx.lineWidth = 0.5;
                this.ctx.beginPath();
                this.ctx.arc(planetX, planetY, moon.orbitRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            });

            // Saturn's rings
            if (planet.name === 'Saturn') {
                this.ctx.strokeStyle = 'rgba(255, 255, 200, 0.6)';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.ellipse(planetX, planetY, planet.size * 2, planet.size * 0.8, planet.angle, 0, Math.PI * 2);
                this.ctx.stroke();

                this.ctx.strokeStyle = 'rgba(255, 255, 200, 0.4)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.ellipse(planetX, planetY, planet.size * 2.5, planet.size * 1, planet.angle, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });
    }

    drawLabels(centerX, centerY) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';

        this.planets.forEach(planet => {
            const planetX = centerX + Math.cos(planet.angle) * planet.radius;
            const planetY = centerY + Math.sin(planet.angle) * planet.radius;

            this.ctx.fillText(planet.name, planetX, planetY - planet.size - 8);
        });

        // Sun label
        this.ctx.fillText('Sun', centerX, centerY - 25);
    }
                             }
