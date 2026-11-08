// Teste automático do Leilão dos Sonhos.
// Como usar: abra index.html?teste no navegador (sem chave de API). Leva cerca de 1 minuto.
// Ele confere o motor e joga uma noite curta sozinho. No fim mostra uma caixa verde (tudo certo) ou vermelha.
(async()=>{
  const log=[],errs=[],ok=(c,m)=>{log.push([!!c,m]);if(!c)console.error('FALHOU: '+m)};
  window.addEventListener('error',e=>errs.push(e.message));
  const W8=async(f,n=200)=>{for(let i=0;i<n;i++){if(f())return true;await sleep(100)}return false};
  const cena=()=>$('#tv').dataset.scene;
  try{
    // 1. Motor da liga, em todos os modos e com 2, 3 e 4 times
    for(const mid of Object.keys(MODES)){
      S.modes=[mid];S.round=0;W=MODES[mid].crit[0][2];
      const pool=fallbackPool(mid),mt=MODES[mid].motor;
      for(const n of [2,3,4]){
        const ts=[...Array(n)].map((_,i)=>({name:'T'+i,ps:MODES[mid].slots.map(s=>pool.filter(p=>p.pos===s)[i])}));R={teams:ts};
        const z=ts.map(()=>0),a=league(ts,z,123,mt),b=league(ts,z,123,mt);
        ok(JSON.stringify(a)===JSON.stringify(b),`${mid}, ${n} times: mesma semente dá o mesmo resultado`);
        ok(a.matches.length===n*(n-1)/2,`${mid}, ${n} times: todos contra todos`);
        const p=oddsLeague(ts,mt).reduce((s,x)=>s+x.p,0);ok(Math.abs(p-1)<.03,`${mid}, ${n} times: chances somam 100%`);
        let pior=0;
        for(let s=1;s<60;s++){const l0=league(ts,z,s,mt),ci=l0.order[n-1],bo=ts.map(()=>0);bo[ci]=8;if(league(ts,bo,s,mt).order.indexOf(ci)>l0.order.indexOf(ci))pior++}
        ok(pior===0,`${mid}, ${n} times: o VAR nunca piora quem chamou`);
      }
    }
    W=[.25,.25,.25,.25];
    // 2. Uma noite de 2 rodadas com 3 jogadores, sem IA
    S.chars={};S.draft=null;setup();await W8(()=>$('#p0'));
    ['Ana','Bia','Caio',''].forEach((n,i)=>$('#p'+i).value=n);$('#nr').value='2';$('#key').value='';
    startNight();
    for(let r=0;r<2;r++){
      ok(await W8(()=>$('.open button')),`rodada ${r+1}: abertura com critério`);
      nextItem();await W8(()=>$('#bid'));
      ok(!$('#stage').innerText.includes('Pular'),`rodada ${r+1}: leilão sem botão Pular`);
      ok(!!$('.lotart svg'),`rodada ${r+1}: desenho do nome no leilão`);
      let k=0;
      while($('#bid')&&k<30){
        k++;const it=R.cur,ts=R.teams.map((t,i)=>i).filter(i=>canBid(R.teams[i],it));
        if(ts.length){const i=ts[k%ts.length];bid(i,Math.min(maxBid(R.teams[i]),Math.max(1,it.exp)));}
        R.t=1;tick();await sleep(1950);
      }
      ok(await W8(()=>cena()==='elenco'),`rodada ${r+1}: elencos fechados`);
      ok(R.teams.every(t=>t.slots.every(s=>s.pick)),`rodada ${r+1}: todo mundo com time completo`);
      ok(R.teams.every(t=>t.money>=0),`rodada ${r+1}: ninguém com saldo negativo`);
      drawBets();await W8(()=>TB&&$('#b_0_0'));lockBets();
      ok(await W8(()=>$('#sideA svg')),`rodada ${r+1}: animação dos confrontos`);
      skipAnim=true;
      ok(await W8(()=>$('.pod'),300),`rodada ${r+1}: veredito do juiz antes de qualquer defesa`);
      const elig=[...document.querySelectorAll('[id^=vc]')].map(b=>+b.id.slice(2));
      ok(!elig.includes(R.lg.order[0]),`rodada ${r+1}: o líder não pode chamar VAR`);
      ok(elig.every(i=>S.varLeft[R.teams[i].name]>0),`rodada ${r+1}: só quem tem VAR vê o botão`);
      if(r===0&&elig.length){
        const ci=elig[0];varCall(ci);closeVarWindow();await W8(()=>$('#vtext'));
        $('#vtext').value='teste';await reviewVar();await W8(()=>$('#stage').innerText.includes('Ótima'));
        await finishVar(6,[]);
        ok(S.varLeft[R.teams[ci].name]===0,'VAR gasto depois de usado');
        ok(R.varDelta&&[2,-1].includes(R.varDelta.delta),'VAR vale +2 ou −1');
        scoreRound();
      }else closeVarWindow();
      ok(await W8(()=>cena()==='placar'),`rodada ${r+1}: placar`);
      if(r===0){S.round++;startRound();}
    }
    const soma=Object.values(S.totals).reduce((a,b)=>a+b,0);
    ok(soma>0,'a noite somou pontos');
    endNight();ok(await W8(()=>$('#stage').innerText.includes('Fim da noite')),'fim da noite');
  }catch(e){ok(false,'erro inesperado: '+e.message)}
  ok(errs.length===0,'sem erros no console'+(errs.length?': '+errs.join(' | '):''));
  const falhas=log.filter(x=>!x[0]);
  const box=document.createElement('div');
  box.id='resultado-teste';
  box.style.cssText=`position:fixed;right:12px;bottom:12px;z-index:99;max-width:440px;max-height:70vh;overflow:auto;padding:14px 16px;border-radius:12px;font:15px/1.4 system-ui;color:#fff;background:${falhas.length?'#b3123a':'#1f7a4f'};box-shadow:0 6px 24px rgba(0,0,0,.4)`;
  box.innerHTML=`<b style="font-size:1.2em">${falhas.length?falhas.length+' teste(s) falharam':'Tudo certo: '+log.length+' testes passaram'}</b>`+
    (falhas.length?'<ul>'+falhas.map(x=>`<li>${esc(x[1])}</li>`).join('')+'</ul>':'');
  document.body.appendChild(box);
  window.resultadoTeste={total:log.length,falhas:falhas.map(x=>x[1])};
})();
