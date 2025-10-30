export default class MoonPhaseManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.moonPhase = 0; // 0 = New Moon, 0.5 = Full Moon, 1.0 = New Moon
        this.moonPosition = { x: 0, y: 0 };
        this.moonSize = 40;
        this.huntTimes = {
            dawn: null,
            dusk: null,
            goldenHour: null,
            blueHour: null
        };
        
        this.calculateMoonPhase();
        this.calculateHuntTimes();
    }

    calculateMoonPhase() {
        // Simplified moon phase calculation based on current date
        const now = new Date();
        const start = new Date('2000-01-06'); // Known new moon
        const diff = now - start;
        const moonCycle = 29.53; // days
        const days = diff / (1000 * 60 * 60 * 24);
        
        this.moonPhase = (days % moonCycle) / moonCycle;
    }

    calculateHuntTimes() {
        // Calculate optimal hunting times based on moon phase and position
        const now = new Date();
        
        // Golden hours (first and last hour of sunlight)
        this.huntTimes.goldenHour = {
            morning: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 30), // 6:30 AM
            evening: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 30) // 6:30 PM
        };

        // Best hunting based on moon phase
        if (this.moonPhase > 0.4 && this.moonPhase < 0.6) {
            // Full moon - good for night hunting
            this.huntTimes.dawn = 'Excellent';
            this.huntTimes.dusk = 'Excellent';
        } else if (this.moonPhase > 0.1 && this.moonPhase < 0.3) {
            // Waxing crescent - good for morning
            this.huntTimes.dawn = 'Good';
            this.huntTimes.dusk = 'Fair';
        } else if (this.moonPhase > 0.7 && this.moonPhase < 0.9) {
            // Waning crescent - good for evening
            this.huntTimes.dawn = 'Fair';
            this.huntTimes.dusk = 'Good';
        } else {
            // New moon or quarters - average
            this.huntTimes.dawn = 'Fair';
            this.huntTimes.dusk = 'Fair';
        }

        // Blue hour (civil twilight)
        this.huntTimes.blueHour = {
            morning: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 5, 45), // 5:45 AM
            evening: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 15) // 7:15 PM
        };
    }

    update() {
        this.updateMoonPosition();
        this.draw();
    }

    updateMoonPosition() {
        // Animate moon across the sky
        const time = Date.now() * 0.0001;
        this.moonPosition.x = this.ctx.canvas.width * 0.7 + Math.sin(time) * 50;
        this.moonPosition.y = this.ctx.canvas.height * 0.3 + Math.cos(time * 0.7) * 30;
    }

    draw() {
        this.drawMoon();
        this.drawMoonPhaseInfo();
        this.drawHuntTimes();
    }

    drawMoon() {
        const { x, y } = this.moonPosition;
        
        // Draw moon sphere
        const moonGrad = this.ctx.createRadialGradient(x, y, 0, x, y, this.moonSize);
        moonGrad.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
        moonGrad.addColorStop(1, 'rgba(200, 200, 150, 0.7)');
        
        this.ctx.fillStyle = moonGrad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.moonSize, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw moon phase shadow
        this.drawMoonPhaseShadow(x, y);

        // Draw craters
        this.drawMoonCraters(x, y);

        // Moon glow
        const glowGrad = this.ctx.createRadialGradient(x, y, 0, x, y, this.moonSize * 1.5);
        glowGrad.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        glowGrad.addColorStop(1, 'rgba(255, 255, 200, 0)');
        
        this.ctx.fillStyle = glowGrad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.moonSize * 1.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawMoonPhaseShadow(x, y) {
        const shadowWidth = this.moonSize * 2 * Math.abs(this.moonPhase - 0.5) * 2;
        
        if (this.moonPhase < 0.5) {
            // Waxing - shadow on right
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.beginPath();
            this.ctx.ellipse(x + shadowWidth/2, y, shadowWidth, this.moonSize, 0, -Math.PI/2, Math.PI/2);
            this.ctx.fill();
        } else if (this.moonPhase > 0.5) {
            // Waning - shadow on left
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.beginPath();
            this.ctx.ellipse(x - shadowWidth/2, y, shadowWidth, this.moonSize, 0, Math.PI/2, -Math.PI/2);
            this.ctx.fill();
        }
        // Full moon (0.5) and new moon (0) have no visible shadow
    }

    drawMoonCraters(x, y) {
        const craters = [
            { x: -15, y: -10, size: 8 },
            { x: 10, y: 5, size: 6 },
            { x: -5, y: 15, size: 5 },
            { x: 15, y: -12, size: 4 },
            { x: 0, y: -20, size: 7 }
        ];

        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        this.ctx.strokeStyle = 'rgba(80, 80, 80, 0.5)';
        this.ctx.lineWidth = 1;

        craters.forEach(crater => {
            this.ctx.beginPath();
            this.ctx.arc(x + crater.x, y + crater.y, crater.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        });
    }

    drawMoonPhaseInfo() {
        const phaseNames = [
            'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
            'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
        ];
        
        const phaseIndex = Math.floor(this.moonPhase * 8) % 8;
        const phaseName = phaseNames[phaseIndex];
        const illumination = Math.abs(0.5 - this.moonPhase) * 2; // 0-1 scale

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        this.ctx.fillText(`Moon Phase: ${phaseName}`, 20, 30);
        this.ctx.fillText(`Illumination: ${Math.round(illumination * 100)}%`, 20, 50);
        
        // Moon phase diagram
        this.drawPhaseDiagram(20, 70, 80, phaseIndex);
    }

    drawPhaseDiagram(x, y, size, phaseIndex) {
        // Draw circular diagram showing current phase
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        this.ctx.stroke();

        // Fill based on phase
        this.ctx.fillStyle = 'rgba(255, 255, 200, 0.7)';
        
        switch(phaseIndex) {
            case 0: // New Moon - no fill
                break;
            case 1: // Waxing Crescent - small right crescent
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, size/2, -Math.PI/2, Math.PI/2);
                this.ctx.fill();
                break;
            case 2: // First Quarter - right half
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, size/2, -Math.PI/2, Math.PI/2);
                this.ctx.fill();
                break;
            case 3: // Waxing Gibbous - mostly right
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, size/2, -Math.PI/2, Math.PI/2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(x + size/2 - size/8, y + size/2, size/2, -Math.PI/2, Math.PI/2, true);
                this.ctx.fill();
                break;
            case 4: // Full Moon - full circle
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
                this.ctx.fill();
                break;
            case 5: // Waning Gibbous - mostly left
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, size/2, Math.PI/2, -Math.PI/2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(x + size/2 + size/8, y + size/2, size/2, Math.PI/2, -Math.PI/2, true);
                this.ctx.fill();
                break;
            case 6: // Last Quarter - left half
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, size/2, Math.PI/2, -Math.PI/2);
                this.ctx.fill();
                break;
            case 7: // Waning Crescent - small left crescent
                this.ctx.beginPath();
                this.ctx.arc(x + size/2, y + size/2, size/2, Math.PI/2, -Math.PI/2);
                this.ctx.fill();
                break;
        }
    }

    drawHuntTimes() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        const startY = 170;
        this.ctx.fillText('Optimal Hunting Times:', 20, startY);
        this.ctx.fillText(`Dawn: ${this.huntTimes.dawn}`, 20, startY + 20);
        this.ctx.fillText(`Dusk: ${this.huntTimes.dusk}`, 20, startY + 40);
        
        this.ctx.fillText('Golden Hour:', 20, startY + 70);
        this.ctx.fillText(`Morning: ${this.huntTimes.goldenHour.morning.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, 20, startY + 90);
        this.ctx.fillText(`Evening: ${this.huntTimes.goldenHour.evening.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, 20, startY + 110);
        
        this.ctx.fillText('Blue Hour:', 20, startY + 140);
        this.ctx.fillText(`Morning: ${this.huntTimes.blueHour.morning.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, 20, startY + 160);
        this.ctx.fillText(`Evening: ${this.huntTimes.blueHour.evening.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, 20, startY + 180);
    }
}
