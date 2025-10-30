export default class EclipseSimulator {
    constructor(ctx) {
        this.ctx = ctx;
        this.activeEclipse = null;
        this.eclipseProgress = 0;
        this.eclipsePhase = 'none'; // none, partial, total, ending
        this.eclipseTimer = 0;
        
        this.upcomingEclipses = [
            {
                type: 'lunar',
                date: new Date('2024-03-25'),
                duration: 180, // minutes
                magnitude: 0.95,
                visible: true
            },
            {
                type: 'solar',
                date: new Date('2024-04-08'),
                duration: 4, // minutes of totality
                magnitude: 1.05,
                visible: true,
                path: 'North America'
            }
        ];
        
        this.checkEclipse();
    }

    checkEclipse() {
        const now = new Date();
        this.upcomingEclipses.forEach(eclipse => {
            const hoursUntil = (eclipse.date - now) / (1000 * 60 * 60);
            if (hoursUntil < 24 && hoursUntil > -2) { // Active within time window
                this.activeEclipse = eclipse;
                this.eclipseProgress = Math.max(0, 1 - (hoursUntil / 24));
                this.eclipsePhase = hoursUntil <= 0 ? 'partial' : 'upcoming';
            }
        });
    }

    update() {
        if (this.activeEclipse) {
            this.updateEclipse();
        }
        this.draw();
    }

    updateEclipse() {
        this.eclipseTimer += 0.002;
        
        if (this.eclipsePhase === 'upcoming' && this.eclipseProgress >= 1) {
            this.eclipsePhase = 'partial';
            this.eclipseTimer = 0;
        }
        
        if (this.eclipsePhase === 'partial' && this.eclipseTimer > 0.3) {
            this.eclipsePhase = 'total';
            this.eclipseTimer = 0;
        }
        
        if (this.eclipsePhase === 'total' && this.eclipseTimer > 0.4) {
            this.eclipsePhase = 'ending';
            this.eclipseTimer = 0;
        }
        
        if (this.eclipsePhase === 'ending' && this.eclipseTimer > 0.3) {
            this.eclipsePhase = 'none';
            this.activeEclipse = null;
        }
    }

    draw() {
        if (!this.activeEclipse) return;

        const centerX = this.ctx.canvas.width / 2;
        const centerY = this.ctx.canvas.height / 2;
        
        if (this.activeEclipse.type === 'solar') {
            this.drawSolarEclipse(centerX, centerY);
        } else {
            this.drawLunarEclipse(centerX, centerY);
        }
        
        this.drawEclipseInfo(centerX, centerY);
    }

    drawSolarEclipse(centerX, centerY) {
        const sunRadius = 60;
        const moonRadius = sunRadius * (this.activeEclipse.magnitude || 1.0);
        const maxOffset = sunRadius + moonRadius;
        
        let moonOffset = 0;
        let coronaIntensity = 1;
        
        switch(this.eclipsePhase) {
            case 'partial':
                moonOffset = this.eclipseTimer * maxOffset;
                coronaIntensity = 1 - this.eclipseTimer * 0.8;
                break;
            case 'total':
                moonOffset = maxOffset;
                coronaIntensity = 0.2 + Math.sin(this.eclipseTimer * 10) * 0.1;
                break;
            case 'ending':
                moonOffset = maxOffset - this.eclipseTimer * maxOffset;
                coronaIntensity = 0.2 + this.eclipseTimer * 0.8;
                break;
            default:
                moonOffset = 0;
                coronaIntensity = 1;
        }

        // Draw sun
        const sunGrad = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, sunRadius
        );
        sunGrad.addColorStop(0, `rgba(255, 255, 200, ${coronaIntensity})`);
        sunGrad.addColorStop(0.7, `rgba(255, 200, 100, ${coronaIntensity * 0.8})`);
        sunGrad.addColorStop(1, `rgba(255, 150, 50, ${coronaIntensity * 0.4})`);

        this.ctx.fillStyle = sunGrad;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw moon
        this.ctx.fillStyle = 'rgba(50, 50, 50, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(centerX + moonOffset, centerY, moonRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Solar corona during totality
        if (this.eclipsePhase === 'total') {
            this.drawSolarCorona(centerX, centerY, sunRadius);
        }

        // Bailey's beads effect
        if (this.eclipsePhase === 'partial' || this.eclipsePhase === 'ending') {
            this.drawBaileysBeads(centerX, centerY, moonOffset, sunRadius, moonRadius);
        }
    }

    drawLunarEclipse(centerX, centerY) {
        const moonRadius = 40;
        const earthShadowRadius = moonRadius * 1.5;
        
        let shadowCoverage = 0;
        
        switch(this.eclipsePhase) {
            case 'partial':
                shadowCoverage = this.eclipseTimer;
                break;
            case 'total':
                shadowCoverage = 1;
                break;
            case 'ending':
                shadowCoverage = 1 - this.eclipseTimer;
                break;
            default:
                shadowCoverage = 0;
        }

        // Draw full moon
        this.ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, moonRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw earth's shadow
        if (shadowCoverage > 0) {
            const shadowGrad = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, earthShadowRadius
            );
            shadowGrad.addColorStop(0, 'rgba(100, 0, 0, 0.8)');
            shadowGrad.addColorStop(shadowCoverage, 'rgba(100, 0, 0, 0.6)');
            shadowGrad.addColorStop(1, 'rgba(100, 0, 0, 0)');

            this.ctx.fillStyle = shadowGrad;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, earthShadowRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Blood moon effect during totality
        if (this.eclipsePhase === 'total') {
            this.ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, moonRadius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawSolarCorona(centerX, centerY, sunRadius) {
        // Draw solar corona streams
        const streamCount = 12;
        for (let i = 0; i < streamCount; i++) {
            const angle = (i / streamCount) * Math.PI * 2;
            const streamLength = sunRadius * (2 + Math.sin(this.eclipseTimer * 5 + i) * 0.5);
            
            const grad = this.ctx.createLinearGradient(
                centerX, centerY,
                centerX + Math.cos(angle) * streamLength,
                centerY + Math.sin(angle) * streamLength
            );
            grad.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
            grad.addColorStop(0.5, 'rgba(255, 200, 100, 0.4)');
            grad.addColorStop(1, 'rgba(255, 150, 50, 0)');
            
            this.ctx.strokeStyle = grad;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(
                centerX + Math.cos(angle) * streamLength,
                centerY + Math.sin(angle) * streamLength
            );
            this.ctx.stroke();
        }

        // Diamond ring effect
        if (Math.sin(this.eclipseTimer * 20) > 0.8) {
            const ringGrad = this.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, sunRadius * 1.5
            );
            ringGrad.addColorStop(0, 'rgba(255, 255, 200, 0)');
            ringGrad.addColorStop(0.8, 'rgba(255, 255, 200, 0.3)');
            ringGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');
            
            this.ctx.fillStyle = ringGrad;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, sunRadius * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawBaileysBeads(centerX, centerY, moonOffset, sunRadius, moonRadius) {
        const beadCount = 8;
        const overlap = sunRadius + moonRadius - Math.abs(moonOffset);
        
        if (overlap > 0) {
            for (let i = 0; i < beadCount; i++) {
                const angle = (i / beadCount) * Math.PI * 2;
                const distance = sunRadius - 5;
                
                this.ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
                this.ctx.beginPath();
                this.ctx.arc(
                    centerX + Math.cos(angle) * distance,
                    centerY + Math.sin(angle) * distance,
                    2, 0, Math.PI * 2
                );
                this.ctx.fill();
            }
        }
    }

    drawEclipseInfo(centerX, centerY) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        
        const typeName = this.activeEclipse.type === 'solar' ? 'Solar Eclipse' : 'Lunar Eclipse';
        this.ctx.fillText(`${typeName} - ${this.eclipsePhase.toUpperCase()}`, centerX, centerY - 100);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillText(this.activeEclipse.date.toDateString(), centerX, centerY - 80);
        
        if (this.activeEclipse.path) {
            this.ctx.fillText(`Visible: ${this.activeEclipse.path}`, centerX, centerY - 60);
        }
        
        // Progress bar
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(centerX - 50, centerY + 80, 100, 10);
        
        this.ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
        this.ctx.fillRect(centerX - 50, centerY + 80, 100 * this.eclipseProgress, 10);
    }
}
