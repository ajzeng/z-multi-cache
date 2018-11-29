import memoryStorage from "./memoryStorage";

const originStorageMap = {
    localStorage: localStorage,
    sessionStorage: sessionStorage,
    memoryStorage: memoryStorage
};

export const storagesList = Object.keys(originStorageMap);
const storagesListStr = storagesList.join(', ');
export const storagesMap = storagesList.reduce((map, item) => {
    map[item] = item;
    return map;
}, {});

/**
 * check if the type is exist.
 *
 * @param {*} type
 */
function checkStorageType(type) {
    if(!storagesMap[type]) {
        throw new Error(`type should be one of: ${storagesListStr}, your value is: ${type}`);
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
    checkStorageType(type);
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
