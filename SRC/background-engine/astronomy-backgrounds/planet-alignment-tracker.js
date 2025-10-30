export default class PlanetAlignmentTracker {
    constructor(ctx) {
        this.ctx = ctx;
        this.planets = [];
        this.alignments = [];
        this.conjunctions = [];
        this.grandTrines = [];
        
        this.initPlanets();
        this.calculateAlignments();
    }

    initPlanets() {
        const planetData = [
            { name: 'Mercury', speed: 0.004, radius: 100, size: 2, color: 'rgba(200, 200, 200, 0.9)' },
            { name: 'Venus', speed: 0.003, radius: 140, size: 3, color: 'rgba(255, 200, 100, 0.9)' },
            { name: 'Earth', speed: 0.002, radius: 180, size: 3, color: 'rgba(100, 150, 255, 0.9)' },
            { name: 'Mars', speed: 0.0015, radius: 220, size: 2.5, color: 'rgba(255, 100, 100, 0.9)' },
            { name: 'Jupiter', speed: 0.001, radius: 280, size: 6, color: 'rgba(255, 200, 150, 0.9)' },
            { name: 'Saturn', speed: 0.0008, radius: 340, size: 5, color: 'rgba(255, 255, 150, 0.9)' },
            { name: 'Uranus', speed: 0.0006, radius: 400, size: 4, color: 'rgba(150, 255, 255, 0.9)' },
            { name: 'Neptune', speed: 0.0005, radius: 460, size: 4, color: 'rgba(100, 100, 255, 0.9)' }
        ];

        // Start planets at random positions
        planetData.forEach(planet => {
            this.planets.push({
                ...planet,
                angle: Math.random() * Math.PI * 2,
                x: 0,
                y: 0
            });
        });
    }

    calculateAlignments() {
        this.alignments = [];
        this.conjunctions = [];
        this.grandTrines = [];

        // Check for conjunctions (planets close together)
        for (let i = 0; i < this.planets.length; i++) {
            for (let j = i + 1; j < this.planets.length; j++) {
                const angleDiff = Math.abs(this.planets[i].angle - this.planets[j].angle);
                const minAngle = Math.min(angleDiff, Math.PI * 2 - angleDiff);
                
                if (minAngle < 0.1) { // ~5.7 degrees
                    this.conjunctions.push({
                        planet1: this.planets[i].name,
                        planet2: this.planets[j].name,
                        angle: minAngle,
                        strength: 1 - (minAngle / 0.1)
                    });
                }
            }
        }

        // Check for grand trines (120 degree separations)
        for (let i = 0; i < this.planets.length; i++) {
            for (let j = i + 1; j < this.planets.length; j++) {
                for (let k = j + 1; k < this.planets.length; k++) {
                    const angles = [
                        this.planets[i].angle,
                        this.planets[j].angle,
                        this.planets[k].angle
                    ].sort((a, b) => a - b);
                    
                    const diff1 = angles[1] - angles[0];
                    const diff2 = angles[2] - angles[1];
                    const diff3 = (Math.PI * 2 - angles[2]) + angles[0];
                    
                    const tolerance = 0.15; // ~8.6 degrees
                    if (Math.abs(diff1 - Math.PI * 2/3) < tolerance &&
                        Math.abs(diff2 - Math.PI * 2/3) < tolerance &&
                        Math.abs(diff3 - Math.PI * 2/3) < tolerance) {
                        
                        this.grandTrines.push({
                            planets: [this.planets[i].name, this.planets[j].name, this.planets[k].name],
                            strength: 1 - (Math.abs(diff1 - Math.PI * 2/3) / tolerance)
                        });
                    }
                }
            }
        }

        // Major alignments (3+ planets in close proximity)
        if (this.conjunctions.length >= 2) {
            const involvedPlanets = new Set();
            this.conjunctions.forEach(c => {
                involvedPlanets.add(c.planet1);
                involvedPlanets.add(c.planet2);
            });
            
            if (involvedPlanets.size >= 3) {
                this.alignments.push({
                    type: 'planetary_alignment',
                    planets: Array.from(involvedPlanets),
                    strength: this.conjunctions.reduce((sum, c) => sum + c.strength, 0) / this.conjunctions.length
                });
            }
        }
    }

    update() {
        // Update planet positions
        this.planets.forEach(planet => {
            planet.angle += planet.speed;
            if (planet.angle > Math.PI * 2) planet.angle -= Math.PI * 2;
            
            // Calculate screen position
            const centerX = this.ctx.canvas.width / 2;
            const centerY = this.ctx.canvas.height / 2;
            planet.x = centerX + Math.cos(planet.angle) * planet.radius;
            planet.y = centerY + Math.sin(planet.angle) * planet.radius;
        });

        // Recalculate alignments
        this.calculateAlignments();

        this.draw();
    }

    draw() {
        this.drawOrbits();
        this.drawPlanets();
        this.drawAlignments();
        this.drawAlignmentInfo();
    }

    drawOrbits() {
        const centerX = this.ctx.canvas.width / 2;
        const centerY = this.ctx.canvas.height / 2;

        this.planets.forEach(planet => {
            this.ctx.strokeStyle = 'rgba(100, 100, 255, 0.1)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, planet.radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        });
    }

    drawPlanets() {
        this.planets.forEach(planet => {
            // Planet body
            this.ctx.fillStyle = planet.color;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Planet glow
            this.ctx.fillStyle = planet.color.replace('0.9', '0.3');
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.size * 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Planet label
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(planet.name, planet.x, planet.y - planet.size - 8);
        });
    }

    drawAlignments() {
        // Draw conjunction lines
        this.conjunctions.forEach(conjunction => {
            const planet1 = this.planets.find(p => p.name === conjunction.planet1);
            const planet2 = this.planets.find(p => p.name === conjunction.planet2);
            
            if (planet1 && planet2) {
                const alpha = conjunction.strength * 0.8;
                this.ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(planet1.x, planet1.y);
                this.ctx.lineTo(planet2.x, planet2.y);
                this.ctx.stroke();
                
                // Conjunction point glow
                const midX = (planet1.x + planet2.x) / 2;
                const midY = (planet1.y + planet2.y) / 2;
                
                const grad = this.ctx.createRadialGradient(midX, midY, 0, midX, midY, 20);
                grad.addColorStop(0, `rgba(0, 255, 255, ${alpha * 0.5})`);
                grad.addColorStop(1, 'rgba(0, 255, 255, 0)');
                
                this.ctx.fillStyle = grad;
                this.ctx.beginPath();
                this.ctx.arc(midX, midY, 20, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        // Draw grand trines
        this.grandTrines.forEach(trine => {
            const planets = trine.planets.map(name => this.planets.find(p => p.name === name));
            
            if (planets.every(p => p)) {
                const alpha = trine.strength * 0.6;
                this.ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                
                planets.forEach((planet, index) => {
                    if (index === 0) {
                        this.ctx.moveTo(planet.x, planet.y);
                    } else {
                        this.ctx.lineTo(planet.x, planet.y);
                    }
                });
                this.ctx.closePath();
                this.ctx.stroke();
                
                // Trine center glow
                const centerX = planets.reduce((sum, p) => sum + p.x, 0) / planets.length;
                const centerY = planets.reduce((sum, p) => sum + p.y, 0) / planets.length;
                
                const grad = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
                grad.addColorStop(0, `rgba(255, 255, 0, ${alpha * 0.3})`);
                grad.addColorStop(1, 'rgba(255, 255, 0, 0)');
                
                this.ctx.fillStyle = grad;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawAlignmentInfo() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        
        const startX = this.ctx.canvas.width - 20;
        let startY = 30;
        
        this.ctx.fillText('Planetary Alignments', startX, startY);
        startY += 20;
        
        if (this.alignments.length > 0) {
            this.alignments.forEach(alignment => {
                this.ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
                this.ctx.fillText(`${alignment.planets.join(' + ')} Alignment`, startX, startY);
                startY += 15;
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.fillText(`Strength: ${Math.round(alignment.strength * 100)}%`, startX, startY);
                startY += 20;
            });
        }
        
        if (this.conjunctions.length > 0) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillText('Conjunctions:', startX, startY);
            startY += 15;
            
            this.conjunctions.forEach(conjunction => {
                this.ctx.fillStyle = 'rgba(100, 255, 255, 0.8)';
                this.ctx.fillText(`${conjunction.planet1} - ${conjunction.planet2}`, startX, startY);
                startY += 15;
            });
            startY += 5;
        }
        
        if (this.grandTrines.length > 0) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
            this.ctx.fillText('Grand Trines:', startX, startY);
            startY += 15;
            
            this.grandTrines.forEach(trine => {
                this.ctx.fillText(trine.planets.join(' - '), startX, startY);
                startY += 15;
            });
        }
        
        if (this.alignments.length === 0 && this.conjunctions.length === 0 && this.grandTrines.length === 0) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.fillText('No significant alignments', startX, startY);
        }
    }
}
