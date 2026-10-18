// Reference values from a third-party catalogue, not verified official menus.
export const combos=[
 {id:'vit',name:'Вкусно — и точка',icon:'burger',color:'#ffb17a',items:[['Биг Хит, 216 г',503],['Фри средний, 110 г',318],['Добрый Кола, 400 г',170]],url:'https://myfoodmate.ru/calories/restaurants/vkusno-i-tochka'},
 {id:'bk',name:'Бургер Кинг',icon:'burger',color:'#ffc76e',items:[['Воппер, 274 г',720],['Кинг Фри, 100 г',200],['Эвервесс Кола, 0,5 л',220]],url:'https://myfoodmate.ru/calories/restaurants/burger-king'},
 {id:'rostics',name:'Ростикс',icon:'fire',color:'#ff8d99',items:[['Шефбургер, 190 г',401],['Фри средний, 100 г',291],['Эвервесс Кола, 0,4 л',144]],url:'https://myfoodmate.ru/calories/restaurants/rostics'},
 {id:'dodo',name:'Додо Пицца',icon:'pizza',color:'#ffad69',items:[['Пепперони 30 см, традиционное тесто, 550 г',1561],['Картофель из печи, 80 г',175],['Добрый Кола, 0,5 л',210]],url:'https://myfoodmate.ru/calories/restaurants/dodo-pizza'}
].map(x=>({...x,kcal:x.items.reduce((sum,item)=>sum+item[1],0)}));
export function comboEquivalent(calories,kcal){return Number.isFinite(calories)&&calories>=0&&Number.isFinite(kcal)&&kcal>0?{count:Math.floor(calories/kcal),remainder:Math.floor(calories-Math.floor(calories/kcal)*kcal)}:null;}
