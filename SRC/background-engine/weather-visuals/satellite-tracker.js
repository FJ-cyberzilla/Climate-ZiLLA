export default class SatelliteTracker {
    constructor(ctx) {
        this.ctx = ctx;
        this.satellites = [];
        this.orbits = [];
        this.groundStations = [];
        this.communicationLines = [];
        
        this.initSatellites();
        this.initGroundStations();
    }

    initSatellites() {
        const satelliteTypes = [
            { type: 'weather', color: 'rgba(0, 255, 255, 0.8)', size: 4, count: 3 },
            { type: 'gps', color: 'rgba(0, 255, 0, 0.8)', size: 3, count: 4 },
            { type: 'comm', color: 'rgba(255, 255, 0, 0.8)', size: 3, count: 5 },
            { type: 'research', color: 'rgba(255, 100, 255, 0.8)', size: 3, count: 2 }
        ];

        satelliteTypes.forEach(config => {
            for (let i = 0; i < config.count; i++) {
                const orbitRadius = 150 + Math.random() * 300;
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.001 + Math.random() * 0.002;
                
                this.satellites.push({
                    type: config.type,
                    orbitRadius: orbitRadius,
                    angle: angle,
                    speed: speed,
                    size: config.size,
                    color: config.color,
                    trail: []
                });

                // Add orbit if not already exists
                if (!this.orbits.find(o => o.radius === orbitRadius)) {
                    this.orbits.push({ 
                        radius: orbitRadius, 
                        color: 'rgba(100, 100, 255, 0.1)',
                        visible: true 
                    });
                }
            }
        });
    }

    initGroundStations() {
        // Create ground stations around the world
        const stations = [
            { lat: 40.7, lon: -74.0, name: 'New York' },   // NYC
            { lat: 51.5, lon: -0.1, name: 'London' },      // London
            { lat: 35.7, lon: 139.8, name: 'Tokyo' },      // Tokyo
            { lat: -33.9, lon: 151.2, name: 'Sydney' },    // Sydney
            { lat: 55.8, lon: 37.6, name: 'Moscow' },      // Moscow
        ];

        stations.forEach(station => {
            // Convert lat/lon to canvas coordinates (simplified)
            const x = (station.lon + 180) * (this.ctx.canvas.width / 360);
            const y = (90 - station.lat) * (this.ctx.canvas.height / 180);
            
            this.groundStations.push({
                x: x,
                y: y,
                name: station.name,
                active: Math.random() > 0.3
            });
        });
    }

    update() {
        this.updateSatellites();
        this.updateCommunicationLines();
        this.draw();
    }

    updateSatellites() {
        this.satellites.forEach(sat => {
            sat.angle += sat.speed;
            if (sat.angle > Math.PI * 2) sat.angle -= Math.PI * 2;
            
            // Update trail (keep last 20 positions)
            const centerX = this.ctx.canvas.width / 2;
            const centerY = this.ctx.canvas.height / 2;
            const x = centerX + Math.cos(sat.angle) * sat.orbitRadius;
            const y = centerY + Math.sin(sat.angle) * sat.orbitRadius;
            
            sat.trail.push({ x, y, alpha: 1.0 });
            if (sat.trail.length > 20) {
                sat.trail.shift();
            }
            
            // Fade trail
            sat.trail.forEach(point => point.alpha -= 0.05);
        });
    }

    updateCommunicationLines() {
        this.communicationLines = [];
        
        this.satellites.forEach(sat => {
            const centerX = this.ctx.canvas.width / 2;
            const centerY = this.ctx.canvas.height / 2;
            const satX = centerX + Math.cos(sat.angle) * sat.orbitRadius;
            const satY = centerY + Math.sin(sat.angle) * sat.orbitRadius;
            
            // Connect to nearby ground stations
            this.groundStations.forEach(station => {
                if (station.active && Math.random() < 0.1) { // Random activation
                    const distance = Math.sqrt(
                        Math.pow(satX - station.x, 2) + Math.pow(satY - station.y, 2)
                    );
                    
                    if (distance < 300) { // Only connect to nearby stations
                        this.communicationLines.push({
                            from: { x: satX, y: satY },
                            to: { x: station.x, y: station.y },
                            strength: 1.0 - (distance / 300),
                            life: 1.0
                        });
                    }
                }
            });
        });
        
        // Update communication line life
        this.communicationLines.forEach(line => {
            line.life -= 0.02;
        });
        this.communicationLines = this.communicationLines.filter(line => line.life > 0);
    }

    draw() {
        this.drawOrbits();
        this.drawGroundStations();
        this.drawSatelliteTrails();
        this.drawSatellites();
        this.drawCommunicationLines();
    }

    drawOrbits() {
        const centerX = this.ctx.canvas.width / 2;
        const centerY = this.ctx.canvas.height / 2;
        
        this.orbits.forEach(orbit => {
            if (orbit.visible) {
                this.ctx.strokeStyle = orbit.color;
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, orbit.radius, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        });
    }

    drawGroundStations() {
        this.groundStations.forEach(station => {
            // Station base
            this.ctx.fillStyle = station.active ? 'rgba(0, 255, 0, 0.6)' : 'rgba(255, 0, 0, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(station.x, station.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Pulsing effect for active stations
            if (station.active) {
                this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(station.x, station.y, 8 + Math.sin(Date.now() * 0.005) * 4, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // Station label
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(station.name, station.x + 8, station.y - 8);
        });
    }

    drawSatelliteTrails() {
        this.satellites.forEach(sat => {
            for (let i = 0; i < sat.trail.length - 1; i++) {
                const point = sat.trail[i];
                const nextPoint = sat.trail[i + 1];
                
                this.ctx.strokeStyle = `rgba(100, 100, 255, ${point.alpha * 0.3})`;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(point.x, point.y);
                this.ctx.lineTo(nextPoint.x, nextPoint.y);
                this.ctx.stroke();
            }
        });
    }

    drawSatellites() {
        const centerX = this.ctx.canvas.width / 2;
        const centerY = this.ctx.canvas.height / 2;
        
        this.satellites.forEach(sat => {
            const x = centerX + Math.cos(sat.angle) * sat.orbitRadius;
            const y = centerY + Math.sin(sat.angle) * sat.orbitRadius;
            
            // Satellite body
            this.ctx.fillStyle = sat.color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, sat.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Solar panels
            this.ctx.strokeStyle = sat.color.replace('0.8', '0.6');
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x - sat.size * 1.5, y);
            this.ctx.lineTo(x + sat.size * 1.5, y);
            this.ctx.stroke();
            
            // Glow effect
            this.ctx.fillStyle = sat.color.replace('0.8', '0.3');
            this.ctx.beginPath();
            this.ctx.arc(x, y, sat.size * 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawCommunicationLines() {
        this.communicationLines.forEach(line => {
            const alpha = line.life * line.strength;
            
            this.ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([2, 2]);
            this.ctx.beginPath();
            this.ctx.moveTo(line.from.x, line.from.y);
            this.ctx.lineTo(line.to.x, line.to.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // Data packets moving along the line
            if (Math.random() < 0.3) {
                const progress = 1 - line.life;
                const packetX = line.from.x + (line.to.x - line.from.x) * progress;
                const packetY = line.from.y + (line.to.y - line.from.y) * progress;
                
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(packetX, packetY, 1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }
              }
