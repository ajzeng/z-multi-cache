let globalMemoryStorage;

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

function getMemoryStorage() {
    if (globalMemoryStorage) {
        return globalMemoryStorage;
    } else {
        return globalMemoryStorage = new MemoryStorage();
    }
}

const memoryStorage = getMemoryStorage();
export default memoryStorage;