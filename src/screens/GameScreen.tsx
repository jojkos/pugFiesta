import { useEffect, useRef, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Joystick } from 'react-joystick-component';
import { supabase, isSupabaseEnabled } from '../lib/supabase';
import { useGameStore } from '../stores/gameStore';
import { GAME_CONFIG } from '../gameConfig';

// --- Constants Moved to gameConfig.ts ---

export default function GameScreen() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { t, i18n } = useTranslation();
    const { addScore, dressColor, setView, isMuted, setMuted } = useGameStore();
    
    // Game State Refs (Mutable for loop)
    const gameState = useRef<'countdown' | 'playing' | 'gameOver'>('countdown');
    const keys = useRef<{ [key: string]: boolean }>({});
    const player = useRef<any>(null);
    const femaleDogs = useRef<any[]>([]);
    const score = useRef(0);
    const timer = useRef(60);
    const lastTime = useRef(0);
    const femaleDogSpawnTimer = useRef(0);
    const taggedDogInfo = useRef<any>(null);
    const successMessages = useRef<any[]>([]);
    const heartAnimations = useRef<any[]>([]);
    const backgroundFlowers = useRef<any[]>([]);
    
    // Audio Refs
    const audioContext = useRef<any>(null);
    const synth = useRef<any>(null); // Tag sound
    const failSynth = useRef<any>(null);
    // const musicSynth = useRef<any>(null); // Removed
    const musicLoop = useRef<any>(null);
    const countdownValue = useRef(3);
    const isPausedRef = useRef(false);
    
    // Assets
    const assets = useRef<{
        player: HTMLImageElement | null;
        female: HTMLImageElement | null;
        dress: HTMLImageElement | null;
    }>({ player: null, female: null, dress: null });

    // React State for UI Overlays
    const [gameOver, setGameOver] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'success'|'error'>('idle');

    // --- Helpers ---
    const createParticle = (x: number, y: number) => ({
        x, y,
        size: Math.random() * 5 + 2,
        speedX: (Math.random() - 0.5) * 120,
        speedY: (Math.random() - 0.5) * 120 - 60,
        alpha: 1,
        duration: GAME_CONFIG.PARTICLE_DURATION,
        color: `hsl(${Math.random() * 60 + 200},100%,70%)`,
    });

    const speakText = (text: string, lang = 'en') => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        
        const getVoice = () => {
             const voices = window.speechSynthesis.getVoices();
             if (lang === 'cz') {
                 // Try various Czech codes
                 return voices.find(v => v.lang === 'cs-CZ') || 
                        voices.find(v => v.lang === 'cs_CZ') || 
                        voices.find(v => v.lang.startsWith('cs')) ||
                        voices.find(v => v.lang.includes('cz')); // Fallback
             }
             return voices.find(v => v.lang.startsWith('en'));
        };

        const u = new SpeechSynthesisUtterance(text);
        // Explicitly set lang for Android fallback
        u.lang = lang === 'cz' ? 'cs-CZ' : 'en-US';
        u.pitch = 1.0 + (Math.random() - 0.5) * 0.4;
        u.rate = 1.1;
        
        let voice = getVoice();
        if (voice) {
            u.voice = voice;
            window.speechSynthesis.speak(u);
        } else {
            // Retry once if voices weren't loaded
             window.speechSynthesis.onvoiceschanged = () => {
                voice = getVoice();
                if (voice) {
                    u.voice = voice;
                }
                // Speak regardless if voice found (uses u.lang)
                window.speechSynthesis.speak(u);
                window.speechSynthesis.onvoiceschanged = null; // Cleanup
             };
             // Attempt to speak immediately with lang fallback as well
             window.speechSynthesis.speak(u);
        }
    };

    const createFlower = (cw: number, ch: number) => {
        const petalColors = ["#FFEB3B", "#FFC107", "#FFF176", "#FF80AB", "#F8BBD0", "#E1BEE7", "#81D4FA", "#B3E5FC"];
        return {
            x: Math.random() * cw,
            y: Math.random() * (ch * 0.8) + ch * 0.2,
            stemHeight: Math.random() * (ch / 20) + ch / 30,
            centerRadius: Math.random() * (cw / 200) + cw / 250,
            petalRadius: Math.random() * (cw / 150) + cw / 200,
            numPetals: Math.floor(Math.random() * 3) + 5,
            petalColor: petalColors[Math.floor(Math.random() * petalColors.length)],
            stemColor: "#4CAF50",
        };
    };

    const createPlayerEntity = (cw: number, ch: number, currentScale: number, speed: number) => {
        const sw = GAME_CONFIG.PLAYER_BASE_WIDTH * currentScale;
        const sh = GAME_CONFIG.PLAYER_BASE_HEIGHT * currentScale;
        return {
            x: cw / 2 - sw / 2,
            y: ch / 2 - sh / 2,
            width: sw,
            height: sh,
            speed: speed,
            dx: 0, dy: 0,
            isDashing: false,
            dashTimer: 0,
            currentDashSpeed: 0,
            trail: [],
            maxTrailLength: 4,
            isCurrentlyTagging: false,
            tagLockTimer: 0,
            isMissLungeAnimating: false,
            missLungeTimer: 0,
            facingDirection: 1,
        };
    };

    const createFemaleDog = (cw: number, ch: number, currentScale: number, speed: number) => {
        const p = cw * 0.05;
        const sw = GAME_CONFIG.FEMALE_DOG_BASE_WIDTH * currentScale;
        const sh = GAME_CONFIG.FEMALE_DOG_BASE_HEIGHT * currentScale;
        return {
            x: Math.random() * (cw - sw - 2 * p) + p,
            y: Math.random() * (ch - sh - 2 * p) + p,
            width: sw,
            height: sh,
            speed: speed,
            dx: (Math.random() - 0.5) * 2,
            dy: (Math.random() - 0.5) * 2,
            moveTimer: Math.random() * 2 + 1,
            facingDirection: Math.random() < 0.5 ? -1 : 1,
        };
    };

    // --- Initialization ---
    useEffect(() => {
        // Load Images
        const pImg = new Image(); pImg.src = 'assets/sprites/pug.png';
        const fImg = new Image(); fImg.src = 'assets/sprites/femalePug.png';
        const dImg = new Image(); dImg.src = 'assets/sprites/dress.png';
        assets.current = { player: pImg, female: fImg, dress: dImg };

        // Keyboard Listeners
        const handleDown = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
        const handleUp = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);

        // Canvas Setup
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingEnabled = false;

        // Resize Handler (Strict 4:3 Aspect Ratio)
        const handleResize = () => {
            if (!canvas.parentElement) return;
            const cW = canvas.parentElement.clientWidth;
            const cH = canvas.parentElement.clientHeight;
            const ratio = 4 / 3;
            let nW = cW;
            let nH = cW / ratio;
            if (nH > cH) {
                nH = cH;
                nW = cH * ratio;
            }
            canvas.width = Math.floor(nW);
            canvas.height = Math.floor(nH);
            ctx.imageSmoothingEnabled = false;
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        // Audio Init
        const initAudio = async () => {
             if (audioContext.current) return;
             try {
                const Tone = await import('tone');
                if (Tone.context.state !== 'running') await Tone.start();
                
                audioContext.current = Tone;
                
                // Tag Sound (Sine)
                synth.current = new Tone.Synth({
                    oscillator: { type: "sine" },
                    envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.1 },
                }).toDestination();
                
                // Fail Sound (Square)
                failSynth.current = new Tone.Synth({
                    oscillator: { type: "square" },
                    envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
                    volume: -10,
                }).toDestination();
                
                // Music - Retro Synthwave (Softer Kick)
                const bassSynth = new Tone.Synth({ 
                    oscillator: { type: "triangle" },
                    envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.1 },
                    volume: GAME_CONFIG.MUSIC_VOLUME_BASS 
                }).toDestination();
                
                const leadSynth = new Tone.PolySynth(Tone.Synth, {
                    volume: GAME_CONFIG.MUSIC_VOLUME_LEAD,
                    oscillator: { type: "square" },
                    envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 1 }
                }).toDestination();
                
                // Bass Sequence (Sparser)
                const bassSeq = new Tone.Sequence((time, note) => {
                    if (note) bassSynth.triggerAttackRelease(note, "8n", time);
                }, ["C2", null, "E2", null, "G2", null, "C2", "G2"], "4n");
                
                // Melody Sequence
                const melodySeq = new Tone.Sequence((time, note) => {
                    if (note !== null) leadSynth.triggerAttackRelease(note, "8n", time);
                }, [
                    "C5", null, "E5", "G5", "C6", "G5", "E5", null,
                    "F5", null, "A5", "C6", "F6", "C6", "A5", null,
                    "G5", null, "B5", "D6", "G6", "D6", "B5", null,
                    "C5", "E5", "G5", "C6", "E6", "C6", "G5", "E5"
                ], "8n");

                musicLoop.current = {
                    start: () => {
                        bassSeq.start(0);
                        melodySeq.start(0);
                        Tone.Transport.start();
                    },
                    stop: () => {
                        bassSeq.stop();
                        melodySeq.stop();
                        Tone.Transport.stop();
                    }
                };
                
                Tone.Transport.bpm.value = GAME_CONFIG.MUSIC_BPM;

             } catch (e) { console.error("Audio init failed", e); }
        };
        // Init audio on first touch/click if not already
        const startAudio = () => { initAudio(); window.removeEventListener('click', startAudio); window.removeEventListener('touchstart', startAudio); };
        window.addEventListener('click', startAudio);
        window.addEventListener('touchstart', startAudio);
        // Try init immediately too e.g. if coming from menu
        initAudio();



        const initGame = () => {
             // ... assets setup moved to loop or refs ...
        
             // Reset Game State
             score.current = 0;
             timer.current = GAME_CONFIG.GAME_DURATION;
             gameState.current = 'countdown';
             countdownValue.current = GAME_CONFIG.COUNTDOWN_DURATION;
             
             // Setup Dogs
             const cw = canvas.width;
             const ch = canvas.height;
             const scaleFactor = cw / 800;
             // ... (Logic handled in loop now)
             
             // Reset entities
             const currentScale = GAME_CONFIG.SPRITE_SCALE_BASE * Math.max(0.7, Math.min(1.5, scaleFactor * 1.1));
             const pSpeed = GAME_CONFIG.PLAYER_SPEED_BASE * Math.max(0.8, scaleFactor);
             const fSpeed = GAME_CONFIG.FEMALE_DOG_SPEED_BASE * Math.max(0.8, scaleFactor);
             
             // Re-create initial entities
             player.current = createPlayerEntity(cw, ch, currentScale, pSpeed);
             femaleDogs.current = [];
             for (let i = 0; i < Math.floor(GAME_CONFIG.MAX_FEMALE_DOGS / 2) + 1; i++) {
                 femaleDogs.current.push(createFemaleDog(cw, ch, currentScale, fSpeed));
             }
             backgroundFlowers.current = [];
             const numFlowers = 15 + Math.floor(Math.random() * 10);
             for (let i = 0; i < numFlowers; i++) backgroundFlowers.current.push(createFlower(cw, ch));

             return () => {}; // No interval to clear
        };

        const cleanupGame = initGame();
        
        // Ensure voices are loaded
        window.speechSynthesis.getVoices();

        // --- Game Loop ---
        let animationFrameId: number;
        const loop = (timestamp: number) => {
            if (!lastTime.current) lastTime.current = timestamp;
            const deltaTime = Math.min((timestamp - lastTime.current) / 1000, 0.1);
            lastTime.current = timestamp;

            const cw = canvas.width;
            const ch = canvas.height;
            
            // Clear & Background
            ctx.fillStyle = '#78c850'; // Original Green
            ctx.fillRect(0, 0, cw, ch);

            // Draw Flowers
            backgroundFlowers.current.forEach(f => {
               ctx.strokeStyle = f.stemColor;
               ctx.lineWidth = Math.max(1, cw / 300);
               ctx.beginPath();
               ctx.moveTo(f.x, f.y + f.stemHeight);
               ctx.lineTo(f.x, f.y);
               ctx.stroke();
               ctx.fillStyle = f.petalColor;
               for(let i=0; i<f.numPetals; i++) {
                   const ang = (i / f.numPetals) * Math.PI * 2;
                   const pX = f.x + Math.cos(ang) * (f.centerRadius + f.petalRadius / 2);
                   const pY = f.y + Math.sin(ang) * (f.centerRadius + f.petalRadius / 2);
                   ctx.beginPath();
                   ctx.arc(pX, pY, f.petalRadius, 0, Math.PI * 2);
                   ctx.fill();
               }
               ctx.fillStyle = "#FFD700";
               ctx.beginPath();
               ctx.arc(f.x, f.y, f.centerRadius, 0, Math.PI * 2);
               ctx.fill();
            });

            // PAUSE CHECK (Top of Loop)
            if (isPausedRef.current) {
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.fillRect(0,0,cw,ch);
                ctx.fillStyle = '#FFFFFF';
                ctx.font = `${cw / 10}px "Press Start 2P"`;
                ctx.textAlign = 'center';
                ctx.fillText("PAUSED", cw/2, ch/2);
                animationFrameId = requestAnimationFrame(loop);
                return; 
            }

            if (gameState.current === 'countdown') {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(0, 0, cw, ch);
                
                // Countdown Logic (Delta Time)
                countdownValue.current -= deltaTime;
                if (countdownValue.current < 0) {
                    gameState.current = 'playing';
                    if (musicLoop.current && musicLoop.current.state !== 'started') {
                        musicLoop.current.start(0); 
                    }
                }

                ctx.font = `${cw / 8}px "Press Start 2P"`;
                ctx.fillStyle = '#FFD700';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const txt = countdownValue.current > 0 ? Math.ceil(countdownValue.current).toString() : "GO!"; 
                ctx.fillText(txt, cw/2, ch/2);
            } else if (gameState.current === 'playing') {

                // --- UPDATE ---
                timer.current -= deltaTime;
                if (timer.current <= 0) {
                    gameState.current = 'gameOver';
                    setFinalScore(score.current);
                    if (addScore) addScore(score.current);
                    setGameOver(true);
                    if (musicLoop.current) musicLoop.current.stop();
                }

                const p = player.current;
                if (p) {
                    // Resize constants if needed
                    const scaleFactor = cw / 800;
                    const fleeRadius = GAME_CONFIG.FLEE_RADIUS_BASE * Math.max(0.7, Math.min(1.5, scaleFactor));
                    
                    // Player Update
                    if (!p.isCurrentlyTagging && !p.isMissLungeAnimating) {
                        let dx = 0; let dy = 0;
                        if (keys.current['w']) dy = -1;
                        if (keys.current['s']) dy = 1;
                        if (keys.current['a']) dx = -1;
                        if (keys.current['d']) dx = 1;
                        // Joystick
                        // (Assume joystick updates dx/dy in ref directly if needed, but handled via keys for now)

                        if (dx !== 0 && dy !== 0) { const f = 1/Math.sqrt(2); dx*=f; dy*=f; }
                        p.dx = dx; p.dy = dy;
                        
                        if (dx > 0) p.facingDirection = 1;
                        else if (dx < 0) p.facingDirection = -1;

                        if (keys.current[' '] && !p.isDashing && !taggedDogInfo.current) {
                            p.isDashing = true;
                            p.dashTimer = GAME_CONFIG.DASH_DURATION;
                            p.currentDashSpeed = p.speed * GAME_CONFIG.DASH_SPEED_MULTIPLIER;
                            if (p.dx === 0 && p.dy === 0) p.dx = p.facingDirection; 
                        }

                        if (!p.isDashing) {
                            p.x += p.dx * p.speed * deltaTime;
                            p.y += p.dy * p.speed * deltaTime;
                        } else {
                            p.dashTimer -= deltaTime;
                            p.trail.unshift({x:p.x, y:p.y, width:p.width, height:p.height, facingRight: p.facingDirection===1});
                            if (p.trail.length > p.maxTrailLength) p.trail.pop();
                             if (p.dashTimer <= 0) {
                                p.isDashing = false;
                                p.trail = [];
                                // Check miss
                                if (!p.isCurrentlyTagging && !taggedDogInfo.current) {
                                    p.isMissLungeAnimating = true;
                                    p.missLungeTimer = GAME_CONFIG.MISS_LUNGE_DURATION;
                                    if (failSynth.current) failSynth.current.triggerAttackRelease("C2", "16n");
                                }
                            }
                        }
                        
                        // Bounds
                        p.x = Math.max(0, Math.min(p.x, cw - p.width));
                        p.y = Math.max(0, Math.min(p.y, ch - p.height));
                    } 
                    else if (p.isCurrentlyTagging) {
                         p.tagLockTimer -= deltaTime;
                         if (taggedDogInfo.current) {
                             const bounceProgress = (GAME_CONFIG.TAG_LOCK_DURATION - p.tagLockTimer) / GAME_CONFIG.TAG_LOCK_DURATION;
                             const bounceY = Math.sin(bounceProgress * Math.PI) * (-p.height * 0.15);
                             p.x = taggedDogInfo.current.originalX + (taggedDogInfo.current.dogData.width - p.width)/2;
                             p.y = taggedDogInfo.current.originalY - p.height * 0.3 + bounceY;
                         }
                         if (p.tagLockTimer <= 0) p.isCurrentlyTagging = false;
                    } 
                    else if (p.isMissLungeAnimating) {
                         p.missLungeTimer -= deltaTime;
                         if (p.missLungeTimer <= 0) p.isMissLungeAnimating = false;
                    } 
                    
                    // Update Effects
                    for (let i = successMessages.current.length - 1; i >= 0; i--) {
                        const msg = successMessages.current[i];
                        msg.timer -= deltaTime;
                        msg.alpha = msg.timer / GAME_CONFIG.SUCCESS_TEXT_DURATION;
                        msg.y -= 30 * deltaTime;
                        msg.scale = 1 + ((GAME_CONFIG.SUCCESS_TEXT_DURATION - msg.timer) / GAME_CONFIG.SUCCESS_TEXT_DURATION) * 0.3;
                         if (msg.particles) {
                            for (let j = msg.particles.length - 1; j >= 0; j--) {
                                const pa = msg.particles[j];
                                pa.x += pa.speedX * deltaTime;
                                pa.y += pa.speedY * deltaTime;
                                pa.alpha = pa.duration / GAME_CONFIG.PARTICLE_DURATION;
                                pa.duration -= deltaTime;
                                if (pa.duration <= 0) msg.particles.splice(j, 1);
                            }
                        }
                        if (msg.timer <= 0) successMessages.current.splice(i, 1);
                    }
                    
                    for (let i = heartAnimations.current.length - 1; i >= 0; i--) {
                        const h = heartAnimations.current[i];
                        h.timer -= deltaTime;
                        h.y -= h.riseSpeed * 60 * deltaTime;
                        h.alpha = h.timer / GAME_CONFIG.HEART_ANIM_DURATION;
                        if (h.phase === 'grow' && h.currentScale < h.maxScale) {
                            h.currentScale += 3 * deltaTime;
                            if (h.currentScale >= h.maxScale) h.phase = 'float';
                        }
                        if (h.timer <= 0) heartAnimations.current.splice(i, 1);
                    }

                    // Female Dogs Update
                    femaleDogs.current.forEach(dog => {
                        const dX = p.x + p.width/2 - (dog.x + dog.width/2);
                        const dY = p.y + p.height/2 - (dog.y + dog.height/2);
                        const dist = Math.sqrt(dX*dX + dY*dY);
                        if (dist < fleeRadius && !p.isCurrentlyTagging) {
                            const angle = Math.atan2(dY, dX);
                            dog.dx = -Math.cos(angle);
                            dog.dy = -Math.sin(angle);
                        } else {
                            dog.moveTimer -= deltaTime;
                            if (dog.moveTimer <= 0) {
                                const angle = Math.random() * Math.PI * 2;
                                dog.dx = Math.cos(angle);
                                dog.dy = Math.sin(angle);
                                dog.moveTimer = Math.random()*2+1;
                            }
                        }
                        if (dog.dx > 0) dog.facingDirection = 1; else if (dog.dx < 0) dog.facingDirection = -1;
                        dog.x += dog.dx * dog.speed * deltaTime;
                        dog.y += dog.dy * dog.speed * deltaTime;
                        
                        // Bounce bounds
                        if (dog.x < 0 || dog.x + dog.width > cw) { dog.dx *= -1; dog.x = Math.max(0, Math.min(dog.x, cw-dog.width)); }
                        if (dog.y < 0 || dog.y + dog.height > ch) { dog.dy *= -1; dog.y = Math.max(0, Math.min(dog.y, ch-dog.height)); }
                    });

                    // Spawning
                    if ((femaleDogSpawnTimer.current -= deltaTime) <= 0) {
                         if (femaleDogs.current.length < GAME_CONFIG.MAX_FEMALE_DOGS && !taggedDogInfo.current && !p.isCurrentlyTagging) {
                             femaleDogs.current.push(createFemaleDog(cw, ch, GAME_CONFIG.SPRITE_SCALE_BASE * Math.max(0.7, Math.min(1.5, scaleFactor * 1.1)), GAME_CONFIG.FEMALE_DOG_SPEED_BASE * Math.max(0.8, scaleFactor)));
                             femaleDogSpawnTimer.current = GAME_CONFIG.FEMALE_DOG_SPAWN_COOLDOWN;
                         }
                    }

                    // Collisions
                    if (p.isDashing) {
                        for (let i = femaleDogs.current.length - 1; i >= 0; i--) {
                            const dog = femaleDogs.current[i];
                            if (p.x < dog.x + dog.width && p.x + p.width > dog.x && p.y < dog.y + dog.height && p.y + p.height > dog.y) {
                                score.current++;
                                if (synth.current) synth.current.triggerAttackRelease("G5", "32n");
                                const phraseList = t('game.tagPhrases', { returnObjects: true }) as string[];
                                const phrase = phraseList[Math.floor(Math.random() * phraseList.length)];
                                if (phrase) speakText(phrase, i18n.language); 
                                
                                successMessages.current.push({
                                    text: phrase || "TAG!",
                                    x: p.x + p.width/2,
                                    y: p.y - 10,
                                    alpha: 1, scale: 1,
                                    timer: GAME_CONFIG.SUCCESS_TEXT_DURATION,
                                    particles: Array.from({length: 5}, () => createParticle(p.x+p.width/2, p.y+p.height/2))
                                });
                                
                                heartAnimations.current.push({
                                    x: dog.x + dog.width/2, y: dog.y - 10,
                                    currentScale: 0.1, maxScale: 1.2, alpha: 1,
                                    timer: GAME_CONFIG.HEART_ANIM_DURATION, riseSpeed: 0.7, phase: 'grow'
                                });
                                p.isDashing = false;
                                p.trail = [];
                                p.isCurrentlyTagging = true;
                                p.tagLockTimer = GAME_CONFIG.TAG_LOCK_DURATION;
                                taggedDogInfo.current = {
                                    dogData: {...dog},
                                    animTimer: GAME_CONFIG.TAG_ANIMATION_TOTAL_DURATION,
                                    originalX: dog.x,
                                    originalY: dog.y,
                                };
                                femaleDogs.current.splice(i, 1);
                                break; // Tag one at a time for simplicity of port
                            }
                        }
                    }
                    
                    if (taggedDogInfo.current) {
                        taggedDogInfo.current.animTimer -= deltaTime;
                        if (taggedDogInfo.current.animTimer < -0.16) taggedDogInfo.current = null;
                    }
                } // End Player Logic

                // --- DRAW ---
                const drawDog = (dog: any, alpha=1) => {
                     ctx.save();
                     ctx.globalAlpha = alpha;
                     let dx = dog.x;
                     if (dog.facingDirection === -1) { ctx.scale(-1,1); dx = -(dog.x + dog.width); }
                     if (assets.current.female) ctx.drawImage(assets.current.female, dx, dog.y, dog.width, dog.height);
                     else { ctx.fillStyle = 'pink'; ctx.fillRect(dx, dog.y, dog.width, dog.height); }
                     ctx.restore();
                };

                // Draw Female Dogs
                femaleDogs.current.forEach(d => drawDog(d));

                // Draw Player
                const drawPug = (x:number, y:number, width:number, height:number, facing:number, useDress: boolean) => {
                    ctx.save();
                    let dx = x;
                    if (facing === -1) { ctx.scale(-1, 1); dx = -(x + width); }
                    if (assets.current.player) ctx.drawImage(assets.current.player, dx, y, width, height);
                    else { ctx.fillStyle = 'brown'; ctx.fillRect(dx, y, width, height); }
                    
                    if (useDress && assets.current.dress) {
                        const tempC = document.createElement('canvas');
                        tempC.width = width; tempC.height = height;
                        const tCtx = tempC.getContext('2d');
                        if (tCtx) {
                            tCtx.drawImage(assets.current.dress, 0, 0, width, height);
                            tCtx.globalCompositeOperation = "source-in";
                            tCtx.fillStyle = dressColor || '#FFFFFF';
                            tCtx.fillRect(0, 0, width, height);
                            ctx.drawImage(tempC, dx, y, width, height);
                        } else {
                            ctx.drawImage(assets.current.dress, dx, y, width, height);
                        }
                    }
                    ctx.restore();
                };

                if (p) {
                    // Trail
                    p.trail.forEach((t:any, i:number) => {
                        ctx.globalAlpha = 0.4 * (1 - (i+1)/(p.trail.length+1));
                        drawPug(t.x, t.y, t.width, t.height, t.facingRight?1:-1, false);
                        ctx.globalAlpha = 1;
                    });
                    
                    // Main Pug (with Miss Bob)
                    let py = p.y;
                    if (p.isMissLungeAnimating) {
                         const prog = (GAME_CONFIG.MISS_LUNGE_DURATION - p.missLungeTimer) / GAME_CONFIG.MISS_LUNGE_DURATION;
                         py += Math.sin(prog * Math.PI) * -(p.height * 0.2);
                    }
                    // If tagging, render Ghost Dog underneath
                    if (p.isCurrentlyTagging && taggedDogInfo.current) {
                        const td = taggedDogInfo.current.dogData;
                        const prog = (GAME_CONFIG.TAG_LOCK_DURATION - p.tagLockTimer) / GAME_CONFIG.TAG_LOCK_DURATION;
                        const by = Math.sin(prog * Math.PI) * (td.height * 0.1);
                        ctx.save();
                        let ddx = taggedDogInfo.current.originalX;
                        if (td.facingDirection === -1) { ctx.scale(-1,1); ddx = -(ddx + td.width); }
                        ctx.drawImage(assets.current.female!, ddx, taggedDogInfo.current.originalY + by, td.width, td.height);
                        ctx.restore();
                    } else if (taggedDogInfo.current) {
                        // Fading out
                         const fadeDur = GAME_CONFIG.TAG_ANIMATION_TOTAL_DURATION - GAME_CONFIG.TAG_LOCK_DURATION;
                         const fadeProg = Math.max(0, Math.min(1, taggedDogInfo.current.animTimer / fadeDur));
                         const s = fadeProg * 0.8 + 0.2;
                         const w = taggedDogInfo.current.dogData.width * s;
                         const h = taggedDogInfo.current.dogData.height * s;
                         const ox = taggedDogInfo.current.originalX + (taggedDogInfo.current.dogData.width - w)/2;
                         const oy = taggedDogInfo.current.originalY + (taggedDogInfo.current.dogData.height - h)/2;
                         
                         ctx.save();
                         ctx.globalAlpha = fadeProg;
                         let ddx = ox;
                         if (taggedDogInfo.current.dogData.facingDirection === -1) { ctx.scale(-1,1); ddx = -(ox + w); }
                         ctx.drawImage(assets.current.female!, ddx, oy, w, h);
                         ctx.restore();
                    }
                    
                    // Draw Effects
                    successMessages.current.forEach(msg => {
                         if (msg.particles) {
                             msg.particles.forEach((pa:any) => {
                                 ctx.globalAlpha = pa.alpha; ctx.fillStyle = pa.color;
                                 ctx.beginPath(); ctx.arc(pa.x, pa.y, pa.size, 0, Math.PI*2); ctx.fill();
                             });
                             ctx.globalAlpha = 1;
                         }
                         ctx.save();
                         ctx.globalAlpha = msg.alpha;
                         ctx.fillStyle = '#FFD700'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
                         const bfs = Math.max(10, Math.min(20, cw/40));
                         ctx.font = `${bfs * msg.scale}px "Press Start 2P"`;
                         ctx.textAlign = 'center';
                         ctx.strokeText(msg.text, msg.x, msg.y);
                         ctx.fillText(msg.text, msg.x, msg.y);
                         ctx.restore();
                    });
                    
                    heartAnimations.current.forEach(h => {
                        const hs = Math.max(5, cw/80) * h.currentScale;
                         ctx.save(); ctx.globalAlpha = h.alpha; ctx.fillStyle = 'red'; ctx.strokeStyle = 'darkred';
                         ctx.beginPath();
                         const x = h.x - hs/2; const y = h.y - hs/2;
                         ctx.moveTo(x, y + hs*0.3);
                         ctx.bezierCurveTo(x, y, x - hs/2, y, x - hs/2, y + hs*0.3);
                         ctx.bezierCurveTo(x - hs/2, y + (hs+hs*0.3)/2, x, y + (hs+hs*0.3)/2 + hs*0.15, x, y + hs);
                         ctx.bezierCurveTo(x, y + (hs+hs*0.3)/2 + hs*0.15, x + hs/2, y + (hs+hs*0.3)/2, x + hs/2, y + hs*0.3);
                         ctx.bezierCurveTo(x + hs/2, y, x, y, x, y + hs*0.3);
                         ctx.fill(); ctx.stroke();
                         ctx.restore();
                    });

                    drawPug(p.x, py, p.width, p.height, p.facingDirection, true);
                }

                // UI
                // UI
                ctx.fillStyle = '#FFFFFF';
                // Font sizing
                const fs = Math.max(10, Math.min(24, cw / 35));
                ctx.font = `${fs}px "Press Start 2P"`;
                ctx.textAlign = 'left';
                ctx.fillText(`${t('game.score')}: ${score.current}`, cw * 0.05, ch * GAME_CONFIG.UI_TOP_OFFSET_PCT);
                ctx.textAlign = 'right';
                ctx.fillText(`${t('game.time')}: ${Math.ceil(timer.current)}`, cw * 0.95, ch * GAME_CONFIG.UI_TOP_OFFSET_PCT);

            } // End Playing

            animationFrameId = requestAnimationFrame(loop);
        };
        animationFrameId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
            window.removeEventListener('resize', handleResize);
            if (cleanupGame) cleanupGame();
            cancelAnimationFrame(animationFrameId);
            // Cleanup Audio
            if (musicLoop.current) {
                musicLoop.current.stop();
            }
            if (audioContext.current && audioContext.current.Transport) {
                audioContext.current.Transport.stop();
                audioContext.current.Transport.cancel(0); // Clear events
            }
            window.speechSynthesis.cancel();
        };
    }, []);

    // Mute Effect
    useEffect(() => {
        if (audioContext.current && audioContext.current.Destination) {
            audioContext.current.Destination.mute = isMuted;
        }
    }, [isMuted]);

    return (
        <div style={{ width: '100vw', height: '100dvh', position: 'relative', backgroundColor: '#2c2c2c', overflow: 'hidden' }}>
             {/* Canvas */}
             <div id="gameContainer" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', aspectRatio: '4/3', border: '2px solid #000', backgroundColor: '#78c850', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }} />
             </div>

             {/* Menu Button */}
             <button
                onClick={() => {
                    const next = !isPaused;
                    setIsPaused(next);
                    isPausedRef.current = next;
                    if (audioContext.current?.Transport) {
                        if (next) audioContext.current.Transport.pause();
                        else audioContext.current.Transport.start();
                    }
                }}
                style={{
                    position: 'absolute', top: '20px', left: '20px', zIndex: 10,
                    padding: '10px 20px', backgroundColor: isPaused ? '#4CAF50' : '#f44336', color: 'white',
                    border: '2px solid white', borderRadius: '5px', fontFamily: '"Press Start 2P"', cursor: 'pointer'
                }}
             >
                {isPaused ? "RESUME" : "MENU"}
             </button>

             {/* Pause Overlay (Menu Options) */}
             {isPaused && (
                 <div style={{
                     position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20,
                     backgroundColor: 'rgba(0,0,0,0.9)', padding: '40px', borderRadius: '15px', border: '4px solid white',
                     display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center'
                 }}>
                      <h2 style={{ color: '#fff', fontFamily: '"Press Start 2P"', marginBottom: '20px' }}>PAUSE</h2>
                      <button onClick={() => { 
                          setIsPaused(false); 
                          isPausedRef.current = false;
                          if (audioContext.current?.Transport) audioContext.current.Transport.start();
                      }} style={{ padding: '15px', width: '250px', fontFamily: '"Press Start 2P"', backgroundColor: '#4CAF50', border: '3px solid #fff', color: 'white', cursor: 'pointer' }}>RESUME</button>
                      <button onClick={() => setMuted(!isMuted)} style={{ padding: '15px', width: '250px', fontFamily: '"Press Start 2P"', backgroundColor: isMuted ? '#f44336' : '#2196F3', border: '3px solid #fff', color: 'white', cursor: 'pointer' }}>
                          {isMuted ? "UNMUTE" : "MUTE"}
                      </button>
                      <button onClick={() => setView('menu')} style={{ padding: '15px', width: '250px', fontFamily: '"Press Start 2P"', backgroundColor: '#f44336', border: '3px solid #fff', color: 'white', cursor: 'pointer' }}>EXIT TO MENU</button>
                 </div>
             )}

             {/* Game Over Modal */}
             {gameOver && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <h2 style={{ fontSize: '2em', color: '#ff0000', marginBottom: '20px', fontFamily: '"Press Start 2P"' }}>
                        {t('game.gameOver')}
                    </h2>
                    <p style={{ fontSize: '1.2em', color: '#ffd700', marginBottom: '30px', fontFamily: '"Press Start 2P"' }}>
                         {t('game.score')}: {finalScore}
                    </p>
                    
                    {/* Leaderboard Save */}
                    <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                        <input 
                            type="text" 
                            placeholder={t('game.enterName')} 
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            maxLength={10}
                            style={{ padding: '10px', fontFamily: '"Press Start 2P"' }}
                        />
                        <button 
                            disabled={!isSupabaseEnabled || saveStatus === 'saving' || saveStatus === 'success' || !playerName}
                            onClick={async () => {
                                if (!isSupabaseEnabled) return;
                                setSaveStatus('saving');
                                const { error } = await supabase.from('leaderboard').insert({ player_name: playerName, score: finalScore });
                                if (!error) {
                                    setSaveStatus('success');
                                    setTimeout(() => setView('leaderboard'), 1000); // Auto navigate after success
                                } else {
                                    setSaveStatus('error');
                                }
                            }}
                            style={{ padding: '10px', fontFamily: '"Press Start 2P"', backgroundColor: isSupabaseEnabled ? '#2196F3' : '#9e9e9e', color: 'white', border: 'none', cursor: isSupabaseEnabled ? 'pointer' : 'not-allowed', opacity: (isSupabaseEnabled && (saveStatus !== 'idle' || !playerName)) ? 0.5 : 1 }}
                        >
                            {!isSupabaseEnabled ? "OFFLINE" : saveStatus === 'saving' ? t('game.saving') : saveStatus === 'success' ? "SAVED!" : saveStatus === 'error' ? "ERROR" : t('game.saveScore')}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => window.location.reload()} style={{ padding: '15px', fontFamily: '"Press Start 2P"', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>
                            {t('game.playAgain')}
                        </button>
                        <button onClick={() => setView('leaderboard')} style={{ padding: '15px', fontFamily: '"Press Start 2P"', cursor: 'pointer', backgroundColor: '#f39c12', color: 'white', border: 'none' }}>
                            {t('menu.leaderboard')}
                        </button>
                        <button onClick={() => setView('menu')} style={{ padding: '15px', fontFamily: '"Press Start 2P"', cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none' }}>
                            {t('game.menu')}
                        </button>
                    </div>
                </div>
             )}

             {/* Mobile Controls */}
            <div style={{
                position: 'fixed', bottom: '20px', left: '20px', right: '20px', zIndex: 100,
                display: 'flex', width: 'auto', justifyContent: 'space-between', paddingRight: '0', boxSizing: 'border-box', pointerEvents: 'none'
            }}>
                <div style={{ pointerEvents: 'auto' }}>
                     <Joystick 
                        size={100} 
                        baseColor="rgba(80, 80, 80, 0.5)" 
                        stickColor="rgba(150, 150, 150, 0.8)" 
                        move={(e) => {
                             // Map joystick event to keys
                             if (e.direction) {
                                 keys.current['w'] = e.direction === 'FORWARD';
                                 keys.current['s'] = e.direction === 'BACKWARD';
                                 keys.current['a'] = e.direction === 'LEFT';
                                 keys.current['d'] = e.direction === 'RIGHT';
                                 // Diagonals? library might give complex output, for now basic
                             }
                        }}
                        stop={() => {
                            keys.current['w'] = false; keys.current['s'] = false; keys.current['a'] = false; keys.current['d'] = false;
                        }}
                     />
                </div>
                <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center' }}>
                    <button
                        onTouchStart={(e) => { e.preventDefault(); keys.current[' '] = true; }}
                        onTouchEnd={(e) => { e.preventDefault(); keys.current[' '] = false; }}
                        onMouseDown={() => keys.current[' '] = true}
                        onMouseUp={() => keys.current[' '] = false}
                        style={{
                            width: '80px', height: '80px', backgroundColor: 'rgba(255, 80, 80, 0.7)',
                            border: '2px solid rgba(255, 255, 255, 0.7)', borderRadius: '15px',
                            color: 'white', fontFamily: '"Press Start 2P"', fontSize: '0.9em',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer'
                        }}
                    >
                        DASH
                    </button>
                </div>
            </div>
        </div>
    );
}
