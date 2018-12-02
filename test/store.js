
import { factory } from '@src/store';
const store = factory({ns: 'tmc', strict: true, template: {
    globalKeys: ['age'],
    pages: ['home']
}});


store.setItem('name', 100, {scope: 'home'})
store.setItem('age', 18, {scope: 'global', type: 'ls'});
const val = store.getItem('name', {scope: 'home/hotel', default: '100'});
console.log('val:', val);


