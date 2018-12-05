import memoryStorage from "./memoryStorage";

const originStorageMap = {
    localStorage: localStorage,
    sessionStorage: sessionStorage,
    memoryStorage: memoryStorage
};

export const setItemStoragesList = Object.keys(originStorageMap);
export const setItemStoragesMap = setItemStoragesList.reduce((map, item) => {
    map[item] = item;
    return map;
}, {});
export const setItemStoragesListStr = setItemStoragesList.join(', ');
export const getItemStoragesList = setItemStoragesList.concat('urlSearch');

export const getItemStoragesMap = getItemStoragesList.reduce((map, item) => {
    map[item] = item;
    return map;
}, {});
export const getItemStoragesListStr = getItemStoragesList.join(', ');

/**
 * check if the type is exist.
 *
 * @param {*} type
 */
function checkStorageType(type, method = "setItem") {
    if (method !== 'setItem' && method !== 'getItem') {
        throw new Error('method need to be one of setItem, getItem');
    }
    if (method === "setItem") {
        if (!setItemStoragesMap[type]) {
            throw new Error(
                `[setItem]: type should be one of: ${setItemStoragesListStr}, your value is: ${type}`
            );
        }
    } else {
        if (!getItemStoragesMap[type]) {
            throw new Error(
                `[getItem]: type should be one of: ${getItemStoragesListStr}, your value is: ${type}`
            );
        }
    }
}

/**
 * get the value from storage(such as localStorage) according to the fields: type, storeKey
 *
 * @param {*} type the type used to store the value
 * @param {*} storeKey store key
 * @returns store item value
 */
function getStoreByStoreKey(type, storeKey) {
    checkStorageType(type, 'getItem');
    const val = originStorageMap[type].getItem(storeKey);
    return JSON.parse(val) || {};
}

/**
 * set the value into storage(such as localStorage) according to the fields: type, storeKey, storeVal
 *
 * @param {*} type the type used to store the value
 * @param {*} storeKey store key
 * @param {*} storeVal store value
 * @param {*} errCallBack error callback
 */
function setStoreByStoreKey(type, storeKey, storeVal, errCallBack) {
    checkStorageType(type);
    try {
        const valStr = JSON.stringify(storeVal);
        originStorageMap[type].setItem(storeKey, valStr);
    } catch (e) {
        errCallBack && errCallBack(e);
    }
}

/**
 * Use 'Storage' to manage sessionStorage, localStorage, memoryStorage
 *
 * @export Storage
 * @class Storage
 */
export class Storage {
    /**
     * set item. if you use localStorage:
     * const s = new Storage();
     * s.setItem('localStorage', 'storeKey', 'itemKey', 'the value', null);
     *  =>
     * localStorage.setItem('storeKey', '{"itemKey":"the value"}');
     *
     * @param {*} type the type used to store the value, such as sessionStorage
     * @param {*} storeKey sessionStorage.setItem('theStoreKey', '{"theItemKey":"the value"}'), here storeKey is "theStoreKey"
     * @param {*} itemKey as above, itemKey is "theItemKey"
     * @param {*} val as above, val is "the value"
     * @param {*} errCallBack
     * @memberof Storage
     */
    setItem(type, storeKey, itemKey, val, errCallBack) {
        const store = getStoreByStoreKey(type, storeKey);
        store[itemKey] = val;
        setStoreByStoreKey(type, storeKey, store, errCallBack);
    }

    /**
     * get item.
     *
     * @param {*} type the type used to store the value
     * @param {*} storeKey store key
     * @param {*} itemKey item key
     * @returns item value
     * @memberof Storage
     */
    getItem(type, storeKey, itemKey) {
        const store = getStoreByStoreKey(type, storeKey);
        return store[itemKey];
    }

    /**
     * remove item from storage according to the fileds: type, storeKey, itemKey
     *
     * @param {*} type the type used to store the value
     * @param {*} storeKey store key
     * @param {*} itemKey item key
     * @memberof Storage
     */
    removeItem(type, storeKey, itemKey) {
        const store = getStoreByStoreKey(type, storeKey);
        delete store[itemKey];
        setStoreByStoreKey(type, storeKey, itemKey);
    }

    /**
     * clear the storage
     *
     * @param {*} type the type used to store the value
     * @param {*} storeKey store key
     * @memberof Storage
     */
    clear(type, storeKey) {
        setStoreByStoreKey(type, storeKey, {});
    }
}

const store = new Storage();
export default store;
