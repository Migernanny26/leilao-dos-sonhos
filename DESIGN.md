# DESIGN.md · Leilão dos Sonhos

Fonte única das decisões visuais. Se o CSS divergir daqui, este arquivo vale.

## Contexto
- **O que é:** jogo de festa para o fim de uma call de voz. Uma pessoa divide a tela; todos falam.
- **Para quem:** grupo de amigos, à noite, cansado, olhando uma tela compartilhada (legibilidade a distância importa mais que detalhe).
- **Ação principal de cada tela:** uma só, sempre dita no rodapé ("Agora: …").

## Palavras
- Adjetivos: elegante, noturno, de cassino, colecionável, divertido sem ser infantil.
- Essência: **leilão de cassino noturno**.
- Referências transpostas: Balatro (mesa escura, explosão só no momento-chave), cartas FIFA Ultimate e Panini (raridade pela moldura), interface da Supercell (botões que afundam).

## Sistema
- **Tipos:** Lilita One para títulos, números e placar; Nunito 400/700/800 para o resto.
- **Cores:** fundo `#120a10` liso; superfícies `#1c0f19`; vinho `#3a0d20 → #7a1c40`; dourado `#f2b33d` só para dinheiro, lance, líder e o atributo que mais pesa; creme `#fff1dc` no texto. Raridade: bronze, prata, ouro, lenda.
- **Cantos:** 14px nas superfícies, 10px em controles, pílula só em etiquetas.
- **Sombra:** uma abordagem (elevação escura); nada de brilho colorido.
- **Ícones:** grade 24, traço 2, pontas arredondadas, um desenho por atributo.
- **Movimento:** calmo no resto do tempo; impacto só em VENDIDO, gol, nocaute, virada do VAR e pódio. Respeita "reduzir movimento".

## Movimento de assinatura
A carta do nome leiloado entra levemente inclinada (como no Balatro) e endireita ao passar o mouse; no VENDIDO o carimbo bate, a tela treme e as moedas espirram.

## Imagens
- Nomes leiloados: foto da Wikipédia (miniatura, em cache no navegador) dentro da carta; sem foto, monograma na cor da raridade. Nada de mascote desenhado.
- Jogadores da call: escudo personalizável (formato, duas cores, padrão, símbolo, iniciais).

## Auditoria (slop checklist), 2026-11-08
Corrigido: brilho radial de fundo, listras do VAR, cantos de 24 a 30px iguais em tudo, bolinhas piscando sem dado ao vivo, letreiro rolando, bonecos SVG no lugar de imagem real.
Fica de olho: nome repetido na carta e no título do leilão; travessões em textos de narração.
