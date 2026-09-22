/**
 * Pluffy Bird: Main Game Controller
 * Manages game states, game loop, rendering pipeline, input events,
 * dynamic day/night parallax backgrounds, score tracking, and medals.
 */

const STATE = {
    START: 'START',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER'
};

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Internal logical resolution (sharp retro-modern 9:16 arcade ratio)
        this.width = 400;
        this.height = 640;
        this.floorHeight = 80;

        this.initCanvas();

        // Game Entities
        this.cat = new Cat(100, 260);
        this.obstacles = new ObstacleManager();
        this.collectibles = new CollectibleManager();
        this.particles = new ParticleSystem();

        // State & Scoring
        this.state = STATE.START;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('pluffy_cat_highscore') || '0', 10);
        this.speed = 2.4;
        this.baseSpeed = 2.4;
        this.maxSpeed = 3.8;

        // Background & Parallax
        this.bgScroll = 0;
        this.floorScroll = 0;
        this.time = 0;
        this.shakeTimer = 0;

        // Cloud objects
        this.clouds = [
            { x: 30, y: 80, s: 1.2, speed: 0.3 },
            { x: 190, y: 140, s: 0.8, speed: 0.2 },
            { x: 320, y: 60, s: 1.0, speed: 0.25 },
            { x: 440, y: 110, s: 1.1, speed: 0.28 }
        ];

        // Twinkling stars for night mode
        this.stars = [];
        for (let i = 0; i < 35; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * (this.height - 200),
                r: Math.random() * 1.6 + 0.6,
                twinkle: Math.random() * Math.PI * 2
            });
        }

        // DOM elements
        this.dom = {
            scoreDisplay: document.getElementById('currentScore'),
            highScoreDisplay: document.getElementById('startHighScore'),
            startScreen: document.getElementById('startScreen'),
            gameOverModal: document.getElementById('gameOverModal'),
            finalScore: document.getElementById('finalScore'),
            bestScore: document.getElementById('bestScore'),
            medalIcon: document.getElementById('medalIcon'),
            medalTitle: document.getElementById('medalTitle'),
            newBestBadge: document.getElementById('newBestBadge'),
            pauseOverlay: document.getElementById('pauseOverlay'),
            muteBtn: document.getElementById('muteBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            skinSelects: document.querySelectorAll('.skin-pill')
        };

        this.initEvents();
        this.updateUI();

        // Start render loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    initCanvas() {
        // Handle high-DPI (Retina) scaling
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);

        // Resize responsiveness
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const container = document.getElementById('gameContainer');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const scale = Math.min(containerWidth / this.width, containerHeight / this.height);
        this.canvas.style.width = `${this.width * scale}px`;
        this.canvas.style.height = `${this.height * scale}px`;
    }

    initEvents() {
        // Universal action trigger (Space / Tap / Click)
        const handleAction = (e) => {
            if (e) {
                // Don't trigger flap if clicking UI buttons
                if (e.target && (e.target.closest('.ui-btn') || e.target.closest('.skin-pill'))) {
                    return;
                }
            }

            if (this.state === STATE.START) {
                this.startGame();
            } else if (this.state === STATE.PLAYING) {
                this.cat.flap(this.particles);
            } else if (this.state === STATE.GAMEOVER && this.gameOverCooldown <= 0) {
                this.resetGame();
            }
        };

        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                handleAction();
            } else if (e.code === 'KeyP' || e.code === 'Escape') {
                e.preventDefault();
                this.togglePause();
            } else if (e.code === 'KeyM') {
                e.preventDefault();
                this.toggleMute();
            }
        });

        // Mouse / Touch Controls on canvas
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleAction(e);
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleAction(e);
        }, { passive: false });

        // Restart button in Game Over Modal
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.resetGame());
        }

        // Mute button
        if (this.dom.muteBtn) {
            this.dom.muteBtn.addEventListener('click', () => this.toggleMute());
        }

        // Pause button
        if (this.dom.pauseBtn) {
            this.dom.pauseBtn.addEventListener('click', () => this.togglePause());
        }

        // Skin pills
        this.dom.skinSelects.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const skin = btn.dataset.skin;
                this.cat.setSkin(skin);
                this.dom.skinSelects.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    startGame() {
        this.state = STATE.PLAYING;
        this.dom.startScreen.classList.add('hidden');
        this.dom.gameOverModal.classList.add('hidden');
        this.cat.flap(this.particles);
    }

    togglePause() {
        if (this.state === STATE.PLAYING) {
            this.state = STATE.PAUSED;
            this.dom.pauseOverlay.classList.remove('hidden');
        } else if (this.state === STATE.PAUSED) {
            this.state = STATE.PLAYING;
            this.dom.pauseOverlay.classList.add('hidden');
        }
    }

    toggleMute() {
        if (window.soundEngine) {
            const isMuted = window.soundEngine.toggleMute();
            this.dom.muteBtn.innerHTML = isMuted ? '🔇' : '🔊';
            this.dom.muteBtn.setAttribute('title', isMuted ? 'Unmute (M)' : 'Mute (M)');
        }
    }

    triggerGameOver() {
        this.state = STATE.GAMEOVER;
        this.gameOverCooldown = 0.5; // Prevent instant accidental restart
        this.shakeTimer = 0.25; // Screen shake

        this.cat.die();

        // Check High Score
        const isNewBest = this.score > this.highScore;
        if (isNewBest) {
            this.highScore = this.score;
            localStorage.setItem('pluffy_cat_highscore', this.highScore.toString());
            this.particles.spawnConfetti(this.width, this.height);
            if (window.soundEngine) {
                window.soundEngine.playFanfare();
            }
        }

        // Update Modal
        this.dom.finalScore.innerText = this.score;
        this.dom.bestScore.innerText = this.highScore;
        this.dom.newBestBadge.classList.toggle('hidden', !isNewBest);

        // Award Medal
        this.updateMedal();

        setTimeout(() => {
            this.dom.gameOverModal.classList.remove('hidden');
        }, 450);
    }

    updateMedal() {
        let medal = { icon: '🐾', title: 'Fluffy Kitten' };
        if (this.score >= 50) {
            medal = { icon: '👑', title: 'Diamond Cat God' };
        } else if (this.score >= 30) {
            medal = { icon: '🥇', title: 'Golden Collar' };
        } else if (this.score >= 15) {
            medal = { icon: '🥈', title: 'Silver Fish' };
        } else if (this.score >= 5) {
            medal = { icon: '🥉', title: 'Bronze Bell' };
        }

        this.dom.medalIcon.innerText = medal.icon;
        this.dom.medalTitle.innerText = medal.title;
    }

    resetGame() {
        this.score = 0;
        this.speed = this.baseSpeed;
        this.cat.reset();
        this.obstacles.reset();
        this.collectibles.reset();
        this.particles.reset();

        this.dom.gameOverModal.classList.add('hidden');
        this.dom.startScreen.classList.remove('hidden');
        this.state = STATE.START;
        this.updateUI();
    }

    updateUI() {
        this.dom.scoreDisplay.innerText = this.score;
        this.dom.highScoreDisplay.innerText = this.highScore;
    }

    // Main Game Loop
    loop(currentTime) {
        const delta = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        const dt = delta * 60; // Normalize to 60fps unit
        this.lastTime = currentTime;

        this.update(dt, delta);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt, delta) {
        this.time += delta;

        if (this.gameOverCooldown > 0) {
            this.gameOverCooldown -= delta;
        }

        // Screen shake decay
        if (this.shakeTimer > 0) {
            this.shakeTimer -= delta;
        }

        // Always update background cloud floating
        for (const cloud of this.clouds) {
            cloud.x -= cloud.speed * dt;
            if (cloud.x < -120) cloud.x = this.width + 40;
        }

        if (this.state === STATE.START) {
            // Cute idle bobbing animation on start screen
            this.cat.y = 260 + Math.sin(this.time * 4) * 9;
            this.cat.rotation = Math.sin(this.time * 3) * 0.08;
            this.cat.wingAngle = Math.sin(this.time * 8) * 0.4;
            this.cat.tailAngle = Math.sin(this.time * 6) * 0.3;
            this.floorScroll = (this.floorScroll + this.speed * 0.5 * dt) % 36;
        } else if (this.state === STATE.PLAYING) {
            // Speed progression
            this.speed = Math.min(this.maxSpeed, this.baseSpeed + (this.score * 0.035));
            this.floorScroll = (this.floorScroll + this.speed * dt) % 36;

            // Update Cat physics
            const hitFloor = this.cat.update(dt, { floorY: this.height - this.floorHeight });
            if (hitFloor) {
                this.triggerGameOver();
                return;
            }

            // Update Obstacles & check scoring
            const scored = this.obstacles.update(
                dt,
                this.speed,
                this.width,
                this.height,
                this.floorHeight,
                this.score,
                this.cat,
                this.collectibles
            );

            if (scored) {
                this.score += 1;
                this.updateUI();
            }

            // Update Collectibles (fish cookies / catnip)
            const bonusPoints = this.collectibles.update(dt, this.speed, this.cat, this.particles);
            if (bonusPoints > 0) {
                this.score += bonusPoints;
                this.updateUI();
            }

            // Collision check with Scratching Posts
            if (this.obstacles.checkCollision(this.cat)) {
                this.triggerGameOver();
            }
        } else if (this.state === STATE.GAMEOVER) {
            // Cat falls to floor with comical spin
            this.cat.update(dt, { floorY: this.height - this.floorHeight });
        }

        // Always update active particles
        this.particles.update(dt);
    }

    render() {
        this.ctx.save();

        // Screen shake effect
        if (this.shakeTimer > 0) {
            const shakeAmt = (this.shakeTimer / 0.25) * 6;
            const sx = (Math.random() - 0.5) * shakeAmt;
            const sy = (Math.random() - 0.5) * shakeAmt;
            this.ctx.translate(sx, sy);
        }

        // 1. Draw Parallax Background Sky (Day / Sunset / Night cycle)
        this.drawBackground();

        // 2. Draw Obstacles (Scratching Posts)
        this.obstacles.draw(this.ctx, this.floorHeight);

        // 3. Draw Collectibles (Golden Fish / Catnip)
        this.collectibles.draw(this.ctx);

        // 4. Draw Floor & Pawprints
        this.drawFloor();

        // 5. Draw Particles (Feathers, Sparkles, Confetti)
        this.particles.draw(this.ctx);

        // 6. Draw Cat Character
        this.cat.draw(this.ctx);

        this.ctx.restore();
    }

    drawBackground() {
        const h = this.height - this.floorHeight;

        // Dynamic Sky Gradient based on score
        const grad = this.ctx.createLinearGradient(0, 0, 0, h);

        if (this.score < 10) {
            // Daylight Pastel Sky
            grad.addColorStop(0, '#74B9FF');
            grad.addColorStop(0.55, '#A0E7E5');
            grad.addColorStop(1, '#FFF2D8');
        } else if (this.score < 25) {
            // Cozy Warm Sunset
            grad.addColorStop(0, '#6C5CE7');
            grad.addColorStop(0.4, '#FD79A8');
            grad.addColorStop(0.75, '#FFA07A');
            grad.addColorStop(1, '#FEEAA7');
        } else {
            // Starry Cat Night
            grad.addColorStop(0, '#191928');
            grad.addColorStop(0.5, '#2D2B55');
            grad.addColorStop(1, '#534C7A');
        }

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, h);

        // Night stars & Moon
        if (this.score >= 20) {
            this.drawNightSky(h);
        } else {
            // Sun for day/sunset
            this.drawSun(h);
        }

        // Distant cozy cat houses & trees skyline
        this.drawCitySilhouette(h);

        // Fluffy Drifting Clouds
        this.drawClouds();
    }

    drawSun(h) {
        this.ctx.save();
        const isSunset = this.score >= 10;
        const sunY = isSunset ? 180 : 90;
        const sunColor = isSunset ? '#FFA502' : '#FFF9A6';
        const haloColor = isSunset ? 'rgba(255, 165, 2, 0.25)' : 'rgba(255, 249, 166, 0.3)';

        // Glow halo
        this.ctx.fillStyle = haloColor;
        this.ctx.beginPath();
        this.ctx.arc(320, sunY, 44, 0, Math.PI * 2);
        this.ctx.fill();

        // Sun disc
        this.ctx.fillStyle = sunColor;
        this.ctx.beginPath();
        this.ctx.arc(320, sunY, 26, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawNightSky(h) {
        this.ctx.save();
        // Stars
        for (const star of this.stars) {
            const alpha = 0.5 + Math.sin(this.time * 3 + star.twinkle) * 0.45;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Crescent sleeping-cat Moon
        this.ctx.fillStyle = '#FFEAA7';
        this.ctx.beginPath();
        this.ctx.arc(320, 80, 24, 0, Math.PI * 2);
        this.ctx.fill();

        // Moon shadow cutout to make crescent
        this.ctx.fillStyle = '#222238';
        this.ctx.beginPath();
        this.ctx.arc(310, 75, 21, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawCitySilhouette(h) {
        this.ctx.save();
        const baseColor = this.score >= 25 ? '#1E1E34' : (this.score >= 10 ? '#8B5A78' : '#88D1D1');
        this.ctx.fillStyle = baseColor;
        this.ctx.globalAlpha = 0.35;

        // Distant gentle rolling rooftops / hills
        this.ctx.beginPath();
        this.ctx.moveTo(0, h);
        this.ctx.lineTo(0, h - 55);
        this.ctx.quadraticCurveTo(80, h - 85, 160, h - 50);
        this.ctx.quadraticCurveTo(240, h - 90, 320, h - 55);
        this.ctx.quadraticCurveTo(360, h - 75, this.width, h - 60);
        this.ctx.lineTo(this.width, h);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    drawClouds() {
        this.ctx.save();
        for (const cloud of this.clouds) {
            this.ctx.fillStyle = this.score >= 20 ? 'rgba(80, 80, 120, 0.4)' : 'rgba(255, 255, 255, 0.75)';
            const s = cloud.s;
            const x = cloud.x;
            const y = cloud.y;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 16 * s, 0, Math.PI * 2);
            this.ctx.arc(x + 18 * s, y - 6 * s, 20 * s, 0, Math.PI * 2);
            this.ctx.arc(x + 38 * s, y, 15 * s, 0, Math.PI * 2);
            this.ctx.ellipse(x + 18 * s, y + 6 * s, 30 * s, 10 * s, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawFloor() {
        const floorY = this.height - this.floorHeight;

        // Cozy carpet / grass floor
        const grassGrad = this.ctx.createLinearGradient(0, floorY, 0, this.height);
        grassGrad.addColorStop(0, '#55EFC4');
        grassGrad.addColorStop(0.12, '#00B894');
        grassGrad.addColorStop(1, '#00947A');

        this.ctx.fillStyle = grassGrad;
        this.ctx.fillRect(0, floorY, this.width, this.floorHeight);

        // Top decorative wooden/carpet trim
        this.ctx.fillStyle = '#FDCB6E';
        this.ctx.fillRect(0, floorY, this.width, 6);

        // Scrolling cute paw prints on the ground!
        const pawSpacing = 36;
        const totalPaws = Math.ceil(this.width / pawSpacing) + 2;

        for (let i = 0; i < totalPaws; i++) {
            const px = (i * pawSpacing) - this.floorScroll;
            const py = floorY + 38 + (i % 2 === 0 ? -7 : 7);

            this.ctx.save();
            this.ctx.translate(px, py);
            this.ctx.rotate(0.18);
            this.ctx.fillStyle = 'rgba(0, 110, 90, 0.35)';

            // Pad
            this.ctx.beginPath();
            this.ctx.ellipse(0, 2, 4.5, 3.5, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // 3 small toes
            [-4, 0, 4].forEach(tx => {
                this.ctx.beginPath();
                this.ctx.arc(tx, -3, 1.6, 0, Math.PI * 2);
                this.ctx.fill();
            });

            this.ctx.restore();
        }
    }
}

// Instantiate game once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();

    // Developer / testing auto-demo mode via ?demo=1 or ?autoplay=1
    const params = new URLSearchParams(window.location.search);
    if (params.has('demo') || params.has('autoplay')) {
        const mode = params.get('demo');
        setTimeout(() => {
            window.game.startGame();
            if (mode === 'gameover') {
                window.game.score = 16;
                setTimeout(() => {
                    window.game.triggerGameOver();
                }, 100);
                return;
            }
            // Auto flap AI to keep cat airborne for screenshots
            setInterval(() => {
                if (window.game.state === STATE.PLAYING && window.game.cat.y > 280) {
                    window.game.cat.flap(window.game.particles);
                }
            }, 180);
        }, 100);
    }
});
