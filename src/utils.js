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

// 之所以要使用setTimeout是因为我们的小程序中使用了类似日历选择这样的中间页，同时给这个中间页提供了一个url（使用的H5的pushState），
// 中间页的链接并不是我们想要的，所以默认是用setTimeOut得到中间页关闭后的页面的url，如果要使用同步接口，可以传time为null值即可
export function updateUrlSearchPart(storageParamObj = {}, theTime, urlTitle) {
    if (typeof theTime === 'number') {
        setTimeout(() => {
            _updateUrlSearchPart(storageParamObj, urlTitle);
        }, theTime);
    } else {
        _updateUrlSearchPart(storageParamObj, urlTitle);
    }
}

function _updateUrlSearchPart(storageParamObj, urlTitle) {
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