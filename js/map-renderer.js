/**
 * Map Renderer Module
 * Handles the world map with animated pins showing countries of origin
 */

const MapRenderer = {
    // SVG namespace
    SVG_NS: 'http://www.w3.org/2000/svg',

    // Map dimensions (matches viewBox)
    mapWidth: 1000,
    mapHeight: 500,

    // Pin configuration
    pinConfig: {
        radius: 8,
        pulseRadius: 15,
        labelOffset: 20
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

        // Create pins for each country
        this.createPins(countryMembers, countriesData);

        // Create legend
        this.createLegend(countryMembers, countriesData);
    },

    /**
     * Load the SVG map file
     */
    async loadMap() {
        try {
            const response = await fetch('images/map/world-map.svg');
            const svgText = await response.text();

            // Parse the SVG
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
            this.mapSVG = svgDoc.documentElement;

            // Clear container and append map
            this.container.innerHTML = '';
            this.container.appendChild(this.mapSVG);
        } catch (error) {
            console.error('Error loading map:', error);
            this.container.innerHTML = '<p class="error">Could not load map</p>';
        }
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
            Object.values(familyData.greatGrandparents).forEach(person => {
                if (person && !person._comment) {
                    addMember(person, 'Great-grandparent');
                }
            });
        }

        return countries;
    },

    /**
     * Create pins on the map
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

            // Calculate pixel position from percentage
            const x = (countryCoords.x / 100) * this.mapWidth;
            const y = (countryCoords.y / 100) * this.mapHeight;

            // Create pin group
            const pinGroup = this.createPin(x, y, data, index);
            this.pinsGroup.appendChild(pinGroup);
        });
    },

    /**
     * Create a single pin element
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} data - Country data with members
     * @param {number} index - Pin index for animation delay
     * @returns {SVGElement} Pin group element
     */
    createPin(x, y, data, index) {
        const group = document.createElementNS(this.SVG_NS, 'g');
        group.setAttribute('class', 'map-pin');
        group.setAttribute('data-country', data.code);
        group.setAttribute('data-delay', index * 300);
        group.setAttribute('transform', `translate(${x}, ${y})`);

        // Pulse animation circle (behind the pin)
        const pulse = document.createElementNS(this.SVG_NS, 'circle');
        pulse.setAttribute('class', 'map-pin-pulse');
        pulse.setAttribute('cx', 0);
        pulse.setAttribute('cy', 0);
        pulse.setAttribute('r', this.pinConfig.pulseRadius);
        pulse.setAttribute('fill', '#0D7377');
        pulse.setAttribute('opacity', '0.3');
        group.appendChild(pulse);

        // Main pin circle
        const pin = document.createElementNS(this.SVG_NS, 'circle');
        pin.setAttribute('cx', 0);
        pin.setAttribute('cy', 0);
        pin.setAttribute('r', this.pinConfig.radius);
        pin.setAttribute('fill', '#0D7377');
        pin.setAttribute('stroke', '#FFFFFF');
        pin.setAttribute('stroke-width', '2');
        group.appendChild(pin);

        // Inner dot
        const dot = document.createElementNS(this.SVG_NS, 'circle');
        dot.setAttribute('cx', 0);
        dot.setAttribute('cy', 0);
        dot.setAttribute('r', 3);
        dot.setAttribute('fill', '#FFFFFF');
        group.appendChild(dot);

        // Country label
        const label = document.createElementNS(this.SVG_NS, 'text');
        label.setAttribute('x', 0);
        label.setAttribute('y', this.pinConfig.labelOffset);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', '#2D3436');
        label.setAttribute('font-size', '12');
        label.setAttribute('font-weight', '500');
        label.setAttribute('font-family', 'Segoe UI, sans-serif');
        label.textContent = data.country;
        group.appendChild(label);

        // Member count badge (if more than 1)
        if (data.members.length > 1) {
            const badge = document.createElementNS(this.SVG_NS, 'g');
            badge.setAttribute('transform', `translate(${this.pinConfig.radius}, -${this.pinConfig.radius})`);

            const badgeCircle = document.createElementNS(this.SVG_NS, 'circle');
            badgeCircle.setAttribute('r', 8);
            badgeCircle.setAttribute('fill', '#FF6B6B');
            badgeCircle.setAttribute('stroke', '#FFFFFF');
            badgeCircle.setAttribute('stroke-width', '1');
            badge.appendChild(badgeCircle);

            const badgeText = document.createElementNS(this.SVG_NS, 'text');
            badgeText.setAttribute('text-anchor', 'middle');
            badgeText.setAttribute('dominant-baseline', 'central');
            badgeText.setAttribute('fill', '#FFFFFF');
            badgeText.setAttribute('font-size', '10');
            badgeText.setAttribute('font-weight', '600');
            badgeText.textContent = data.members.length;
            badge.appendChild(badgeText);

            group.appendChild(badge);
        }

        return group;
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
