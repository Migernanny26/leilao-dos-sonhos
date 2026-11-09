# Como publicar a sala online

Resultado: um link tipo `https://leilao-dos-sonhos.onrender.com` que você abre, clica em **Criar sala online** e manda o link da sala para os amigos. Ninguém precisa de conta em nada, só você (para publicar).

## Antes: testar no seu computador
```
cd "D:\projetos mig\leilao"
npm install
npm start
```
Abra `http://localhost:8780`. Para simular um amigo, abra o link da sala em outra aba.
Isso só funciona na sua rede; para amigos de fora, siga os passos abaixo.

## 1. Subir o código para o GitHub
1. Crie uma conta em github.com (se não tiver) e um repositório novo, por exemplo `leilao-dos-sonhos` (pode ser privado).
2. Na pasta `leilao`, rode (troque `SEU-USUARIO`):
```
git remote add origin https://github.com/SEU-USUARIO/leilao-dos-sonhos.git
git push -u origin master
```

## 2. Criar o serviço no Render
1. Crie conta em render.com entrando com o GitHub.
2. **New → Web Service** e escolha o repositório.
3. Preencha:
   - Runtime: **Node**
   - Build command: `npm install`
   - Start command: `npm start`
   - Plano: **Free**
4. Em **Environment**, adicione a variável `ANTHROPIC_API_KEY` com a sua chave (só se quiser a IA na sala; sem ela o jogo usa os nomes prontos e o narrador local).
5. Clique em **Create Web Service** e espere o link aparecer.

## 3. Proteja seu bolso
- No console da Anthropic (console.anthropic.com → Limits), defina um **limite de gasto mensal** baixo. A chave fica só no servidor, mas o limite é a garantia.
- O servidor já limita: só o anfitrião da sala usa a IA, no máximo 60 chamadas por sala a cada 2 horas.

## Bom saber
- No plano gratuito o servidor **dorme** depois de 15 min sem uso. O primeiro acesso leva cerca de 1 minuto para acordar: abra o link uns minutos antes da call.
- Quem recarrega a página volta para a cena atual. Se o **anfitrião** recarregar, a sala continua, mas a partida em andamento se perde (ele precisa começar a noite de novo).
- Cada atualização que você fizer no código: `git push`, e o Render publica sozinho.
