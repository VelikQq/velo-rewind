// Reference values from a third-party catalogue, not verified official menus.
export const combos=[
 {id:'vit',name:'Вкусно — и точка',icon:'burger',color:'#ffb17a',unit:'бургер',units:['Биг Спешиал','Биг Спешиала','Биг Спешиалов'],items:[['Биг Спешиал, 326 г',756]],url:'https://myfoodmate.ru/calories/restaurants/vkusno-i-tochka'},
 {id:'bk',name:'Бургер Кинг',icon:'burger',color:'#ffc76e',unit:'бургер',units:['Воппер','Воппера','Вопперов'],items:[['Воппер, 274 г',720]],url:'https://myfoodmate.ru/calories/restaurants/burger-king'},
 {id:'rostics',name:'Ростикс',icon:'fire',color:'#ff8d99',unit:'крылышко',units:['крылышко','крылышка','крылышек'],calculation:'Среднее на одно острое крылышко: 228 ккал за 3 шт. / 3 = 76 ккал. Размер отдельных крылышек может отличаться.',items:[['Острое крылышко, 1 шт. (около 25 г)',76]],url:'https://myfoodmate.ru/calories/restaurants/rostics'},
 {unit:'набор',units:['набор','набора','наборов'],id:'dodo',name:'Додо Пицца',icon:'pizza',color:'#ffad69',items:[['Пепперони 30 см, традиционное тесто, 550 г',1561],['Картофель из печи, 80 г',175],['Добрый Кола, 0,5 л',210]],url:'https://myfoodmate.ru/calories/restaurants/dodo-pizza'}
].map(x=>({...x,kcal:x.items.reduce((sum,item)=>sum+item[1],0)}));
export function comboEquivalent(calories,kcal){return Number.isFinite(calories)&&calories>=0&&Number.isFinite(kcal)&&kcal>0?{count:Math.floor(calories/kcal),remainder:Math.floor(calories-Math.floor(calories/kcal)*kcal)}:null;}

export function foodCountLabel(item,count){const last=count%10,lastTwo=count%100;return item.units[last===1&&lastTwo!==11?0:last>=2&&last<=4&&(lastTwo<12||lastTwo>14)?1:2];}
