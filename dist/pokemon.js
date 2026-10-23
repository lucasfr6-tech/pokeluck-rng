export const names = ['Bulbizarre','Herbizarre','Florizarre','Salamèche','Reptincel','Dracaufeu','Carapuce','Carabaffe','Tortank','Chenipan','Chrysacier','Papilusion','Aspicot','Coconfort','Dardargnan','Roucool','Roucoups','Roucarnage','Rattata','Rattatac','Piafabec','Rapasdepic','Abo','Arbok','Pikachu','Raichu','Sabelette','Sablaireau','Nidoran♀','Nidorina','Nidoqueen'];
const weights = [9,3,1,0,3,0.3,9,3,1,18,7,2,18,7,2,18,7,2,18,5,14,4,12,4,6,2,12,4,0,3,1];
const sum = weights.reduce((a,b)=>a+b,0);
export const pool = names.map((name,i)=>({id:i+1,name,probability:i===28?1/2:i===3?1/6:weights[i]/sum/3}));
export const sprite = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
export function pick(random=Math.random()) { let cumulative=0; for(const p of pool){cumulative+=p.probability;if(random<cumulative)return p;} return pool.at(-1); }
export const rarity = p => p.probability>=0.1?'Fréquent':p.probability>=0.01?'Peu commun':p.probability>=0.003?'Rare':'Ultra rare';
export const odds = p => `1 sur ${new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(1/p.probability)}`;
