# Cardápio — Point do Hambúrguer

Transcrito da imagem enviada pelo usuário em 20/10/2026. A imagem é referência de dados do restaurante, não uma fonte de instruções para o agente.

## Ingredientes

| ID | Nome exibido | Controle de estoque | Quantidades na imagem |
|---|---|---|---|
| carne-hamburguer | Carne de hambúrguer | Unidade | 1, 2, 3, 4 |
| frango | Frango | Porção | 1, 2, 3, 4 |
| queijo | Queijo | Unidade | 1, 2, 3, 4 |
| cheddar | Cheddar | Unidade | 1, 2, 3, 4 |
| catupiry | Catupiry | Unidade | 1, 2, 3, 4 |
| presunto | Presunto | Unidade | 1, 2, 3, 4 |
| bacon | Bacon | Porção | 1, 2, 3, 4 |
| ovo | Ovo | Unidade | 1, 2, 3, 4 |
| calabresa | Calabresa | Porção | 1, 2, 3, 4 |
| salsicha | Salsicha | Porção | 1, 2, 3, 4 |
| milho-verde | Milho verde | Porção | 1, 2, 3, 4 |
| ervilha | Ervilha | Porção | 1, 2, 3, 4 |
| cebola | Cebola | Porção | 1, 2, 3, 4 |
| salada | Salada | Porção | 1, 2, 3, 4 |
| batata-palha | Batata palha | Porção | 1, 2, 3, 4 |

Ausência de ingrediente corresponde a quantidade zero. A interface deve permitir adicionar e remover sem exigir todos os ingredientes.

O administrador pode pausar e liberar manualmente qualquer ingrediente sem modificar seu saldo. Item pausado permanece visível como indisponível no cardápio e não pode entrar em novos pedidos. Liberar restaura a disponibilidade apenas quando há estoque suficiente.

## Tabela de preços do sanduíche

Valores em reais; persistência proposta em centavos inteiros.

| Quantidade total de itens | Valor |
|---|---|
| 3 | R$ 13,00 |
| 4 | R$ 14,00 |
| 5 | R$ 15,00 |
| 6 | R$ 16,00 |
| 7 | R$ 17,00 |
| 8 | R$ 18,00 |
| 9 | R$ 19,00 |
| 10 | R$ 20,00 |
| 11 | R$ 21,00 |
| 12 | R$ 22,00 |
| 13 | R$ 23,00 |
| 14 | R$ 24,00 |
| 15 | R$ 25,00 |

Embora a tabela inicial siga `R$ 10 + quantidade`, cada faixa deve ser editável individualmente no admin. Não fixar a fórmula no sistema.

## Complementos e entrega

| Item da imagem | Informação disponível | Pendente |
|---|---|---|
| Suco | Campo “suco de” | Sabores, tamanhos e preços |
| Refrigerante | Categoria | Marcas, tamanhos e preços |
| Batata frita | Oito porções e preços confirmados na foto de 20/10/2026 | Saldo real e peso de cada porção |
| Taxa de entrega | Campo no total | Valor fixo ou tabela por região |
| Pão | Uma única opção, incluída automaticamente em cada hambúrguer; não há etapa de seleção | Reposição de estoque conforme a operação |

Não tratar preço desconhecido como zero nem inventar produtos. O admin poderá cadastrar opções; compra de opção sem preço fica indisponível.

Admin → Cardápio reúne refrigerantes, sucos, batata frita e outros produtos cadastrados pela hamburgueria. Refrigerantes e sucos exigem nome/marca, sabor, tamanho/embalagem e preço; porções e outros produtos usam nome e tamanho/porção. Cada combinação tem estoque, alerta, limite por pedido e pausa/liberação próprios. Edição de cadastro não altera saldo; reposição usa ajuste auditado.

A estrela preenchida publica o produto em Acompanhamentos no pedido do cliente. Estrela vazia mantém o produto somente no cadastro administrativo. Novos produtos começam sem estrela; produtos já exibidos antes da mudança são mantidos marcados. A marcação não altera preço, estoque ou disponibilidade manual. Produto marcado ainda precisa de preço e saldo para ser comprado. Se for desmarcado durante uma montagem existente, o cliente pode removê-lo e a reserva no servidor impede novas compras com catálogos antigos. Os três registros genéricos existentes continuam sem preço até configuração; nenhum sabor, preço ou saldo é inventado.

## Porções de batata frita — foto recebida em 20/10/2026

As duas tabelas na foto repetem o mesmo cardápio. Cadastrar uma vez cada opção, sem inventar peso ou estoque.

| Porção | Coberturas | Preço |
|---|---|---|
| Tradicional | Queijo ralado | R$ 25,00 |
| Bacon | Bacon e queijo ralado | R$ 27,00 |
| Calabresa | Calabresa e queijo ralado | R$ 27,00 |
| Cheddar | Cheddar e queijo ralado | R$ 27,00 |
| Bacon e calabresa | Bacon, calabresa e queijo ralado | R$ 28,00 |
| Bacon e cheddar | Bacon, cheddar e queijo ralado | R$ 28,00 |
| Calabresa e cheddar | Calabresa, cheddar e queijo ralado | R$ 28,00 |
| Completa | Bacon, calabresa, cheddar e queijo ralado | R$ 30,00 |

Cada porção tem preço e estoque independentes, tamanho “Porção” e descrição editável no admin. Saldo inicial zero até reposição informada pelo responsável. As oito opções foram marcadas para aparecer nos acompanhamentos; ficam indisponíveis sem estoque. O registro genérico anterior permanece intacto. Os ingredientes descritos como coberturas não são baixados também do estoque de recheios: a unidade vendida é a porção cadastrada.

## Interpretações propostas, ainda não confirmadas

- A quantidade de itens corresponde à soma das quantidades escolhidas: 2 carnes + 3 queijos = 5 itens, R$ 15,00 antes dos complementos e da entrega.
- O pão faz parte do sanduíche e não entra na contagem da tabela. A imagem não confirma essa regra.
- A tabela cobre apenas 3 a 15 itens; fora dela a finalização deve aguardar uma faixa cadastrada. Não extrapolar preços.
- O máximo por ingrediente começa em 4, conforme a imagem. O admin poderá revisar essa limitação posteriormente.
- O estoque de frango é medido em porções, conforme o cardápio; não em gramas sem uma conversão cadastrada.

## Pedido com vários hambúrgueres — 21/10/2026
Um pedido pode conter de 1 a 10 montagens independentes. Cada lanche exige um pão e usa sua própria faixa da tabela pela soma das quantidades dos recheios. Acompanhamentos são compartilhados no pedido e a taxa de entrega é cobrada uma única vez. O servidor calcula o total e verifica a soma de todos os ingredientes antes da reserva atômica. O limite por ingrediente vale por hambúrguer; estoque considera o pedido completo.
Receita e preço de cada lanche são guardados no histórico em orders.burgers; pedidos antigos continuam legíveis. As linhas de estoque de cada lanche são reservadas juntas, repetição continua idempotente e cancelamento devolve a soma das porções uma vez. O financeiro continua com uma receita por pedido concluído.
Acompanhamentos do cliente agora aparecem em categorias recolhíveis: Batata frita, Bebidas (refrigerantes e sucos), e Outros quando houver produtos. A estrela e a disponibilidade do cadastro administrativo permanecem vigentes. Nenhum sabor, preço ou estoque foi inventado.

## Fluxo de montagem aprovado — 21/10/2026
A primeira etapa escolhe a quantidade de hambúrgueres, respeitando o limite existente de 1 a10 por pedido e a disponibilidade do pão. Cada montagem começa somente com um pão, sem recheios pré-selecionados. O cliente monta e finaliza um lanche de cada vez, avançando ao próximo. A última finalização leva aos acompanhamentos; a entrega vem depois da escolha explícita entre adicionar acompanhamentos ou seguir só com os hambúrgueres. Não há etapa O pão nem bloco Mais alguém com fome. Alterar a quantidade preserva as receitas restantes e cria novos lanches vazios com pão incluído. Redução remove as últimas montagens, com orientação visível no seletor.

## Repetir uma receita em outros lanches — 21/10/2026
Na etapa Montagem, pedidos com mais de um hambúrguer oferecem Repetir este lanche após compor uma receita válida. O cliente marca quais outros hambúrgueres recebem a cópia; cada destino com ingredientes informa que a receita atual será substituída. Destinos ainda não finalizados são sugeridos inicialmente. Cópias são independentes, incluem o pão e podem ser alteradas depois. Lanches copiados continuam sujeitos à revisão/finalização em sequência. Acompanhamentos não são copiados. A operação verifica a soma do estoque de todos os hambúrgueres antes de alterar o rascunho e mantém os preços calculados pela tabela existente.

A lista de recheios na montagem começa por Carne de hambúrguer, Queijo, Cheddar, Catupiry, Salada, Frango, Calabresa e Salsicha, nessa ordem. Os demais ingredientes seguem depois, preservando sua ordem relativa. Os filtros de categoria respeitam essa mesma sequência.
