```js
import { factory } from "z-multi-cache";
import { autorun, toJS } from "mobx";

const uniqueInstance = Symbol("the unique instance of the Store class");
const getItemKeysList = Symbol("the keys list will getItem from storage");

const template = {
    globalKeys: [
        /** 公共部分 */

        /** 机票部分 */

        /** 酒店部分 */
        "hotelArrDate", // 酒店入住日期,存储在sessionStorage,格式为'2018-12-12',字符串
        "hotelDptDate", // 酒店离店日期,存储在sessionStorage,格式为'2018-12-13',字符串
        "hotelBookingCity", // 酒店预订城市信息,存储在sessionStorage是一个对象,包含cityName,cityUrl,location几个属性
        "hotelKeyword", // 酒店搜索关键字,存储在sessionStorage,字符串
        "hotelKeywordType"
        /** 火车票部分 */
    ],
    pages: [
        /** 公共部分 */
        "tmcHome", // tmc的H5端新首页
        "my", // 我的信息页面

        /** 未来可能重构的机票部分 */

        /** 酒店部分 */
        "hotelList", // 列表页
        "hotelDetail", // 详情页
        "hotelBook", // 下单页
        "hotelOrderDetail", // 订单详情页
        "hotelOrderList" // 订单列表页

        /** 火车票部分 */
    ]
};

const store = factory({
    ns: "tmc", // 命名空间
    getterStrict: true,
    strict: true, // 开启严格模式
    template // 严格模式校验使用的配置模板
});

export default store;

// 这个是可以通过storeSet装饰器来监听属性的变化
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

// 用于数据store的class上的初始化装饰
// 1. 为了在原型上挂载一个唯一的实例，用于后面setItem装饰函数使用
// 2. 变量原型上getItemKeysList数组，进行初始化赋值
export function initStore(clazz) {
    const proto = clazz.prototype;
    const proxy = new Proxy(clazz, {
        construct: function(target, args) {
            const instance = Reflect.construct(target, args);
            // 将实例挂载在原型上
            if (!proto[uniqueInstance]) {
                proto[uniqueInstance] = instance;
            }
            // 给实例赋予初始值
            const list = proto[getItemKeysList];
            if (list) {
                list.forEach(({ key, opts, name }) => {
                    instance[name] = store.getItem(key, opts);
                });
            }
            return instance;
        }
    });
    return proxy;
}

function _setItem(proto, name, descriptor, key, opts) {
    setTimeout(() => {
        const instance = proto[uniqueInstance];
        if (instance) {
            autorun(() => {
                store.setItem(key, toJS(instance[name]), opts);
            });
        }
    }, 0);
    return descriptor;
}

function _getItem(proto, name, descriptor, key, opts) {
    let list = proto[getItemKeysList];
    if (!list) {
        list = proto[getItemKeysList] = [];
    }
    list.push({
        key,
        opts,
        name
    });
}

const changeItemHandlerMap = {
    setItem: _setItem,
    getItem: _getItem
};

// 用于在数据store的属性上的setItem装饰函数
export function changeItem(type, arg1, arg2, arg3) {
    // @setItem
    if (arguments.length === 4) {
        return changeItemHandlerMap[type](arg1, arg2, arg3, arg2);
    } else if (arguments.length === 2) {
        // @setItem(key)
        if (typeof arg1 === 'string') {
            return function(proto, name, descriptor) {
                return changeItemHandlerMap[type](proto, name, descriptor, arg1);
            }
        }
        // @setItem(opts)
        else {
            return function(proto, name, descriptor) {
                return changeItemHandlerMap[type](proto, name, descriptor, name, arg1);
            }
        }
    }
    // @setItem() 与 @setItem等效
    else if (arguments.length === 1) {
        return function(proto, name, descriptor) {
            changeItemHandlerMap[type](proto, name, descriptor, name);
        }
    }
    // @setItem(key, opts)
    else {
        return function(proto, name, descriptor) {
            return changeItemHandlerMap[type](proto, name, descriptor, arg1, arg2);
        }
    }

    // @setItem(key, opts)
    // return function(proto, name, descriptor) {
    //     setTimeout(() => {
    //         const instance = proto[uniqueInstance];
    //         if (instance) {
    //             autorun(() => {
    //                 store.setItem(key, toJS(instance[name]), opts);
    //             });
    //         }
    //     }, 0);
    //     return descriptor;
    // };
}

// 用于在数据store的属性上的setItem装饰函数
export function setItem() {
    const args = Array.prototype.slice.call(arguments);
    return changeItem('setItem', ...args);
}

export function getItem() {
    const args = Array.prototype.slice.call(arguments);
    return changeItem('getItem', ...args);
}

// ************** store的使用说明 ****************

/**
 * store主要有两个api: setItem和getItem
 *
 * 【------ setItem(key, value, opts) ----------】
 * 三个参数： key, value, opts三个参数，其中key，value就是普通的键值概念，opts是一个配置对象，具体如下
 * opts = {
 *  type: 'localStorage', // type是这个值存在什么级别的存储中，常用的分为localStorage, sessionStorage
 *  scope: 'home' // 主要分为两类：全局scope和普通分模块的scope
 * }
 *
 * scope详解：
 * 全局scope: 当scope为“global”值的时候，就代表这个值是存在全局环境的，建议多个页面需要进行读写的公共数据才放在全局scope中，全局scope的数据在每个
 *            页面和模块中都可以进行读写，尽量小心操作
 * 普通scope: 还有的数据是本页面进行读写的数据，scope可以设置在本页面scope下，比如scope设置为home，表示这个数据是home页面下的，如果一个页面很复杂
 *           是由多个不同的部分组成的，可以通过“/”写多层次的scope，加入home页下有一个叫做广告的版块有数据需要存取，可以设置scope为“home/advertisement”
 *           如果一个数据是scope为“home/advertisement”，home页面下可以对这个数据进行读写操作，但是其他页面不能对home页面数据进行读写操作。全局的scope
 *           只能为“global”，暂时不存在分层的概念
 *
 * 【------- getItem(key, opts) -------】
 * getItem操作参数和setItem参数类似：
 * opts = {
 *  type: 'sessionStorage', // 设置type表示数据从哪里进行读取
 *  scope: 'home', // 设置home表示数据从哪个scope进行读取，如果当初setItem时scope为“home/advertisement”，则读取的时候scope也要为“home/advertisement”，如果设置的
 *                    也可以查看全局scope是否有需要的数据，可以设置scope为“global”
 *  default: 100 // default表示默认值是多少，如果当初没有setItem，获取的时候如果没有值则使用default对应的默认值，default也可以是一个函数，返回的是函数执行的结果
 *                  比如需要默认值为当前时间： default: function() {return new Date()}
 * }
 *
 * 【 严格模式说明 】
 * 由于为了防止随意的存储数据造成数据杂乱，我们这里开启了严格模式：
 * 1. 如果你存取的数据的scope是“global”的全局数据，那么这个数据的key需要先在template的globalKeys列表中进行定义，否则会报错
 * 2. 当你新增加一个普通cope的时候，比如： "hotelOrderDetail/invoice"，这个是多层次的scope，但是第一个“/”前面的单词代表这个scope的页面，这个页面需要先在template的pages中
 *    进行定义
 */

/**
 * 【---------- 同步更新url参数的方法 ------------】
 * 当我们进行读写storage中的数据的时候，如果想同时更新url中对应的参数，分为以下两个情况：
 * 情况一：
 * store.setItem('hotelArrDate', '2018-12-12', { scope: 'global', updateUrlSearchKey: 'checkIn' }); 这代表我们从storage中存hotelArrDate的值时，同时将urld的search中checkIn参数更新为该值
 *
 * 情况二：（如果storage中key对应的值是个对象，包含多个信息）
 * store.setItem('userInfo', infoObj, { scope: 'global' }); 这个时候假如infoObj包含了name和age这两个信息，需要用下面的方法
 * const { name, age } = infoObj;
 *
 * store.updateUrlSearch({
 *     urlName: name, // 使用name值更新url上的urlName
 *     urlAge: age,
 *     urlDate: ['theDate', { scope: 'global' }],  // 也可以从storage中取theDate值来更新urlDate
 * })
 */

// ************* storeSet方式使用说明 ************
/**
 * storeSet是作为装饰器使用的，在使用mobx的时候我们会使用到Class来定义我们的状态类，storeSet就是用于装饰该类
 *
 * @storeSet('price', {     // 在这里storeSet监听price的变化，storeSet一发生变化，就会将新的值写在scope为home的locaStorage中去
 *  scope: 'home',
 *  type: 'localStorage',
 *  default: 0
 * })
 * class DetailStore {
 *  @observable
 *  price = 0;
 *
 *  @observable
 *  amount = 0;
 *
 *  @action.bound
 *  changePrice(newPrice) {
 *      this.price = newPrice
 *  }
 * }
 */

 // ***************** 使用initStore和setItem来代替storeSet *******************

/**
 * import store, { initStore, setItem } from '$storage';
 * 
 * initStore是作为初始化装饰器使用的，然后setItem在每个属性上做，有多种形式
 * @initStore
 * class DetailStore {
 *  @setItem  与 @setItem()等效  // 这里底层调用的是 store.setItem('price', opts)， key为属性名称，opts为默认值
 *  @observable
 *  price = 0;
 * 
 *  @setItem('theAmount') // 如果存在storage中的key值和属性名称不同可以自定义，opts为默认值
 *  @observable
 *  amount = 0;
 *
 *  @setItem(optsObj)  // 这里key默认和属性名称同名，optsObj自定义
 *  @observable
 *  checkInDate = '2018-12-12'
 *  
 *  @setItem(key, optsObj) // 这里是key和optsObj全部自定义
 *  @observable
 *  checkOutDate = '2018-12-13'
 * 
 *  @action.bound
 *  changePrice(newPrice) {
 *      this.price = newPrice
 *  }
 * }
 */

 // ***************** 数据初始化getItem *******************
 /**
 * import store, { initStore, setItem, getItem } from '$storage';
 * 
 * initStore是作为初始化装饰器使用的，然后setItem在每个属性上做，有多种形式
 * @initStore
 * class DetailStore {
 *  @getItem // 和下面@setItem的默认参数是一致的
 *  @setItem  与 @setItem()等效  // 这里底层调用的是 store.setItem('price', opts)， key为属性名称，opts为默认值
 *  @observable
 *  price = 0;
 * 
 *  @getItem('theAmount')
 *  @setItem('theAmount') // 如果存在storage中的key值和属性名称不同可以自定义，opts为默认值
 *  @observable
 *  amount = 0;
 * 
 *  @action.bound
 *  changePrice(newPrice) {
 *      this.price = newPrice
 *  }
 * }
 */

/**
 * 在诸如酒店列表这类页面中，URL能够唯一确定一个页面，如入离酒店日期是从url参数中获取的，这个页面自己又可以修改入离店日期，
 * 修改了日期之后会更新storage中的入离店日期，那么像首页这种从storage中恢复入离店日期的页面就可以获取到最新的操作后的信息。
 * 但是列表页url的参数并没有变化，这个时候刷新列表页，那么信息还是错误的，所以我们在更新storage信息时候要同步更新url参数信息。
 * 有两个方面需要注意：
 * 1. 更新storage信息的时候同时更新url参数信息
 * 2. 每次进入一个页面的时候，先从storage中获取url中包含的参数的数据和url参数进行对比，如果不一致，更新url参数信息
 */
```
