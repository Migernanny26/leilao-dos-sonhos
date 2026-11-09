// Servidor da sala online do Leilão dos Sonhos.
// Serve os arquivos do jogo, cria salas, repassa mensagens entre o anfitrião e os jogadores
// e faz a ponte com a IA (a chave da Anthropic fica só aqui, na variável ANTHROPIC_API_KEY).
// Não roda regra de jogo: quem decide é o navegador do anfitrião.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const RAIZ = path.join(__dirname, '..');
const ARQUIVOS = { '/': 'index.html', '/index.html': 'index.html', '/visuais.js': 'visuais.js', '/teste.js': 'teste.js' };
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MAX_JOGADORES = 8;
const MAX_MSG = 512 * 1024;         // bytes por mensagem
const MAX_ESTADO = 400 * 1024;      // retrato guardado por sala
const MSG_POR_SEG = 25;             // por conexão
const SALA_PARADA_MS = 2 * 60 * 60 * 1000;
const IA_POR_SALA = 60;             // chamadas de IA por sala a cada 2 h
const IA_MODELOS = ['claude-haiku-5-5', 'claude-sonnet-5-5'];
const IA_MAX_TOKENS = 6000;
const IA_MAX_PROMPT = 120 * 1024;

function criarServidor({ chave = process.env.ANTHROPIC_API_KEY || '', chamarIA } = {}) {
  const salas = new Map(); // código -> sala
  const novoCodigo = () => {
    for (let t = 0; t < 100; t++) {
      const c = Array.from(crypto.randomBytes(4), b => LETRAS[b % LETRAS.length]).join('');
      if (!salas.has(c)) return c;
    }
    throw new Error('sem códigos livres');
  };
  const iaPadrao = async ({ model, max_tokens, prompt }) => {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': chave, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens, messages: [{ role: 'user', content: prompt }] }),
      signal: AbortSignal.timeout(90000),
    });
    if (!r.ok) throw new Error('IA respondeu ' + r.status);
    const j = await r.json();
    return (j.content || []).map(c => c.text || '').join('');
  };
  const ia = chamarIA || iaPadrao;

  // ---------- HTTP ----------
  const lerCorpo = (req, limite) => new Promise((ok, falha) => {
    let n = 0; const partes = [];
    req.on('data', d => { n += d.length; if (n > limite) { falha(new Error('grande demais')); req.destroy(); } else partes.push(d); });
    req.on('end', () => ok(Buffer.concat(partes).toString('utf8')));
    req.on('error', falha);
  });
  const responder = (res, cod, obj) => { res.writeHead(cod, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); };

  const servidor = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('referrer-policy', 'no-referrer');
    if (req.method === 'GET' && url.pathname === '/saude') return responder(res, 200, { ok: true, ia: !!(chave || chamarIA) });
    if (req.method === 'POST' && url.pathname === '/ia') {
      try {
        const corpo = JSON.parse(await lerCorpo(req, IA_MAX_PROMPT + 4096));
        const sala = salas.get(String(corpo.sala || ''));
        if (!sala || corpo.token !== sala.token) return responder(res, 403, { erro: 'só o anfitrião da sala usa a IA' });
        if (!(chave || chamarIA)) return responder(res, 503, { erro: 'IA não configurada no servidor' });
        const agora = Date.now();
        if (agora - sala.ia.inicio > SALA_PARADA_MS) sala.ia = { n: 0, inicio: agora };
        if (sala.ia.n >= IA_POR_SALA) return responder(res, 429, { erro: 'limite de IA da sala atingido' });
        const model = IA_MODELOS.includes(corpo.model) ? corpo.model : IA_MODELOS[0];
        const max_tokens = Math.max(1, Math.min(IA_MAX_TOKENS, Number(corpo.max_tokens) || 1000));
        const prompt = String(corpo.prompt || '');
        if (!prompt || prompt.length > IA_MAX_PROMPT) return responder(res, 400, { erro: 'pedido inválido' });
        sala.ia.n++; sala.ultimo = agora;
        const texto = await ia({ model, max_tokens, prompt });
        return responder(res, 200, { texto });
      } catch (e) {
        return responder(res, 502, { erro: String(e.message || e).slice(0, 200) });
      }
    }
    if (req.method === 'GET' && ARQUIVOS[url.pathname]) {
      const arq = path.join(RAIZ, ARQUIVOS[url.pathname]);
      return fs.readFile(arq, (err, dados) => {
        if (err) { res.writeHead(404); return res.end('não encontrado'); }
        res.writeHead(200, { 'content-type': TIPOS[path.extname(arq)] || 'application/octet-stream', 'cache-control': 'no-cache' });
        res.end(dados);
      });
    }
    res.writeHead(404); res.end('não encontrado');
  });

  // ---------- WebSocket ----------
  const wss = new WebSocketServer({ server: servidor, path: '/ws', maxPayload: MAX_MSG });
  const enviar = (ws, obj) => { if (ws && ws.readyState === 1) ws.send(typeof obj === 'string' ? obj : JSON.stringify(obj)); };
  const presenca = sala => {
    const msg = { t: 'presenca', host: !!sala.host, jogadores: [...sala.jogadores.entries()].map(([id, j]) => ({ id, nome: j.nome, on: !!j.ws })) };
    enviar(sala.host, msg); for (const j of sala.jogadores.values()) enviar(j.ws, msg);
  };
  const nomeOk = n => String(n || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 24);

  wss.on('connection', ws => {
    ws.cota = { n: 0, t: Date.now() };
    ws.on('error', () => { try { ws.terminate(); } catch {} }); // mensagem grande demais ou quebrada: fecha só esta conexão
    ws.on('message', bruto => {
      const agora = Date.now();
      if (agora - ws.cota.t > 1000) ws.cota = { n: 0, t: agora };
      if (++ws.cota.n > MSG_POR_SEG) return enviar(ws, { t: 'erro', erro: 'mensagens demais' });
      let m; try { m = JSON.parse(bruto.toString('utf8')); } catch { return enviar(ws, { t: 'erro', erro: 'mensagem inválida' }); }
      if (!m || typeof m !== 'object') return;
      const sala = ws.sala && salas.get(ws.sala);
      if (sala) sala.ultimo = agora;
      switch (m.t) {
        case 'criar': {
          if (ws.sala) return;
          const codigo = novoCodigo(), token = crypto.randomBytes(16).toString('hex');
          const s = { codigo, token, host: ws, jogadores: new Map(), estado: null, ultimo: agora, ia: { n: 0, inicio: agora } };
          salas.set(codigo, s); ws.sala = codigo; ws.papel = 'host';
          enviar(ws, { t: 'criada', sala: codigo, token });
          return presenca(s);
        }
        case 'retomar': { // anfitrião que recarregou a página
          const s = salas.get(String(m.sala || ''));
          if (!s || m.token !== s.token) return enviar(ws, { t: 'erro', erro: 'sala ou token inválido' });
          if (s.host && s.host !== ws) try { s.host.close(); } catch {}
          s.host = ws; ws.sala = s.codigo; ws.papel = 'host';
          enviar(ws, { t: 'retomada', sala: s.codigo });
          return presenca(s);
        }
        case 'entrar': {
          const s = salas.get(String(m.sala || '').toUpperCase());
          if (!s) return enviar(ws, { t: 'erro', erro: 'sala não encontrada' });
          let id = typeof m.id === 'string' && /^[a-f0-9]{16}$/.test(m.id) && s.jogadores.has(m.id) ? m.id : null;
          if (!id) {
            if (s.jogadores.size >= MAX_JOGADORES) return enviar(ws, { t: 'erro', erro: 'sala cheia' });
            id = crypto.randomBytes(8).toString('hex');
            s.jogadores.set(id, { nome: nomeOk(m.nome) || 'Jogador', ws: null });
          }
          const j = s.jogadores.get(id);
          if (j.ws && j.ws !== ws) try { j.ws.close(); } catch {}
          j.ws = ws; if (m.nome) j.nome = nomeOk(m.nome) || j.nome;
          ws.sala = s.codigo; ws.papel = 'jogador'; ws.id = id;
          enviar(ws, { t: 'entrou', sala: s.codigo, id });
          if (s.estado) enviar(ws, s.estado);
          return presenca(s);
        }
        case 'estado':
        case 'parcial': { // só o anfitrião fala para todos
          if (!sala || ws.papel !== 'host' || sala.host !== ws) return enviar(ws, { t: 'erro', erro: 'só o anfitrião envia o estado' });
          const texto = JSON.stringify({ t: m.t, dados: m.dados });
          if (m.t === 'estado') { if (texto.length > MAX_ESTADO) return enviar(ws, { t: 'erro', erro: 'estado grande demais' }); sala.estado = texto; }
          for (const j of sala.jogadores.values()) enviar(j.ws, texto);
          return;
        }
        case 'acao': { // jogador pede algo; só o anfitrião recebe, com o id carimbado aqui
          if (!sala || ws.papel !== 'jogador') return;
          const j = sala.jogadores.get(ws.id);
          return enviar(sala.host, { t: 'acao', de: ws.id, nome: j ? j.nome : '', dados: m.dados });
        }
        case 'renomear': {
          if (!sala || ws.papel !== 'jogador') return;
          const j = sala.jogadores.get(ws.id); if (j) j.nome = nomeOk(m.nome) || j.nome;
          return presenca(sala);
        }
        default:
          return enviar(ws, { t: 'erro', erro: 'tipo desconhecido' });
      }
    });
    ws.on('close', () => {
      const sala = ws.sala && salas.get(ws.sala);
      if (!sala) return;
      if (sala.host === ws) sala.host = null;
      if (ws.id && sala.jogadores.has(ws.id) && sala.jogadores.get(ws.id).ws === ws) sala.jogadores.get(ws.id).ws = null;
      presenca(sala);
    });
  });

  const faxina = setInterval(() => {
    const agora = Date.now();
    for (const [c, s] of salas) if (agora - s.ultimo > SALA_PARADA_MS && !s.host && ![...s.jogadores.values()].some(j => j.ws)) salas.delete(c);
  }, 10 * 60 * 1000);
  faxina.unref();
  servidor.on('close', () => clearInterval(faxina));

  return { servidor, wss, salas };
}

module.exports = { criarServidor };

if (require.main === module) {
  const porta = Number(process.env.PORT) || 8780;
  const { servidor } = criarServidor();
  servidor.listen(porta, () => console.log(`Leilão dos Sonhos: http://localhost:${porta}  (IA ${process.env.ANTHROPIC_API_KEY ? 'ligada' : 'desligada'})`));
}
