# Direção visual

Atualizada em 20/10/2026. Direção aplicada ao cliente e refinada conforme o feedback do usuário.

## Identidade

Laranja vivo como cor principal, fundo branco e creme claro, texto marrom muito escuro. A marca deve parecer uma hamburgueria acolhedora e atual. A imagem enviada contém o cardápio, sem logotipo isolado; não assumir que existe um arquivo de marca disponível.

| Uso | Cor proposta |
|---|---|
| Marca, destaques e ações principais | #F26724 |
| Ação do cliente com texto branco; hover #B83D0B | #CC470D |
| Superfície principal | #FFFFFF |
| Fundo suave | #FFF8F1 |
| Texto | #2D201A |
| Texto secundário | #75665B |

Tipografia aplicada: Bricolage Grotesque nos títulos e DM Sans no corpo, declaradas no CSS. Títulos expressivos, corpo simples e valores/quantidades legíveis em telas pequenas.

## Área do cliente

1. Cabeçalho compacto: marca, link “Monte seu burger”, acesso ao pedido e informação real de funcionamento quando configurada.
2. Hero de duas colunas no desktop: título “Do seu jeito. Até a última camada.”, uma frase curta e CTA “Montar meu burger”; fotografia do burger no outro lado. No celular, texto e visual ficam empilhados.
3. Montador: etapas “Pão”, “Ingredientes”, “Complementos” e “Revisão”. Lista agrupada por proteínas, queijos e extras; todos os ingredientes continuam acessíveis.
4. Prévia visual ao lado das escolhas no desktop, acompanhada de contagem e preço. No celular, visual compacto e resumo inferior que não encobre os controles.
5. Revisão e entrega: formulário curto com resumo explícito de valores antes da ação “Fazer pedido”.

Disponibilidade aparece no próprio cardápio: ingredientes, pães e complementos com estoque zero ou desativados mantêm o nome legível, recebem selo “Indisponível”, foto atenuada e bloqueio da adição. Retirar itens já selecionados continua permitido. Saldos menores que o limite por item mostram a quantidade disponível. O catálogo é atualizado a cada 5 segundos com a página visível, e ao retornar à aba ou recuperar conexão. A montagem e os dados de entrega são preservados; falta em um item já escolhido gera aviso antes da finalização. Reposição remove o selo e reativa a adição automaticamente.

Sem blocos longos de argumentos, depoimentos inventados, estatísticas comerciais, promoções ou promessas de prazo não fornecidas.

## Refinamento da hero e do pedido

Preservar a fotografia aprovada, a paleta laranja/branco e as fontes existentes. A hero usa título em três linhas, composição com mais respiro, fundo radial suave e selo de preço do catálogo. Textos curtos e sem legendas sobre a comida. Evitar animações contínuas; respeitar movimento reduzido.

O montador possui painel de ingredientes branco e prévia fotográfica em creme. Etapas em controle segmentado; categorias mostram estado pressionado; ingredientes escolhidos recebem borda laranja e check. Fotos, nomes e contadores possuem áreas próprias, evitando sobreposição. No celular, a prévia exibe preço e ação lado a lado, e as etapas permanecem acessíveis durante a rolagem do cardápio.

A revisão final utiliza duas colunas no desktop: resumo fotográfico do pedido e totais à esquerda, dados de entrega à direita. No celular, os blocos ficam empilhados. Campos de texto usam fonte de 16 px no celular; o botão de confirmar destaca o total. “Editar” conserva os dados preenchidos. O botão de fechar permanece acessível ao rolar o diálogo. Estilos do refinamento ficam em `app/storefront.css`, limitados ao contêiner `.storefront` para preservar o admin. Não alterar fotos ou a geometria da montagem para executar este refinamento.

## Hambúrguer em montagem

As camadas correspondem aos ingredientes reais e às quantidades, inclusive itens menos espessos, como milho, ervilha e molhos. Usar recortes fotográficos identificáveis, conforme correção explícita do usuário em 20/10/2026; recheios compartilham espaço dentro do pão e quantidades repetidas alteram o volume ou a distribuição.

Os ingredientes usam imagens fotorrealistas com fundo transparente e silhuetas completas, sem máscaras retangulares ou faixas cortadas. Carnes possuem fotos específicas para 1, 2, 3 e 4 unidades, com formas e texturas diferentes dentro da mesma foto. Queijo se acomoda nas carnes; extras compartilham espaço. Oclusões naturais são esperadas; as quantidades exatas continuam no resumo. Não reduzir a largura do lanche para acomodar uma torre, nem achatar as fotografias.

Referência fotográfica aprovada pelo usuário: o próprio burger da hero. O montador usa pão com crosta dourada brilhante, carne caramelizada com textura úmida, queijo amarelo derretido com pontas aparentes, bacon com brilho natural e alface sobre o tomate. Fotos principais coordenadas pelo mesmo referencial de luz/cor. Prompts, arquivos e procedência em FOTOS-SUCULENTAS.md. Nenhuma seleção é substituída por uma foto fixa de lanche pronto.

A montagem fica aberta durante a escolha: pão superior elevado e levemente inclinado. “Finalizar montagem” enquadra a prévia, fecha o pão em 850 ms e depois abre a revisão da entrega. Alternância manual “Aberto / Fechado” permite conferir o resultado. Alterar ingredientes reabre a composição. Durante o fechamento, edição e novos disparos ficam desabilitados. Timers são limpos na desmontagem.

Ao fechar, manter a borda do tomate visível sob o pão. Os recheios selecionados se acomodam com pequenos deslocamentos distintos: algumas bordas aparecem na frente, outras nas laterais. O pão permanece próximo ao recheio; não empilhar um andar por ingrediente. Pão e recheios compartilham os mesmos 850 ms de transição. A revisão da entrega usa a mesma composição fechada. Não acrescentar ingredientes ausentes da seleção para decorar a imagem.

Ordem visual fixa, de baixo para cima, independente dos cliques: pão inferior → carne → frango → calabresa → salsicha → queijo → cheddar → presunto → ovo → bacon → catupiry → cebola → batata palha → milho → ervilha → salada → pão superior. A ordem define o encaixe e a sobreposição dentro do mesmo espaço compacto; não cria um andar por item. Remover e adicionar novamente um ingrediente mantém a mesma composição final.

Milho e ervilha aparecem em porções fotográficas coesas e próximas, com a batata palha em uma porção rasa atrás dos grãos e sob a salada. Quantidades adicionais aumentam a densidade no mesmo espaço, sem ampliar os grãos nem formar uma torre. Sem carne ou frango, os complementos se apoiam na superfície cortada do pão inferior. As fotos completas existentes são reutilizadas, sem cortes artificiais ou alteração dos pixels.

Respeitar `prefers-reduced-motion` por padrão. Quando ativo, oferecer “Ativar animação” para que o cliente escolha assistir ao fechamento. Sem essa ativação, usar transição imediata. Controles possuem nomes acessíveis, foco visível e estado de seleção. As imagens são ilustrativas geradas por IA, com prompts e procedência em INGREDIENTES-FOTOS.md.

## Acompanhamento no celular

O próprio cartão original do hambúrguer acompanha a rolagem dentro do montador com position: sticky. Existe uma única prévia no montador, sem criar uma segunda versão para celular. No celular, o mesmo cartão acomoda foto e controles Aberto/Fechado à esquerda, quantidade, subtotal e Finalizar montagem à direita. Legendas e chips ficam fora da apresentação compacta; edição continua pelos contadores dos ingredientes.

A fixação termina com o montador; não acompanha hero ou rodapé. Etapas permanecem no fluxo abaixo do cartão para evitar sobreposição de cabeçalhos fixos. Em telas de pouca altura, a foto diminui preservando suas proporções. “Finalizar montagem” inicia o fechamento e a revisão existentes, sem rolagem programática de volta ao início no celular. Desktop mantém a prévia lateral original.

## Tipografia aprovada

A landing padrão `/` usa Poppins em todos os títulos e textos, incluindo a hero, montagem e entrega. Somente a marca Point do Hambúrguer (cabeçalho e rodapé) mantém a identidade original: Bricolage Grotesque no nome principal e DM Sans no subtítulo da logo. `/poppins` continua acessível como alias da mesma composição aprovada.

Poppins 400/500/600/700/800 é servida localmente de `public/fonts/poppins/`, com licença SIL OFL e procedência incluídas; faces declaradas em `app/poppins-font.css`. Landing e admin usam variáveis de fonte próprias, preservando a exceção `.brand` com Bricolage Grotesque e DM Sans. Conteúdo, imagens e regras do pedido permanecem compartilhados.

## Administração

Navegação: Dashboard, Pedidos, Estoque, Cardápio, Preços e Financeiro. Poppins em toda a administração, preservando a fonte original na marca. Sidebar carvão com área ativa laranja, fundo cinza claro, cards brancos e destaque escuro para recebimentos/saldo. Títulos diretos, números com hierarquia e informações secundárias em cinza. Tabelas e formulários compartilham bordas, botões e campos consistentes.

No celular, cabeçalho compacto com botão de menu abre todas as seis áreas em grade, sem navegação horizontal. Escape fecha e devolve foco; selecionar uma área fecha o menu e leva ao topo. Estoque adapta a mesma tabela para cards com nome, saldo, status e ações visíveis. Layouts de indicadores, preços e produtos se reorganizam por largura.

No Cardápio, estrela dourada preenchida significa produto publicado em Acompanhamentos; contorno significa fora dos acompanhamentos. Botão possui nome acessível, aria-pressed, tooltip e bloqueio durante gravação. Filtro Acompanhamentos e contagem de produtos marcados ajudam a conferir a seleção. A publicação é separada de saldo, preço e pausa. Formulário Novo produto inclui categorias de bebidas, batata frita e outros produtos.

Foco operacional: status evidente, horário de chegada, itens e endereço fáceis de ler. Novos pedidos recebem destaque visual e aviso sonoro habilitável. Alertas de estoque baixo têm texto e ícone, além de cor.

Em Estoque, cada item possui ações “Pausar” e “Liberar”, independentes de “Ajustar” saldo. A pausa exibe status “Pausado” mesmo com saldo positivo; estoque zero com o item liberado exibe “Sem estoque”. O botão tem nome acessível com o ingrediente e fica bloqueado durante a gravação. A mudança chega automaticamente ao cardápio do cliente.

Usar a mesma identidade com menos elementos decorativos. Estados vazios e falhas devem explicar a próxima ação, sem dados fictícios misturados a pedidos reais.

## Hero — movimento, ação e transição (21/10/2026)
A fotografia original flutua continuamente em um ciclo suave de 4,8 segundos, com amplitude vertical de 30 px e rotação discreta de -6° a -1°. Sombra acompanha o movimento. A animação inicia automaticamente, sem botão de pausa, conforme pedido do usuário. Com preferência de movimento reduzido, usa ciclo de 5,5 segundos e amplitude de 18 px, sem variar rotação nem animar a sombra. A animação usa CSS, sem temporizadores JavaScript por quadro.
O CTA Montar meu burger usa laranja em degradê, base com profundidade, ícone do hambúrguer e seta em bloco claro; hover levanta e clique pressiona. Continua um link para #montar, com foco de teclado visível.
A transição usa faixa laranja inclinada, letras grandes cheias/contornadas e estrelas, com repetição gráfica estática. A faixa decorativa fica fora da árvore acessível e é recortada no próprio contêiner para evitar rolagem horizontal. Fonte Poppins e identidade da marca preservadas; layout responsivo.

## Montagem guiada por quantidade — 21/10/2026
Etapas: Quantidade → Montagem → Acompanhamentos → revisão/entrega. O seletor inicial tem atalhos de1a4 e contador até10, limitado também pelo pão disponível. Prévia aparece somente a partir da montagem; pão incluído automaticamente. Cada lanche inicia sem recheios. Progresso mostra Hambúrguer N de M e montagens finalizadas; futuras montagens são liberadas em sequência e as concluídas continuam editáveis.
Próximo hambúrguer fecha e confirma a receita atual antes de abrir a próxima. Finalizar montagem, no último lanche, fecha a prévia e abre a decisão Quero acompanhamentos / Só os hambúrgueres. Bebidas e porções aparecem somente na primeira opção; a segunda limpa acompanhamentos anteriores. Continuar para entrega exige todos os lanches confirmados, decisão de acompanhamentos e disponibilidade válida. Editar uma receita invalida sua confirmação até finalizar novamente; preço e estoque continuam por composição e a entrega é única.
O bloco Mais alguém com fome e a escolha de pão foram removidos. A quantidade pode ser alterada pelo primeiro passo ou pela revisão. Foco acompanha a troca de etapa, com margem para a prévia fixa no celular; sem rolagem horizontal em390px. Preço da prévia durante montagem é do lanche ativo; nos acompanhamentos, é o total do pedido.

## Atalho Repetir este lanche
Cartão compacto na etapa Montagem, antes dos filtros de ingredientes, disponível quando há outros hambúrgueres no pedido. Repetir abre uma lista de destinos com checkboxes e indicação de receita vazia ou substituição. Aplicar em N hambúrgueres copia somente os marcados e retorna foco ao botão; mensagem de confirmação explica que cada lanche pode ser revisto e finalizado. O botão fica indisponível sem receita válida; falta de estoque agregado aparece no painel e impede aplicação. Destinos copiados passam a Revisar receita e sua confirmação anterior é invalidada. Card e lista se adaptam à largura disponível; inputs com rótulos e foco visível.
