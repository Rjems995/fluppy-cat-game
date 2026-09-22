/**
 * Pluffy Bird: Cat Player Character
 * Procedurally drawn chubby kitty with wings, dynamic animations, physics, and skins.
 */
class Cat {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.reset();

        // Skins definition
        this.skins = {
            orange: {
                name: 'Orange Tabby',
                body: '#FF9F43',
                belly: '#FFF1E0',
                stripes: '#E57E22',
                innerEar: '#FFB8B8',
                eyes: '#2ECC71',
                nose: '#FF7675',
                wing: '#FFFFFF'
            },
            tuxedo: {
                name: 'Tuxedo Cat',
                body: '#2D3436',
                belly: '#FFFFFF',
                stripes: null,
                innerEar: '#FFB8B8',
                eyes: '#F1C40F',
                nose: '#FF7675',
                wing: '#DFE6E9'
            },
            calico: {
                name: 'Sweet Calico',
                body: '#FFFFFF',
                belly: '#FFFFFF',
                patches: [
                    { x: -8, y: -10, r: 9, color: '#E17055' },
                    { x: 10, y: -4, r: 8, color: '#2D3436' },
                    { x: -2, y: 8, r: 6, color: '#E17055' }
                ],
                innerEar: '#FFB8B8',
                eyes: '#0984E3',
                nose: '#FF7675',
                wing: '#FFFFFF'
            },
            white: {
                name: 'Fluffy Marshmallow',
                body: '#FFFFFF',
                belly: '#F8F9FA',
                stripes: null,
                innerEar: '#FFC0CB',
                eyes: '#74B9FF',
                nose: '#FF9999',
                wing: '#E8F4FD'
            },
            void: {
                name: 'Midnight Void',
                body: '#1E1E28',
                belly: '#2B2B38',
                stripes: null,
                innerEar: '#9C27B0',
                eyes: '#FFEAA7',
                nose: '#D63031',
                wing: '#6C5CE7'
            }
        };

        this.currentSkinKey = 'orange';
        this.skin = this.skins[this.currentSkinKey];
    }

    setSkin(skinKey) {
        if (this.skins[skinKey]) {
            this.currentSkinKey = skinKey;
            this.skin = this.skins[skinKey];
        }
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.vy = 0;
        this.gravity = 0.38;
        this.jumpForce = -7.2;
        this.radius = 17; // Collision radius

        // Animation attributes
        this.rotation = 0;
        this.wingAngle = 0;
        this.wingSpeed = 0.2;
        this.flapAnim = 0;
        this.tailAngle = 0;
        this.squashX = 1;
        this.squashY = 1;
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.happyTimer = 0;
        this.dizzy = false;
        this.dead = false;
        this.time = 0;
    }

    flap(particleSystem) {
        if (this.dead) return;

        this.vy = this.jumpForce;
        this.flapAnim = 1.0;
        this.happyTimer = 0.25; // 250ms of happy ^ ^ face

        // Squash & stretch: stretch vertically
        this.squashX = 0.85;
        this.squashY = 1.25;

        // Spawn soft wing feathers
        if (particleSystem) {
            particleSystem.spawnFeathers(this.x, this.y);
        }

        // Sound effect
        if (window.soundEngine) {
            window.soundEngine.playFlap();
        }
    }

    die() {
        if (this.dead) return;
        this.dead = true;
        this.dizzy = true;
        this.vy = -4.5; // Little comical death hop
        if (window.soundEngine) {
            window.soundEngine.playHit();
        }
    }

    update(dt = 1, bounds) {
        this.time += dt * 0.05;

        // Apply gravity
        this.vy += this.gravity * dt;
        this.y += this.vy * dt;

        // Terminal fall velocity
        if (this.vy > 12) this.vy = 12;

        // Rotation physics
        if (!this.dead) {
            const targetRot = Math.min(Math.PI / 2.2, Math.max(-Math.PI / 6, (this.vy * 0.08)));
            this.rotation += (targetRot - this.rotation) * 0.15 * dt;
        } else {
            this.rotation += 0.08 * dt; // Spin comically when dead
        }

        // Wing flap animation
        if (this.flapAnim > 0) {
            this.flapAnim -= 0.05 * dt;
            this.wingAngle = Math.sin(this.time * 25) * 0.9;
        } else {
            this.wingAngle = Math.sin(this.time * 6) * 0.25;
        }

        // Tail wag animation
        this.tailAngle = Math.sin(this.time * 8 + this.vy * 0.2) * 0.35;

        // Return squash & stretch to normal 1.0
        this.squashX += (1 - this.squashX) * 0.12 * dt;
        this.squashY += (1 - this.squashY) * 0.12 * dt;

        // Blinking logic
        this.blinkTimer += dt * 0.016;
        if (this.blinkTimer > 3.5) {
            this.isBlinking = true;
            if (this.blinkTimer > 3.65) {
                this.isBlinking = false;
                this.blinkTimer = 0;
            }
        }

        // Happy expression timer
        if (this.happyTimer > 0) {
            this.happyTimer -= 0.016 * dt;
        }

        // Floor / ceiling bounds check
        if (bounds) {
            if (this.y - this.radius < 0) {
                this.y = this.radius;
                this.vy = 0;
            }
            if (this.y + this.radius > bounds.floorY) {
                this.y = bounds.floorY - this.radius;
                return true; // Hit floor
            }
        }

        return false;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.squashX, this.squashY);

        const s = this.skin;

        // --- 1. Draw Tail (Swishing behind body) ---
        ctx.save();
        ctx.translate(-18, 5);
        ctx.rotate(this.tailAngle);
        ctx.strokeStyle = s.body;
        ctx.lineWidth = 6.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-14, -8, -18, -2);
        ctx.stroke();

        // White/dark tail tip
        ctx.strokeStyle = s.belly || '#FFFFFF';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-13, -6);
        ctx.lineTo(-18, -2);
        ctx.stroke();
        ctx.restore();

        // --- 2. Back Wing (Angel Wing) ---
        this.drawWing(ctx, -6, -8, this.wingAngle * 0.8 - 0.2, s.wing, 0.85);

        // --- 3. Chubby Cat Body ---
        ctx.fillStyle = s.body;
        ctx.beginPath();
        ctx.ellipse(0, 2, 22, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cute Calico Patches if applicable
        if (s.patches) {
            ctx.save();
            ctx.clip();
            s.patches.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        // Tabby Stripes if applicable
        if (s.stripes) {
            ctx.strokeStyle = s.stripes;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            // Top stripes
            ctx.beginPath();
            ctx.moveTo(-6, -14);
            ctx.lineTo(-4, -8);
            ctx.moveTo(2, -15);
            ctx.lineTo(3, -9);
            ctx.moveTo(10, -13);
            ctx.lineTo(8, -8);
            ctx.stroke();
        }

        // Chubby Cream Belly Patch
        if (s.belly) {
            ctx.fillStyle = s.belly;
            ctx.beginPath();
            ctx.ellipse(4, 7, 13, 10, 0.1, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- 4. Cat Ears ---
        // Left Ear
        this.drawEar(ctx, -8, -13, s.body, s.innerEar, -0.2);
        // Right Ear
        this.drawEar(ctx, 8, -14, s.body, s.innerEar, 0.15);

        // --- 5. Front Wing (Flapping) ---
        this.drawWing(ctx, -2, -4, this.wingAngle, s.wing, 1.0);

        // --- 6. Cheeks & Fluff ---
        ctx.fillStyle = s.body;
        // Fluffy cheek tufts
        ctx.beginPath();
        ctx.moveTo(18, 3);
        ctx.lineTo(24, 6);
        ctx.lineTo(19, 9);
        ctx.fill();

        // --- 7. Face (Eyes, Nose, Mouth, Whiskers) ---
        this.drawFace(ctx, s);

        // --- 8. Cute Little Paws ---
        ctx.fillStyle = s.belly || s.body;
        ctx.beginPath();
        ctx.ellipse(2, 18, 5, 4, -0.1, 0, Math.PI * 2);
        ctx.ellipse(12, 17, 5, 4, 0.1, 0, Math.PI * 2);
        ctx.fill();
        // Tiny pink toe beans!
        ctx.fillStyle = '#FF9999';
        ctx.beginPath();
        ctx.arc(2, 18.5, 1.5, 0, Math.PI * 2);
        ctx.arc(12, 17.5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Debug Hitbox (optional, disabled by default)
        // ctx.strokeStyle = 'rgba(255,0,0,0.4)';
        // ctx.beginPath();
        // ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        // ctx.stroke();
    }

    drawEar(ctx, x, y, outerColor, innerColor, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        // Outer ear
        ctx.fillStyle = outerColor;
        ctx.beginPath();
        ctx.moveTo(-6, 4);
        ctx.lineTo(0, -11);
        ctx.lineTo(7, 4);
        ctx.closePath();
        ctx.fill();

        // Inner pink ear
        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.moveTo(-3, 3);
        ctx.lineTo(0, -7);
        ctx.lineTo(4, 3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    drawWing(ctx, x, y, angle, wingColor, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.rotate(angle);

        ctx.fillStyle = wingColor;
        ctx.strokeStyle = 'rgba(200, 200, 220, 0.7)';
        ctx.lineWidth = 1;

        // Wing feathers shape
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-10, -18, -25, -12, -28, -2);
        ctx.bezierCurveTo(-26, 4, -18, 6, -14, 2);
        ctx.bezierCurveTo(-12, 7, -6, 8, 0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Feather detail lines
        ctx.strokeStyle = 'rgba(180, 180, 200, 0.4)';
        ctx.beginPath();
        ctx.moveTo(-5, -3);
        ctx.quadraticCurveTo(-14, -8, -22, -2);
        ctx.moveTo(-4, 0);
        ctx.quadraticCurveTo(-10, 2, -14, 2);
        ctx.stroke();

        ctx.restore();
    }

    drawFace(ctx, s) {
        // Whiskers
        ctx.strokeStyle = 'rgba(60, 60, 60, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';
        // Right whiskers
        ctx.beginPath();
        ctx.moveTo(14, 5);
        ctx.lineTo(26, 3);
        ctx.moveTo(14, 7);
        ctx.lineTo(26, 8);
        ctx.stroke();
        // Left whiskers
        ctx.beginPath();
        ctx.moveTo(3, 5);
        ctx.lineTo(-7, 3);
        ctx.moveTo(3, 7);
        ctx.lineTo(-7, 8);
        ctx.stroke();

        // Cute Pink Nose
        ctx.fillStyle = s.nose;
        ctx.beginPath();
        ctx.moveTo(11, 4);
        ctx.lineTo(13, 7);
        ctx.lineTo(9, 7);
        ctx.closePath();
        ctx.fill();

        // :3 Mouth
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(9.5, 8.5, 2.2, 0, Math.PI, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(13.5, 8.5, 2.2, 0, Math.PI, false);
        ctx.stroke();

        // Rosy Blush Cheeks
        ctx.fillStyle = 'rgba(255, 120, 150, 0.35)';
        ctx.beginPath();
        ctx.ellipse(3, 8, 3.5, 2, 0, 0, Math.PI * 2);
        ctx.ellipse(17, 8, 3.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes rendering based on state
        if (this.dizzy) {
            // X_X dizzy eyes
            this.drawCrossEye(ctx, 6, 2);
            this.drawCrossEye(ctx, 15, 2);
        } else if (this.happyTimer > 0) {
            // ^ ^ Happy squint eyes
            ctx.strokeStyle = '#2D3436';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(6, 4, 3.2, Math.PI * 1.15, Math.PI * 1.85, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(15, 4, 3.2, Math.PI * 1.15, Math.PI * 1.85, false);
            ctx.stroke();
        } else if (this.isBlinking) {
            // Blinking closed eyes - -
            ctx.strokeStyle = '#2D3436';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(3, 3);
            ctx.lineTo(9, 3);
            ctx.moveTo(12, 3);
            ctx.lineTo(18, 3);
            ctx.stroke();
        } else {
            // Normal Round Eyes with Iris, Pupil, and Highlights
            this.drawEye(ctx, 6, 2, s.eyes, this.vy > 6);
            this.drawEye(ctx, 15, 2, s.eyes, this.vy > 6);
        }
    }

    drawEye(ctx, x, y, eyeColor, isScared) {
        ctx.save();
        ctx.translate(x, y);

        // White eye base
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Iris
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(0.5, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Pupil (larger if normal, small slit if scared)
        ctx.fillStyle = '#1A1A1A';
        ctx.beginPath();
        if (isScared) {
            ctx.ellipse(0.5, 0, 1.2, 3.2, 0, 0, Math.PI * 2);
        } else {
            ctx.arc(0.7, 0, 2.4, 0, Math.PI * 2);
        }
        ctx.fill();

        // Catchlight reflections (kawaii sparkle)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.5, -1.2, 1.2, 0, Math.PI * 2);
        ctx.arc(-0.2, 1.2, 0.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawCrossEye(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = '#2D3436';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-3, -3);
        ctx.lineTo(3, 3);
        ctx.moveTo(3, -3);
        ctx.lineTo(-3, 3);
        ctx.stroke();
        ctx.restore();
    }
}

window.Cat = Cat;

