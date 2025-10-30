export default class HurricaneAnimator {
    constructor(ctx) {
        this.ctx = ctx;
        this.eye = { x: ctx.canvas.width / 2, y: ctx.canvas.height / 2, size: 80 };
        this.spiralArms = [];
        this.rainBands = [];
        this.rotation = 0;
        this.windParticles = [];
        this.intensity = 0.8;
        
        this.initHurricane();
        this.initRainBands();
        this.initWindParticles();
    }

    initHurricane() {
        // Create main spiral arms
        for (let i = 0; i < 6; i++) {
            this.spiralArms.push({
                angle: (i / 6) * Math.PI * 2,
                length: 400 + Math.random() * 300,
                width: 25 + Math.random() * 20,
                speed: 0.015 + Math.random() * 0.01,
                tightness: 0.3 + Math.random() * 0.3
            });
        }
    }

    initRainBands() {
        // Create outer rain bands
        for (let i = 0; i < 4; i++) {
            this.rainBands.push({
                radius: 300 + i * 120,
                width: 40 + i * 10,
                density: 0.3 + i * 0.2,
                speed: 0.005 + i * 0.002
            });
        }
    }

    initWindParticles() {
        // Create wind particles around hurricane
        for (let i = 0; i < 200; i++) {
            this.windParticles.push({
                angle: Math.random() * Math.PI * 2,
                distance: 200 + Math.random() * 500,
                size: 1 + Math.random() * 3,
                speed: 0.02 + Math.random() * 0.03,
                opacity: 0.3 + Math.random() * 0.4
            });
        }
    }

    update() {
        this.rotation += 0.02;
        this.updateWindParticles();
        this.draw();
    }

    updateWindParticles() {
        this.windParticles.forEach(particle => {
            particle.angle += particle.speed;
            particle.distance -= 0.5; // Slowly move inward
            
            if (particle.distance < 150) {
                particle.distance = 600;
                particle.angle = Math.random() * Math.PI * 2;
            }
        });
    }

    draw() {
        this.drawHurricaneEye();
        this.drawSpiralArms();
        this.drawRainBands();
        this.drawWindParticles();
    }

    drawHurricaneEye() {
        const grad = this.ctx.createRadialGradient(
            this.eye.x, this.eye.y, 0,
            this.eye.x, this.eye.y, this.eye.size
        );
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        grad.addColorStop(0.7, 'rgba(50, 50, 100, 0.5)');
        grad.addColorStop(1, 'rgba(100, 100, 150, 0.2)');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(this.eye.x, this.eye.y, this.eye.size, 0, Math.PI * 2);
        this.ctx.fill();

        // Eye wall
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.arc(this.eye.x, this.eye.y, this.eye.size, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawSpiralArms() {
        this.spiralArms.forEach(arm => {
            const currentAngle = arm.angle + this.rotation * arm.speed;
            
            this.ctx.strokeStyle = `rgba(200, 220, 255, ${0.5 + Math.sin(this.rotation) * 0.2})`;
            this.ctx.lineWidth = arm.width;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            
            for (let r = this.eye.size; r < arm.length; r += 3) {
                const spiralAngle = currentAngle + (r / arm.length) * Math.PI * 4 * arm.tightness;
                const x = this.eye.x + Math.cos(spiralAngle) * r;
                const y = this.eye.y + Math.sin(spiralAngle) * r;
                
                if (r === this.eye.size) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.stroke();
        });
    }

    drawRainBands() {
        this.rainBands.forEach(band => {
            const bandRotation = this.rotation * band.speed;
            
            this.ctx.strokeStyle = `rgba(100, 150, 255, ${band.density})`;
            this.ctx.lineWidth = band.width;
            this.ctx.beginPath();
            this.ctx.arc(this.eye.x, this.eye.y, band.radius, bandRotation, bandRotation + Math.PI * 1.5);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.arc(this.eye.x, this.eye.y, band.radius, bandRotation + Math.PI, bandRotation + Math.PI * 0.5);
            this.ctx.stroke();
        });
    }

    drawWindParticles() {
        this.windParticles.forEach(particle => {
            const x = this.eye.x + Math.cos(particle.angle) * particle.distance;
            const y = this.eye.y + Math.sin(particle.angle) * particle.distance;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}
