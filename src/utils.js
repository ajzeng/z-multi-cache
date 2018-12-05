import qp from 'query-parse';

export function getUrlParam(key) {
    const { search } = window.location;
    const paramObj = qp.toObject(search.replace(/^\?/, ''));
    if (key) {
        return paramObj[key];
    } else {
        return paramObj;
    }
}

export function updateUrlSearchPart(storageParamObj = {}, urlTitle) {
    const { href, search } = window.location;
    const paramObj = getUrlParam();
    if (!Object.keys(paramObj).length) {
        return;
    }
    const newParamObj = {
        ...paramObj,
        ...storageParamObj
    };
    const newSearch = '?' + qp.toString(newParamObj);
    if (search === newSearch) {
        return;
    }
    const newHref = href.replace(search, newSearch);
    const title = urlTitle === void 0 ? document.title : urlTitle;
    window.history.replaceState(null, title, newHref);
}