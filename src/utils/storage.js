/**
 * Storage Utilities
 * Wrapper for localStorage with error handling and size management
 */

class StorageManager {
    constructor() {
        this.maxSize = 5 * 1024 * 1024; // 5MB default limit
    }

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @returns {string|null}
     */
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error(`Error reading from localStorage: ${key}`, error);
            return null;
        }
    }

    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {boolean} - Success status
     */
    setItem(key, value) {
        try {
            // Check size before storing
            const size = new Blob([value]).size;
            if (size > this.maxSize) {
                console.warn(`Value too large for key ${key}: ${size} bytes`);
                return false;
            }

            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error(`Error writing to localStorage: ${key}`, error);

            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                this.handleQuotaExceeded(key, value);
            }
            return false;
        }
    }

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     */
    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing from localStorage: ${key}`, error);
        }
    }

    /**
     * Clear all items from localStorage
     */
    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error clearing localStorage', error);
        }
    }

    /**
     * Get JSON object from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist or parse fails
     * @returns {*}
     */
    getJSON(key, defaultValue = null) {
        try {
            const value = this.getItem(key);
            if (value === null) return defaultValue;
            return JSON.parse(value);
        } catch (error) {
            console.error(`Error parsing JSON from localStorage: ${key}`, error);
            return defaultValue;
        }
    }

    /**
     * Set JSON object in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store (will be JSON.stringify'd)
     * @returns {boolean}
     */
    setJSON(key, value) {
        try {
            const jsonString = JSON.stringify(value);
            return this.setItem(key, jsonString);
        } catch (error) {
            console.error(`Error stringifying JSON for localStorage: ${key}`, error);
            return false;
        }
    }

    /**
     * Get current usage of localStorage
     * @returns {number} - Size in bytes
     */
    getUsage() {
        let total = 0;
        try {
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
        } catch (error) {
            console.error('Error calculating localStorage usage', error);
        }
        return total;
    }

    /**
     * Handle quota exceeded error by removing old items
     * @param {string} newKey - Key trying to be stored
     * @param {string} newValue - Value trying to be stored
     */
    handleQuotaExceeded(newKey, newValue) {
        console.warn('LocalStorage quota exceeded, attempting cleanup...');

        // Remove items with 'cached' prefix first
        const cachedKeys = [];
        for (let key in localStorage) {
            if (key.startsWith('cached')) {
                cachedKeys.push(key);
            }
        }

        // Remove oldest cached items
        cachedKeys.forEach(key => {
            this.removeItem(key);
            console.log(`Removed cached item: ${key}`);
        });

        // Try storing again
        try {
            localStorage.setItem(newKey, newValue);
            console.log('Successfully stored after cleanup');
        } catch (error) {
            console.error('Still unable to store after cleanup', error);
        }
    }

    /**
     * Check if localStorage is available
     * @returns {boolean}
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Create singleton instance
const storageManager = new StorageManager();

// Export globally for backwards compatibility
window.storageManager = storageManager;
