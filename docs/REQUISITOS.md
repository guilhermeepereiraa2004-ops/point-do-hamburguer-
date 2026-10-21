# Escopo e critérios de aceite — Point do Hambúrguer

Data: 20/10/2026. Estado: especificação inicial; aplicação ainda não implementada.

## Pedido confirmado pelo usuário

Sistema web de delivery para uma hamburgueria, com identidade laranja e branca. A área do cliente deve priorizar o cardápio, com uma hero curta seguida do montador. O admin gerencia pedidos, estoque, preços e financeiro.

## Experiência do cliente

| ID | Critério de aceite |
|---|---|
| CLI-01 | Layout responsivo, com hero curta e botão que leva ao montador. |
| CLI-02 | Todos os 15 ingredientes de CARDAPIO.md aparecem com unidade/porção e seletor de quantidade. |
| CLI-03 | Primeiro escolher de 1 a 10 hambúrgueres, com um pão incluído automaticamente em cada um. Montar cada lanche em sequência; cada ingrediente e repetição atualiza as camadas. Próximo hambúrguer confirma o atual e avança. Finalizar a última montagem leva aos acompanhamentos antes da entrega. |
| CLI-04 | Preço e quantidade total acompanham as escolhas; faixas são consultadas na tabela configurada. |
| CLI-05 | Complementos cadastrados têm quantidade, preço e disponibilidade. |
| CLI-06 | Resumo mostra composição, quantidades, subtotal, complementos, entrega e total antes de enviar. |
| CLI-07 | Finalização coleta nome, telefone, endereço e referência; valida no navegador e no servidor. |
| CLI-08 | Envio bem-sucedido retorna confirmação com identificador e resumo do pedido. Falhas preservam o carrinho. |
| CLI-09 | Ingredientes sem estoque aparecem indisponíveis; alteração concorrente de disponibilidade é tratada no envio. |
| CLI-10 | Acompanhamentos exigem decisão explícita: escolher bebidas/porções ou seguir só com os hambúrgueres. A entrega abre após essa etapa. Permitir rever receitas e alterar a quantidade, preservando os lanches restantes e cobrando uma única entrega. |

Não foram solicitados pagamento online, login do cliente, WhatsApp, app de loja, cupons ou rastreamento de entregador.

## Pedidos e administração

| ID | Critério de aceite |
|---|---|
| ADM-01 | Rotas e ações administrativas exigem autorização conferida no servidor; esconder botões não basta. |
| ADM-02 | Painel recebe novos pedidos com composição, quantidades, cliente, telefone, endereço, referência e valores. |
| ADM-03 | Fluxo proposto: recebido → em preparo → saiu para entrega → concluído; cancelamento permitido antes de concluir. |
| ADM-04 | Alterações inválidas de status são rejeitadas; mudanças registram data e responsável. |
| ADM-05 | Novos pedidos aparecem automaticamente enquanto o painel está aberto; proposta inicial de consulta a cada 5 segundos, ajustável após medir carga. |
| ADM-06 | Botão “Ativar alertas” desbloqueia áudio e permite testar a sineta; alerta visual acompanha cada novo pedido. |
| ADM-07 | Sineta se repete até reconhecimento, com volume configurável e botão para silenciar. Recarregar ou consultar novamente não deve alertar pedidos já reconhecidos. |
| ADM-08 | Após perda de conexão, o painel indica desconexão, tenta recuperar e busca pedidos não reconhecidos. |

Limite real do áudio: navegadores podem bloquear reprodução sem interação; volume depende também do aparelho. Não prometer som com o painel fechado ou aparelho sem áudio. Referência: [MDN — Autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), consultada em 20/10/2026.

## Estoque e integridade

| ID | Critério de aceite |
|---|---|
| EST-01 | Cada ingrediente e complemento controlado tem saldo, unidade e limite de alerta de estoque baixo. |
| EST-02 | Receber pedido e descontar estoque são uma operação atômica no servidor. 50 porções de frango menos 1 resultam em 49; menos 2 resultam em 48. |
| EST-03 | Dois pedidos concorrentes disputando a última porção não podem deixar saldo negativo. Apenas o pedido com estoque garantido é aceito. |
| EST-04 | Repetir a mesma requisição por duplo clique ou reconexão não duplica pedido nem baixa; usar chave de idempotência única. |
| EST-05 | Cancelamento antes da conclusão restitui estoque uma única vez na regra inicial proposta; perdas de preparo devem ser tratadas por ajuste auditável. |
| EST-06 | Entradas, saídas, reposições e ajustes mantêm histórico com motivo, saldo e responsável. |
| EST-07 | Quantidade inválida, ingrediente desconhecido, complemento inativo e preço enviado pelo cliente são rejeitados ou recalculados. |

## Tabela de preços

| ID | Critério de aceite |
|---|---|
| PRE-01 | Admin edita as 13 faixas iniciais, de 3 a 15 itens, preservando valores da imagem na carga inicial. |
| PRE-02 | Admin configura complementos, tipos de pão e taxa de entrega. Valores desconhecidos ficam pendentes. |
| PRE-03 | Pedido guarda uma cópia dos preços e nomes usados na compra; alteração posterior não reescreve o histórico. |
| PRE-04 | Servidor recalcula o total na confirmação. Mudança de preço desde a revisão exige nova confirmação do cliente. |

## Financeiro

| ID | Critério de aceite |
|---|---|
| FIN-01 | Mudar um pedido para concluído gera lançamento automático de receita com vínculo único ao pedido. |
| FIN-02 | Repetir a conclusão não duplica receita; pedido aberto ou cancelado não compõe receita concluída. |
| FIN-03 | Painel filtra por período e lista pedidos concluídos, receita total e ticket médio; entrega e itens têm valores discriminados. |
| FIN-04 | Valores são centavos inteiros; datas de exibição seguem America/Bahia. |
| FIN-05 | Admin registra entradas e saídas manuais com descrição, data e valor positivo. Reenvio da mesma solicitação não duplica o lançamento. |
| FIN-06 | Extrato identifica vendas automáticas e lançamentos manuais; mostra entradas, saídas e saldo por mês atual, hoje, últimos sete dias locais ou todo o período. |

O financeiro inclui receitas por conclusão e movimentações manuais de caixa. Saldo é entradas menos saídas registradas; não representa lucro contábil, conciliação ou emissão fiscal.

## Dashboard mensal e acompanhamentos

| ID | Critério de aceite |
|---|---|
| DAS-01 | Dashboard abre no mês atual em America/Bahia, com valor recebido, ticket médio das vendas e quantidade de pedidos não cancelados. |
| DAS-02 | Recebido soma vendas concluídas e entradas manuais na data do movimento. Ticket considera apenas vendas concluídas; cancelados e movimentações manuais ficam fora da média. |
| DAS-03 | Dia de maior movimento agrupa pedidos recebidos no mês por dia da semana e informa empates. Cliente mais frequente agrupa vendas concluídas no mês pelo telefone, com desempate pelo valor comprado. |
| ACO-01 | Admin gerencia refrigerantes, sucos, batata frita e outros produtos em Cardápio. Cada sabor/tamanho tem identificação, preço, saldo, alerta e limite por pedido próprios. |
| ACO-02 | A estrela publica o produto nos Acompanhamentos do cliente, com preço, disponibilidade e filtros por tipo. Sem estrela o produto permanece no cadastro; sem preço ou saldo, a compra permanece bloqueada. |
| ACO-03 | Pedido reserva a quantidade exata de cada opção atomicamente e devolve ao cancelar. Cadastro reenviado não duplica produto, saldo ou movimentação inicial. Alterar detalhes não sobrescreve saldo vendido. |
| ACO-04 | Alterações de nome e preço não modificam pedidos anteriores. Valores e sabores comerciais são preenchidos pelo administrador, sem dados inventados. |
| ACO-05 | Marcar/desmarcar é uma operação administrativa booleana que não altera estoque, preço ou pausa. Novos produtos iniciam sem estrela; existentes preservam a exibição. A reserva atômica bloqueia compra com estrela retirada mesmo com catálogo antigo; item já selecionado permanece removível. |

## Verificação necessária antes de declarar pronto

- Testes de contagem/preços, estoque concorrente e insuficiente, idempotência, cancelamento, transições e receita sem duplicação.
- Conferir autorização de cada endpoint administrativo.
- Fluxo no navegador: montar → revisar → informar entrega → enviar → receber no admin → concluir → conferir financeiro e estoque.
- Inspeção visual em celular e desktop, teclado, estados de erro, falta de estoque e movimento reduzido.
- Teste real da sineta após habilitação, reconexão e reconhecimento.

Evidências de implementação, testes e limites operacionais são mantidas em plan/STATUS.md.

CLI-11 (21/10/2026): permitir repetir a receita do lanche ativo em outros hambúrgueres escolhidos do mesmo pedido, preservando os não marcados e a independência das cópias. Avisar substituição de montagem existente, manter revisão/finalização por lanche e conferir estoque total antes de copiar. Não copiar acompanhamentos nem modificar a tabela de preços.

## Acesso pela tela inicial — 21/10/2026
A vitrine oferece seção Seu Point está a um toque, com benefício de acessar o cardápio sem procurar o link. App web instalável via manifesto, ícones PNG e modo standalone, iniciando em /#montar. Android e navegadores compatíveis usam o prompt nativo quando disponível; ausência/recusa/erro oferece instruções, sem prometer instalação automática. iPhone/iPad orientam Safari → Compartilhar → Adicionar à Tela de Início → Adicionar. Se disponível, manter Abrir como App da Web. A seção desaparece em modo standalone ou após appinstalled. Não é distribuído APK; não há cache offline de catálogo, estoque, sessão ou pedidos. Internet continua necessária. Não altera o fluxo ou o preço dos pedidos.

## Administração no celular — 21/10/2026
Em telas de até 900px, o painel oferece atalhos fixos Início, Pedidos, Estoque, Cardápio e Mais (Preços/Financeiro no menu). Controles principais têm pelo menos44–48px, textos de leitura maiores e maior contraste. Conta/Sair ficam ao final do conteúdo, fora da sobreposição. Estoque e produtos possuem busca local sem distinção de acentos; filtros existentes permanecem. Pedidos em uma coluna e financeiro em cartões com rótulos, evitando tabela horizontal. Formulários em folha inferior rolável, campos16px e uma coluna; foco inicial no botão de fechar em dispositivos de toque, Escape/Tab e retorno de foco. Funcionalidades e autorização do servidor permanecem iguais.
