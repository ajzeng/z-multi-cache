
import { factory } from '@src/store';
const store = factory({strict: true, template: {
    globalKeys: ['age'],
    pages: ['home']
}});


store.setItem('name', 100, {scope: 'home'})
store.setItem('age', 18, {scope: 'global', type: store.types.localStorage});
const val = store.getItem('name', {scope: 'home/hotel', default: '100'});
console.log('val:', val);

const store
export const store;

