/**
 * Translation Service
 * Manages multi-language support with fallback mechanism
 */

class TranslationService {
    constructor() {
        this.languages = this.getInlineFallback();
        this.currentLanguage = 'en';
        this.supportedLanguages = ['en', 'ko', 'ja'];
        this.loaded = false;
    }

    /**
     * Get inline fallback translations (minimal set for immediate use)
     * @returns {Object}
     */
    getInlineFallback() {
        return {
            en: {},
            ko: {},
            ja: {}
        };
    }

    /**
     * Load translation files
     * @returns {Promise<void>}
     */
    async loadTranslations() {
        if (this.loaded) return;

        try {
            const loadPromises = this.supportedLanguages.map(async (lang) => {
                const response = await fetch(`src/i18n/locales/${lang}.json`);
                if (!response.ok) {
                    console.warn(`Failed to load ${lang}.json`);
                    return null;
                }
                const data = await response.json();
                // Merge with existing fallback data
                this.languages[lang] = { ...this.languages[lang], ...data };
                return data;
            });

            await Promise.all(loadPromises);
            this.loaded = true;
            this.currentLanguage = this.getLanguage();

            // Apply language after loading
            this.applyLanguage();
        } catch (error) {
            console.error('Error loading translations:', error);
            // Continue with fallback translations
            this.loaded = false;
        }
    }

    /**
     * Get current language from localStorage or browser
     * @returns {string}
     */
    getLanguage() {
        const saved = localStorage.getItem('language');
        if (saved && this.supportedLanguages.includes(saved)) {
            return saved;
        }

        const browserLang = navigator.language.split('-')[0];
        return this.supportedLanguages.includes(browserLang) ? browserLang : 'en';
    }

    /**
     * Set and persist language preference
     * @param {string} lang - Language code
     */
    setLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) {
            console.warn(`Unsupported language: ${lang}`);
            return;
        }

        this.currentLanguage = lang;
        localStorage.setItem('language', lang);

        // Update language selector if exists
        const langSelect = document.getElementById('languageSelector');
        if (langSelect && langSelect.value !== lang) {
            langSelect.value = lang;
        }

        // Apply language immediately
        this.applyLanguage();
    }

    /**
     * Apply language to all elements with data-lang-key attribute
     */
    applyLanguage() {
        const lang = this.currentLanguage;

        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            const translatedText = this.translate(key);
            element.textContent = translatedText;
        });
    }

    /**
     * Translate a key with parameter substitution
     * Fallback order: currentLang -> en -> ko -> key itself
     * @param {string} key - Translation key
     * @param {Object} params - Parameters to substitute
     * @returns {string}
     */
    translate(key, params = {}) {
        const lang = this.currentLanguage;

        // Try current language, then English, then Korean, then return key
        let text = (this.languages[lang] && this.languages[lang][key])
            || (this.languages['en'] && this.languages['en'][key])
            || (this.languages['ko'] && this.languages['ko'][key])
            || key;

        // Replace parameters like {width}, {height}, etc.
        Object.keys(params).forEach(param => {
            text = text.replace(`{${param}}`, params[param]);
        });

        return text;
    }

    /**
     * Get all supported languages
     * @returns {string[]}
     */
    getSupportedLanguages() {
        return [...this.supportedLanguages];
    }
}

// Create singleton instance
const translationService = new TranslationService();

// Export for use in other modules
window.translationService = translationService;

// Legacy compatibility - expose old function names
window.translate = (key, params) => translationService.translate(key, params);
window.setLanguage = (lang) => translationService.setLanguage(lang);
window.getLanguage = () => translationService.getLanguage();
window.applyLanguage = () => translationService.applyLanguage();
