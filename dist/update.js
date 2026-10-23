// Recharge la page toute seule quand une nouvelle version est publiée.
// scripts/build.cjs écrit version.json et inscrit la version dans <meta name="app-version">.
(()=>{
  const meta=document.querySelector('meta[name="app-version"]');
  const current=meta&&meta.content;
  if(!current||current.startsWith('__'))return; // serveur local sans build : rien à faire
  let checking=false;
  async function check(){
    if(checking||document.hidden)return;
    checking=true;
    try{
      const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});
      if(!r.ok)return;
      const {version}=await r.json();
      if(version&&version!==current){
        // On attend la fin d'un tirage en cours ; la sauvegarde est déjà enregistrée à chaque tirage.
        if(document.querySelector('.rolling'))return;
        // Une seule tentative par version : évite une boucle si un cache sert encore l'ancienne page.
        try{if(sessionStorage.getItem('pokeluck-reload')===version)return;sessionStorage.setItem('pokeluck-reload',version);}catch{}
        location.reload();
      }
    }catch{}finally{checking=false;}
  }
  setInterval(check,60000);
  document.addEventListener('visibilitychange',check);
  window.addEventListener('focus',check);
  check();
})();
