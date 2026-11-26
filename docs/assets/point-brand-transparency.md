# Logo PH — transparência corrigida

Atualização de 24/11/2026. Correção da aplicação inicial que utilizava imagens com fundo preto.

Logo completa e ícone receberam remoção de fundo com a ferramenta integrada imagegen e canal alpha real. Mantidos PH, coroa, hambúrguer, nome e slogan. Áreas vazias, inclusive dentro do aro, são transparentes; contornos escuros pertencentes à arte foram preservados para leitura sobre fundo claro. Não há retângulo, disco opaco, fundo CSS ou sombra de cartão.

## Arquivos vigentes

- `point-delivery/public/images/brand/point-logo-v2.webp`: 800 × 450, RGBA; fonte com 62% dos pixels totalmente transparentes.
- `point-delivery/public/images/brand/point-icon-v2.webp`: 512 × 512, RGBA; fonte com 70% dos pixels totalmente transparentes.
- Ícones derivados `ph-192-v2.png`, `ph-512-v2.png`, `ph-maskable-512-v2.png`, `ph-apple-touch-v2.png`, `ph-favicon-v2.png` e alias de compatibilidade `point-192.png`, reproduzíveis pelo script existente.
- PNGs originais sem fundo para download em `output/branding/site-assets-ph-v2/logo-sem-fundo.png` e `icon-sem-fundo.png`.

BrandLogo e metadados usam URLs v2 para renovar o cache. CSS da logo, login, painel e seção de instalação usa fundo transparente; sombra do antigo cartão removida. Verificação de alpha confirmou mínimo 0 e máximo 255 nos WebPs. Conferência no navegador em desktop e celular comprovou fundo transparente, ausência de sombra e ausência de overflow.

## Prompts utilizados

### Logo completa

Use case: background-extraction. EDIT THE ATTACHED EXACT LOGO, only remove its background. This is a production cutout for placement directly on a white website header.
Preserve the exact PH initials, gold crown, realistic burger, orange circular outline, white italic POINT, small script do, orange-gold script Hambúrguer and slogan O melhor da cidade!, including all proportions, colors, spelling, positions and the existing fine dark outlines belonging to the lettering. No redesign, no relettering, no new details.
Remove ALL black BACKDROP, outside AND INSIDE the orange circular frame, in the open spaces between the letters and artwork, in letter counters, and around the slogan. Remove the background smoke and broad neon haze as well. The orange ring is just a thin line, NOT a filled black disk. Retain only the actual artwork and a small precise dark keyline/shadow that belongs directly to letter edges so the white H, POINT and slogan remain readable on white. Keep true dark ink and food details; do not erase the patty or the lettering outlines. There must be NO opaque black rectangle, NO opaque black circle, NO black ribbon panel, NO white background, NO checkerboard painted into the image. Actual transparent alpha in every background/open area. Crisp clean anti-aliased edges, no black fringe, no foggy outer halo. Keep the complete logo entirely in the canvas with comfortable transparent padding, same landscape composition. Output only the isolated full logo on genuine transparency.

### Ícone

Use case: background-extraction. Remove only the black backdrop from this exact square PH crown/burger icon. Preserve the orange P, silver/white H, golden crown, realistic burger, orange ring and their existing precise dark artwork outlines without redesigning anything. Every BACKGROUND area, both outside the orange ring AND INSIDE the ring between the elements, must become genuine transparent alpha. No black rectangle or filled black disk, no opaque tile, no white background, no painted checkerboard. Preserve the dark burger meat and intentional thin black letter outlines so the H reads on white. Remove broad glow/smoke/background haze and leave crisp anti-aliased edges. Exact same symbol and colors, no added text, no other elements. Centered square icon with transparent safe padding and whole crown/ring inside the frame. Output only the original emblem isolated on real transparency.


## Destaque no cabeçalho — 24/11/2026

A apresentação foi ampliada sem alterar a imagem transparente. No computador, a logo ocupa 260 px em um cabeçalho de 164 px. Na faixa de 761 a1050 px, ocupa 216 px para preservar a navegação. No celular fica centralizada, com largura entre220 e270 px; em390 px ocupa aproximadamente250 px. O carrinho fica no canto superior direito com alvo mínimo44 px, mantendo o texto Meu pedido disponível para leitores de tela. Conferidas larguras320,390,820 e1366, sem overflow horizontal. Fundo e sombra de cartão continuam ausentes.

## Cabeçalho compacto — etapa anterior de 24/11/2026

Por nova solicitação do usuário, o cabeçalho agora usa a variante `icon` de BrandLogo: PH, coroa e hambúrguer, sem texto e com alpha. Reaproveitado o ícone já aprovado, sem nova geração nem alteração da arte. A logo completa permanece no rodapé, login e acompanhamento. Cabeçalho de104px/ícone88px no computador,96px/80px no tablet e84px/72px no celular; telas até350px usam80px/68px. No celular o símbolo fica centralizado e o carrinho alinhado verticalmente no canto direito, preservando o nome acessível e alvo44px. PNG disponível em `output/branding/site-assets-ph-v2/icon-sem-fundo.png`.

## Ícone à esquerda com nome — versão mobile vigente em 24/11/2026

O ícone transparente fica à esquerda com Point e do Hambúrguer ao lado; o carrinho permanece à direita em fluxo normal. No mobile o ícone ocupa96px em cabeçalho104px; até350px usa88px em96px. Nome em duas linhas com Poppins, sem alterar a arte. O nome visual tem aria-hidden, pois o link já possui o rótulo acessível completo. Tablet e computador mantêm a versão só com o ícone. Conferidos320/390/1366px, sem sobreposição ou overflow horizontal.

## Nome em Poppins na navbar — versão vigente em 24/11/2026

O cabeçalho mantém o ícone PH transparente à esquerda e exibe o nome como texto Poppins, a mesma fonte do sistema. Point do e Hambúrguer usam duas linhas, ambas grandes e em peso700; tamanho27px no desktop,23px no tablet/mobile e20px até350px. O nome aparece no computador e no celular. Carrinho à direita, sem sobreposição. O nome visual usa aria-hidden, pois o link já tem o rótulo acessível completo. Nenhuma alteração nas imagens aprovadas da logo ou nos ícones.

Conferidos320,390,768 e1366px: sem overflow horizontal e sem sobreposição; font-family computada Poppins, sans-serif. Capturas work/navbar-poppins-mobile.jpg e navbar-poppins-desktop.jpg. A arte tipográfica gerada para a alternativa anterior não é consumida pelo site. Alteração local, publicação pendente.
## Tipografia Lilita One na navbar — vigente em 24/11/2026

O nome da marca usa Lilita One, de formas encorpadas e arredondadas, em duas linhas: Point do em marrom e Hambúrguer em laranja #cf4e17. Tamanho base32px no desktop,28px no tablet/mobile e24px até350px; primeira linha em0.78em. Ícone PH transparente, carrinho e nome acessível do link preservados. Corpo e demais módulos permanecem em Poppins.

Fonte servida localmente em point-delivery/public/fonts/lilita-one/lilita-one-regular.ttf (28.092bytes), sem requisições a provedores externos ao navegar. Origem oficial: https://github.com/google/fonts/tree/main/ofl/lilitaone. Licença SIL Open Font License incluída como OFL.txt na mesma pasta. @font-face usa font-display swap.

Navegador confirmou carregamento real da fonte e ausência de overflow/sobreposição em320/390/768/1366px, ícone carregado e console sem erros. Capturas work/navbar-lilita-mobile.jpg e navbar-lilita-desktop.jpg. Alteração local, publicação pendente.
