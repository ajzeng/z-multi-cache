> this is a caching tool that uses localStorage, sessionStorage, url in combination to provide more convenient get data from the cache

### Install
`npm i z-multi-cache --save`

### Use
#### method 1: use default store
```
    import store from 'z-multi-cache';

    const optObj = {};

    // setItem
    store.setItem('city', 'beijing');
    // getItem
    const city = store.getItem('city');

    // you can personalize optObj. store will use default value without optObj.
```

#### method 2: use factory to create a store with config

### Api

#### store.setItem(key, val, optObj);

```
```

#### factory(
    opts = {
        ns: 'project namespace',
        strict: true, // whether to open strict mode.
        getterStrict: true, // whether to open strict mode when use getItem.
        template: simpleObj, // verification template in strict mode.
        scopeSeparator: '/' // the split symbol used by the scope value. introduced later.
    })
> 
```
    import { factory } from 'z-multi-cache';

    const template = {
        globalKeys: [
            'cityName',
            'arrDate'
        ],
        pages: [
            'home',
            'hotelList',
            'hotelDetail',
            'orderList',
            'orderDetail'
        ]
    };

    const store = factory({
        ns: "projectA",
        getterStrict: true,
        strict: true,
        template
    });

    //-- use
    
    // in mobx, we create a decorator. when the value change, the changed value will be stored automatically.
    export function storeSet(key, opts) {
        return function(clazz) {
            const proxy = new Proxy(clazz, {
                construct: function(target, args) {
                    const obj = Reflect.construct(target, args);
                    autorun(() => {
                        store.setItem(key, toJS(obj[key]), opts);
                    });
                    return obj;
                }
            });
            return proxy;
        };
    }

    // used in mobx
    @storeSet('cityName', { scope: 'global' })
    class DataStore {
        @observable
        cityName = store.getItem('cityName', { scope: 'global', default: 'beijing' } //default can be basic type, or a function. default will be return value of the funciton.

        @aciton.bound
        changeCityName(val) {
            this.cityName = val;
        }
    }

    // getItem, in localStorage, get value from key: 'defaultKey', in sessionStorage get value from key: 'ssKey'
    store.getItem('defaultKey', {scope: 'global', type: ['localStorage', {type: 'sessionStorage', key: 'ssKey' }] })

    // getItem according to the priorities of "localStorage", "sessionStorage", and "urlSearch". the default value is "2018-12-12" while the result of getItem is undefined. if getItem from urlSearch, the key is arrDate
    store.getItem('theDate', {
        scope: 'global',
        type: ['localStorage', 'sessionStorage', { type: 'urlSearch', key: 'arrDate'}],
        default: function() {  return '2018-12-12' } // default can also be a string: '2018-12-12'
    });

    // update search part of the url
    // if 'theCityName' in the search part of url, then the value from storage of key: cityName will update 'theCityName'
    store.getItem('cityName', {scope: 'global', updateSearchUrlKey: 'theCityName' })
    store.getItem('cityName', {scope: 'global', updateSearchUrlKey: 'theCityName' })

    // updateUrlSearch
    store.updateUrlSearch({
        cityNameKeyInSearchOfUrl: ['cityName', {  scope: 'global', type: 'localStorage' }],
        arrDateKeyOfSearch: ['arrDate', {scope: 'global', type: ['sessionStorage', 'localStorage'] }] // first get value from sessionStorage
    });

    // updateUrlSearch asynchronously, the search part of the url will be updated after 100ms.
    store.updateUrlSearch({
        data: "2018-12-12",
        arrDateKeyOfSearch: ['arrDate', {scope: 'global', type: ['sessionStorage', 'localStorage'] }] // first get value from sessionStorage
    }, 100);

    // updateUrlSearch when setItem or getItem
    store.setItem('cityName', { updateSearchUrlKey: 'city', updateSearchUrlKeyTime: 400 }); // update url after 400ms, the default scope is "global" and default type is "sessionStorage"

    store.getItem('arrDate', { updateSearchUrlKey: 'arrDate', updateSearchUrlKeyTime: 500 }); // update url after 500ms

    // url utils

    const { getUrlParam, updateUrlSearch } = store;
    const urlParamObj = getUrlParam();
    const cityName = getUrlParam('cityName');
    
    const _setTimeout = 500;
    updateUrlSearch({
        cityName: 'beijing',
        arrDate: '2018-12-12'
    }, _setTimeout); // if _setTimeout is undefined, the updateUrlSearch will be invoked synchronously.

    
```