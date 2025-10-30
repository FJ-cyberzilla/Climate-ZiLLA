export default class RainThunderRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.raindrops = [];
        this.splashes = [];
        this.lightningBolts = [];
        this.lastLightning = 0;
        this.lightningFlash = 0;
        this.windStrength = 0.5;
        
        this.initRain();
    }

    initRain() {
        // Create multiple layers of raindrops for depth
        for (let layer = 0; layer < 3; layer++) {
            const dropCount = layer === 0 ? 200 : layer === 1 ? 150 : 100;
            const layerSpeed = [8, 12, 16][layer];
            const layerLength = [8, 12, 16][layer];
            const layerOpacity = [0.3, 0.5, 0.7][layer];
            
            for (let i = 0; i < dropCount; i++) {
                this.raindrops.push({
                    x: Math.random() * this.ctx.canvas.width,
                    y: Math.random() * this.ctx.canvas.height,
                    length: layerLength,
                    speed: layerSpeed + Math.random() * 4,
                    opacity: layerOpacity,
                    layer: layer,
                    windOffset: Math.random() * 100
                });
            }
        }
    }

    update() {
        this.updateRain();
        this.updateSplashes();
        this.updateLightning();
        this.draw();
    }

    updateRain() {
        this.raindrops.forEach(drop => {
            drop.y += drop.speed;
            drop.x += Math.sin((drop.y + drop.windOffset) * 0.01) * this.windStrength;
            
            if (drop.y > this.ctx.canvas.height) {
                // Create splash effect
                if (Math.random() < 0.3) {
                    this.splashes.push({
                        x: drop.x,
                        y: this.ctx.canvas.height,
                        size: 2 + Math.random() * 3,
                        life: 1.0,
                        maxLife: 0.5 + Math.random() * 0.5
                    });
                }
                
                // Reset drop
                drop.y = -drop.length;
                drop.x = Math.random() * this.ctx.canvas.width;
                drop.windOffset = Math.random() * 100;
            }
        });

        // Random lightning
        if (Date.now() - this.lastLightning > 4000 && Math.random() < 0.01) {
            this.createLightning();
            this.lastLightning = Date.now();
            this.lightningFlash = 1.0;
        }
    }

    updateSplashes() {
        this.splashes = this.splashes.filter(splash => {
            splash.life -= 0.02;
            return splash.life > 0;
        });
    }

    updateLightning() {
        if (this.lightningFlash > 0) {
            this.lightningFlash -= 0.05;
        }
        
        this.lightningBolts = this.lightningBolts.filter(bolt => {
            bolt.life -= 0.1;
            return bolt.life > 0;
        });
    }

    createLightning() {
        const startX = 100 + Math.random() * (this.ctx.canvas.width - 200);
        const branches = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < branches; i++) {
            this.lightningBolts.push({
                segments: this.generateLightningPath(
                    startX + (i - branches/2) * 40, 
                    0, 
                    startX + (Math.random() - 0.5) * 200, 
                    this.ctx.canvas.height
                ),
                life: 1.0,
                intensity: 0.8 + Math.random() * 0.2
            });
        }
    }

    generateLightningPath(startX, startY, endX, endY) {
        const segments = [];
        const points = 6 + Math.floor(Math.random() * 4);
        const jaggedness = 30;
        
        for (let i = 0; i <= points; i++) {
            const t = i / points;
            const baseX = startX + (endX - startX) * t;
            const baseY = startY + (endY - startY) * t;
            
            // Add randomness to create jagged lightning
            const x = baseX + (Math.random() - 0.5) * jaggedness * (1 - t * 0.5);
            const y = baseY + (Math.random() - 0.5) * jaggedness * (1 - t * 0.5);
            
            segments.push({ x, y });
        }
        
        return segments;
    }

    draw() {
        // Lightning flash effect
        if (this.lightningFlash > 0) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.3})`;
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }

        this.drawRain();
        this.drawSplashes();
        this.drawLightning();
    }

    drawRain() {
        this.raindrops.forEach(drop => {
            this.ctx.strokeStyle = `rgba(150, 200, 255, ${drop.opacity})`;
            this.ctx.lineWidth = 1;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(drop.x, drop.y);
            this.ctx.lineTo(
                drop.x + Math.sin(drop.y * 0.01) * 3, 
                drop.y + drop.length
            );
            this.ctx.stroke();
        });
    }

    drawSplashes() {
        this.splashes.forEach(splash => {
            const alpha = splash.life / splash.maxLife;
            this.ctx.fillStyle = `rgba(150, 200, 255, ${alpha * 0.6})`;
            this.ctx.beginPath();
            this.ctx.arc(splash.x, splash.y, splash.size * alpha, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Splash rings
            this.ctx.strokeStyle = `rgba(200, 220, 255, ${alpha * 0.3})`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(splash.x, splash.y, splash.size * (1 + alpha), 0, Math.PI * 2);
            this.ctx.stroke();
        });
    }

    drawLightning() {
        this.lightningBolts.forEach(bolt => {
            const alpha = bolt.life * bolt.intensity;
            
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            
            bolt.segments.forEach((point, index) => {
                if (index === 0) {
                    this.ctx.moveTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            });
            
            this.ctx.stroke();
            
            // Lightning glow
            this.ctx.strokeStyle = `rgba(100, 150, 255, ${alpha * 0.5})`;
            this.ctx.lineWidth = 6;
            this.ctx.beginPath();
            
            bolt.segments.forEach((point, index) => {
                if (index === 0) {
                    this.ctx.moveTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            });
            
            this.ctx.stroke();
        });
    }
}
