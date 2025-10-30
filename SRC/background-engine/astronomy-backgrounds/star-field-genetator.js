export default class StarFieldGenerator {
    constructor(ctx) {
        this.ctx = ctx;
        this.stars = [];
        this.constellations = [];
        this.meteors = [];
        this.lastMeteor = 0;
        
        this.initStars();
        this.initConstellations();
    }

    initStars() {
        // Create stars with different brightness and sizes
        for (let i = 0; i < 1500; i++) {
            const size = Math.random() * 2.5;
            const brightness = 0.2 + Math.random() * 0.8;
            
            this.stars.push({
                x: Math.random() * this.ctx.canvas.width,
                y: Math.random() * this.ctx.canvas.height,
                size: size,
                originalSize: size,
                brightness: brightness,
                twinkleSpeed: 0.5 + Math.random() * 2,
                twinkleOffset: Math.random() * Math.PI * 2,
                color: this.getStarColor(brightness)
            });
        }
    }

    initConstellations() {
        // Major constellations with their star patterns
        this.constellations = [
            {
                name: 'Orion',
                stars: [
                    { x: 0.3, y: 0.4 }, { x: 0.4, y: 0.35 }, { x: 0.5, y: 0.3 },
                    { x: 0.6, y: 0.35 }, { x: 0.7, y: 0.4 }, { x: 0.45, y: 0.45 },
                    { x: 0.55, y: 0.45 }
                ],
                lines: [[0,1], [1,2], [2,3], [3,4], [1,5], [2,6]],
                visible: true
            },
            {
                name: 'Ursa Major',
                stars: [
                    { x: 0.2, y: 0.2 }, { x: 0.25, y: 0.25 }, { x: 0.3, y: 0.2 },
                    { x: 0.35, y: 0.25 }, { x: 0.4, y: 0.2 }, { x: 0.45, y: 0.25 },
                    { x: 0.5, y: 0.2 }
                ],
                lines: [[0,1], [1,2], [2,3], [3,4], [4,5], [5,6]],
                visible: true
            },
            {
                name: 'Cassiopeia',
                stars: [
                    { x: 0.7, y: 0.3 }, { x: 0.65, y: 0.35 }, { x: 0.7, y: 0.4 },
                    { x: 0.75, y: 0.35 }, { x: 0.8, y: 0.3 }
                ],
                lines: [[0,1], [1,2], [2,3], [3,4]],
                visible: true
            }
        ];
    }

    getStarColor(brightness) {
        // Different star colors based on temperature (simplified)
        if (brightness > 0.8) return { r: 255, g: 255, b: 255 }; // Blue-white
        if (brightness > 0.6) return { r: 255, g: 255, b: 200 }; // White
        if (brightness > 0.4) return { r: 255, g: 200, b: 100 }; // Yellow
        return { r: 255, g: 150, b: 100 }; // Orange-red
    }

    update() {
        this.updateStars();
        this.updateMeteors();
        this.draw();
    }

    updateStars() {
        // Make stars twinkle
        const time = Date.now() * 0.001;
        
        this.stars.forEach(star => {
            const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
            star.size = star.originalSize * twinkle;
        });

        // Occasionally spawn meteors
        if (Date.now() - this.lastMeteor > 8000 && Math.random() < 0.02) {
            this.createMeteor();
            this.lastMeteor = Date.now();
        }
    }

    updateMeteors() {
        this.meteors = this.meteors.filter(meteor => {
            meteor.x += meteor.speedX;
            meteor.y += meteor.speedY;
            meteor.life -= 0.02;
            
            // Create trail particles
            if (Math.random() < 0.7) {
                meteor.trail.push({
                    x: meteor.x,
                    y: meteor.y,
                    life: 1.0
                });
            }
            
            // Update trail
            meteor.trail.forEach(particle => particle.life -= 0.1);
            meteor.trail = meteor.trail.filter(particle => particle.life > 0);
            
            return meteor.life > 0 && 
                   meteor.x < this.ctx.canvas.width && 
                   meteor.y < this.ctx.canvas.height;
        });
    }

    createMeteor() {
        const startSide = Math.floor(Math.random() * 2); // 0 = top, 1 = right
        let startX, startY;
        
        if (startSide === 0) {
            startX = Math.random() * this.ctx.canvas.width;
            startY = -10;
        } else {
            startX = this.ctx.canvas.width + 10;
            startY = Math.random() * this.ctx.canvas.height * 0.5;
        }
        
        const speed = 8 + Math.random() * 6;
        const angle = -Math.PI/4 + (Math.random() - 0.5) * Math.PI/8;
        
        this.meteors.push({
            x: startX,
            y: startY,
            speedX: Math.cos(angle) * speed,
            speedY: Math.sin(angle) * speed,
            size: 2 + Math.random() * 2,
            life: 1.0,
            trail: []
        });
    }

    draw() {
        this.drawStars();
        this.drawConstellations();
        this.drawMeteors();
    }

    drawStars() {
        this.stars.forEach(star => {
            const alpha = star.brightness;
            const color = star.color;
            
            this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add glow for brighter stars
            if (star.brightness > 0.6) {
                const grad = this.ctx.createRadialGradient(
                    star.x, star.y, 0,
                    star.x, star.y, star.size * 3
                );
                grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.3})`);
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                this.ctx.fillStyle = grad;
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawConstellations() {
        this.constellations.forEach(constellation => {
            if (!constellation.visible) return;
            
            // Draw constellation lines
            this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
            this.ctx.lineWidth = 1;
            
            constellation.lines.forEach(line => {
                const startStar = constellation.stars[line[0]];
                const endStar = constellation.stars[line[1]];
                
                this.ctx.beginPath();
                this.ctx.moveTo(startStar.x * this.ctx.canvas.width, startStar.y * this.ctx.canvas.height);
                this.ctx.lineTo(endStar.x * this.ctx.canvas.width, endStar.y * this.ctx.canvas.height);
                this.ctx.stroke();
            });
            
            // Draw constellation name
            if (constellation.stars.length > 0) {
                const firstStar = constellation.stars[0];
                this.ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
                this.ctx.font = '12px Arial';
                this.ctx.fillText(
                    constellation.name,
                    firstStar.x * this.ctx.canvas.width + 15,
                    firstStar.y * this.ctx.canvas.height - 10
                );
            }
        });
    }

    drawMeteors() {
        this.meteors.forEach(meteor => {
            // Draw trail
            for (let i = 0; i < meteor.trail.length - 1; i++) {
                const point = meteor.trail[i];
                const nextPoint = meteor.trail[i + 1];
                const alpha = point.life * 0.8;
                
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.lineWidth = meteor.size * 0.5;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                this.ctx.moveTo(point.x, point.y);
                this.ctx.lineTo(nextPoint.x, nextPoint.y);
                this.ctx.stroke();
            }
            
            // Draw meteor head
            const headAlpha = meteor.life;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${headAlpha})`;
            this.ctx.beginPath();
            this.ctx.arc(meteor.x, meteor.y, meteor.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Meteor glow
            const grad = this.ctx.createRadialGradient(
                meteor.x, meteor.y, 0,
                meteor.x, meteor.y, meteor.size * 4
            );
            grad.addColorStop(0, `rgba(255, 255, 255, ${headAlpha * 0.5})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(meteor.x, meteor.y, meteor.size * 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
          }
