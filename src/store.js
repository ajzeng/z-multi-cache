import storage, { storagesMap, storagesList } from '@storages/index';
const NAMESPACE_PREFIX = '$zMultiCachePrefix$';
const DEFAULT_PAGE = '$page$';
const DEFAULT_STORAGE_TYPE = storagesMap.sessionStorage;
const noop = function() {};
const storagesListStr = storagesList.join(', ');

/**
 * get type of the parameter.
 *
 * @param {*} obj
 * @returns type
 */
function getType(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1).toLocaleLowerCase();
}

/**
 * judge if the input is a simple object.
 *
 * @param {*} obj
 * @returns
 */
function isSimpleObject(obj) {
    return getType(obj) !== 'object' ? false : true;
}

function strictCheck(strict, template, page, itemKey) {
    if (!strict) {
        return; 
    }
    if (isGlobalStore(page)) {
        const { globalKeys } = template;
        if (getType(globalKeys) !== 'array') {
            throw new Error('globalKeys need to be an array.');
        }
        if (!globalKeys.some((item) => {
            return item === itemKey;
        })) {
            throw new Error(`key "${itemKey}" should be defined in globalKeys firstly.`);
        }
    } else {
        const { pages } = template;
        if (getType(pages) !== 'array') {
            throw new Error('pages need to be an array.');
        }
        if (!pages.some((item) => {
            return item === page;
        })) {
            throw new Error(`the page part of scope "${page}" should be defined in pages firstly.`);
        }
    }
}

function checkParams({ type }) {
    if (!storagesMap[type]) {
        throw new Error(`type should be one of: ${storagesListStr}, your value is: ${type}`);
    }
    return true;
}

function isGlobalStore(page) {
    return page === 'global';
}

/**
 * parse page and itemKey from scope and key.
 *
 * @param {*} scope
 * @param {*} key
 * @param {*} separator
 * @returns
 */
function getPageAndItemKey(scope, key, separator) {
    if (typeof scope !== 'string') {
        throw new Error('scope need to be a string.');
    }
    // scope = scope.replace(/^(\s*)\/?(\s*)|(\s*)\/?(\s*)$/g, '');
    scope = scope.replace(/\s*\/?\s*$/g, '');
    const idx = scope.indexOf(separator);
    const hasSeparator = idx !== -1;
    const page = scope.slice(0, hasSeparator ? idx : void 0).trim();
    let keyPrefix = scope.substr(hasSeparator ? idx + separator.length : scope.length).trim();
    keyPrefix = keyPrefix.length ? `${keyPrefix}>` : `${keyPrefix}`;
    const itemKey = isGlobalStore(page) ? `${key}` : `${keyPrefix}${key}`;
    return {
        page: page || void 0, // 如果page为''则返回void 0，是为了方便后面处理默认值
        itemKey
    }
}

/**
 * provide the ability to create a store with some config.
 * 
 * @api factory
 * @export
 * @param {*} [config={
 *  ns: '$ns$', // namespace, default "$ns$".you can set a ns in a new project, then the data stored in sessionStorage or localStorage will not cover the data from other projects. 
 *  scopeSeparator: '/', // separator in scope string. when you do: store.set({scope:'homePage/flightPart', key:'city', value: 'beijing'}); the key use "/" to distinguish each part.
 *  strict: true, // it represents whether to use strict mode.
 *  template: { // if you use strict mode. when you set or get Data. store will validate data according to the template config.
 *      globalKeys: [], // if you do: store.set({scope: 'global', key: 'city', value: 'beijing'}), if the scope is global, the key will be checked whther it is defined in globalKeys.
 *      pages: [] // if scope is not global and in strict mode. the scope will be checked whther it is defined in pages. for example. store.set({scope: 'home/flight'}); the first part of
 *                // the scope is "home", the "home" will be checked whther it is in pages. the rest is not checked.
 *  }
 * }]
 * @returns
 */
export function factory(config = {}) {
    const { ns = '$ns$', strict = false, template = {}, scopeSeparator = '/' } = config;
    if(strict && !isSimpleObject(template)) {
        throw new Error('when "strict" is true, template is needed. template is a simple object.');
    }
    const partialStoreKey = `${NAMESPACE_PREFIX}-${ns}`;
    const store = {
        /**
         * set data in storage. the storage can be localStorage, sessionStorage, memoryStorage.
         *
         * @param {*} [opts={
         *  type: store.types.localStorage, // which type storage to store data. one of: store.types.localStorage, store.types.sessionStorage, store.types.memoryStorage
         *  scope: 'homePage/flightPart', // if scope is "global", the key will be checked if it is defined in globalKeys. if it is normal scope. for example: 'home/flight', the first part "home"
         *                                 // will be check if it is defined in pages while you set strict to be true.
         *  key: 'city', // store key
         *  value: 'beijing' // store value
         * }]
         */
        setItem(key = '', value, opts = {}) {
            const { type = DEFAULT_STORAGE_TYPE, scope = '', errCallBack = noop } = opts;
            checkParams({type});
            const { page = DEFAULT_PAGE, itemKey } = getPageAndItemKey(scope, key, scopeSeparator);
            strictCheck(strict, template, page, itemKey);
            const storeKey = `${partialStoreKey}-${page}`;
            storage.setItem(type, storeKey, itemKey, value, errCallBack);
        },
        /**
         * get data from storage
         *
         * @param {*} [opts={
         *  type: store.types.sessionStorage,
         *  scope: 'global',
         *  key: 'city'
         * }]
         * @returns
         */
        getItem(key = '', opts = {}) {
            const { type = DEFAULT_STORAGE_TYPE, scope = '', defaultValue } = opts;
            checkParams({type});
            const { page = DEFAULT_PAGE, itemKey } = getPageAndItemKey(scope, key, scopeSeparator);
            strictCheck(strict, template, page, itemKey);
            const storeKey = `${partialStoreKey}-${page}`;
            const value =  storage.getItem(type, storeKey, itemKey);
            if (typeof defaultValue === 'function') {
                defaultValue = defaultValue();
            }
            const returnValue = (value === void 0 || value === null) ? defaultValue : value;
            return returnValue;
        },

        /**
         * remove item from storage.
         *
         * @param {*} key
         * @param {*} [opts={}]
         */
        removeItem(key, opts = {}) {
            const { type = DEFAULT_STORAGE_TYPE, scope = '' } = opts;
            checkParams({type});
            const { page = DEFAULT_PAGE, itemKey } = getPageAndItemKey(scope, key, scopeSeparator);
            strictCheck(strict, template, page, itemKey);
            const storeKey = `${partialStoreKey}-${page}`;
            store.removeItem(type, storeKey, itemKey);
        },

        /**
         * clear one page data from storage.
         *
         * @param {*} [opts={}]
         */
        clear(opts = {}) {
            const key = '';
            const { type = DEFAULT_STORAGE_TYPE, scope = '' } = opts;
            checkParams({type});
            const { page = DEFAULT_PAGE, itemKey } = getPageAndItemKey(scope, key, scopeSeparator);
            strictCheck(strict, template, page, itemKey);
            const storeKey = `${partialStoreKey}-${page}`;
            store.clear(type, storeKey);
        },
        types: storagesMap
    };
    return store;
}

const store = factory();

export default store;

