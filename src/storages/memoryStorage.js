/**
 * realize a memoryStorage with the same api as localStorage or sessionStorage.
 *
 * @export
 * @class MemoryStorage
 */
export class MemoryStorage {
    storage = {};

    setItem(key, value) {
        this.storage[key] = String(value);
    }

    getItem(key) {
        return this.storage[key] || null;
    }

    removeItem(key) {
        delete this.storage[key];
    }
    
    clear() {
        this.storage = {};
    }
}

const memoryStorage = new MemoryStorage();

export default memoryStorage;