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
            TreeRenderer.initCardZoom();
        });

        // Child (Mason) slide
        Slideshow.registerCallback('onChildSlide', () => {
            const container = document.getElementById('child-cards');
            const child = [{ ...this.data.family.child, side: 'child' }];
            TreeRenderer.createFocusCards(child, container);
        });

        // Parents slide — horizontal layout
        Slideshow.registerCallback('onParentsSlide', () => {
            const container = document.getElementById('parents-cards');
            const parents = [
                { ...this.data.family.parents?.mother, side: 'maternal' },
                { ...this.data.family.parents?.father, side: 'paternal' }
            ];
            TreeRenderer.createFocusCards(parents, container, { layout: 'horizontal' });
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

        // Maternal great-grandparents slide — horizontal layout
        Slideshow.registerCallback('onMaternalGreatSlide', () => {
            const container = document.getElementById('maternal-great-cards');
            const ggp = this.data.family.greatGrandparents;
            const greatGrandparents = [
                { ...ggp?.mothersMothersMother, side: 'maternal' },
                { ...ggp?.mothersMothersFather, side: 'maternal' },
                { ...ggp?.mothersFathersMother, side: 'maternal' },
                { ...ggp?.mothersFathersFather, side: 'maternal' }
            ];
            TreeRenderer.createFocusCards(greatGrandparents, container, { layout: 'horizontal' });
        });

        // Paternal great-grandparents slide — horizontal layout
        Slideshow.registerCallback('onPaternalGreatSlide', () => {
            const container = document.getElementById('paternal-great-cards');
            const ggp = this.data.family.greatGrandparents;
            const greatGrandparents = [
                { ...ggp?.fathersMothersMother, side: 'paternal' },
                { ...ggp?.fathersMothersFather, side: 'paternal' },
                { ...ggp?.fathersFathersMother, side: 'paternal' },
                { ...ggp?.fathersFathersFather, side: 'paternal' }
            ];
            TreeRenderer.createFocusCards(greatGrandparents, container, { layout: 'horizontal' });
        });

        // Closing slide - render photo tree
        Slideshow.registerCallback('onClosingSlide', () => {
            this.renderClosingTree();
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

        // Render the title photo tree
        this.renderTitleTree();
    },

    /**
     * Render the title slide photo tree — large tree with family photos at branch tips
     */
    renderTitleTree() {
        const container = document.getElementById('title-photo-tree');
        if (!container || container.querySelector('svg')) return;

        const SVG_NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 400 480');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // Tree structure — branches drawn with warm green
        const treePaths = `
            <g fill="none" stroke="#2D6A4F" stroke-linecap="round" opacity="0.3">
                <path d="M200 480 L200 280" stroke-width="6"/>
                <path d="M200 320 Q160 290 120 260" stroke-width="4"/>
                <path d="M200 320 Q240 290 280 260" stroke-width="4"/>
                <path d="M200 280 Q150 240 100 200" stroke-width="3"/>
                <path d="M200 280 Q250 240 300 200" stroke-width="3"/>
                <path d="M120 260 Q90 230 60 190" stroke-width="2.5"/>
                <path d="M120 260 Q130 220 150 180" stroke-width="2.5"/>
                <path d="M280 260 Q270 220 250 180" stroke-width="2.5"/>
                <path d="M280 260 Q310 230 340 190" stroke-width="2.5"/>
                <path d="M100 200 Q70 160 50 120" stroke-width="2"/>
                <path d="M100 200 Q110 160 130 130" stroke-width="2"/>
                <path d="M300 200 Q290 160 270 130" stroke-width="2"/>
                <path d="M300 200 Q330 160 350 120" stroke-width="2"/>
                <path d="M60 190 Q40 150 30 110" stroke-width="1.5"/>
                <path d="M60 190 Q70 150 90 120" stroke-width="1.5"/>
                <path d="M150 180 Q140 140 120 100" stroke-width="1.5"/>
                <path d="M150 180 Q170 140 180 110" stroke-width="1.5"/>
                <path d="M250 180 Q230 140 220 110" stroke-width="1.5"/>
                <path d="M250 180 Q260 140 280 100" stroke-width="1.5"/>
                <path d="M340 190 Q330 150 310 120" stroke-width="1.5"/>
                <path d="M340 190 Q360 150 370 110" stroke-width="1.5"/>
            </g>
        `;
        svg.innerHTML = treePaths;

        // Photo positions at branch tips — larger radii for the title slide
        const photoTips = [
            // Great-grandparents (top row)
            { cx: 30, cy: 105, photo: this.data.family.greatGrandparents?.mothersMothersMother?.photo },
            { cx: 90, cy: 115, photo: this.data.family.greatGrandparents?.mothersMothersFather?.photo },
            { cx: 120, cy: 95, photo: this.data.family.greatGrandparents?.mothersFathersMother?.photo },
            { cx: 180, cy: 105, photo: this.data.family.greatGrandparents?.mothersFathersFather?.photo },
            { cx: 220, cy: 105, photo: this.data.family.greatGrandparents?.fathersMothersMother?.photo },
            { cx: 280, cy: 95, photo: this.data.family.greatGrandparents?.fathersMothersFather?.photo },
            { cx: 310, cy: 115, photo: this.data.family.greatGrandparents?.fathersFathersMother?.photo },
            { cx: 370, cy: 105, photo: this.data.family.greatGrandparents?.fathersFathersFather?.photo },
            // Grandparents
            { cx: 60, cy: 190, photo: this.data.family.grandparents?.mothersMother?.photo },
            { cx: 150, cy: 180, photo: this.data.family.grandparents?.mothersFather?.photo },
            { cx: 250, cy: 180, photo: this.data.family.grandparents?.fathersMother?.photo },
            { cx: 340, cy: 190, photo: this.data.family.grandparents?.fathersFather?.photo },
            // Parents
            { cx: 120, cy: 260, photo: this.data.family.parents?.mother?.photo },
            { cx: 280, cy: 260, photo: this.data.family.parents?.father?.photo },
            // Child
            { cx: 200, cy: 350, photo: this.data.family.child?.photo }
        ];

        // Photo radius by generation — bigger than closing tree
        const getRadius = (i) => {
            if (i === 14) return 24;   // Child — largest
            if (i >= 12) return 22;    // Parents
            if (i >= 8) return 18;     // Grandparents
            return 14;                  // Great-grandparents
        };

        const defs = document.createElementNS(SVG_NS, 'defs');
        photoTips.forEach((tip, i) => {
            if (!tip.photo) return;
            const r = getRadius(i);
            const clip = document.createElementNS(SVG_NS, 'clipPath');
            clip.id = `title-clip-${i}`;
            const clipCircle = document.createElementNS(SVG_NS, 'circle');
            clipCircle.setAttribute('cx', tip.cx);
            clipCircle.setAttribute('cy', tip.cy);
            clipCircle.setAttribute('r', r);
            clip.appendChild(clipCircle);
            defs.appendChild(clip);
        });
        svg.appendChild(defs);

        photoTips.forEach((tip, i) => {
            if (!tip.photo) return;
            const r = getRadius(i);

            const img = document.createElementNS(SVG_NS, 'image');
            img.setAttribute('href', tip.photo);
            img.setAttribute('x', tip.cx - r);
            img.setAttribute('y', tip.cy - r);
            img.setAttribute('width', r * 2);
            img.setAttribute('height', r * 2);
            img.setAttribute('clip-path', `url(#title-clip-${i})`);
            img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
            img.setAttribute('opacity', '0');
            img.classList.add('title-tree-photo');
            img.style.animationDelay = `${0.5 + i * 0.08}s`;
            svg.appendChild(img);

            // White border ring
            const border = document.createElementNS(SVG_NS, 'circle');
            border.setAttribute('cx', tip.cx);
            border.setAttribute('cy', tip.cy);
            border.setAttribute('r', r);
            border.setAttribute('fill', 'none');
            border.setAttribute('stroke', '#FFFEF9');
            border.setAttribute('stroke-width', '2.5');
            border.setAttribute('opacity', '0');
            border.classList.add('title-tree-photo');
            border.style.animationDelay = `${0.5 + i * 0.08}s`;
            svg.appendChild(border);
        });

        container.appendChild(svg);
    },

    /**
     * Render the closing slide decorative tree with photos at branch tips
     */
    renderClosingTree() {
        const container = document.getElementById('closing-tree');
        if (!container || container.querySelector('svg')) return; // only render once

        const SVG_NS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 400 500');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // Draw the tree structure (same as title but with photo circles)
        const treePaths = `
            <g fill="none" stroke="#2D6A4F" stroke-linecap="round" opacity="0.15">
                <path d="M200 500 L200 280" stroke-width="6"/>
                <path d="M200 320 Q160 290 120 260" stroke-width="4"/>
                <path d="M200 320 Q240 290 280 260" stroke-width="4"/>
                <path d="M200 280 Q150 240 100 200" stroke-width="3"/>
                <path d="M200 280 Q250 240 300 200" stroke-width="3"/>
                <path d="M120 260 Q90 230 60 190" stroke-width="2"/>
                <path d="M120 260 Q130 220 150 180" stroke-width="2"/>
                <path d="M280 260 Q270 220 250 180" stroke-width="2"/>
                <path d="M280 260 Q310 230 340 190" stroke-width="2"/>
                <path d="M100 200 Q70 160 50 120" stroke-width="1.5"/>
                <path d="M100 200 Q110 160 130 130" stroke-width="1.5"/>
                <path d="M300 200 Q290 160 270 130" stroke-width="1.5"/>
                <path d="M300 200 Q330 160 350 120" stroke-width="1.5"/>
                <path d="M60 190 Q40 150 30 110" stroke-width="1"/>
                <path d="M60 190 Q70 150 90 120" stroke-width="1"/>
                <path d="M150 180 Q140 140 120 100" stroke-width="1"/>
                <path d="M150 180 Q170 140 180 110" stroke-width="1"/>
                <path d="M250 180 Q230 140 220 110" stroke-width="1"/>
                <path d="M250 180 Q260 140 280 100" stroke-width="1"/>
                <path d="M340 190 Q330 150 310 120" stroke-width="1"/>
                <path d="M340 190 Q360 150 370 110" stroke-width="1"/>
            </g>
        `;
        svg.innerHTML = treePaths;

        // Photo positions at branch tips (matching leaf positions from title SVG)
        const photoTips = [
            { cx: 30, cy: 105, photo: this.data.family.greatGrandparents?.mothersMothersMother?.photo },
            { cx: 90, cy: 115, photo: this.data.family.greatGrandparents?.mothersMothersFather?.photo },
            { cx: 120, cy: 95, photo: this.data.family.greatGrandparents?.mothersFathersMother?.photo },
            { cx: 180, cy: 105, photo: this.data.family.greatGrandparents?.mothersFathersFather?.photo },
            { cx: 220, cy: 105, photo: this.data.family.greatGrandparents?.fathersMothersMother?.photo },
            { cx: 280, cy: 95, photo: this.data.family.greatGrandparents?.fathersMothersFather?.photo },
            { cx: 310, cy: 115, photo: this.data.family.greatGrandparents?.fathersFathersMother?.photo },
            { cx: 370, cy: 105, photo: this.data.family.greatGrandparents?.fathersFathersFather?.photo },
            // Grandparents
            { cx: 60, cy: 190, photo: this.data.family.grandparents?.mothersMother?.photo },
            { cx: 150, cy: 180, photo: this.data.family.grandparents?.mothersFather?.photo },
            { cx: 250, cy: 180, photo: this.data.family.grandparents?.fathersMother?.photo },
            { cx: 340, cy: 190, photo: this.data.family.grandparents?.fathersFather?.photo },
            // Parents
            { cx: 120, cy: 260, photo: this.data.family.parents?.mother?.photo },
            { cx: 280, cy: 260, photo: this.data.family.parents?.father?.photo },
            // Child
            { cx: 200, cy: 350, photo: this.data.family.child?.photo }
        ];

        const defs = document.createElementNS(SVG_NS, 'defs');
        photoTips.forEach((tip, i) => {
            if (!tip.photo) return;
            const r = i >= 12 ? 18 : (i >= 8 ? 14 : 11);

            // Clip path
            const clip = document.createElementNS(SVG_NS, 'clipPath');
            clip.id = `closing-clip-${i}`;
            const clipCircle = document.createElementNS(SVG_NS, 'circle');
            clipCircle.setAttribute('cx', tip.cx);
            clipCircle.setAttribute('cy', tip.cy);
            clipCircle.setAttribute('r', r);
            clip.appendChild(clipCircle);
            defs.appendChild(clip);
        });
        svg.appendChild(defs);

        photoTips.forEach((tip, i) => {
            if (!tip.photo) return;
            const r = i >= 12 ? 18 : (i >= 8 ? 14 : 11);

            const img = document.createElementNS(SVG_NS, 'image');
            img.setAttribute('href', tip.photo);
            img.setAttribute('x', tip.cx - r);
            img.setAttribute('y', tip.cy - r);
            img.setAttribute('width', r * 2);
            img.setAttribute('height', r * 2);
            img.setAttribute('clip-path', `url(#closing-clip-${i})`);
            img.setAttribute('preserveAspectRatio', 'xMidYMid slice');
            img.setAttribute('opacity', '0');
            img.style.animation = `closingPhotoAppear 0.4s ease-out ${0.3 + i * 0.08}s forwards`;
            svg.appendChild(img);

            // Border
            const border = document.createElementNS(SVG_NS, 'circle');
            border.setAttribute('cx', tip.cx);
            border.setAttribute('cy', tip.cy);
            border.setAttribute('r', r);
            border.setAttribute('fill', 'none');
            border.setAttribute('stroke', '#FFFEF9');
            border.setAttribute('stroke-width', '2');
            border.setAttribute('opacity', '0');
            border.style.animation = `closingPhotoAppear 0.4s ease-out ${0.3 + i * 0.08}s forwards`;
            svg.appendChild(border);
        });

        container.appendChild(svg);
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
