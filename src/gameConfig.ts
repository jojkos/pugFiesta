export const GAME_CONFIG = {
    // --- Rendering & Scaling ---
    SPRITE_SCALE_BASE: 1.5,
    PLAYER_BASE_WIDTH: 32,
    PLAYER_BASE_HEIGHT: 30,
    FEMALE_DOG_BASE_WIDTH: 32,
    FEMALE_DOG_BASE_HEIGHT: 32,

    // --- Physics & Movement ---
    PLAYER_SPEED_BASE: 200,
    FEMALE_DOG_SPEED_BASE: 120,
    DASH_SPEED_MULTIPLIER: 2.5,
    DASH_DURATION: 0.25,
    FLEE_RADIUS_BASE: 150,

    // --- Game Logic ---
    GAME_DURATION: 60, // Seconds
    COUNTDOWN_DURATION: 3, // Seconds
    MAX_FEMALE_DOGS: 5,
    FEMALE_DOG_SPAWN_COOLDOWN: 2.0, // Seconds

    // --- Interactions & Animations ---
    TAG_LOCK_DURATION: 0.33,
    TAG_ANIMATION_TOTAL_DURATION: 0.83,
    MISS_LUNGE_DURATION: 0.2,
    
    // --- Effects & Visuals ---
    SUCCESS_TEXT_DURATION: 1.5,
    PARTICLE_DURATION: 0.5,
    HEART_ANIM_DURATION: 1.16,
    UI_TOP_OFFSET_PCT: 0.08, // 8% from top to avoid notch/clipping

    // --- Audio ---
    MUSIC_BPM: 140,
    MUSIC_VOLUME_BASS: -18, // Lowered from -5
    MUSIC_VOLUME_LEAD: -12,
};
