export default class MeteorShowerGenerator {
    constructor(ctx) {
        this.ctx = ctx;
        this.meteors = [];
        this.activeShower = null;
        this.showerIntensity = 0;
        this.lastMeteorTime = 0;
        
        this.meteorShowers = [
            {
                name: 'Perseids',
                peak: new Date('2024-08-12'),
                active: true,
                intensity: 0.8,
                radiant: { x: 0.3, y: 0.1 },
                color: 'rgba(255, 200, 100, 1)'
            },
            {
                name: 'Geminids',
                peak: new Date('2024-12-14'),
                active: false,
                intensity: 0.9,
                radiant: { x: 0.7, y: 0.2 },
                color: 'rgba(100, 200, 255, 1)'
            },
            {
                name: 'Leonids',
                peak: new Date('2024-11-17'),
                active: false,
                intensity: 0.6,
                radiant: { x: 0.5, y: 0.15 },
                color: 'rgba(255, 100, 100, 1)'
            }
        ];
        
        this.checkActiveShower();
    }

    checkActiveShower() {
        const now = new Date();
        this.meteorShowers.forEach(shower => {
            const daysFromPeak = Math.abs(now - shower.peak) / (1000 * 60 * 60 * 24);
            if (daysFromPeak < 30) { // Active within 30 days of peak
                shower.active = true;
                this.activeShower = shower;
                this.showerIntensity = shower.intensity * (1 - daysFromPeak / 30);
            }
        });
    }

    update() {
        this.updateMeteors();
        this.spawnMeteors();
        this.draw();
    }

    spawnMeteors() {
        const now = Date.now();
        const baseRate = 0.002; // Base meteor rate
        const showerRate = this.showerIntensity * 0.01; // Increased rate during showers
        
        if (now - this.lastMeteorTime > 100 && Math.random() < baseRate + showerRate) {
            this.createMeteor();
            this.lastMeteorTime = now;
        }
    }

    createMeteor() {
        let startX, startY, speedX, speedY;
        
        if (this.activeShower && Math.random() < this.showerIntensity) {
            // Shower meteor - originates from radiant point
            const radiantX = this.activeShower.radiant.x * this.ctx.canvas.width;
            const radiantY = this.activeShower.radiant.y * this.ctx.canvas.height;
            
            startX = radiantX + (Math.random() - 0.5) * 50;
            startY = radiantY + (Math.random() - 0.5) * 50;
            
            // Random direction away from radiant
            const angle = Math.atan2(this.ctx.canvas.height - radiantY, this.ctx.canvas.width - radiantX) + (Math.random() - 0.5) * 1;
            const speed = 12 + Math.random() * 8;
            
            speedX = Math.cos(angle) * speed;
            speedY = Math.sin(angle) * speed;
        } else {
            // Random meteor
            startX = Math.random() * this.ctx.canvas.width;
            startY = -10;
            const angle = -Math.PI/4 + (Math.random() - 0.5) * Math.PI/4;
            const speed = 8 + Math.random() * 6;
            
            speedX = Math.cos(angle) * speed;
            speedY = Math.sin(angle) * speed;
        }

        this.meteors.push({
            x: startX,
            y: startY,
            speedX: speedX,
            speedY: speedY,
            size: 1.5 + Math.random() * 2,
            life: 1.0,
            trail: [],
            color: this.activeShower ? this.activeShower.color : 'rgba(255, 255, 255, 1)',
            brightness: 0.7 + Math.random() * 0.3
        });
    }

    updateMeteors() {
        this.meteors = this.meteors.filter(meteor => {
            meteor.x += meteor.speedX;
            meteor.y += meteor.speedY;
            meteor.life -= 0.015;
            
            // Create trail particles
            if (Math.random() < 0.8) {
                meteor.trail.push({
                    x: meteor.x,
                    y: meteor.y,
                    life: 1.0,
                    size: meteor.size * 0.7
                });
            }
            
            // Update trail
            meteor.trail.forEach(particle => particle.life -= 0.08);
            meteor.trail = meteor.trail.filter(particle => particle.life > 0);
            
            return meteor.life > 0 && 
                   meteor.x > -50 && meteor.x < this.ctx.canvas.width + 50 &&
                   meteor.y > -50 && meteor.y < this.ctx.canvas.height + 50;
        });
    }

    draw() {
        this.drawMeteors();
        if (this.activeShower) {
            this.drawRadiant();
        }
    }

    drawMeteors() {
        this.meteors.forEach(meteor => {
            const alpha = meteor.life * meteor.brightness;
            
            // Draw trail
            for (let i = 0; i < meteor.trail.length - 1; i++) {
                const point = meteor.trail[i];
                const nextPoint = meteor.trail[i + 1];
                const trailAlpha = point.life * alpha * 0.6;
                
                this.ctx.strokeStyle = this.ctx.createLinearGradient(
                    point.x, point.y, nextPoint.x, nextPoint.y
                );
                const grad = this.ctx.createLinearGradient(point.x, point.y, nextPoint.x, nextPoint.y);
                grad.addColorStop(0, meteor.color.replace('1)', `${trailAlpha})`));
                grad.addColorStop(1, meteor.color.replace('1)', '0)'));
                
                this.ctx.strokeStyle = grad;
                this.ctx.lineWidth = point.size;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.moveTo(point.x, point.y);
                this.ctx.lineTo(nextPoint.x, nextPoint.y);
                this.ctx.stroke();
            }
            
            // Draw meteor head
            this.ctx.fillStyle = meteor.color.replace('1)', `${alpha})`);
            this.ctx.beginPath();
            this.ctx.arc(meteor.x, meteor.y, meteor.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Meteor glow
            const grad = this.ctx.createRadialGradient(
                meteor.x, meteor.y, 0,
                meteor.x, meteor.y, meteor.size * 3
            );
            grad.addColorStop(0, meteor.color.replace('1)', `${alpha * 0.5})`));
            grad.addColorStop(1, meteor.color.replace('1)', '0)'));
            
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(meteor.x, meteor.y, meteor.size * 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawRadiant() {
        if (!this.activeShower) return;
        
        const radiantX = this.activeShower.radiant.x * this.ctx.canvas.width;
        const radiantY = this.activeShower.radiant.y * this.ctx.canvas.height;
        
        // Radiant point glow
        const grad = this.ctx.createRadialGradient(
            radiantX, radiantY, 0,
            radiantX, radiantY, 30
        );
        grad.addColorStop(0, this.activeShower.color.replace('1)', '0.3)'));
        grad.addColorStop(1, this.activeShower.color.replace('1)', '0)'));
        
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(radiantX, radiantY, 30, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Radiant label
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.activeShower.name} Radiant`, radiantX, radiantY - 40);
        
        // Intensity indicator
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(`Intensity: ${Math.round(this.showerIntensity * 100)}%`, radiantX, radiantY - 25);
    }
              }
