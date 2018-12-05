import storage, {
    getItemStoragesMap,
    setItemStoragesMap,
    setItemStoragesListStr,
    getItemStoragesListStr
} from "@storages/index";
import { updateUrlSearchPart, getUrlParam } from "./utils";
const NAMESPACE_PREFIX = "$zMultiCachePrefix$";
const DEFAULT_PAGE = "$page$";
const DEFAULT_STORAGE_TYPE = "sessionStorage";
const noop = function() {};

/**
 * get type of the parameter.
 *
 * @param {*} obj
 * @returns type
 */
function getType(obj) {
    return Object.prototype.toString
        .call(obj)
        .slice(8, -1)
        .toLocaleLowerCase();
}

/**
 * judge if the input is a simple object.
 *
 * @param {*} obj
 * @returns
 */
function isSimpleObject(obj) {
    return getType(obj) !== "object" ? false : true;
}

function strictCheck(strict, template, page, itemKey) {
    if (!strict) {
        return;
    }
    if (isGlobalStore(page)) {
        const { globalKeys } = template;
        if (getType(globalKeys) !== "array") {
            throw new Error("globalKeys need to be an array.");
        }
        if (
            !globalKeys.some(item => {
                return item === itemKey;
            })
        ) {
            throw new Error(
                `key "${itemKey}" should be defined in globalKeys firstly.`
            );
        }
    } else {
        const { pages } = template;
        if (getType(pages) !== "array") {
            throw new Error("pages need to be an array.");
        }
        if (
            !pages.some(item => {
                return item === page;
            })
        ) {
            throw new Error(
                `the page part of scope "${page}" should be defined in pages firstly.`
            );
        }
    }
}

function checkParams({ type }, method = "setItem") {
    if (method !== "setItem" && method !== "getItem") {
        throw new Error("method need to be one of setItem, getItem");
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

function getDefaultValue(defaultVal) {
    if (typeof defaultVal === "function") {
        return defaultVal();
    }
    return defaultVal;
}

function isGlobalStore(page) {
    return page === "global";
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
    if (typeof scope !== "string") {
        throw new Error("scope need to be a string.");
    }
    // scope = scope.replace(/^(\s*)\/?(\s*)|(\s*)\/?(\s*)$/g, '');
    scope = scope.replace(/\s*\/?\s*$/g, "");
    const idx = scope.indexOf(separator);
    const hasSeparator = idx !== -1;
    const page = scope.slice(0, hasSeparator ? idx : void 0).trim();
    let keyPrefix = scope
        .substr(hasSeparator ? idx + separator.length : scope.length)
        .trim();
    keyPrefix = keyPrefix.length ? `${keyPrefix}>` : `${keyPrefix}`;
    const itemKey = isGlobalStore(page) ? `${key}` : `${keyPrefix}${key}`;
    return {
        page: page || void 0, // 如果page为''则返回void 0，是为了方便后面处理默认值
        itemKey
    };
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
    const {
        ns = "$ns$",
        strict = false,
        template = {},
        scopeSeparator = "/",
        getterStrict = true
    } = config;
    if (strict && !isSimpleObject(template)) {
        throw new Error(
            'when "strict" is true, template is needed. template is a simple object.'
        );
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
         *  value: 'beijing', // store value
         *  updateUrlSearchKey
         * }]
         */
        setItem(key = "", value, opts = {}) {
            const {
                type = DEFAULT_STORAGE_TYPE,
                scope = "global",
                errCallBack = noop,
                updateUrlSearchKey,
                updateUrlSearchKeyTime = 0
            } = opts;
            checkParams({ type });
            const { page = DEFAULT_PAGE, itemKey } = getPageAndItemKey(
                scope,
                key,
                scopeSeparator
            );
            strictCheck(strict, template, page, itemKey);
            const storeKey = `${partialStoreKey}-${page}`;
            storage.setItem(type, storeKey, itemKey, value, errCallBack);
            // update the search part of url.
            updateUrlSearchKey &&
                updateUrlSearchPart(
                    { [updateUrlSearchKey]: value },
                    "",
                    updateUrlSearchKeyTime
                );
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
        getItem(key = "", opts = {}) {
            let {
                type = DEFAULT_STORAGE_TYPE,
                scope = "global",
                updateUrlSearchKey,
                updateUrlSearchKeyTime = 0
            } = opts;
            let defaultValue = opts.default;
            // 当type是一个数组的时候，按照数组顺序为优先级来取数据
            if (getType(type) === "array") {
                for (let i = 0, len = type.length; i < len; i++) {
                    const result = this.getItem(key, {
                        ...opts,
                        type: type[i],
                        default: void 0
                    });
                    if (result) {
                        return result;
                    } else {
                        continue;
                    }
                }
                return defaultValue;
            }

            if (isSimpleObject(type)) {
                key = type.key || key;
                type = type.type;
            }

            checkParams({ type }, "getItem");
            defaultValue = getDefaultValue(defaultValue);
            let returnValue;
            if (type === "urlSearch") {
                const val = getUrlParam(key);
                returnValue = val || defaultValue;
            } else {
                const { page = DEFAULT_PAGE, itemKey } = getPageAndItemKey(
                    scope,
                    key,
                    scopeSeparator
                );
                if (!!getterStrict) {
                    strictCheck(strict, template, page, itemKey);
                }
                const storeKey = `${partialStoreKey}-${page}`;
                const value = storage.getItem(type, storeKey, itemKey);
                returnValue =
                    value === void 0 || value === null ? defaultValue : value;
            }
            updateUrlSearchKey &&
                updateUrlSearchPart(
                    { [updateUrlSearchKey]: returnValue },
                    "",
                    updateUrlSearchKeyTime
                );
            return returnValue;
        },

        /**
         * remove item from storage.
         *
         * @param {*} key
         * @param {*} [opts={}]
         */
        removeItem(key, opts = {}) {
            const { type = DEFAULT_STORAGE_TYPE, scope = "global" } = opts;
            checkParams({ type });
            const { page = DEFAULT_PAGE, itemKey } = getPageAndItemKey(
                scope,
                key,
                scopeSeparator
            );
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
            const key = "";
            const { type = DEFAULT_STORAGE_TYPE, scope = "global" } = opts;
            checkParams({ type });
            const { page = DEFAULT_PAGE, itemKey } = getPageAndItemKey(
                scope,
                key,
                scopeSeparator
            );
            strictCheck(strict, template, page, itemKey);
            const storeKey = `${partialStoreKey}-${page}`;
            store.clear(type, storeKey);
        },
        types: getItemStoragesMap,
        /**
         * update the param in the url search part.
         *
         * @param {*} [map={}]
         *
         * map = {
         *  city: ['hotelCity', { scope: 'global' }], // 'city' is from the search part of url. 'hotelCity' is the key of the date stored in storage.
         *  name: ['userName', {scope: 'home', type: 'localStorage' }]
         * }
         */
        updateUrlSearch(map = {}, title, theTime) {
            let storeVal = {};
            Object.keys(map).forEach(item => {
                const storeCfgArr = map[item];
                if (getType(storeCfgArr) === 'array') {
                    storeVal[item] = this.getItem(storeCfgArr[0], storeCfgArr[1]);
                } else {
                    storeVal[item] = storeCfgArr;
                }
            });
            updateUrlSearchPart(storeVal, title, theTime);
        },
        updateUrlSearchByValue: updateUrlSearchPart,
        getUrlParam
    };
    return store;
}

const store = factory();

export default store;
