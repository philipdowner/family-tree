/**
 * Data Loader Module
 * Handles loading and validating JSON data files with friendly error messages
 */

const DataLoader = {
    // Store loaded data
    familyData: null,
    configData: null,
    countriesData: null,

    /**
     * Load all required data files
     * @returns {Promise<Object>} Combined data object
     */
    async loadAll() {
        try {
            const [family, config, countries] = await Promise.all([
                this.loadJSON('data/family.json', 'family'),
                this.loadJSON('data/config.json', 'config'),
                this.loadJSON('data/countries.json', 'countries')
            ]);

            this.familyData = family;
            this.configData = config;
            this.countriesData = countries;

            // Validate the family data
            this.validateFamilyData(family);

            return {
                family,
                config,
                countries
            };
        } catch (error) {
            throw error;
        }
    },

    /**
     * Load a single JSON file with helpful error messages
     * @param {string} path - Path to the JSON file
     * @param {string} name - Friendly name for error messages
     * @returns {Promise<Object>} Parsed JSON data
     */
    async loadJSON(path, name) {
        try {
            const response = await fetch(path);

            if (!response.ok) {
                throw new Error(`Could not find ${name}.json file.\n\nMake sure the file exists at: ${path}`);
            }

            const text = await response.text();

            try {
                return JSON.parse(text);
            } catch (parseError) {
                // Provide helpful error message for JSON syntax errors
                const errorMessage = this.formatJSONError(text, parseError, name);
                throw new Error(errorMessage);
            }
        } catch (error) {
            if (error.message.includes('Could not find') || error.message.includes('JSON Error')) {
                throw error;
            }
            throw new Error(`Error loading ${name}.json:\n\n${error.message}`);
        }
    },

    /**
     * Format a JSON parse error with helpful details
     * @param {string} text - The raw JSON text
     * @param {Error} error - The parse error
     * @param {string} name - File name for context
     * @returns {string} Formatted error message
     */
    formatJSONError(text, error, name) {
        let message = `JSON Error in ${name}.json:\n\n`;

        // Try to extract line/column from error message
        const positionMatch = error.message.match(/position (\d+)/i);

        if (positionMatch) {
            const position = parseInt(positionMatch[1]);
            const lines = text.substring(0, position).split('\n');
            const lineNumber = lines.length;
            const columnNumber = lines[lines.length - 1].length + 1;

            // Get the problematic line and surrounding context
            const allLines = text.split('\n');
            const startLine = Math.max(0, lineNumber - 3);
            const endLine = Math.min(allLines.length, lineNumber + 2);

            message += `Problem near line ${lineNumber}, column ${columnNumber}\n\n`;
            message += `Here's what I see:\n`;
            message += '─'.repeat(40) + '\n';

            for (let i = startLine; i < endLine; i++) {
                const lineNum = (i + 1).toString().padStart(3, ' ');
                const marker = (i + 1 === lineNumber) ? ' → ' : '   ';
                message += `${lineNum}${marker}${allLines[i]}\n`;
            }

            message += '─'.repeat(40) + '\n\n';
        }

        // Add common fixes
        message += `Common problems to check:\n`;
        message += `• Missing comma at the end of a line\n`;
        message += `• Extra comma after the last item in a list\n`;
        message += `• Missing quotes around text values\n`;
        message += `• Using curly quotes "" instead of straight quotes ""\n`;
        message += `• Missing closing bracket } or ]\n`;

        return message;
    },

    /**
     * Validate the family data structure
     * @param {Object} data - The family data to validate
     */
    validateFamilyData(data) {
        const errors = [];

        // Check for required top-level fields
        if (!data.familyName) {
            errors.push('Missing "familyName" - add your family\'s last name!');
        }

        if (!data.child) {
            errors.push('Missing "child" section - this should be your information!');
        }

        if (!data.parents) {
            errors.push('Missing "parents" section');
        }

        if (!data.grandparents) {
            errors.push('Missing "grandparents" section');
        }

        if (!data.greatGrandparents) {
            errors.push('Missing "greatGrandparents" section');
        }

        // Validate child
        if (data.child) {
            this.validatePerson(data.child, 'child', errors);
        }

        // Validate parents
        if (data.parents) {
            if (data.parents.mother) {
                this.validatePerson(data.parents.mother, 'parents.mother', errors);
            }
            if (data.parents.father) {
                this.validatePerson(data.parents.father, 'parents.father', errors);
            }
        }

        // Validate grandparents
        if (data.grandparents) {
            const gpKeys = ['mothersMother', 'mothersFather', 'fathersMother', 'fathersFather'];
            gpKeys.forEach(key => {
                if (data.grandparents[key]) {
                    this.validatePerson(data.grandparents[key], `grandparents.${key}`, errors);
                }
            });
        }

        // Validate great-grandparents
        if (data.greatGrandparents) {
            const ggpKeys = [
                'mothersMothersMother', 'mothersMothersFather',
                'mothersFathersMother', 'mothersFathersFather',
                'fathersMothersMother', 'fathersMothersFather',
                'fathersFathersMother', 'fathersFathersFather'
            ];
            ggpKeys.forEach(key => {
                if (data.greatGrandparents[key]) {
                    this.validatePerson(data.greatGrandparents[key], `greatGrandparents.${key}`, errors);
                }
            });
        }

        if (errors.length > 0) {
            throw new Error(`Family data validation errors:\n\n${errors.map(e => `• ${e}`).join('\n')}`);
        }
    },

    /**
     * Validate a single person object
     * @param {Object} person - Person data
     * @param {string} path - Path for error messages
     * @param {Array} errors - Array to add errors to
     */
    validatePerson(person, path, errors) {
        if (!person.firstName) {
            errors.push(`${path}: Missing "firstName"`);
        }

        if (!person.lastName) {
            errors.push(`${path}: Missing "lastName"`);
        }

        // Validate date format if provided
        if (person.birthDate && !this.isValidDate(person.birthDate)) {
            errors.push(`${path}: Invalid birthDate format. Use YYYY-MM-DD (like 1990-05-15)`);
        }

        if (person.deathDate && person.deathDate !== null && !this.isValidDate(person.deathDate)) {
            errors.push(`${path}: Invalid deathDate format. Use YYYY-MM-DD or null`);
        }
    },

    /**
     * Check if a date string is valid
     * @param {string} dateStr - Date string to validate
     * @returns {boolean} True if valid
     */
    isValidDate(dateStr) {
        if (!dateStr || dateStr === 'YYYY-MM-DD') return false;
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateStr)) return false;
        const date = new Date(dateStr);
        return !isNaN(date.getTime());
    },

    /**
     * Get all unique countries from family data
     * @returns {Array} Array of country codes
     */
    getUniqueCountries() {
        if (!this.familyData) return [];

        const countries = new Set();

        const addCountry = (person) => {
            if (person && person.countryFlag) {
                countries.add(person.countryFlag);
            }
        };

        // Collect all countries
        addCountry(this.familyData.child);

        if (this.familyData.parents) {
            addCountry(this.familyData.parents.mother);
            addCountry(this.familyData.parents.father);
        }

        if (this.familyData.grandparents) {
            Object.values(this.familyData.grandparents).forEach(addCountry);
        }

        if (this.familyData.greatGrandparents) {
            Object.values(this.familyData.greatGrandparents).forEach(addCountry);
        }

        return Array.from(countries);
    },

    /**
     * Get all family members as a flat array
     * @returns {Array} Array of person objects with metadata
     */
    getAllMembers() {
        if (!this.familyData) return [];

        const members = [];

        // Child
        if (this.familyData.child) {
            members.push({
                ...this.familyData.child,
                role: 'child',
                generation: 0,
                side: 'center'
            });
        }

        // Parents
        if (this.familyData.parents) {
            if (this.familyData.parents.mother) {
                members.push({
                    ...this.familyData.parents.mother,
                    role: 'mother',
                    generation: 1,
                    side: 'maternal'
                });
            }
            if (this.familyData.parents.father) {
                members.push({
                    ...this.familyData.parents.father,
                    role: 'father',
                    generation: 1,
                    side: 'paternal'
                });
            }
        }

        // Grandparents
        if (this.familyData.grandparents) {
            const gpMapping = {
                mothersMother: { role: 'mothersMother', side: 'maternal' },
                mothersFather: { role: 'mothersFather', side: 'maternal' },
                fathersMother: { role: 'fathersMother', side: 'paternal' },
                fathersFather: { role: 'fathersFather', side: 'paternal' }
            };

            Object.entries(gpMapping).forEach(([key, meta]) => {
                if (this.familyData.grandparents[key]) {
                    members.push({
                        ...this.familyData.grandparents[key],
                        ...meta,
                        generation: 2
                    });
                }
            });
        }

        // Great-grandparents
        if (this.familyData.greatGrandparents) {
            const ggpMapping = {
                mothersMothersMother: { side: 'maternal' },
                mothersMothersFather: { side: 'maternal' },
                mothersFathersMother: { side: 'maternal' },
                mothersFathersFather: { side: 'maternal' },
                fathersMothersMother: { side: 'paternal' },
                fathersMothersFather: { side: 'paternal' },
                fathersFathersMother: { side: 'paternal' },
                fathersFathersFather: { side: 'paternal' }
            };

            Object.entries(ggpMapping).forEach(([key, meta]) => {
                if (this.familyData.greatGrandparents[key]) {
                    members.push({
                        ...this.familyData.greatGrandparents[key],
                        role: key,
                        ...meta,
                        generation: 3
                    });
                }
            });
        }

        return members;
    },

    /**
     * Format a date for display
     * @param {string} dateStr - Date in YYYY-MM-DD format
     * @returns {string} Formatted date or empty string
     */
    formatDate(dateStr) {
        if (!dateStr || dateStr === 'YYYY-MM-DD') return '';

        try {
            const date = new Date(dateStr + 'T00:00:00');
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    },

    /**
     * Calculate age for a person (current age if living, age at death if deceased)
     * @param {Object} person - Person object
     * @returns {number|null} Age in years, or null if birth date is missing
     */
    getAge(person) {
        if (!person || !person.birthDate) return null;

        const [birthYear, birthMonth, birthDay] = person.birthDate.split('-').map(Number);

        let endYear, endMonth, endDay;
        if (person.deathDate) {
            [endYear, endMonth, endDay] = person.deathDate.split('-').map(Number);
        } else {
            const today = new Date();
            endYear = today.getFullYear();
            endMonth = today.getMonth() + 1;
            endDay = today.getDate();
        }

        let age = endYear - birthYear;
        if (endMonth < birthMonth || (endMonth === birthMonth && endDay < birthDay)) {
            age--;
        }

        return age >= 0 ? age : null;
    },

    /**
     * Get display dates for a person (birth - death)
     * @param {Object} person - Person object
     * @returns {string} Formatted date range
     */
    getDateRange(person) {
        if (!person) return '';

        const birth = this.formatDate(person.birthDate);
        const death = this.formatDate(person.deathDate);

        if (birth && death) {
            return `${birth} - ${death}`;
        } else if (birth) {
            return `Born ${birth}`;
        }

        return '';
    }
};

// Export for use in other modules
window.DataLoader = DataLoader;
