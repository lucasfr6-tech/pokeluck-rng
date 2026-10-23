export const names = ['Bulbizarre','Herbizarre','Florizarre','Salamèche','Reptincel','Dracaufeu','Carapuce','Carabaffe','Tortank','Chenipan','Chrysacier','Papilusion','Aspicot','Coconfort','Dardargnan','Roucool','Roucoups','Roucarnage','Rattata','Rattatac','Piafabec','Rapasdepic','Abo','Arbok','Pikachu','Raichu','Sabelette','Sablaireau','Nidoran♀','Nidorina','Nidoqueen',
'Nidoran♂','Nidorino','Nidoking','Mélofée','Mélodelfe','Goupix','Feunard','Rondoudou','Grodoudou','Nosferapti','Nosferalto','Mystherbe','Ortide','Rafflesia','Paras','Parasect','Mimitoss','Aéromite','Taupiqueur','Triopikeur','Miaouss','Persian','Psykokwak','Akwakwak','Férosinge','Colossinge','Caninos','Arcanin','Ptitard','Têtarte','Tartard','Abra','Kadabra','Alakazam','Machoc','Machopeur','Mackogneur','Chétiflor','Boustiflor','Empiflor','Tentacool','Tentacruel','Racaillou','Gravalanch','Grolem','Ponyta','Galopa','Ramoloss','Flagadoss','Magnéti','Magnéton','Canarticho','Doduo','Dodrio','Otaria','Lamantine','Tadmorv','Grotadmorv','Kokiyas','Crustabri','Fantominus','Spectrum','Ectoplasma','Onix','Soporifik','Hypnomade','Krabby','Krabboss','Voltorbe','Électrode','Noeunoeuf','Noadkoko','Osselait','Ossatueur','Kicklee','Tygnon','Excelangue','Smogo','Smogogo','Rhinocorne','Rhinoféros','Leveinard','Saquedeneu','Kangourex','Hypotrempe','Hypocéan','Poissirène','Poissoroy','Stari','Staross','M. Mime','Insécateur','Lippoutou','Élektek','Magmar','Scarabrute','Tauros','Magicarpe','Léviator','Lokhlass','Métamorph','Évoli','Aquali','Voltali','Pyroli','Porygon','Amonita','Amonistar','Kabuto','Kabutops','Ptéra','Ronflex','Artikodin','Électhor','Sulfura','Minidraco','Draco','Dracolosse','Mewtwo','Mew'];

// Poids de base PROVISOIRES (rareté croissante vers la fin des lignées et pour les légendaires).
// Nidoran♀ (50 %) et Salamèche (1/6) gardent leurs chances fixes du prototype ; les autres espèces
// se partagent le tiers restant selon ces poids.
const weights = [9,3,1,0,3,0.3,9,3,1,18,7,2,18,7,2,18,7,2,18,5,14,4,12,4,6,2,12,4,0,3,1,
12,4,1,6,1.5,6,1.5,10,2,18,5,14,5,1.5,12,3,12,3,12,3,12,3,12,3,12,3,6,1,14,5,1.5,6,2,0.6,12,4,1,14,5,1.5,14,3,16,5,1.2,10,2,10,2,10,3,3,12,3,10,2.5,10,2.5,10,1.5,10,3,0.8,4,12,3,12,3,10,3,10,2,10,2.5,1.5,1.5,3,10,2.5,10,2,0.8,4,1.5,10,2.5,14,3,12,1.2,1.5,1.2,1.5,1.5,1.5,1.2,1.5,18,0.5,0.4,1,3,0.4,0.4,0.4,0.4,0.8,0.2,0.8,0.2,0.3,0.3,0.002,0.002,0.002,0.5,0.15,0.02,0.0002,0.0002];
if (weights.length !== names.length) throw new Error('Poids et noms désynchronisés');
export const baseWeights = weights;
const sum = weights.reduce((a,b)=>a+b,0);
export const pool = names.map((name,i)=>({id:i+1,name,probability:i===28?1/2:i===3?1/6:weights[i]/sum/3}));

// Évolution directe : numéro de l'espèce → numéro de la forme précédente.
export const evolvesFrom = {2:1,3:2,5:4,6:5,8:7,9:8,11:10,12:11,14:13,15:14,17:16,18:17,20:19,22:21,24:23,26:25,28:27,30:29,31:30,33:32,34:33,36:35,38:37,40:39,42:41,44:43,45:44,47:46,49:48,51:50,53:52,55:54,57:56,59:58,61:60,62:61,64:63,65:64,67:66,68:67,70:69,71:70,73:72,75:74,76:75,78:77,80:79,82:81,85:84,87:86,89:88,91:90,93:92,94:93,97:96,99:98,101:100,103:102,105:104,110:109,112:111,117:116,119:118,121:120,130:129,134:133,135:133,136:133,139:138,141:140,148:147,149:148};
// Toutes les formes précédentes d'une espèce (de la plus proche à la plus ancienne).
export function ancestors(id){const list=[];for(let p=evolvesFrom[id];p;p=evolvesFrom[p])list.push(p);return list;}
// Deux espèces sont de la même lignée si l'une descend de l'autre (Évoli et ses évolutions : un seul rôle par embranchement).
export const sameLine = (a,b) => a===b || ancestors(a).includes(b) || ancestors(b).includes(a);

export const sprite = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
export function pick(random=Math.random()) { let cumulative=0; for(const p of pool){cumulative+=p.probability;if(random<cumulative)return p;} return pool.at(-1); }
export const rarity = p => p.probability>=0.1?'Fréquent':p.probability>=0.01?'Peu commun':p.probability>=0.003?'Rare':'Ultra rare';
export const odds = p => `1 sur ${new Intl.NumberFormat('fr-FR',{maximumFractionDigits:1}).format(1/p.probability)}`;
