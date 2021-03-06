
import { factory } from '@src/store';
const store = factory({ns: 'tmc', strict: true, template: {
    globalKeys: ['age'],
    pages: ['home']
}});

console.log('start...');
store.setItem('name', 100, { scope: 'home' })
store.setItem('age', 18, {scope: 'global', type: 'localStorage', updateUrlSearchKey: 'xixixi', updateUrlSearchKeyTime: 2000});
const val = store.getItem('timsssss', {scope: 'home', type: ['localStorage', {key: 'xixi', type: 'urlSearch'}], updateUrlSearchKey: 'happy'});
store.updateUrlSearch({
    name: ['name', {scope: 'home'}],
    age: ['age', { scope: 'global', type: 'localStorage' }],
    arrDate: ['hotelArrDate', { scope: 'home/hotel', type: [], default: 0 }]
});

setTimeout(() => {
    store.clearAll(['localStorage']);
}, 1000)


