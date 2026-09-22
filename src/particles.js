/**
 * Pluffy Bird: Particle Engine
 * Handles feathers, sparkles, hearts, dust puffs, and celebration confetti.
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    reset() {
        this.particles = [];
    }

    // Spawn tiny soft feathers when flapping
    spawnFeathers(x, y) {
        const count = 3;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                type: 'feather',
                x: x - 10 + (Math.random() * 8 - 4),
                y: y + 4 + (Math.random() * 8 - 4),
                vx: -1.8 - Math.random() * 1.5,
                vy: -0.5 + Math.random() * 1.8,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.15,
                scale: 0.6 + Math.random() * 0.5,
                opacity: 0.9,
                color: '#ffffff',
                life: 1.0,
                decay: 0.02 + Math.random() * 0.015
            });
        }
    }

    // Sparkles when collecting a golden fish treat
    spawnSparkles(x, y) {
        const colors = ['#FFE066', '#FFD166', '#FFF3B0', '#FF9F1C', '#FFFFFF'];
        for (let i = 0; i < 14; i++) {
            const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.3;
            const speed = 2.0 + Math.random() * 3.5;
            this.particles.push({
                type: 'sparkle',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: Math.random() * Math.PI,
                vRot: (Math.random() - 0.5) * 0.3,
                scale: 0.7 + Math.random() * 0.6,
                opacity: 1.0,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                decay: 0.025 + Math.random() * 0.02
            });
        }

        // Spawn a cute heart too!
        this.particles.push({
            type: 'heart',
            x: x,
            y: y - 8,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -2.2,
            rotation: (Math.random() - 0.5) * 0.2,
            vRot: 0,
            scale: 1.2,
            opacity: 1.0,
            color: '#FF6B8B',
            life: 1.0,
            decay: 0.018
        });
    }

    // Score celebration confetti on game over / high score
    spawnConfetti(width, height) {
        const colors = ['#FF6B8B', '#FFE066', '#4D96FF', '#6BCB77', '#FF9F1C', '#9D4EDD'];
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                type: 'confetti',
                x: Math.random() * width,
                y: -10 - Math.random() * 50,
                vx: (Math.random() - 0.5) * 2,
                vy: 2.0 + Math.random() * 3.5,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.2,
                width: 6 + Math.random() * 4,
                height: 10 + Math.random() * 6,
                opacity: 1.0,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                decay: 0.008 + Math.random() * 0.006
            });
        }
    }

    // Soft dust cloud puff
    spawnDust(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                type: 'dust',
                x: x + (Math.random() - 0.5) * 16,
                y: y + (Math.random() - 0.5) * 6,
                vx: -1.2 + (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.0,
                radius: 4 + Math.random() * 5,
                opacity: 0.6,
                color: 'rgba(255, 255, 255, 0.7)',
                life: 1.0,
                decay: 0.035
            });
        }
    }

    update(dt = 1) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += (p.vRot || 0) * dt;
            p.life -= p.decay * dt;
            p.opacity = Math.max(0, p.life);

            // Gravity on confetti and feathers
            if (p.type === 'confetti') {
                p.vy += 0.04 * dt;
                p.vx += Math.sin(p.rotation) * 0.05 * dt;
            } else if (p.type === 'feather') {
                p.vy += 0.03 * dt;
                p.vx *= 0.98;
            } else if (p.type === 'sparkle') {
                p.vx *= 0.94;
                p.vy *= 0.94;
            } else if (p.type === 'heart') {
                p.vy *= 0.97;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.opacity;

            if (p.type === 'feather') {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.scale(p.scale, p.scale);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                // Quill line
                ctx.strokeStyle = 'rgba(230, 230, 230, 0.8)';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(-7, 0);
                ctx.lineTo(7, 0);
                ctx.stroke();
            } else if (p.type === 'sparkle') {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.scale(p.scale, p.scale);
                ctx.fillStyle = p.color;
                this.drawStar(ctx, 0, 0, 4, 6, 2.5);
            } else if (p.type === 'heart') {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.scale(p.scale, p.scale);
                ctx.fillStyle = p.color;
                this.drawHeart(ctx, 0, 0, 8);
            } else if (p.type === 'confetti') {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
            } else if (p.type === 'dust') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * (1 + (1 - p.life) * 0.4), 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }

    drawHeart(ctx, x, y, size) {
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(x, y + topCurveHeight);
        ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
        ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
        ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
        ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
        ctx.closePath();
        ctx.fill();
    }
}

window.ParticleSystem = ParticleSystem;

