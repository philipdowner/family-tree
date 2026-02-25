/**
 * Slideshow Controller Module
 * Manages slide transitions and auto-play functionality
 */

const Slideshow = {
    // State
    currentSlide: 0,
    totalSlides: 10,
    isPlaying: false,
    isPaused: false,
    timer: null,
    progressInterval: null,
    slideStartTime: 0,

    // Configuration (loaded from config.json)
    config: {
        autoPlay: true,
        showControls: true,
        showKeyboardHints: true
    },

    // Timing configuration
    timing: {
        titleSlide: 5000,
        treeSlide: 10000,
        childSlide: 8000,
        parentsSlide: 8000,
        grandparentsSlide: 8000,
        greatGrandparentsSlide: 8000,
        mapSlide: 12000,
        closingSlide: 5000
    },

    // Slide definitions with their timing keys and transition types
    // Transition types: 'fade-scale', 'zoom-in', 'slide-left', 'fade-up', 'warm-fade'
    slides: [
        { id: 'slide-title', timing: 'titleSlide', onEnter: null, transition: 'fade-scale' },
        { id: 'slide-tree', timing: 'treeSlide', onEnter: 'onTreeSlide', transition: 'zoom-in' },
        { id: 'slide-child', timing: 'childSlide', onEnter: 'onChildSlide', transition: 'slide-left' },
        { id: 'slide-parents', timing: 'parentsSlide', onEnter: 'onParentsSlide', transition: 'slide-left' },
        { id: 'slide-maternal-grandparents', timing: 'grandparentsSlide', onEnter: 'onMaternalGrandparentsSlide', transition: 'slide-left' },
        { id: 'slide-paternal-grandparents', timing: 'grandparentsSlide', onEnter: 'onPaternalGrandparentsSlide', transition: 'slide-left' },
        { id: 'slide-maternal-great', timing: 'greatGrandparentsSlide', onEnter: 'onMaternalGreatSlide', transition: 'slide-left' },
        { id: 'slide-paternal-great', timing: 'greatGrandparentsSlide', onEnter: 'onPaternalGreatSlide', transition: 'fade-up' },
        { id: 'slide-map', timing: 'mapSlide', onEnter: 'onMapSlide', transition: 'warm-fade' },
        { id: 'slide-closing', timing: 'closingSlide', onEnter: 'onClosingSlide', transition: 'fade-scale' }
    ],

    // Callbacks for slide-specific actions
    callbacks: {},

    // DOM elements
    elements: {
        presentation: null,
        controls: null,
        btnPrev: null,
        btnNext: null,
        btnPlay: null,
        iconPlay: null,
        iconPause: null,
        progressFill: null,
        currentSlideEl: null,
        totalSlidesEl: null,
        keyboardHint: null
    },

    /**
     * Initialize the slideshow
     * @param {Object} config - Configuration from config.json
     */
    init(config = {}) {
        // Merge config
        if (config.presentation) {
            Object.assign(this.config, config.presentation);
        }
        if (config.timing) {
            Object.assign(this.timing, config.timing);
        }

        // Cache DOM elements
        this.elements.presentation = document.getElementById('presentation');
        this.elements.controls = document.getElementById('controls');
        this.elements.btnPrev = document.getElementById('btn-prev');
        this.elements.btnNext = document.getElementById('btn-next');
        this.elements.btnPlay = document.getElementById('btn-play');
        this.elements.iconPlay = document.getElementById('icon-play');
        this.elements.iconPause = document.getElementById('icon-pause');
        this.elements.progressFill = document.getElementById('progress-fill');
        this.elements.currentSlideEl = document.getElementById('current-slide');
        this.elements.totalSlidesEl = document.getElementById('total-slides');
        this.elements.keyboardHint = document.getElementById('keyboard-hint');

        // Setup event listeners
        this.setupEventListeners();

        // Apply config
        this.applyConfig();

        // Update total slides display
        if (this.elements.totalSlidesEl) {
            this.elements.totalSlidesEl.textContent = this.totalSlides;
        }
    },

    /**
     * Apply configuration settings
     */
    applyConfig() {
        // Show/hide controls
        if (!this.config.showControls && this.elements.controls) {
            this.elements.controls.classList.add('hidden');
        }

        // Show/hide keyboard hints
        if (!this.config.showKeyboardHints && this.elements.keyboardHint) {
            this.elements.keyboardHint.classList.add('hidden');
        }
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Control buttons
        if (this.elements.btnPrev) {
            this.elements.btnPrev.addEventListener('click', () => this.prev());
        }
        if (this.elements.btnNext) {
            this.elements.btnNext.addEventListener('click', () => this.next());
        }
        if (this.elements.btnPlay) {
            this.elements.btnPlay.addEventListener('click', () => this.togglePlay());
        }

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Hide keyboard hint after first interaction
        document.addEventListener('keydown', () => this.hideKeyboardHint(), { once: true });
        document.addEventListener('click', () => this.hideKeyboardHint(), { once: true });
    },

    /**
     * Handle keyboard input
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboard(e) {
        switch (e.key) {
            case ' ':
            case 'Space':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowRight':
            case 'Right':
                this.next();
                break;
            case 'ArrowLeft':
            case 'Left':
                this.prev();
                break;
            case 'Home':
                this.goTo(0);
                break;
            case 'End':
                this.goTo(this.totalSlides - 1);
                break;
        }
    },

    /**
     * Hide keyboard hint
     */
    hideKeyboardHint() {
        if (this.elements.keyboardHint) {
            this.elements.keyboardHint.classList.add('auto-hide');
        }
    },

    /**
     * Register a callback for slide events
     * @param {string} name - Callback name
     * @param {Function} fn - Callback function
     */
    registerCallback(name, fn) {
        this.callbacks[name] = fn;
    },

    /**
     * Start the slideshow
     */
    start() {
        // Show presentation
        if (this.elements.presentation) {
            this.elements.presentation.classList.remove('hidden');
        }
        if (this.elements.controls) {
            this.elements.controls.classList.remove('hidden');
        }

        // Show first slide
        this.goTo(0);

        // Auto-play if enabled
        if (this.config.autoPlay) {
            this.play();
        }
    },

    // Transition class names
    transitionClasses: ['trans-fade-scale', 'trans-zoom-in', 'trans-slide-left', 'trans-slide-right', 'trans-fade-up', 'trans-warm-fade'],

    /**
     * Go to a specific slide
     * @param {number} index - Slide index
     */
    goTo(index) {
        // Validate index
        if (index < 0 || index >= this.totalSlides) return;

        // Dismiss any zoomed tree card when leaving the tree slide
        if (this.currentSlide !== index && TreeRenderer._zoomedCard) {
            TreeRenderer.dismissZoom();
        }

        // Stop current timer
        this.stopTimer();

        const allSlides = document.querySelectorAll('.slide');
        const prevIndex = this.currentSlide;
        const goingForward = index >= prevIndex;
        const slideDef = this.slides[index];
        const transType = slideDef.transition || 'fade-scale';

        // Remove all transition classes from all slides
        allSlides.forEach(slide => {
            this.transitionClasses.forEach(c => slide.classList.remove(c));
            slide.classList.remove('trans-exit');
        });

        // Apply directional transition
        allSlides.forEach((slide, i) => {
            if (i === index) {
                // Determine enter class
                let enterClass = `trans-${transType}`;
                // If going backwards with slide-left, reverse to slide-right
                if (!goingForward && transType === 'slide-left') {
                    enterClass = 'trans-slide-right';
                }
                slide.classList.add('active', enterClass);

                // Clean up transition class after animation
                slide.addEventListener('animationend', () => {
                    slide.classList.remove(enterClass);
                }, { once: true });

                // Fallback cleanup
                setTimeout(() => {
                    slide.classList.remove(enterClass);
                }, 800);
            } else if (i === prevIndex && i !== index) {
                slide.classList.remove('active');
            } else {
                slide.classList.remove('active');
            }
        });

        // Update current slide
        this.currentSlide = index;

        // Update counter
        if (this.elements.currentSlideEl) {
            this.elements.currentSlideEl.textContent = index + 1;
        }

        // Reset progress
        this.resetProgress();

        // Call slide-specific handler
        if (slideDef && slideDef.onEnter && this.callbacks[slideDef.onEnter]) {
            this.callbacks[slideDef.onEnter]();
        }

        // Start timer if playing
        if (this.isPlaying && !this.isPaused) {
            this.startTimer();
        }
    },

    /**
     * Go to next slide
     */
    next() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.goTo(this.currentSlide + 1);
        } else {
            // Loop back to start or stop
            this.pause();
            this.goTo(0);
        }
    },

    /**
     * Go to previous slide
     */
    prev() {
        if (this.currentSlide > 0) {
            this.goTo(this.currentSlide - 1);
        }
    },

    /**
     * Start auto-play
     */
    play() {
        this.isPlaying = true;
        this.isPaused = false;
        this.updatePlayButton();
        this.startTimer();
    },

    /**
     * Pause auto-play
     */
    pause() {
        this.isPaused = true;
        this.stopTimer();
        this.updatePlayButton();
    },

    /**
     * Toggle play/pause
     */
    togglePlay() {
        if (this.isPaused) {
            this.play();
        } else {
            this.pause();
        }
    },

    /**
     * Update play button icon
     */
    updatePlayButton() {
        if (!this.elements.iconPlay || !this.elements.iconPause) return;

        if (this.isPaused) {
            this.elements.iconPlay.classList.remove('hidden');
            this.elements.iconPause.classList.add('hidden');
        } else {
            this.elements.iconPlay.classList.add('hidden');
            this.elements.iconPause.classList.remove('hidden');
        }
    },

    /**
     * Start the auto-advance timer
     */
    startTimer() {
        const slideDef = this.slides[this.currentSlide];
        const duration = this.timing[slideDef.timing] || 5000;

        this.slideStartTime = Date.now();

        // Start progress animation
        this.startProgress(duration);

        // Set auto-advance timer
        this.timer = setTimeout(() => {
            this.next();
        }, duration);
    },

    /**
     * Stop the current timer
     */
    stopTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    },

    /**
     * Start progress bar animation
     * @param {number} duration - Slide duration in ms
     */
    startProgress(duration) {
        if (!this.elements.progressFill) return;

        this.elements.progressFill.style.width = '0%';

        this.progressInterval = setInterval(() => {
            const elapsed = Date.now() - this.slideStartTime;
            const progress = Math.min((elapsed / duration) * 100, 100);
            this.elements.progressFill.style.width = `${progress}%`;

            if (progress >= 100) {
                clearInterval(this.progressInterval);
            }
        }, 50);
    },

    /**
     * Reset progress bar
     */
    resetProgress() {
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = '0%';
        }
    },

    /**
     * Get current slide duration
     * @returns {number} Duration in ms
     */
    getCurrentDuration() {
        const slideDef = this.slides[this.currentSlide];
        return this.timing[slideDef.timing] || 5000;
    }
};

// Export for use in other modules
window.Slideshow = Slideshow;
