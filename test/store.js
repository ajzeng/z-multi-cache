
import { factory } from '@src/store';
const store = factory({strict: true, template: {
    globalKeys: ['age'],
    pages: ['home']
}});
store.set({ key: 'name', value:'tom', scope: 'home/hotel'})
store.set({ key: 'age', value: 18, scope: 'global'});
const val = store.get({key: 'name', scope: 'home/hotel'});
console.log('val:', val);