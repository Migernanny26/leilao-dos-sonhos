// Caricaturas dos nomes do leilão (SVG 100x100, cartoon com contorno).
// Uso: caricatura('Zidane', 140)  ou  caricaturaV({pele:1,cabelo:'curto',...}, 140)
// Os traços de cada nome vêm de window.VISUAIS (visuais.js). Nome desconhecido ganha um visual sorteado pelo nome.
(function(){
const INK='#2a1018';
const PELE=['#f6dcc4','#f0c9a4','#d9a577','#b37a4c','#8a5531','#5e3720'];
const PELE_X={verde:'#6fbf4f',azul:'#4f7fd6',cinza:'#a3a7ad',amarelo:'#f3d34a'};
const CAB={preto:'#1e1614',castanho:'#5b3a1e',loiro:'#e3b94e',ruivo:'#c4502b',grisalho:'#a19d97',branco:'#efebe4',verde:'#3fa34d',azul:'#3b6fd1',rosa:'#f07fb5'};
const S=(d,f,w=2.4)=>`<path d="${d}" fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`;
const TOP='M26 48 Q26 25 50 25 Q74 25 74 48 Q62 35 50 37 Q38 35 26 48Z';
const shine=`<path d="M39 33 Q46 29 54 31" stroke="rgba(255,255,255,.5)" stroke-width="3" fill="none" stroke-linecap="round"/>`;
// cachos: primeiro o contorno (círculos maiores em tinta), depois o preenchimento, para a silhueta sair limpa
const curls=(pts,r,c)=>pts.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${r+1.3}" fill="${INK}"/>`).join('')+pts.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');
const ring=(cx,cy,R,n,off=0)=>Array.from({length:n},(_,i)=>{const a=off+i/n*Math.PI*2;return[Math.round(cx+Math.cos(a)*R),Math.round(cy+Math.sin(a)*R)]});

// cabelo: [atrás do rosto, na frente do rosto]
const HAIR={
 careca:()=>['',shine],
 raspado:c=>['',`<path d="${TOP}" fill="${c}" opacity=".5"/>`],
 curto:c=>['',S(TOP,c)],
 calvo_topo:c=>['',S('M26 53 Q24 40 31 33 L35 47 Q30 48 26 53Z',c)+S('M74 53 Q76 40 69 33 L65 47 Q70 48 74 53Z',c)+shine],
 tonsura:c=>['',S('M27 45 Q27 34 35 30 Q50 35 65 30 Q73 34 73 45 Q62 39 50 41 Q38 39 27 45Z',c)+shine],
 topete:c=>['',S('M27 48 Q26 22 56 17 Q73 19 72 34 Q60 28 47 34 Q36 36 27 48Z',c)],
 franja:c=>['',S('M25 50 Q24 24 50 24 Q76 24 75 50 L71 45 Q67 40 63 45 Q59 39 55 45 Q51 39 47 45 Q43 39 39 45 Q35 40 31 45Z',c)],
 medio_liso:c=>[S('M24 50 Q22 24 50 23 Q78 24 76 50 L76 68 Q70 72 66 66 L66 48 L34 48 L34 66 Q30 72 24 68Z',c),S(TOP,c)],
 longo_liso:c=>[S('M23 50 Q21 23 50 22 Q79 23 77 50 L78 88 Q70 92 66 84 L66 48 L34 48 L34 84 Q30 92 22 88Z',c),S(TOP,c)],
 cacheado_curto:c=>['',curls([[28,46],[30,37],[36,30],[44,26],[52,25],[60,27],[66,31],[71,38],[72,46]],7,c)],
 cacheado_longo:c=>[curls([[24,42],[20,54],[21,66],[24,78],[30,86],[76,42],[80,54],[79,66],[76,78],[70,86]],9,c),curls([[29,44],[33,34],[41,28],[50,25],[59,28],[67,34],[71,44]],8,c)],
 black_power:c=>[curls(ring(50,40,27,13,.2),11,c),''],
 coque:c=>['',S(TOP,c)+`<circle cx="50" cy="20" r="9.3" fill="${INK}"/><circle cx="50" cy="20" r="8" fill="${c}"/>`],
 rabo:c=>[S('M70 46 Q90 56 82 80 Q77 68 68 58Z',c),S(TOP,c)],
 moicano:c=>['',`<path d="${TOP}" fill="${c}" opacity=".3"/>`+S('M44 37 Q45 14 50 6 Q55 14 56 37 Q50 33 44 37Z',c)],
 espetado:c=>['',S('M24 50 L19 32 L31 36 L27 15 L41 29 L46 5 L54 27 L63 8 L65 29 L77 17 L73 36 L83 33 L76 50 Q64 37 50 39 Q36 37 24 50Z',c)],
 peruca_classica:c=>[curls([[25,50],[23,60],[25,70],[75,50],[77,60],[75,70]],6.5,c)+S('M45 76 Q50 92 55 76Z',c),S('M25 50 Q24 25 50 24 Q76 25 75 50 Q72 40 64 38 Q56 33 50 34 Q44 33 36 38 Q28 40 25 50Z',c)],
 trancas:c=>[[24,30,70,76].map(x=>S(`M${x-3} 44 L${x+3} 44 L${x+3} 80 Q${x} 84 ${x-3} 80Z`,c,2)).join(''),S(TOP,c)+`<path d="M38 30 L40 40 M50 26 L50 37 M62 30 L60 40" stroke="${INK}" stroke-width="1.6" opacity=".5"/>`]
};
// barba e bigode
const BARBA={
 nenhuma:()=>'',
 bigode:c=>S('M38 62 Q44 57 50 61 Q56 57 62 62 Q56 65 50 63 Q44 65 38 62Z',c,2),
 bigode_grande:c=>S('M30 65 Q37 53 50 59 Q63 53 70 65 Q64 71 58 65 Q54 62 50 64 Q46 62 42 65 Q36 71 30 65Z',c,2.2),
 cavanhaque:c=>S('M43 69 Q50 85 57 69 Q50 73 43 69Z',c,2)+S('M40 62 Q45 58 50 61 Q55 58 60 62 Q55 64 50 63 Q45 64 40 62Z',c,2),
 barba_curta:c=>`<path d="M27 54 Q28 79 50 79 Q72 79 73 54 Q66 68 50 69 Q34 68 27 54Z" fill="${c}" opacity=".7"/>`,
 barba_cheia:c=>S('M27 54 Q27 85 50 86 Q73 85 73 54 Q66 70 50 70 Q34 70 27 54Z',c),
 barba_longa:c=>S('M27 54 Q25 93 50 100 Q75 93 73 54 Q66 70 50 70 Q34 70 27 54Z',c),
 costeletas:c=>S('M26 46 L32 46 L33 64 Q29 64 26 58Z',c,2)+S('M74 46 L68 46 L67 64 Q71 64 74 58Z',c,2)
};
const olho=(x,y)=>`<circle cx="${x}" cy="${y}" r="3.6" fill="${INK}"/><circle cx="${x+1.2}" cy="${y-1.2}" r="1.2" fill="#fff"/>`;
const OCULOS={
 nenhum:()=>olho(41,51)+olho(59,51),
 redondo:()=>olho(41,51)+olho(59,51)+`<g fill="rgba(255,255,255,.18)" stroke="${INK}" stroke-width="2.4"><circle cx="41" cy="51" r="8"/><circle cx="59" cy="51" r="8"/></g><path d="M49 50 Q50 48 51 50" stroke="${INK}" stroke-width="2.4" fill="none"/>`,
 quadrado:()=>olho(41,51)+olho(59,51)+`<g fill="rgba(255,255,255,.18)" stroke="${INK}" stroke-width="2.4"><rect x="32" y="45" width="16" height="12" rx="3"/><rect x="52" y="45" width="16" height="12" rx="3"/></g><path d="M48 49 H52" stroke="${INK}" stroke-width="2.4"/>`,
 escuro:()=>`<g fill="#111" stroke="${INK}" stroke-width="2"><rect x="30" y="45" width="18" height="12" rx="5"/><rect x="52" y="45" width="18" height="12" rx="5"/></g><path d="M48 49 H52" stroke="#111" stroke-width="3"/><path d="M33 48 h5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`,
 monoculo:()=>olho(41,51)+olho(59,51)+`<circle cx="59" cy="51" r="8.5" fill="none" stroke="#b8860b" stroke-width="2.6"/><path d="M66 56 Q72 70 67 86" fill="none" stroke="#b8860b" stroke-width="1.4"/>`
};
// acessórios: [atrás, na frente]; cobre = partes do rosto que somem
const ACC={
 nenhum:()=>['',''],
 cartola:c=>['',S('M31 6 H69 V31 H31Z',c)+S('M23 30 H77 V37 H23Z',c)+`<rect x="31" y="24" width="38" height="5" fill="#c1121f"/>`],
 bone:c=>['',S('M26 37 Q50 6 74 37 Z',c)+S('M48 31 H87 Q88 38 82 38 H48Z',c)],
 bandana:c=>['',S('M25 43 Q50 30 75 43 L75 50 Q50 38 25 50Z',c,2)+S('M74 45 L86 40 L84 50Z',c,2)],
 faixa_cabeca:c=>['',S('M25 41 Q50 32 75 41 L75 47 Q50 38 25 47Z',c,2)],
 faixa_ninja:c=>['',S('M25 41 Q50 32 75 41 L75 47 Q50 38 25 47Z',c,2)+`<rect x="42" y="33" width="16" height="9" rx="2" fill="#c9ccd2" stroke="${INK}" stroke-width="2"/><path d="M46 38 q4 -4 8 0" stroke="${INK}" stroke-width="1.4" fill="none"/>`],
 coroa_louros:c=>['',`<g fill="#5f9a3a" stroke="${INK}" stroke-width="1.6">${[[28,42,-60],[31,35,-45],[36,29,-30],[64,29,30],[69,35,45],[72,42,60]].map(([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="4" ry="7" transform="rotate(${r} ${x} ${y})"/>`).join('')}</g>`],
 coroa:c=>['',S('M30 36 V14 L40 25 L50 10 L60 25 L70 14 V36 Z',c==='#000000'?'#ffc72c':c)],
 capacete_alado:c=>['',S('M24 46 Q24 17 50 17 Q76 17 76 46 Q64 38 50 39 Q36 38 24 46Z',c)+S('M25 34 Q10 28 7 15 Q18 23 27 26Z','#f4f4f4',2)+S('M75 34 Q90 28 93 15 Q82 23 73 26Z','#f4f4f4',2)],
 mascara_total:c=>['',`<circle cx="50" cy="52" r="24.5" fill="${c}" stroke="${INK}" stroke-width="2.4"/>`+S('M32 48 Q38 39 47 46 Q43 56 33 53Z','#fff',2.2)+S('M68 48 Q62 39 53 46 Q57 56 67 53Z','#fff',2.2),{hair:1,face:1,beard:1}],
 mascara_teia:c=>{const r=ACC.mascara_total(c);r[1]+=`<path d="M50 28 V76 M27 52 H73 M33 35 L67 69 M67 35 L33 69" stroke="${INK}" stroke-width="1" opacity=".45"/><circle cx="50" cy="52" r="12" fill="none" stroke="${INK}" stroke-width="1" opacity=".45"/>`+S('M32 48 Q38 39 47 46 Q43 56 33 53Z','#fff',2.2)+S('M68 48 Q62 39 53 46 Q57 56 67 53Z','#fff',2.2);return r},
 mascara_olhos_pretos:c=>{const r=ACC.mascara_total(c);r[1]=`<circle cx="50" cy="52" r="24.5" fill="${c}" stroke="${INK}" stroke-width="2.4"/>`+S('M28 47 Q38 36 49 45 Q45 59 30 56Z','#111',2)+S('M72 47 Q62 36 51 45 Q55 59 70 56Z','#111',2)+S('M33 48 Q38 42 45 46 Q42 53 34 52Z','#fff',1.6)+S('M67 48 Q62 42 55 46 Q58 53 66 52Z','#fff',1.6);return r},
 capuz_morcego:c=>['',S('M23 62 Q22 24 50 23 Q78 24 77 62 L68 62 Q67 47 50 47 Q33 47 32 62Z',c)+S('M30 31 L31 9 L41 26Z',c)+S('M70 31 L69 9 L59 26Z',c)+S('M34 52 L46 50 L44 55Z','#fff',1.6)+S('M66 52 L54 50 L56 55Z','#fff',1.6),{hair:1,face:1}],
 chapeu_bruxo:c=>['',S('M33 36 L58 1 L52 16 L68 36Z',c)+S('M16 40 Q50 30 84 40 Q50 46 16 40Z',c)],
 chapeu_palha:c=>['',S('M15 37 Q50 28 85 37 Q50 45 15 37Z','#e2b45b')+S('M32 36 Q34 13 50 13 Q66 13 68 36Z','#e2b45b')+`<rect x="33" y="28" width="34" height="5" fill="${c==='#000000'?'#a63d40':c}"/>`],
 fone:c=>['',`<path d="M26 52 Q26 25 50 25 Q74 25 74 52" fill="none" stroke="${INK}" stroke-width="4.5"/>`+S('M20 47 h9 v15 h-9Z',c,2)+S('M71 47 h9 v15 h-9Z',c,2)],
 tiara:c=>['',`<path d="M28 40 Q50 27 72 40" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M28 40 Q50 27 72 40" fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round"/>`],
 turbante:c=>['',S('M23 47 Q20 21 50 18 Q80 21 77 47 Q65 38 50 40 Q35 38 23 47Z',c)+`<path d="M28 38 Q48 24 70 30 M30 30 Q50 20 66 24" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".5"/>`,{hair:1}],
 deerstalker:c=>['',S('M27 43 Q27 21 50 21 Q73 21 73 43Z',c)+S('M19 44 Q25 37 33 42Z',c,2)+S('M67 42 Q75 37 81 44Z',c,2)+`<path d="M35 26 V42 M50 21 V42 M65 26 V42 M28 33 H72" stroke="${INK}" stroke-width="1.2" opacity=".45"/>`,{hair:1}],
 chapeu_coco:c=>['',S('M30 34 Q30 12 50 12 Q70 12 70 34Z',c)+S('M22 35 Q50 27 78 35 Q50 41 22 35Z',c)],
 papakha:c=>['',S('M26 43 L28 14 Q50 7 72 14 L74 43 Q50 36 26 43Z',c)+`<path d="M33 22 l3 4 M42 17 l2 5 M52 16 l1 5 M61 18 l1 5 M68 24 l-2 4 M36 34 l2 4 M48 30 l1 4 M60 32 l1 4" stroke="${INK}" stroke-width="1.4" opacity=".4" stroke-linecap="round"/>`,{hair:1}],
 capuz_monge:c=>[S('M15 101 L19 52 Q19 15 50 15 Q81 15 81 52 L85 101Z',c),`<path d="M25 66 Q22 30 50 28 Q78 30 75 66" fill="none" stroke="${INK}" stroke-width="2.4"/>`],
 mitra:c=>['',S('M31 37 L33 9 Q42 3 50 15 Q58 3 67 9 L69 37 Q50 31 31 37Z',c)+`<path d="M50 15 V34 M44 24 H56" stroke="#c9a227" stroke-width="2.6"/>`,{hair:1}],
 capuz_antenas:c=>['',`<path d="M40 25 L33 4 M60 25 L67 4" stroke="${INK}" stroke-width="2.4"/><circle cx="33" cy="5" r="4.5" fill="#ffd400" stroke="${INK}" stroke-width="2"/><circle cx="67" cy="5" r="4.5" fill="#ffd400" stroke="${INK}" stroke-width="2"/>`+S('M24 58 Q22 24 50 23 Q78 24 76 58 L70 58 Q68 40 50 40 Q32 40 30 58Z',c),{hair:1}],
 elmo_robo:c=>['',S('M24 60 Q22 22 50 21 Q78 22 76 60 L76 74 Q50 82 24 74Z',c)+S('M45 21 L50 8 L55 21Z',c,2)+S('M20 40 L24 30 L26 52Z',c,2)+S('M80 40 L76 30 L74 52Z',c,2)+
   S('M33 44 H67 V56 H33Z','#7fd3ff',2)+S('M36 60 H64 V76 Q50 80 36 76Z','#b9bec6',2)+`<path d="M42 63 V74 M50 63 V76 M58 63 V74" stroke="${INK}" stroke-width="1.8"/>`,{hair:1,face:1,beard:1}]
};
const hashName=n=>[...String(n)].reduce((a,ch)=>(a*31+ch.charCodeAt(0))>>>0,7);
const pickIdx=(h,arr)=>arr[h%arr.length];
function sorteado(nome){
  const h=hashName(nome);
  return{pele:h%6,cabelo:pickIdx(h>>>3,['curto','careca','medio_liso','cacheado_curto','franja','topete','longo_liso','raspado']),corCabelo:pickIdx(h>>>7,['preto','castanho','loiro','castanho','grisalho','preto']),
    barba:pickIdx(h>>>10,['nenhuma','nenhuma','barba_curta','bigode','nenhuma','cavanhaque']),oculos:pickIdx(h>>>13,['nenhum','nenhum','nenhum','redondo','nenhum','quadrado']),acessorio:'nenhum',corAcessorio:'#000000',camisa:pickIdx(h>>>16,['#7a1c40','#1d3a6b','#1f5e47','#c96f2b','#2b2b2b','#5b2a86'])};
}
// visual antigo (números, vindo da IA) -> traços novos
function doAntigo(v){
  if(!v||typeof v.cabelo!=='number')return null;
  const cab=['careca','curto','longo_liso','topete','black_power','coque'][v.cabelo]||'curto';
  return{pele:Number.isInteger(v.pele)?v.pele:1,cabelo:cab,corCabelo:'castanho',barba:v.barba?'barba_cheia':'nenhuma',oculos:v.oculos?'redondo':'nenhum',acessorio:'nenhum',corAcessorio:'#000000',camisa:'#7a1c40'};
}
function caricaturaV(v,tam=96,estado='neutro'){
  const pele=typeof v.pele==='string'?(PELE_X[v.pele]||PELE[1]):PELE[Math.max(0,Math.min(5,v.pele|0))];
  const cc=CAB[v.corCabelo]||CAB.castanho,ca=v.corAcessorio||'#333';
  const [hb,hf]=(HAIR[v.cabelo]||HAIR.curto)(cc);
  const [ab,af,cobre={}]=(ACC[v.acessorio]||ACC.nenhum)(ca);
  const camisa=v.camisa==='pele'?pele:(v.camisa||'#7a1c40');
  const peito=v.camisa==='pele'?`<path d="M38 88 Q44 92 50 88 Q56 92 62 88" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".5"/>`:`<path d="M40 79 L50 89 L60 79" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.4"/>`;
  const sobr=(cobre.hair||v.cabelo==='careca')?INK:cc;
  const brows=`<path d="M35 44 Q40 41 46 43 M65 44 Q60 41 54 43" stroke="${sobr}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  const boca=estado==='feliz'?`<path d="M41 63 Q50 76 59 63 Z" fill="#fff" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`:estado==='triste'?`<path d="M43 68 Q50 61 57 68" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`:`<path d="M43 65 Q50 70 57 65" fill="none" stroke="${['barba_cheia','barba_longa','barba_curta'].includes(v.barba)?'#fff3dc':INK}" stroke-width="2.6" stroke-linecap="round"/>`;
  const rosto=`<circle cx="26" cy="54" r="5.5" fill="${pele}" stroke="${INK}" stroke-width="2.4"/><circle cx="74" cy="54" r="5.5" fill="${pele}" stroke="${INK}" stroke-width="2.4"/><circle cx="50" cy="52" r="24" fill="${pele}" stroke="${INK}" stroke-width="2.4"/><path d="M68 40 Q77 56 62 73 Q72 58 68 40Z" fill="rgba(0,0,0,.12)"/><circle cx="37" cy="62" r="4" fill="rgba(255,90,110,.25)"/><circle cx="63" cy="62" r="4" fill="rgba(255,90,110,.25)"/>`;
  return `<svg class="car" width="${tam}" height="${tam}" viewBox="0 0 100 100" aria-hidden="true">${ab}${cobre.hair?'':hb}`+
    `<path d="M13 101 Q13 77 50 77 Q87 77 87 101 Z" fill="${camisa}" stroke="${INK}" stroke-width="2.4"/>${peito}${rosto}`+
    `${cobre.beard?'':(BARBA[v.barba]||BARBA.nenhuma)(cc)}${cobre.hair?'':hf}${cobre.face?'':(OCULOS[v.oculos]||OCULOS.nenhum)()+brows+boca}${af}</svg>`;
}
window.caricaturaV=caricaturaV;
window.caricatura=(nome,tam,estado,visualIA)=>caricaturaV((window.VISUAIS||{})[nome]||doAntigo(visualIA)||(visualIA&&visualIA.cabelo?visualIA:null)||sorteado(nome),tam,estado);
})();
