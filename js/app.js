/**
 * Family Tree Application
 * Main entry point that coordinates all modules
 */

const App = {
    // Loaded data
    data: {
        family: null,
        config: null,
        countries: null
    },

    /**
     * Initialize the application
     */
    async init() {
        console.log('Family Tree App initializing...');

        try {
            // Load all data
            await this.loadData();

            // Initialize modules
            this.initModules();

            // Setup slide callbacks
            this.setupSlideCallbacks();

            // Populate initial content
            this.populateContent();

            // Hide loading screen and start
            this.hideLoading();

            // Start slideshow
            Slideshow.start();

        } catch (error) {
            console.error('App initialization error:', error);
            this.showError(error.message);
        }
    },

    /**
     * Load all data files
     */
    async loadData() {
        const data = await DataLoader.loadAll();
        this.data.family = data.family;
        this.data.config = data.config;
        this.data.countries = data.countries;
    },

    /**
     * Initialize all modules
     */
    initModules() {
        TreeRenderer.init();
        MapRenderer.init();
        Slideshow.init(this.data.config);
    },

    /**
     * Setup callbacks for slide transitions
     */
    setupSlideCallbacks() {
        // Tree slide - render and animate tree
        Slideshow.registerCallback('onTreeSlide', () => {
            TreeRenderer.render(this.data.family);
            const animConfig = this.data.config?.animations || {};
            TreeRenderer.animateEntrance(animConfig);
        });

        // Parents slide
        Slideshow.registerCallback('onParentsSlide', () => {
            const container = document.getElementById('parents-cards');
            const parents = [
                { ...this.data.family.parents?.mother, side: 'maternal' },
                { ...this.data.family.parents?.father, side: 'paternal' }
            ];
            TreeRenderer.createFocusCards(parents, container);
        });

        // Maternal grandparents slide
        Slideshow.registerCallback('onMaternalGrandparentsSlide', () => {
            const container = document.getElementById('maternal-grandparents-cards');
            const grandparents = [
                { ...this.data.family.grandparents?.mothersMother, side: 'maternal' },
                { ...this.data.family.grandparents?.mothersFather, side: 'maternal' }
            ];
            TreeRenderer.createFocusCards(grandparents, container);
        });

        // Paternal grandparents slide
        Slideshow.registerCallback('onPaternalGrandparentsSlide', () => {
            const container = document.getElementById('paternal-grandparents-cards');
            const grandparents = [
                { ...this.data.family.grandparents?.fathersMother, side: 'paternal' },
                { ...this.data.family.grandparents?.fathersFather, side: 'paternal' }
            ];
            TreeRenderer.createFocusCards(grandparents, container);
        });

        // Maternal great-grandparents slide
        Slideshow.registerCallback('onMaternalGreatSlide', () => {
            const container = document.getElementById('maternal-great-cards');
            const ggp = this.data.family.greatGrandparents;
            const greatGrandparents = [
                { ...ggp?.mothersMothersMother, side: 'maternal' },
                { ...ggp?.mothersMothersFather, side: 'maternal' },
                { ...ggp?.mothersFathersMother, side: 'maternal' },
                { ...ggp?.mothersFathersFather, side: 'maternal' }
            ];
            TreeRenderer.createFocusCards(greatGrandparents, container);
        });

        // Paternal great-grandparents slide
        Slideshow.registerCallback('onPaternalGreatSlide', () => {
            const container = document.getElementById('paternal-great-cards');
            const ggp = this.data.family.greatGrandparents;
            const greatGrandparents = [
                { ...ggp?.fathersMothersMother, side: 'paternal' },
                { ...ggp?.fathersMothersFather, side: 'paternal' },
                { ...ggp?.fathersFathersMother, side: 'paternal' },
                { ...ggp?.fathersFathersFather, side: 'paternal' }
            ];
            TreeRenderer.createFocusCards(greatGrandparents, container);
        });

        // Map slide - render map with pins
        Slideshow.registerCallback('onMapSlide', async () => {
            await MapRenderer.render(this.data.family, this.data.countries);
            const animConfig = this.data.config?.map || {};
            MapRenderer.animatePins(animConfig);
        });
    },

    /**
     * Populate static content (title, family name, etc.)
     */
    populateContent() {
        const familyName = this.data.family.familyName || 'Family';

        // Update all family name elements
        document.querySelectorAll('.family-name').forEach(el => {
            el.textContent = familyName;
        });

        // Set page title
        document.title = `${familyName} Family Tree`;
    },

    /**
     * Hide loading screen
     */
    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 500);
        }
    },

    /**
     * Show error screen
     * @param {string} message - Error message to display
     */
    showError(message) {
        const loadingScreen = document.getElementById('loading-screen');
        const errorScreen = document.getElementById('error-screen');
        const errorMessage = document.getElementById('error-message');

        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }

        if (errorScreen && errorMessage) {
            errorMessage.textContent = message;
            errorScreen.classList.remove('hidden');
        }
    }
};

// Prevent double initialization
let appInitialized = false;

function startApp() {
    if (appInitialized) return;
    appInitialized = true;
    App.init();
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
