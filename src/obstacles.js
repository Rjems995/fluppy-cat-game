/**
 * Pluffy Bird: Obstacle Engine
 * Generates cat-themed scratching post pillars with sisal rope wraps,
 * plush carpet caps, and dangling cat toys.
 */
class ObstacleManager {
    constructor() {
        this.obstacles = [];
        this.pipeWidth = 68;
        this.baseGap = 155;
        this.minGap = 132;
        this.spawnDistance = 230;
        this.timeSinceLastSpawn = 0;
    }

    reset() {
        this.obstacles = [];
        this.timeSinceLastSpawn = 0;
    }

    // Spawn a pair of scratching posts (top & bottom)
    spawn(canvasWidth, canvasHeight, floorHeight, currentScore, collectibleManager) {
        // Dynamic gap scaling with difficulty
        const gap = Math.max(this.minGap, this.baseGap - Math.floor(currentScore / 6) * 3);
        const playableHeight = canvasHeight - floorHeight;
        
        // Randomize gap center position
        const minCenter = gap / 2 + 50;
        const maxCenter = playableHeight - gap / 2 - 50;
        const gapCenter = minCenter + Math.random() * (maxCenter - minCenter);

        const topHeight = gapCenter - gap / 2;
        const bottomY = gapCenter + gap / 2;
        const bottomHeight = playableHeight - bottomY;

        // Dangling toy on some top pillars
        const hasToy = Math.random() < 0.45;

        const obstacle = {
            x: canvasWidth + 10,
            width: this.pipeWidth,
            topHeight: topHeight,
            bottomY: bottomY,
            bottomHeight: bottomHeight,
            passed: false,
            hasToy: hasToy,
            toySwing: Math.random() * Math.PI * 2,
            capHeight: 24,
            capOverhang: 6
        };

        this.obstacles.push(obstacle);

        // 45% chance to spawn a bonus treat in this gap
        if (collectibleManager && Math.random() < 0.45) {
            collectibleManager.spawn(obstacle.x + this.pipeWidth / 2, gapCenter);
        }
    }

    update(dt = 1, speed, canvasWidth, canvasHeight, floorHeight, currentScore, cat, collectibleManager) {
        let scored = false;

        // Check if we need to spawn a new obstacle
        if (this.obstacles.length === 0) {
            this.spawn(canvasWidth, canvasHeight, floorHeight, currentScore, collectibleManager);
        } else {
            const lastObstacle = this.obstacles[this.obstacles.length - 1];
            if (canvasWidth - lastObstacle.x >= this.spawnDistance) {
                this.spawn(canvasWidth, canvasHeight, floorHeight, currentScore, collectibleManager);
            }
        }

        // Move and process obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const ob = this.obstacles[i];
            ob.x -= speed * dt;
            ob.toySwing += 0.05 * dt;

            // Score point when passing player
            if (!ob.passed && ob.x + ob.width < cat.x) {
                ob.passed = true;
                scored = true;
                if (window.soundEngine) {
                    window.soundEngine.playScore();
                }
            }

            // Remove off-screen obstacles
            if (ob.x + ob.width + 20 < 0) {
                this.obstacles.splice(i, 1);
            }
        }

        return scored;
    }

    // Check collision between cat and all obstacles
    checkCollision(cat) {
        if (cat.dead) return false;

        const catX = cat.x;
        const catY = cat.y;
        const radius = cat.radius - 3; // Slight forgiveness margin for fair play

        for (const ob of this.obstacles) {
            // Check top obstacle
            if (this.circleRectCollision(catX, catY, radius, ob.x, 0, ob.width, ob.topHeight)) {
                return true;
            }

            // Check bottom obstacle
            if (this.circleRectCollision(catX, catY, radius, ob.x, ob.bottomY, ob.width, ob.bottomHeight)) {
                return true;
            }
        }

        return false;
    }

    // Accurate Circle vs Box collision
    circleRectCollision(cx, cy, r, rx, ry, rw, rh) {
        const closestX = Math.max(rx, Math.min(cx, rx + rw));
        const closestY = Math.max(ry, Math.min(cy, ry + rh));

        const dx = cx - closestX;
        const dy = cy - closestY;

        return (dx * dx + dy * dy) < (r * r);
    }

    draw(ctx, floorHeight) {
        for (const ob of this.obstacles) {
            // --- Draw Top Scratching Post ---
            this.drawPost(ctx, ob.x, 0, ob.width, ob.topHeight, true, ob);

            // --- Draw Bottom Scratching Post ---
            this.drawPost(ctx, ob.x, ob.bottomY, ob.width, ob.bottomHeight, false, ob);
        }
    }

    drawPost(ctx, x, y, width, height, isTop, ob) {
        if (height <= 0) return;

        ctx.save();

        // 1. Sisal Rope Cylinder
        const ropeGrad = ctx.createLinearGradient(x, 0, x + width, 0);
        ropeGrad.addColorStop(0, '#CBB493');
        ropeGrad.addColorStop(0.3, '#E6D5B8');
        ropeGrad.addColorStop(0.7, '#DFCEB1');
        ropeGrad.addColorStop(1, '#B09774');

        ctx.fillStyle = ropeGrad;
        ctx.fillRect(x, y, width, height);

        // Sisal rope texture wraps (horizontal grooves)
        ctx.strokeStyle = 'rgba(120, 95, 65, 0.28)';
        ctx.lineWidth = 1.5;
        const ropeStep = 9;
        const startY = y;
        const endY = y + height;

        ctx.beginPath();
        for (let py = startY; py <= endY; py += ropeStep) {
            ctx.moveTo(x, py);
            ctx.lineTo(x + width, py);
        }
        ctx.stroke();

        // Subtle vertical highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(x + 10, y, 14, height);

        // 2. Carpeted End Cap
        const capX = x - ob.capOverhang;
        const capWidth = width + ob.capOverhang * 2;
        const capY = isTop ? (y + height - ob.capHeight) : y;

        // Wood / Plush carpet cap
        const capGrad = ctx.createLinearGradient(capX, 0, capX + capWidth, 0);
        capGrad.addColorStop(0, '#9C88FF');
        capGrad.addColorStop(0.5, '#B8A9FF');
        capGrad.addColorStop(1, '#8168EE');

        ctx.fillStyle = capGrad;
        this.roundRect(ctx, capX, capY, capWidth, ob.capHeight, 6);
        ctx.fill();

        // Cap rim highlight & detail
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cute paw print decal on cap face
        this.drawPawPrint(ctx, capX + capWidth / 2, capY + ob.capHeight / 2, '#FFFFFF', 0.6);

        // 3. Dangling Cat Toy (Mouse or Bell) on Upper Post
        if (isTop && ob.hasToy) {
            this.drawDanglingToy(ctx, capX + capWidth / 2, capY + ob.capHeight, ob.toySwing);
        }

        ctx.restore();
    }

    drawDanglingToy(ctx, originX, originY, swing) {
        ctx.save();
        ctx.translate(originX, originY);

        const swingAngle = Math.sin(swing) * 0.35;
        ctx.rotate(swingAngle);

        const stringLength = 28;

        // Elastic string
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, stringLength);
        ctx.stroke();

        // Plush toy mouse / fluff ball
        ctx.translate(0, stringLength);
        
        // Toy body
        ctx.fillStyle = '#FF7675';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Toy mouse ears
        ctx.fillStyle = '#FAB1A0';
        ctx.beginPath();
        ctx.arc(-4, -5, 3, 0, Math.PI * 2);
        ctx.arc(4, -5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Toy mouse tail
        ctx.strokeStyle = '#FF7675';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.quadraticCurveTo(4, 12, 0, 16);
        ctx.stroke();

        ctx.restore();
    }

    drawPawPrint(ctx, x, y, color, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = color;

        // Main pad
        ctx.beginPath();
        ctx.ellipse(0, 2, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4 toe pads
        const toes = [
            { x: -5, y: -4 },
            { x: -2, y: -6.5 },
            { x: 2, y: -6.5 },
            { x: 5, y: -4 }
        ];

        toes.forEach(t => {
            ctx.beginPath();
            ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
}

window.ObstacleManager = ObstacleManager;

