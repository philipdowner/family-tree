/**
 * Tree Renderer Module
 * Creates the visual family tree with SVG
 */

const TreeRenderer = {
    // SVG namespace
    SVG_NS: 'http://www.w3.org/2000/svg',

    // Tree layout configuration
    config: {
        viewBox: { width: 1920, height: 1080 },
        padding: { top: 60, bottom: 120, left: 100, right: 100 },

        // Card sizes per generation
        cardSizes: {
            0: { width: 160, height: 180, photoSize: 80 },  // Child
            1: { width: 140, height: 160, photoSize: 60 },  // Parents
            2: { width: 120, height: 140, photoSize: 50 },  // Grandparents
            3: { width: 100, height: 110, photoSize: 40 }   // Great-grandparents
        },

        // Vertical spacing between generations
        generationGap: 50
    },

    // Cached elements
    svg: null,
    branchesGroup: null,
    cardsGroup: null,

    /**
     * Initialize the tree renderer
     */
    init() {
        this.svg = document.getElementById('tree-svg');
        this.branchesGroup = document.getElementById('tree-branches');
        this.cardsGroup = document.getElementById('tree-cards');
    },

    /**
     * Clear existing tree content
     */
    clear() {
        if (this.branchesGroup) this.branchesGroup.innerHTML = '';
        if (this.cardsGroup) this.cardsGroup.innerHTML = '';
    },

    /**
     * Calculate positions for all family members
     * @param {Object} familyData - The family data
     * @returns {Object} Position map for each role
     */
    calculatePositions(familyData) {
        const vb = this.config.viewBox;
        const pad = this.config.padding;

        const usableWidth = vb.width - pad.left - pad.right;
        const usableHeight = vb.height - pad.top - pad.bottom;

        // Calculate Y positions for each generation (from bottom to top)
        const genHeights = [
            pad.top + usableHeight * 0.85,  // Gen 0: Child (bottom)
            pad.top + usableHeight * 0.62,  // Gen 1: Parents
            pad.top + usableHeight * 0.38,  // Gen 2: Grandparents
            pad.top + usableHeight * 0.12   // Gen 3: Great-grandparents (top)
        ];

        const centerX = vb.width / 2;
        const positions = {};

        // Child - centered at bottom
        positions.child = {
            x: centerX,
            y: genHeights[0],
            generation: 0,
            side: 'center'
        };

        // Parents - spread wider to prevent great-grandparent overlap
        const parentSpread = usableWidth * 0.30;
        positions.mother = {
            x: centerX - parentSpread,
            y: genHeights[1],
            generation: 1,
            side: 'maternal'
        };
        positions.father = {
            x: centerX + parentSpread,
            y: genHeights[1],
            generation: 1,
            side: 'paternal'
        };

        // Grandparents - reduced spread to keep tree balanced
        const gpSpread = usableWidth * 0.14;
        positions.mothersMother = {
            x: centerX - parentSpread - gpSpread,
            y: genHeights[2],
            generation: 2,
            side: 'maternal'
        };
        positions.mothersFather = {
            x: centerX - parentSpread + gpSpread,
            y: genHeights[2],
            generation: 2,
            side: 'maternal'
        };
        positions.fathersMother = {
            x: centerX + parentSpread - gpSpread,
            y: genHeights[2],
            generation: 2,
            side: 'paternal'
        };
        positions.fathersFather = {
            x: centerX + parentSpread + gpSpread,
            y: genHeights[2],
            generation: 2,
            side: 'paternal'
        };

        // Great-grandparents - tighter spread to prevent center overlap
        const ggpSpread = usableWidth * 0.06;

        // Maternal side (left half)
        positions.mothersMothersMother = {
            x: positions.mothersMother.x - ggpSpread,
            y: genHeights[3],
            generation: 3,
            side: 'maternal'
        };
        positions.mothersMothersFather = {
            x: positions.mothersMother.x + ggpSpread,
            y: genHeights[3],
            generation: 3,
            side: 'maternal'
        };
        positions.mothersFathersMother = {
            x: positions.mothersFather.x - ggpSpread,
            y: genHeights[3],
            generation: 3,
            side: 'maternal'
        };
        positions.mothersFathersFather = {
            x: positions.mothersFather.x + ggpSpread,
            y: genHeights[3],
            generation: 3,
            side: 'maternal'
        };

        // Paternal side (right half)
        positions.fathersMothersMother = {
            x: positions.fathersMother.x - ggpSpread,
            y: genHeights[3],
            generation: 3,
            side: 'paternal'
        };
        positions.fathersMothersFather = {
            x: positions.fathersMother.x + ggpSpread,
            y: genHeights[3],
            generation: 3,
            side: 'paternal'
        };
        positions.fathersFathersMother = {
            x: positions.fathersFather.x - ggpSpread,
            y: genHeights[3],
            generation: 3,
            side: 'paternal'
        };
        positions.fathersFathersFather = {
            x: positions.fathersFather.x + ggpSpread,
            y: genHeights[3],
            generation: 3,
            side: 'paternal'
        };

        return positions;
    },

    /**
     * Create SVG element
     * @param {string} tag - SVG element tag
     * @param {Object} attrs - Attributes to set
     * @returns {SVGElement} The created element
     */
    createSVGElement(tag, attrs = {}) {
        const el = document.createElementNS(this.SVG_NS, tag);
        Object.entries(attrs).forEach(([key, value]) => {
            el.setAttribute(key, value);
        });
        return el;
    },

    /**
     * Render the complete family tree
     * @param {Object} familyData - The family data
     */
    render(familyData) {
        this.clear();

        const positions = this.calculatePositions(familyData);

        // Draw branches first (behind cards)
        this.drawBranches(positions, familyData);

        // Draw person cards
        this.drawCards(positions, familyData);
    },

    /**
     * Draw connection branches between family members
     * @param {Object} positions - Position map
     * @param {Object} familyData - Family data
     */
    drawBranches(positions, familyData) {
        const connections = [
            // Child to parents
            { from: 'child', to: 'mother', side: 'maternal' },
            { from: 'child', to: 'father', side: 'paternal' },

            // Parents to grandparents
            { from: 'mother', to: 'mothersMother', side: 'maternal' },
            { from: 'mother', to: 'mothersFather', side: 'maternal' },
            { from: 'father', to: 'fathersMother', side: 'paternal' },
            { from: 'father', to: 'fathersFather', side: 'paternal' },

            // Grandparents to great-grandparents
            { from: 'mothersMother', to: 'mothersMothersMother', side: 'maternal' },
            { from: 'mothersMother', to: 'mothersMothersFather', side: 'maternal' },
            { from: 'mothersFather', to: 'mothersFathersMother', side: 'maternal' },
            { from: 'mothersFather', to: 'mothersFathersFather', side: 'maternal' },
            { from: 'fathersMother', to: 'fathersMothersMother', side: 'paternal' },
            { from: 'fathersMother', to: 'fathersMothersFather', side: 'paternal' },
            { from: 'fathersFather', to: 'fathersFathersMother', side: 'paternal' },
            { from: 'fathersFather', to: 'fathersFathersFather', side: 'paternal' }
        ];

        connections.forEach((conn, index) => {
            const fromPos = positions[conn.from];
            const toPos = positions[conn.to];

            if (!fromPos || !toPos) return;

            // Get card heights for proper connection points
            const fromGen = fromPos.generation;
            const toGen = toPos.generation;
            const fromCardHeight = this.config.cardSizes[fromGen].height;
            const toCardHeight = this.config.cardSizes[toGen].height;

            // Connect from top of lower card to bottom of upper card
            const startY = fromPos.y - fromCardHeight / 2;
            const endY = toPos.y + toCardHeight / 2;

            // Create curved path using bezier curve
            const midY = (startY + endY) / 2;
            const path = `M ${fromPos.x} ${startY} C ${fromPos.x} ${midY}, ${toPos.x} ${midY}, ${toPos.x} ${endY}`;

            const branch = this.createSVGElement('path', {
                d: path,
                class: `tree-branch ${conn.side}`,
                'data-delay': index * 100
            });

            this.branchesGroup.appendChild(branch);
        });
    },

    /**
     * Draw all person cards
     * @param {Object} positions - Position map
     * @param {Object} familyData - Family data
     */
    drawCards(positions, familyData) {
        // Define card order for animation (child first, then by generation)
        const cardOrder = [
            { key: 'child', data: familyData.child, role: 'child' },
            { key: 'mother', data: familyData.parents?.mother, role: 'mother' },
            { key: 'father', data: familyData.parents?.father, role: 'father' },
            { key: 'mothersMother', data: familyData.grandparents?.mothersMother, role: 'grandparent' },
            { key: 'mothersFather', data: familyData.grandparents?.mothersFather, role: 'grandparent' },
            { key: 'fathersMother', data: familyData.grandparents?.fathersMother, role: 'grandparent' },
            { key: 'fathersFather', data: familyData.grandparents?.fathersFather, role: 'grandparent' },
            { key: 'mothersMothersMother', data: familyData.greatGrandparents?.mothersMothersMother, role: 'great-grandparent' },
            { key: 'mothersMothersFather', data: familyData.greatGrandparents?.mothersMothersFather, role: 'great-grandparent' },
            { key: 'mothersFathersMother', data: familyData.greatGrandparents?.mothersFathersMother, role: 'great-grandparent' },
            { key: 'mothersFathersFather', data: familyData.greatGrandparents?.mothersFathersFather, role: 'great-grandparent' },
            { key: 'fathersMothersMother', data: familyData.greatGrandparents?.fathersMothersMother, role: 'great-grandparent' },
            { key: 'fathersMothersFather', data: familyData.greatGrandparents?.fathersMothersFather, role: 'great-grandparent' },
            { key: 'fathersFathersMother', data: familyData.greatGrandparents?.fathersFathersMother, role: 'great-grandparent' },
            { key: 'fathersFathersFather', data: familyData.greatGrandparents?.fathersFathersFather, role: 'great-grandparent' }
        ];

        cardOrder.forEach((item, index) => {
            if (!item.data || !positions[item.key]) return;

            const pos = positions[item.key];
            const card = this.createPersonCard(item.data, pos, item.key, index);
            this.cardsGroup.appendChild(card);
        });
    },

    /**
     * Create a person card SVG group
     * @param {Object} person - Person data
     * @param {Object} pos - Position data
     * @param {string} role - Role identifier
     * @param {number} index - Animation delay index
     * @returns {SVGElement} The card group
     */
    createPersonCard(person, pos, role, index) {
        const gen = pos.generation;
        const size = this.config.cardSizes[gen];
        const sideClass = pos.side === 'maternal' ? 'maternal' :
                         pos.side === 'paternal' ? 'paternal' : 'child';

        // Create group for the card
        const group = this.createSVGElement('g', {
            class: `tree-card gen-${gen} ${sideClass}`,
            'data-role': role,
            'data-delay': index * 150,
            transform: `translate(${pos.x - size.width / 2}, ${pos.y - size.height / 2})`
        });

        // Background rectangle
        const bg = this.createSVGElement('rect', {
            class: 'tree-card-bg',
            width: size.width,
            height: size.height,
            rx: 12,
            ry: 12
        });
        group.appendChild(bg);

        // Photo or placeholder
        const photoY = 15;
        const photoX = size.width / 2;
        const photoR = size.photoSize / 2;

        // Create clip path for circular photo
        const clipId = `photo-clip-${role}`;
        const defs = this.createSVGElement('defs');
        const clipPath = this.createSVGElement('clipPath', { id: clipId });
        const clipCircle = this.createSVGElement('circle', {
            cx: photoX,
            cy: photoY + photoR,
            r: photoR
        });
        clipPath.appendChild(clipCircle);
        defs.appendChild(clipPath);
        group.appendChild(defs);

        // Photo placeholder circle (always visible as background)
        const photoPlaceholder = this.createSVGElement('circle', {
            class: 'tree-card-photo-placeholder',
            cx: photoX,
            cy: photoY + photoR,
            r: photoR
        });
        group.appendChild(photoPlaceholder);

        // Actual photo image (if exists)
        if (person.photo) {
            const photoImg = this.createSVGElement('image', {
                href: person.photo,
                x: photoX - photoR,
                y: photoY,
                width: size.photoSize,
                height: size.photoSize,
                'clip-path': `url(#${clipId})`,
                preserveAspectRatio: 'xMidYMid slice'
            });
            group.appendChild(photoImg);
        }

        // Photo border
        const photoBorder = this.createSVGElement('circle', {
            class: 'tree-card-photo-border',
            cx: photoX,
            cy: photoY + photoR,
            r: photoR
        });
        group.appendChild(photoBorder);

        // Name text
        const nameY = photoY + size.photoSize + 20;
        const nameClass = gen >= 2 ? 'tree-card-name small' : 'tree-card-name';
        const name = this.createSVGElement('text', {
            class: nameClass,
            x: size.width / 2,
            y: nameY
        });

        // Show first name for great-grandparents (space limited)
        const displayName = gen >= 3 ?
            person.firstName :
            `${person.firstName} ${person.lastName}`;

        name.textContent = displayName;
        group.appendChild(name);

        // Dates
        const dateRange = DataLoader.getDateRange(person);
        if (dateRange && gen < 3) {
            const datesClass = gen >= 2 ? 'tree-card-dates small' : 'tree-card-dates';
            const dates = this.createSVGElement('text', {
                class: datesClass,
                x: size.width / 2,
                y: nameY + 16
            });
            dates.textContent = dateRange;
            group.appendChild(dates);
        }

        return group;
    },

    /**
     * Animate tree entrance
     * @param {Object} config - Animation config
     */
    animateEntrance(config = {}) {
        const duration = config.treeGrowthDuration || 2000;
        const cardDelay = config.cardFadeDelay || 150;

        // Animate branches
        const branches = this.branchesGroup.querySelectorAll('.tree-branch');
        branches.forEach((branch, index) => {
            const delay = parseInt(branch.dataset.delay) || index * 100;
            setTimeout(() => {
                branch.classList.add('animated');
            }, delay);
        });

        // Animate cards
        const cards = this.cardsGroup.querySelectorAll('.tree-card');
        cards.forEach((card, index) => {
            const delay = parseInt(card.dataset.delay) || index * cardDelay;
            setTimeout(() => {
                card.classList.add('visible');
            }, duration / 2 + delay);
        });
    },

    /**
     * Reset all animations (for replaying)
     */
    resetAnimations() {
        const branches = this.branchesGroup.querySelectorAll('.tree-branch');
        branches.forEach(branch => branch.classList.remove('animated'));

        const cards = this.cardsGroup.querySelectorAll('.tree-card');
        cards.forEach(card => card.classList.remove('visible'));
    },

    /**
     * Create focus cards for detail slides
     * @param {Array} people - Array of person data with side info
     * @param {HTMLElement} container - Container to render into
     */
    createFocusCards(people, container) {
        container.innerHTML = '';

        people.forEach(person => {
            if (!person) return;

            const card = document.createElement('div');
            card.className = `focus-person-card ${person.side || ''}`;

            // Get initials for placeholder
            const initials = (person.firstName?.[0] || '') + (person.lastName?.[0] || '');

            card.innerHTML = `
                <div class="focus-person-photo placeholder" data-initials="${initials}"
                     ${person.photo ? `style="background-image: url('${person.photo}'); background-size: cover;"` : ''}>
                </div>
                <h3 class="focus-person-name">${person.firstName} ${person.lastName}</h3>
                <p class="focus-person-dates">${DataLoader.getDateRange(person) || ''}</p>
                ${person.countryOfOrigin ? `
                    <div class="focus-person-origin">
                        <img class="focus-person-flag"
                             src="images/flags/${person.countryFlag || 'un'}.svg"
                             alt="${person.countryOfOrigin}"
                             onerror="this.style.display='none'">
                        <span>${person.countryOfOrigin}</span>
                    </div>
                ` : ''}
            `;

            container.appendChild(card);
        });
    }
};

// Export for use in other modules
window.TreeRenderer = TreeRenderer;
