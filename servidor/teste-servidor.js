// Testes do servidor da sala: node servidor/teste-servidor.js
const WebSocket = require('ws');
const { criarServidor } = require('./server');

const falhas = []; let total = 0;
const ok = (c, m) => { total++; if (!c) { falhas.push(m); console.log('FALHOU:', m); } };
const espera = ms => new Promise(r => setTimeout(r, ms));

function cliente(porta) {
  const ws = new WebSocket(`ws://localhost:${porta}/ws`);
  const caixa = [];
  ws.on('message', d => caixa.push(JSON.parse(d.toString())));
  const pega = async (pred, ms = 1500) => { const fim = Date.now() + ms; while (Date.now() < fim) { const i = caixa.findIndex(pred); if (i >= 0) return caixa.splice(i, 1)[0]; await espera(15); } return null; };
  const manda = o => ws.send(JSON.stringify(o));
  return new Promise(r => ws.on('open', () => r({ ws, caixa, pega, manda })));
}

(async () => {
  const pedidosIA = [];
  const { servidor } = criarServidor({ chamarIA: async p => { pedidosIA.push(p); return '{"ok":true}'; } });
  await new Promise(r => servidor.listen(0, r));
  const porta = servidor.address().port;
  const base = `http://localhost:${porta}`;
  try {
    // arquivos e saúde
    const html = await fetch(base + '/'); ok(html.status === 200 && (await html.text()).includes('Leilão dos Sonhos'), 'serve o index.html');
    ok((await fetch(base + '/../package.json')).status === 404, 'não serve arquivos fora da lista');
    const saude = await (await fetch(base + '/saude')).json(); ok(saude.ok && saude.ia === true, 'saúde informa IA ligada');

    // criar sala e entrar
    const host = await cliente(porta); host.manda({ t: 'criar' });
    const criada = await host.pega(m => m.t === 'criada'); ok(criada && /^[A-Z]{4}$/.test(criada.sala), 'cria sala com código de 4 letras');
    const a = await cliente(porta); a.manda({ t: 'entrar', sala: criada.sala.toLowerCase(), nome: 'Ana' });
    const entrouA = await a.pega(m => m.t === 'entrou'); ok(entrouA && /^[a-f0-9]{16}$/.test(entrouA.id), 'jogador entra (código sem diferença de maiúscula)');
    const pres = await host.pega(m => m.t === 'presenca' && m.jogadores.some(j => j.nome === 'Ana' && j.on)); ok(!!pres, 'anfitrião vê a presença');
    const nada = await cliente(porta); nada.manda({ t: 'entrar', sala: 'ZZZZ', nome: 'X' }); ok(!!(await nada.pega(m => m.t === 'erro')), 'recusa sala inexistente');

    // repasse
    host.manda({ t: 'estado', dados: { cena: 'leilao', html: '<p>oi</p>' } });
    const est = await a.pega(m => m.t === 'estado'); ok(est && est.dados.cena === 'leilao', 'estado chega ao jogador');
    host.manda({ t: 'parcial', dados: { lance: 5 } }); ok(!!(await a.pega(m => m.t === 'parcial' && m.dados.lance === 5)), 'parcial chega ao jogador');
    a.manda({ t: 'estado', dados: { cena: 'hack' } }); ok(!!(await a.pega(m => m.t === 'erro')), 'jogador não pode enviar estado');
    a.manda({ t: 'acao', dados: { a: 'bump', i: 0, d: 5 } });
    const ac = await host.pega(m => m.t === 'acao'); ok(ac && ac.de === entrouA.id && ac.nome === 'Ana' && ac.dados.a === 'bump', 'ação chega só ao anfitrião, com id carimbado');

    // quem chega atrasado recebe o último retrato; reconexão mantém o id
    const b = await cliente(porta); b.manda({ t: 'entrar', sala: criada.sala, nome: 'Bia' });
    ok(!!(await b.pega(m => m.t === 'estado' && m.dados.cena === 'leilao')), 'atrasado recebe o último estado');
    a.ws.close(); await espera(100);
    const a2 = await cliente(porta); a2.manda({ t: 'entrar', sala: criada.sala, id: entrouA.id });
    const re = await a2.pega(m => m.t === 'entrou'); ok(re && re.id === entrouA.id, 'reconexão mantém o mesmo id');

    // anfitrião retoma com o token; token errado é recusado
    const h2 = await cliente(porta); h2.manda({ t: 'retomar', sala: criada.sala, token: 'x' }); ok(!!(await h2.pega(m => m.t === 'erro')), 'token errado recusado');
    h2.manda({ t: 'retomar', sala: criada.sala, token: criada.token }); ok(!!(await h2.pega(m => m.t === 'retomada')), 'anfitrião retoma com o token');

    // IA só para o anfitrião, modelo restrito
    const r1 = await fetch(base + '/ia', { method: 'POST', body: JSON.stringify({ sala: criada.sala, token: 'x', prompt: 'oi' }) }); ok(r1.status === 403, 'IA recusa quem não é anfitrião');
    const r2 = await fetch(base + '/ia', { method: 'POST', body: JSON.stringify({ sala: criada.sala, token: criada.token, prompt: 'oi', model: 'outro', max_tokens: 99999 }) });
    const j2 = await r2.json(); ok(r2.status === 200 && j2.texto === '{"ok":true}', 'IA responde ao anfitrião');
    ok(pedidosIA[0] && pedidosIA[0].model === 'claude-haiku-5-5' && pedidosIA[0].max_tokens === 6000, 'modelo e tamanho limitados');

    // limites
    const c = await cliente(porta); c.manda({ t: 'entrar', sala: criada.sala, nome: 'Caio' }); await c.pega(m => m.t === 'entrou');
    for (let i = 0; i < 40; i++) c.manda({ t: 'acao', dados: { i } });
    ok(!!(await c.pega(m => m.t === 'erro' && /demais/.test(m.erro))), 'limita mensagens por segundo');
    const fechou = new Promise(r => c.ws.on('close', () => r(true)));
    c.ws.send('x'.repeat(600 * 1024)); ok(await Promise.race([fechou, espera(1500).then(() => false)]), 'derruba mensagem grande demais');
    for (const cl of [host, a2, b, nada, h2]) cl.ws.close();
  } catch (e) { ok(false, 'erro inesperado: ' + e.message); }
  servidor.close();
  console.log(falhas.length ? `${falhas.length} de ${total} testes falharam` : `Tudo certo: ${total} testes passaram`);
  process.exit(falhas.length ? 1 : 0);
})();
