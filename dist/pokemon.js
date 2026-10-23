export const names = ['Bulbizarre','Herbizarre','Florizarre','Salamèche','Reptincel','Dracaufeu','Carapuce','Carabaffe','Tortank','Chenipan','Chrysacier','Papilusion','Aspicot','Coconfort','Dardargnan','Roucool','Roucoups','Roucarnage','Rattata','Rattatac','Piafabec','Rapasdepic','Abo','Arbok','Pikachu','Raichu','Sabelette','Sablaireau','Nidoran♀','Nidorina','Nidoqueen',
'Nidoran♂','Nidorino','Nidoking','Mélofée','Mélodelfe','Goupix','Feunard','Rondoudou','Grodoudou','Nosferapti','Nosferalto','Mystherbe','Ortide','Rafflesia','Paras','Parasect','Mimitoss','Aéromite','Taupiqueur','Triopikeur','Miaouss','Persian','Psykokwak','Akwakwak','Férosinge','Colossinge','Caninos','Arcanin','Ptitard','Têtarte','Tartard','Abra','Kadabra','Alakazam','Machoc','Machopeur','Mackogneur','Chétiflor','Boustiflor','Empiflor','Tentacool','Tentacruel','Racaillou','Gravalanch','Grolem','Ponyta','Galopa','Ramoloss','Flagadoss','Magnéti','Magnéton','Canarticho','Doduo','Dodrio','Otaria','Lamantine','Tadmorv','Grotadmorv','Kokiyas','Crustabri','Fantominus','Spectrum','Ectoplasma','Onix','Soporifik','Hypnomade','Krabby','Krabboss','Voltorbe','Électrode','Noeunoeuf','Noadkoko','Osselait','Ossatueur','Kicklee','Tygnon','Excelangue','Smogo','Smogogo','Rhinocorne','Rhinoféros','Leveinard','Saquedeneu','Kangourex','Hypotrempe','Hypocéan','Poissirène','Poissoroy','Stari','Staross','M. Mime','Insécateur','Lippoutou','Élektek','Magmar','Scarabrute','Tauros','Magicarpe','Léviator','Lokhlass','Métamorph','Évoli','Aquali','Voltali','Pyroli','Porygon','Amonita','Amonistar','Kabuto','Kabutops','Ptéra','Ronflex','Artikodin','Électhor','Sulfura','Minidraco','Draco','Dracolosse','Mewtwo','Mew'];

// Statistiques de base totales (PV+Att+Déf+Att.Spé+Déf.Spé+Vit) des 151 espèces, d'après PokéAPI.
export const baseTotals = [318,405,525,309,405,534,314,405,530,195,205,395,195,205,395,251,349,479,253,413,262,442,288,448,320,485,300,450,275,365,505,
273,365,505,323,483,299,505,270,435,245,455,320,395,490,285,405,305,450,265,425,290,440,320,500,305,455,350,555,300,385,510,310,400,500,305,405,505,300,390,490,335,515,300,390,495,410,500,315,490,325,465,377,310,470,325,475,325,500,305,525,310,405,500,385,328,483,325,475,330,490,325,530,320,425,455,455,385,340,490,345,485,450,435,490,295,440,320,450,340,520,460,500,455,490,495,500,490,200,540,535,288,325,525,525,525,395,355,495,355,495,515,540,580,580,580,300,420,600,680,600];
if (baseTotals.length !== names.length) throw new Error('Statistiques et noms désynchronisés');
// Poids de tirage PROVISOIRE : plus les statistiques de base sont élevées, plus l'espèce est rare
// (division par ≈ 2,7 tous les 70 points). Deux espèces aux statistiques voisines (Tortank et Dracaufeu)
// ont donc quasiment la même chance ; Pikachu est bien plus fréquent que les deux.
export const baseWeights = baseTotals.map(t => Math.exp(-(t - 200) / 70));
const sum = baseWeights.reduce((a,b)=>a+b,0);
export const pool = names.map((name,i)=>({id:i+1,name,probability:baseWeights[i]/sum}));

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
