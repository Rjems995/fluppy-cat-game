/**
 * Pluffy Bird: Sound Synthesizer Engine
 * Uses the Web Audio API to procedurally generate all sound effects.
 * 100% self-contained: No external audio files or downloads needed!
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.masterVolume = 0.35;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.initialized = true;
            }
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }

    resume() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    // Flap / Meow chirp
    playFlap() {
        if (this.isMuted) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        
        // Cute chirpy "mew!" oscillator
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        // Pitch scoop upwards like a curious kitten chirp
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.16);

        // Fluffy feather whoosh filter
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(this.masterVolume * 0.8, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.19);

        // Soft wing air flutter
        const flutter = this.ctx.createOscillator();
        const flutterGain = this.ctx.createGain();
        flutter.type = 'sine';
        flutter.frequency.setValueAtTime(140, now);
        flutter.frequency.linearRampToValueAtTime(90, now + 0.12);
        flutterGain.gain.setValueAtTime(this.masterVolume * 0.3, now);
        flutterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        flutter.connect(flutterGain);
        flutterGain.connect(this.ctx.destination);
        flutter.start(now);
        flutter.stop(now + 0.13);
    }

    // Score point bell chime
    playScore() {
        if (this.isMuted) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [987.77, 1318.51]; // B5, E6 bell chord

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);

            gain.gain.setValueAtTime(0.001, now + idx * 0.04);
            gain.gain.linearRampToValueAtTime(this.masterVolume * 0.5, now + idx * 0.04 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.04);
            osc.stop(now + idx * 0.04 + 0.36);
        });
    }

    // Picked up a delicious fish treat!
    playCollect() {
        if (this.isMuted) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Sparkly arpeggio
        const arpeggio = [659.25, 783.99, 1046.50, 1318.51]; // E5, G5, C6, E6

        arpeggio.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            const startTime = now + idx * 0.04;
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.linearRampToValueAtTime(this.masterVolume * 0.6, startTime + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.23);
        });
    }

    // Collision bonk + sad meow
    playHit() {
        if (this.isMuted) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Bonk sound
        const bonk = this.ctx.createOscillator();
        const bonkGain = this.ctx.createGain();

        bonk.type = 'triangle';
        bonk.frequency.setValueAtTime(260, now);
        bonk.frequency.exponentialRampToValueAtTime(45, now + 0.15);

        bonkGain.gain.setValueAtTime(this.masterVolume * 0.9, now);
        bonkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        bonk.connect(bonkGain);
        bonkGain.connect(this.ctx.destination);

        bonk.start(now);
        bonk.stop(now + 0.19);

        // Comical sad descending meow
        const meow = this.ctx.createOscillator();
        const meowGain = this.ctx.createGain();

        meow.type = 'sawtooth';
        meow.frequency.setValueAtTime(620, now + 0.08);
        meow.frequency.linearRampToValueAtTime(480, now + 0.22);
        meow.frequency.linearRampToValueAtTime(220, now + 0.48);

        // Low pass filter to make the meow mellow/cute
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, now + 0.08);

        meowGain.gain.setValueAtTime(0.001, now + 0.08);
        meowGain.gain.linearRampToValueAtTime(this.masterVolume * 0.5, now + 0.14);
        meowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

        meow.connect(filter);
        filter.connect(meowGain);
        meowGain.connect(this.ctx.destination);

        meow.start(now + 0.08);
        meow.stop(now + 0.53);
    }

    // High Score fanfare
    playFanfare() {
        if (this.isMuted) return;
        this.resume();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const melody = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        melody.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            const t = now + i * 0.09;
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(this.masterVolume * 0.7, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.42);
        });
    }
}

// Global singleton instance
window.soundEngine = new SoundEngine();

