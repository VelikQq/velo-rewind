// One visible card per selected period. Stale map jobs never repaint a newer card.
export function createSharePreview({paint,renderMap,onState}){
 let revision=0,ready=false;
 function reset(){revision++;ready=false;onState({phase:'empty'});}
 async function prepare(input){const ticket=++revision;ready=false;onState({phase:'loading',input});
 try{paint(input,undefined);const map=await renderMap((done,total)=>{if(ticket===revision)onState({phase:'loading',done,total,input});},input);if(ticket!==revision)return false;paint(input,map);ready=true;onState({phase:'ready',input});return true;}
 catch(error){if(ticket!==revision)return false;onState({phase:'error',input,message:error.message||'Не удалось подготовить карту.'});return false;}
 }
 return {reset,prepare,get ready(){return ready;},get revision(){return revision;}};
}
