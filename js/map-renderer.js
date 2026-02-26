/**
 * Map Renderer Module
 * Vintage cartography-styled world map with animated teardrop pins
 */

const MapRenderer = {
    // SVG namespace
    SVG_NS: 'http://www.w3.org/2000/svg',

    // Map dimensions (matches viewBox of world-map.svg)
    mapWidth: 4378.13,
    mapHeight: 2434.94,

    // Pin configuration
    pinConfig: {
        radius: 35,
        pulseRadius: 60,
        labelOffset: 80,
        teardropHeight: 50
    },

    // Store references
    container: null,
    mapSVG: null,
    pinsGroup: null,
    legendContainer: null,

    /**
     * Initialize the map renderer
     */
    init() {
        this.container = document.getElementById('map-container');
        this.legendContainer = document.getElementById('map-legend');
    },

    /**
     * Load and render the map with pins
     * @param {Object} familyData - Family data
     * @param {Object} countriesData - Countries coordinate data
     */
    async render(familyData, countriesData) {
        if (!this.container) return;

        // Load the SVG map
        await this.loadMap();

        if (!this.mapSVG) return;

        // Apply vintage styling to map paths
        this.applyVintageStyle();

        // Add compass rose
        this.addCompassRose();

        // Get pins group
        this.pinsGroup = this.mapSVG.getElementById('map-pins');
        if (!this.pinsGroup) {
            this.pinsGroup = document.createElementNS(this.SVG_NS, 'g');
            this.pinsGroup.id = 'map-pins';
            this.mapSVG.appendChild(this.pinsGroup);
        }

        // Clear existing pins
        this.pinsGroup.innerHTML = '';

        // Collect countries with family members
        const countryMembers = this.collectCountryData(familyData);

        // Check if single-country fallback needed
        const countryKeys = Object.keys(countryMembers);
        if (countryKeys.length === 1) {
            this.createSingleCountryDisplay(countryMembers[countryKeys[0]], countriesData);
        } else {
            this.createPins(countryMembers, countriesData);
        }

        // Create legend
        this.createLegend(countryMembers, countriesData);
    },

    /**
     * Load the SVG map file
     */
    async loadMap() {
        try {
            // Use pre-bundled SVG when available (required for file:// / USB use)
            const svgText = window.BUNDLED_DATA?.worldMapSVG
                ?? await fetch('images/map/world-map.svg').then(r => r.text());

            // Parse the SVG
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            this.mapSVG = svgDoc.documentElement;

            // Make the SVG fill the entire container
            this.mapSVG.setAttribute('preserveAspectRatio', 'xMidYMid slice');
            this.mapSVG.setAttribute('width', '100%');
            this.mapSVG.setAttribute('height', '100%');

            // Clear container and append map
            this.container.innerHTML = '';
            this.container.appendChild(this.mapSVG);
        } catch (error) {
            console.error('Error loading map:', error);
            this.container.innerHTML = '<p class="error">Could not load map</p>';
        }
    },

    /**
     * Apply vintage cartography styling to the map SVG paths
     */
    applyVintageStyle() {
        if (!this.mapSVG) return;

        // Style all land paths
        const paths = this.mapSVG.querySelectorAll('path');
        paths.forEach(path => {
            const currentFill = path.getAttribute('fill');
            const currentClass = path.getAttribute('class') || '';

            // Skip if it's a water/ocean element or already a pin
            if (currentClass.includes('map-pin') || currentClass.includes('ocean')) return;

            // Apply warm parchment tones to land masses
            if (currentFill && currentFill !== 'none') {
                path.setAttribute('fill', '#E8DCC8');
                path.setAttribute('stroke', '#C4A882');
                path.setAttribute('stroke-width', '0.5');
            }
        });

        // Style background/ocean if present
        const rects = this.mapSVG.querySelectorAll('rect');
        rects.forEach(rect => {
            rect.setAttribute('fill', '#D4CFC0');
        });

    },

    /**
     * Add a decorative compass rose to the map
     */
    addCompassRose() {
        if (!this.mapSVG) return;

        const g = document.createElementNS(this.SVG_NS, 'g');
        // Position in bottom-right area
        g.setAttribute('transform', `translate(${this.mapWidth * 0.88}, ${this.mapHeight * 0.78})`);
        g.setAttribute('opacity', '0.25');

        const size = 80;

        // Outer circle
        const circle = document.createElementNS(this.SVG_NS, 'circle');
        circle.setAttribute('r', size);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', '#8B7355');
        circle.setAttribute('stroke-width', '2');
        g.appendChild(circle);

        // Inner circle
        const innerCircle = document.createElementNS(this.SVG_NS, 'circle');
        innerCircle.setAttribute('r', size * 0.3);
        innerCircle.setAttribute('fill', 'none');
        innerCircle.setAttribute('stroke', '#8B7355');
        innerCircle.setAttribute('stroke-width', '1');
        g.appendChild(innerCircle);

        // Cardinal direction points (N, S, E, W)
        const directions = [
            { angle: 0, label: 'N', length: size * 0.9 },
            { angle: 90, label: 'E', length: size * 0.7 },
            { angle: 180, label: 'S', length: size * 0.7 },
            { angle: 270, label: 'W', length: size * 0.7 }
        ];

        directions.forEach(d => {
            const rad = (d.angle - 90) * Math.PI / 180;
            const x2 = Math.cos(rad) * d.length;
            const y2 = Math.sin(rad) * d.length;

            // Line from center to tip
            const line = document.createElementNS(this.SVG_NS, 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#8B7355');
            line.setAttribute('stroke-width', d.label === 'N' ? 3 : 1.5);
            g.appendChild(line);

            // Letter label
            const lx = Math.cos(rad) * (size + 18);
            const ly = Math.sin(rad) * (size + 18);
            const text = document.createElementNS(this.SVG_NS, 'text');
            text.setAttribute('x', lx);
            text.setAttribute('y', ly);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'central');
            text.setAttribute('fill', '#8B7355');
            text.setAttribute('font-size', '24');
            text.setAttribute('font-family', "'Freight Display Pro', Georgia, serif");
            text.setAttribute('font-weight', d.label === 'N' ? '700' : '400');
            text.textContent = d.label;
            g.appendChild(text);
        });

        // Intercardinal lines (NE, SE, SW, NW) - thinner
        [45, 135, 225, 315].forEach(angle => {
            const rad = (angle - 90) * Math.PI / 180;
            const line = document.createElementNS(this.SVG_NS, 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', Math.cos(rad) * size * 0.5);
            line.setAttribute('y2', Math.sin(rad) * size * 0.5);
            line.setAttribute('stroke', '#8B7355');
            line.setAttribute('stroke-width', '0.75');
            g.appendChild(line);
        });

        this.mapSVG.appendChild(g);
    },

    /**
     * Collect country data from family members
     * @param {Object} familyData - Family data
     * @returns {Object} Map of country codes to member arrays
     */
    collectCountryData(familyData) {
        const countries = {};

        const addMember = (person, relationship) => {
            if (!person || !person.countryFlag) return;

            const code = person.countryFlag.toLowerCase();
            if (!countries[code]) {
                countries[code] = {
                    code: code,
                    country: person.countryOfOrigin,
                    members: []
                };
            }
            countries[code].members.push({
                name: `${person.firstName} ${person.lastName}`,
                relationship: relationship
            });
        };

        // Add all family members
        addMember(familyData.child, 'You');

        if (familyData.parents) {
            addMember(familyData.parents.mother, 'Mother');
            addMember(familyData.parents.father, 'Father');
        }

        if (familyData.grandparents) {
            addMember(familyData.grandparents.mothersMother, 'Grandmother');
            addMember(familyData.grandparents.mothersFather, 'Grandfather');
            addMember(familyData.grandparents.fathersMother, 'Grandmother');
            addMember(familyData.grandparents.fathersFather, 'Grandfather');
        }

        if (familyData.greatGrandparents) {
            Object.entries(familyData.greatGrandparents).forEach(([key, person]) => {
                if (!key.startsWith('_') && person && typeof person === 'object') {
                    addMember(person, 'Great-grandparent');
                }
            });
        }

        return countries;
    },

    /**
     * Create teardrop pins on the map
     * @param {Object} countryMembers - Country to members mapping
     * @param {Object} countriesData - Countries coordinate data
     */
    createPins(countryMembers, countriesData) {
        const countries = countriesData.countries || {};

        Object.entries(countryMembers).forEach(([code, data], index) => {
            const countryCoords = countries[code];
            if (!countryCoords) {
                console.warn(`No coordinates for country: ${code}`);
                return;
            }

            const x = (countryCoords.x / 100) * this.mapWidth;
            const y = (countryCoords.y / 100) * this.mapHeight;

            const pinGroup = this.createTeardropPin(x, y, data, index);
            this.pinsGroup.appendChild(pinGroup);
        });
    },

    /**
     * Create a teardrop-shaped pin
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} data - Country data with members
     * @param {number} index - Pin index for animation delay
     * @returns {SVGElement} Pin group element
     */
    createTeardropPin(x, y, data, index) {
        const positionGroup = document.createElementNS(this.SVG_NS, 'g');
        positionGroup.setAttribute('transform', `translate(${x}, ${y})`);

        const group = document.createElementNS(this.SVG_NS, 'g');
        group.setAttribute('class', 'map-pin');
        group.setAttribute('data-country', data.code);
        group.setAttribute('data-delay', index * 300);

        const r = this.pinConfig.radius;

        // Pulse animation circle
        const pulse = document.createElementNS(this.SVG_NS, 'circle');
        pulse.setAttribute('class', 'map-pin-pulse');
        pulse.setAttribute('cx', 0);
        pulse.setAttribute('cy', 0);
        pulse.setAttribute('r', this.pinConfig.pulseRadius);
        pulse.setAttribute('fill', '#2D6A4F');
        pulse.setAttribute('opacity', '0.3');
        group.appendChild(pulse);

        // Teardrop shape path (point at bottom, round at top)
        const teardrop = document.createElementNS(this.SVG_NS, 'path');
        const h = this.pinConfig.teardropHeight;
        teardrop.setAttribute('d', `M0,${h} C-${r*0.8},${h*0.5} -${r},-${r*0.3} 0,-${r} C${r},-${r*0.3} ${r*0.8},${h*0.5} 0,${h} Z`);
        teardrop.setAttribute('fill', '#2D6A4F');
        teardrop.setAttribute('stroke', '#FFFEF9');
        teardrop.setAttribute('stroke-width', '4');
        teardrop.setAttribute('transform', `translate(0, -${h})`);
        group.appendChild(teardrop);

        // Country initial letter inside pin
        const initial = document.createElementNS(this.SVG_NS, 'text');
        initial.setAttribute('x', 0);
        initial.setAttribute('y', -h + r * 0.15);
        initial.setAttribute('text-anchor', 'middle');
        initial.setAttribute('dominant-baseline', 'central');
        initial.setAttribute('fill', '#FFFEF9');
        initial.setAttribute('font-size', '32');
        initial.setAttribute('font-weight', '700');
        initial.setAttribute('font-family', "'Freight Display Pro', Georgia, serif");
        initial.textContent = data.code.toUpperCase().slice(0, 2);
        group.appendChild(initial);

        // Member count badge
        if (data.members.length > 1) {
            const badge = document.createElementNS(this.SVG_NS, 'g');
            badge.setAttribute('transform', `translate(${r * 0.7}, -${h + r * 0.5})`);

            const badgeCircle = document.createElementNS(this.SVG_NS, 'circle');
            badgeCircle.setAttribute('r', 24);
            badgeCircle.setAttribute('fill', '#BC6C25');
            badgeCircle.setAttribute('stroke', '#FFFEF9');
            badgeCircle.setAttribute('stroke-width', '3');
            badge.appendChild(badgeCircle);

            const badgeText = document.createElementNS(this.SVG_NS, 'text');
            badgeText.setAttribute('text-anchor', 'middle');
            badgeText.setAttribute('dominant-baseline', 'central');
            badgeText.setAttribute('fill', '#FFFEF9');
            badgeText.setAttribute('font-size', '28');
            badgeText.setAttribute('font-weight', '700');
            badgeText.textContent = data.members.length;
            badge.appendChild(badgeText);

            group.appendChild(badge);
        }

        positionGroup.appendChild(group);
        return positionGroup;
    },

    /**
     * Single-country fallback: large decorative pin with names radiating outward
     * @param {Object} countryData - The single country data
     * @param {Object} countriesData - Countries coordinate data
     */
    createSingleCountryDisplay(countryData, countriesData) {
        const countries = countriesData.countries || {};
        const coords = countries[countryData.code];
        if (!coords) return;

        const x = (coords.x / 100) * this.mapWidth;
        const y = (coords.y / 100) * this.mapHeight;

        const positionGroup = document.createElementNS(this.SVG_NS, 'g');
        positionGroup.setAttribute('transform', `translate(${x}, ${y})`);

        const group = document.createElementNS(this.SVG_NS, 'g');
        group.setAttribute('class', 'map-pin');
        group.setAttribute('data-country', countryData.code);
        group.setAttribute('data-delay', 0);

        // Large pulse
        const pulse = document.createElementNS(this.SVG_NS, 'circle');
        pulse.setAttribute('class', 'map-pin-pulse');
        pulse.setAttribute('cx', 0);
        pulse.setAttribute('cy', 0);
        pulse.setAttribute('r', 120);
        pulse.setAttribute('fill', '#2D6A4F');
        pulse.setAttribute('opacity', '0.2');
        group.appendChild(pulse);

        // Large teardrop
        const r = 55;
        const h = 75;
        const teardrop = document.createElementNS(this.SVG_NS, 'path');
        teardrop.setAttribute('d', `M0,${h} C-${r*0.8},${h*0.5} -${r},-${r*0.3} 0,-${r} C${r},-${r*0.3} ${r*0.8},${h*0.5} 0,${h} Z`);
        teardrop.setAttribute('fill', '#2D6A4F');
        teardrop.setAttribute('stroke', '#FFFEF9');
        teardrop.setAttribute('stroke-width', '5');
        teardrop.setAttribute('transform', `translate(0, -${h})`);
        group.appendChild(teardrop);

        // Country flag letters inside
        const initial = document.createElementNS(this.SVG_NS, 'text');
        initial.setAttribute('x', 0);
        initial.setAttribute('y', -h + r * 0.15);
        initial.setAttribute('text-anchor', 'middle');
        initial.setAttribute('dominant-baseline', 'central');
        initial.setAttribute('fill', '#FFFEF9');
        initial.setAttribute('font-size', '42');
        initial.setAttribute('font-weight', '700');
        initial.setAttribute('font-family', "'Freight Display Pro', Georgia, serif");
        initial.textContent = countryData.code.toUpperCase();
        group.appendChild(initial);

        positionGroup.appendChild(group);
        this.pinsGroup.appendChild(positionGroup);
    },

    /**
     * Create the legend showing all countries
     * @param {Object} countryMembers - Country to members mapping
     * @param {Object} countriesData - Countries coordinate data
     */
    createLegend(countryMembers, countriesData) {
        if (!this.legendContainer) return;

        this.legendContainer.innerHTML = '';

        const countries = countriesData.countries || {};

        Object.entries(countryMembers).forEach(([code, data]) => {
            const countryInfo = countries[code];
            const countryName = countryInfo?.name || data.country;

            const item = document.createElement('div');
            item.className = 'legend-item';

            item.innerHTML = `
                <span class="legend-dot"></span>
                <span class="legend-text">${countryName} (${data.members.length})</span>
            `;

            this.legendContainer.appendChild(item);
        });
    },

    /**
     * Animate pins dropping onto the map
     * @param {Object} config - Animation config
     */
    animatePins(config = {}) {
        const delay = config.pinDropDelay || 300;

        if (!this.pinsGroup) return;

        const pins = this.pinsGroup.querySelectorAll('.map-pin');

        pins.forEach((pin, index) => {
            const pinDelay = parseInt(pin.dataset.delay) || index * delay;
            setTimeout(() => {
                pin.classList.add('visible');
            }, pinDelay);
        });
    },

    /**
     * Reset pin animations
     */
    resetAnimations() {
        if (!this.pinsGroup) return;

        const pins = this.pinsGroup.querySelectorAll('.map-pin');
        pins.forEach(pin => pin.classList.remove('visible'));
    }
};

// Export for use in other modules
window.MapRenderer = MapRenderer;
