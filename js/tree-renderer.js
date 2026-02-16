/**
 * Tree Renderer Module
 * Creates the visual family tree with SVG
 */

const TreeRenderer = {
    // SVG namespace
    SVG_NS: 'http://www.w3.org/2000/svg',

    // Tree layout configuration — horizontal cards for readability
    config: {
        viewBox: { width: 1920, height: 1080 },
        padding: { top: 40, bottom: 100, left: 80, right: 80 },

        // Uniform card size for all generations
        card: { width: 160, height: 64, photoSize: 72 },

        // Photo overflows the card on the left
        photoOverflow: 14,

        // Uniform text sizes
        text: { name: 13, years: 11 },

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
            pad.top + usableHeight * 0.15   // Gen 3: Great-grandparents (top)
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

        // Parents - spread wide enough to give great-grandparents room
        const parentSpread = usableWidth * 0.26;
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

        // Grandparents
        const gpSpread = usableWidth * 0.115;
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

        // Great-grandparents
        const ggpSpread = usableWidth * 0.063;

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

        // Draw generation labels on left side
        this.drawGenerationLabels(positions);

        // Draw person cards
        this.drawCards(positions, familyData);
    },

    /**
     * Draw generation labels on the left margin
     * @param {Object} positions - Position map
     */
    drawGenerationLabels(positions) {
        const cardH = this.config.card.height;

        // Labels placed in the gap between generations
        const pairs = [
            { text: 'Great-Grandparents', upperKey: 'mothersMothersMother', lowerKey: 'mothersMother' },
            { text: 'Grandparents', upperKey: 'mothersMother', lowerKey: 'mother' },
            { text: 'Parents', upperKey: 'mother', lowerKey: 'child' },
            { text: 'Me', refKey: 'child' }
        ];

        pairs.forEach(lbl => {
            let labelY;

            if (lbl.refKey) {
                // "Me" — place just above the child card
                const pos = positions[lbl.refKey];
                if (!pos) return;
                labelY = pos.y - cardH / 2 - 12;
            } else {
                // Place in the vertical gap between two generations
                const upper = positions[lbl.upperKey];
                const lower = positions[lbl.lowerKey];
                if (!upper || !lower) return;
                const gapTop = upper.y + cardH / 2;
                const gapBottom = lower.y - cardH / 2;
                labelY = (gapTop + gapBottom) / 2 + 5;
            }

            const label = this.createSVGElement('text', {
                class: 'generation-label',
                x: 30,
                y: labelY
            });
            label.textContent = lbl.text;
            this.branchesGroup.appendChild(label);
        });
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

            const cardH = this.config.card.height;

            // Connect from top of lower card to bottom of upper card
            const startY = fromPos.y - cardH / 2;
            const endY = toPos.y + cardH / 2;

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
        const card = this.config.card;
        const txt = this.config.text;
        const overflow = this.config.photoOverflow;
        const sideClass = pos.side === 'maternal' ? 'maternal' :
                         pos.side === 'paternal' ? 'paternal' : 'child';

        // Card origin (top-left of the rect)
        const cardX = pos.x - card.width / 2;
        const cardY = pos.y - card.height / 2;

        const group = this.createSVGElement('g', {
            class: `tree-card gen-${gen} ${sideClass}`,
            'data-role': role,
            'data-delay': index * 150,
            transform: `translate(${cardX}, ${cardY})`
        });

        // Background rectangle
        group.appendChild(this.createSVGElement('rect', {
            class: 'tree-card-bg',
            x: 0, y: 0,
            width: card.width,
            height: card.height,
            rx: 8, ry: 8
        }));

        // --- Photo: overflows top-left of the card ---
        const photoR = card.photoSize / 2;
        // Center the photo vertically on the card, shifted left so it overlaps the edge
        const photoCX = photoR - overflow;
        const photoCY = card.height / 2;

        const clipId = `photo-clip-${role}`;
        const defs = this.createSVGElement('defs');
        const clipPath = this.createSVGElement('clipPath', { id: clipId });
        clipPath.appendChild(this.createSVGElement('circle', {
            cx: photoCX, cy: photoCY, r: photoR
        }));
        defs.appendChild(clipPath);
        group.appendChild(defs);

        // Placeholder
        group.appendChild(this.createSVGElement('circle', {
            class: 'tree-card-photo-placeholder',
            cx: photoCX, cy: photoCY, r: photoR
        }));

        // Photo image
        if (person.photo) {
            group.appendChild(this.createSVGElement('image', {
                href: person.photo,
                x: photoCX - photoR,
                y: photoCY - photoR,
                width: card.photoSize,
                height: card.photoSize,
                'clip-path': `url(#${clipId})`,
                preserveAspectRatio: 'xMidYMid slice'
            }));
        }

        // Photo border ring
        group.appendChild(this.createSVGElement('circle', {
            class: 'tree-card-photo-border',
            cx: photoCX, cy: photoCY, r: photoR
        }));

        // --- Text: right of photo, inside the card ---
        const textX = photoR - overflow + photoR + 8;

        // Build year string
        const birthYear = person.birthDate ? person.birthDate.split('-')[0] : '';
        const deathYear = person.deathDate ? person.deathDate.split('-')[0] : '';
        let yearStr = '';
        if (birthYear && deathYear) yearStr = `${birthYear}–${deathYear}`;
        else if (birthYear) yearStr = `b. ${birthYear}`;

        // Vertically center the 3-line text block (firstName, lastName, years)
        const lineGap = 3;
        const lines = 2 + (yearStr ? 1 : 0);
        const blockH = txt.name * 2 + (yearStr ? txt.years : 0) + lineGap * (lines - 1);
        let textY = (card.height - blockH) / 2 + txt.name;

        // First name
        const firstName = this.createSVGElement('text', {
            class: 'tree-card-name',
            x: textX, y: textY
        });
        firstName.textContent = person.firstName;
        group.appendChild(firstName);

        // Last name
        textY += txt.name + lineGap;
        const lastName = this.createSVGElement('text', {
            class: 'tree-card-name',
            x: textX, y: textY
        });
        lastName.textContent = person.lastName;
        group.appendChild(lastName);

        // Years
        if (yearStr) {
            textY += txt.years + lineGap;
            const years = this.createSVGElement('text', {
                class: 'tree-card-years',
                x: textX, y: textY
            });
            years.textContent = yearStr;
            group.appendChild(years);
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
     * @param {Object} options - Layout options
     */
    createFocusCards(people, container, options = {}) {
        container.innerHTML = '';

        const layout = options.layout || 'portrait';

        people.forEach((person, index) => {
            if (!person) return;

            const card = document.createElement('div');
            const layoutClass = layout === 'horizontal' ? 'focus-person-card-horizontal' : 'focus-person-card';
            card.className = `${layoutClass} ${person.side || ''}`;

            // Get initials for placeholder (only used when no photo)
            const initials = (person.firstName?.[0] || '') + (person.lastName?.[0] || '');
            const hasPhoto = person.photo ? true : false;

            const photoHTML = `
                <div class="focus-person-photo ${hasPhoto ? '' : 'placeholder'}"
                     ${hasPhoto ? '' : `data-initials="${initials}"`}
                     ${hasPhoto ? `style="background-image: url('${person.photo}'); background-size: cover; background-position: center;"` : ''}>
                </div>
            `;

            const infoHTML = `
                <div class="focus-person-info">
                    <h3 class="focus-person-name">${person.firstName} ${person.lastName}</h3>
                    <p class="focus-person-dates">${DataLoader.getDateRange(person) || ''}</p>
                    ${person.funFact ? `<p class="focus-person-funfact"><em>${person.funFact}</em></p>` : ''}
                    ${person.countryOfOrigin ? `
                        <div class="focus-person-origin">
                            <img class="focus-person-flag"
                                 src="images/flags/${person.countryFlag || 'un'}.svg"
                                 alt="${person.countryOfOrigin}"
                                 onerror="this.style.display='none'">
                            <span>${person.countryOfOrigin}</span>
                        </div>
                    ` : ''}
                </div>
            `;

            if (layout === 'horizontal') {
                card.innerHTML = photoHTML + infoHTML;
            } else {
                card.innerHTML = photoHTML + infoHTML;
            }

            container.appendChild(card);
        });
    },

    // ---------------------------------------------------------------
    //  Click-to-zoom on tree cards
    // ---------------------------------------------------------------

    /** Currently zoomed card element (or null) */
    _zoomedCard: null,

    /** Backdrop overlay behind the zoomed card */
    _backdrop: null,

    /**
     * Set up click-to-zoom handlers on the tree slide.
     * Call once after render().
     */
    initCardZoom() {
        // Create a semi-transparent backdrop (inserted before cards group)
        this._backdrop = this.createSVGElement('rect', {
            class: 'tree-zoom-backdrop',
            x: 0, y: 0,
            width: this.config.viewBox.width,
            height: this.config.viewBox.height
        });
        this._backdrop.style.display = 'none';
        this.svg.insertBefore(this._backdrop, this.cardsGroup);

        // Click on backdrop → dismiss zoom
        this._backdrop.addEventListener('click', (e) => {
            e.stopPropagation();
            this.dismissZoom();
        });

        // Click on each card → zoom it
        const cards = this.cardsGroup.querySelectorAll('.tree-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                this.zoomCard(card);
            });
        });

        // Click anywhere else on the SVG → dismiss
        this.svg.addEventListener('click', () => {
            this.dismissZoom();
        });
    },

    /**
     * Zoom into a specific card.
     * Animates the SVG transform attribute directly via anime.js
     * so that SVG viewBox coordinates are respected.
     * @param {SVGElement} card - The tree-card <g> element
     */
    zoomCard(card) {
        // If clicking the already-zoomed card, dismiss it
        if (this._zoomedCard === card) {
            this.dismissZoom();
            return;
        }

        // Dismiss any currently zoomed card first (instant)
        if (this._zoomedCard) {
            this._resetCard(this._zoomedCard, false);
        }

        this._zoomedCard = card;
        const cardW = this.config.card.width;
        const cardH = this.config.card.height;
        const scale = 2.5;

        // Save original translate
        const origTransform = card.getAttribute('transform');
        card.dataset.origTransform = origTransform;

        const match = origTransform.match(/translate\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/);
        if (!match) return;

        const origTx = parseFloat(match[1]);
        const origTy = parseFloat(match[2]);

        // Card center in SVG coords
        const cx = origTx + cardW / 2;
        const cy = origTy + cardH / 2;

        // Target: card center at viewBox center
        const vbCx = this.config.viewBox.width / 2;
        const vbCy = this.config.viewBox.height / 2;

        // The zoomed transform places the scale origin at the card center:
        //   translate(vbCx, vbCy) scale(s) translate(-cardW/2, -cardH/2)
        const targetTx = vbCx;
        const targetTy = vbCy;

        // Show backdrop & bring card to front
        this._backdrop.style.display = '';
        this.cardsGroup.appendChild(card);
        card.classList.add('zoomed');

        // Animate with anime.js
        const anim = { tx: origTx, ty: origTy, s: 1 };
        anime({
            targets: anim,
            tx: targetTx,
            ty: targetTy,
            s: scale,
            duration: 400,
            easing: 'easeOutCubic',
            update: () => {
                card.setAttribute('transform',
                    `translate(${anim.tx}, ${anim.ty}) scale(${anim.s}) translate(${-cardW / 2}, ${-cardH / 2})`
                );
            }
        });
    },

    /**
     * Dismiss the currently zoomed card
     */
    dismissZoom() {
        if (!this._zoomedCard) return;
        this._resetCard(this._zoomedCard, true);
        this._zoomedCard = null;
    },

    /**
     * Reset a card to its original position
     * @param {SVGElement} card
     * @param {boolean} animate - Whether to animate the return
     */
    _resetCard(card, animate) {
        const orig = card.dataset.origTransform;
        if (!orig) return;

        const match = orig.match(/translate\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)/);
        if (!match) {
            card.setAttribute('transform', orig);
            card.classList.remove('zoomed');
            this._backdrop.style.display = 'none';
            return;
        }

        const targetTx = parseFloat(match[1]);
        const targetTy = parseFloat(match[2]);

        if (!animate) {
            card.setAttribute('transform', orig);
            card.classList.remove('zoomed');
            this._backdrop.style.display = 'none';
            return;
        }

        // Parse current animated state from the transform
        const cardW = this.config.card.width;
        const cardH = this.config.card.height;
        const cur = card.getAttribute('transform');
        const curMatch = cur.match(/translate\(\s*([\d.-]+)\s*,\s*([\d.-]+)\s*\)\s*scale\(\s*([\d.-]+)\s*\)/);

        const anim = {
            tx: curMatch ? parseFloat(curMatch[1]) : targetTx,
            ty: curMatch ? parseFloat(curMatch[2]) : targetTy,
            s: curMatch ? parseFloat(curMatch[3]) : 1
        };

        const backdrop = this._backdrop;

        anime({
            targets: anim,
            tx: targetTx,
            ty: targetTy,
            s: 1,
            duration: 300,
            easing: 'easeInCubic',
            update: () => {
                if (anim.s > 1.01) {
                    card.setAttribute('transform',
                        `translate(${anim.tx}, ${anim.ty}) scale(${anim.s}) translate(${-cardW / 2}, ${-cardH / 2})`
                    );
                } else {
                    card.setAttribute('transform', `translate(${anim.tx}, ${anim.ty})`);
                }
            },
            complete: () => {
                card.setAttribute('transform', orig);
                card.classList.remove('zoomed');
                backdrop.style.display = 'none';
            }
        });
    }
};

// Export for use in other modules
window.TreeRenderer = TreeRenderer;
