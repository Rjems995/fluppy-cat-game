/**
 * Pluffy Bird: Collectibles Engine
 * Floating golden fish snacks and catnip treats that spawn between obstacles for bonus score.
 */
class CollectibleManager {
    constructor() {
        this.items = [];
    }

    reset() {
        this.items = [];
    }

    // Spawn a treat in the center of an obstacle gap
    spawn(x, y) {
        // 75% golden fish (+2 pts), 25% catnip star (+5 pts)
        const isCatnip = Math.random() < 0.28;
        this.items.push({
            type: isCatnip ? 'catnip' : 'fish',
            x: x,
            baseY: y,
            y: y,
            points: isCatnip ? 5 : 2,
            radius: 14,
            collected: false,
            floatOffset: Math.random() * Math.PI * 2,
            sparkleTimer: 0
        });
    }

    update(dt = 1, speed, cat, particleSystem) {
        let earnedPoints = 0;

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.x -= speed * dt;
            item.floatOffset += 0.08 * dt;
            item.y = item.baseY + Math.sin(item.floatOffset) * 6;

            // Check collision with cat
            if (!item.collected && !cat.dead) {
                const dx = cat.x - item.x;
                const dy = cat.y - item.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < cat.radius + item.radius) {
                    item.collected = true;
                    earnedPoints += item.points;

                    // Trigger sound & particles
                    if (window.soundEngine) {
                        window.soundEngine.playCollect();
                    }
                    if (particleSystem) {
                        particleSystem.spawnSparkles(item.x, item.y);
                    }
                }
            }

            // Remove if off screen or collected
            if (item.x < -40 || item.collected) {
                this.items.splice(i, 1);
            }
        }

        return earnedPoints;
    }

    draw(ctx) {
        for (const item of this.items) {
            ctx.save();
            ctx.translate(item.x, item.y);

            // Floating glowing halo
            const pulse = 1 + Math.sin(item.floatOffset * 2) * 0.15;
            ctx.fillStyle = item.type === 'catnip' ? 'rgba(46, 204, 113, 0.25)' : 'rgba(255, 215, 0, 0.28)';
            ctx.beginPath();
            ctx.arc(0, 0, (item.radius + 4) * pulse, 0, Math.PI * 2);
            ctx.fill();

            if (item.type === 'fish') {
                this.drawGoldenFish(ctx);
            } else {
                this.drawCatnipStar(ctx);
            }

            ctx.restore();
        }
    }

    drawGoldenFish(ctx) {
        // Golden crispy fish cookie
        ctx.fillStyle = '#FFA502';
        ctx.strokeStyle = '#E67E22';
        ctx.lineWidth = 1.2;

        // Fish body
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Fish tail fin
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.lineTo(-15, -6);
        ctx.lineTo(-13, 0);
        ctx.lineTo(-15, 6);
        ctx.closePath();
        ctx.fillStyle = '#FFA502';
        ctx.fill();
        ctx.stroke();

        // Fish eye
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(6, -2, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2F3542';
        ctx.beginPath();
        ctx.arc(6.5, -2, 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Cute fish smile & scale arches
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(-1, 0, 3, -Math.PI / 2, Math.PI / 2, false);
        ctx.stroke();
    }

    drawCatnipStar(ctx) {
        // Magical emerald catnip leaf/star
        ctx.fillStyle = '#2ED573';
        ctx.strokeStyle = '#10AC84';
        ctx.lineWidth = 1.5;

        // Draw 4-pointed clover/star
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const x = Math.cos(angle) * 11;
            const y = Math.sin(angle) * 11;
            ctx.ellipse(x * 0.5, y * 0.5, 7, 4.5, angle, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();

        // Shiny center
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

window.CollectibleManager = CollectibleManager;

