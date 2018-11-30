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
        template: simpleObj, // verification template in strict mode.
        scopeSeparator: '/' // the split symbol used by the scope value. introduced later.
    })
> 
```
```