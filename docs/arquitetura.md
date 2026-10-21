# Arquitetura

Aplicação React/TypeScript/Vinext, banco local D1 e migrações Drizzle.
`domain/` contém contratos e validações puros; `db/` schema e persistência; `actions/` orquestra e autoriza; `app/api/` expõe HTTP; componentes cliente consomem endpoints. Domínio não importa outras camadas. Clientes não importam banco, identidade de servidor ou ações privilegiadas.

Verificador: `npm run check:layers`. Gate: `npm run gate`. A verificação estática cobre imports literais e marcadores client; não resolve importações construídas em runtime.

Gatilhos SQLite decrementam o estoque ao inserir item e restauram ao cancelar. Restrição CHECK impede saldo negativo e faz o batch inteiro falhar. Pedido contém cópia de nomes e preços. Conclusão cria uma receita com vínculo único; conclusão repetida é idempotente.

`db/order-reservation.ts` executa o batch de pedido e itens, incluindo `created_at` entre os parâmetros obrigatórios. A ação trata repetições pela chave de idempotência antes/depois da transação. Testes de integração executam as migrações reais em D1 descartável, cobrindo rollback, concorrência, quantidades, financeiro e restituição.

Falta de estoque é um resultado de disponibilidade: o domínio retorna todos os ingredientes com ID, nome, unidade, quantidade solicitada e saldo. A API responde com `INSUFFICIENT_STOCK`, HTTP 409 e `shortages`. Após uma disputa pelo estoque, a ação consulta os saldos novamente para nomear os itens afetados. Falhas técnicas não são apresentadas como falta de ingredientes. O cliente atualiza o catálogo e oferece revisão da montagem, preservando os dados de entrega apenas na memória da página.

Disponibilidade manual usa o campo existente `ingredients.active`. A operação administrativa `availability` aceita somente booleano e altera exclusivamente esse campo; não gera saída de estoque. A rota exige administrador e origem válida. A migração adicional `0001_ingredient_availability` valida `active=1` antes de inserir cada item no pedido, impedindo reservas com catálogo antigo e revertendo o batch inteiro se houver um item pausado. Reativar um produto sem saldo mantém a regra de estoque: ele só pode ser adicionado quando também houver quantidade disponível.

Migração aditiva `0002_management` cria `manual_finance` e acrescenta metadados de acompanhamentos em `ingredients`. Registros genéricos anteriores recebem apenas o tipo correspondente, sem alteração de saldo, preço ou disponibilidade. Cada variante usa seu próprio ID e reutiliza os gatilhos de reserva e cancelamento. Cadastro inicial de variante e movimentação de entrada formam um batch; chave estável e verificação do cadastro existente evitam reposição duplicada após reenvio. Editar metadados/preço não grava estoque.

Lançamentos manuais usam ID estável, valor positivo em centavos, tipo entrada/saída, descrição, data operacional e timestamp de criação. Conflito de ID com outros dados é rejeitado. Não criam pedidos nem receitas automáticas e não afetam estoque. Constraints SQL validam sinal e tipo. Todas as operações passam pela rota administrativa protegida e validação de origem.

`domain/reporting.ts` define o mês e os períodos no horário da Bahia e agrega vendas, pedidos e caixa. Analytics mensal consulta todos os pedidos do mês, independentemente do limite de 200 pedidos da fila. Receitas mantêm vínculo com cliente/código mesmo quando o pedido sai da fila recente. Ticket e cliente mais frequente usam vendas na data de conclusão; frequência por dia usa data do pedido e exclui cancelados. Telefones são normalizados apenas para agrupar clientes, sem serem incluídos no resumo do dashboard. Empates de dias e de quantidade de compras são informados.

`0003_menu_featured` acrescenta `ingredients.featured` com default falso para novos produtos e preserva a publicação dos produtos existentes. A ação `featured` exige booleano e restringe a atualização à categoria interna Complementos; não grava saldo, preço ou active. O trigger adicional `order_item_require_featured` impede reservas com estrela retirada dentro do mesmo batch, com rollback integral. A categoria interna mantém o nome técnico para preservar regras anteriores; a administração exibe Cardápio.

O cliente usa `accompanimentChoices` para exibir os produtos marcados, mantendo temporariamente itens já selecionados para permitir sua remoção após retirada da estrela. Disponibilidade do domínio considera active, featured para produtos e saldo. Shortages identificam o produto retirado e impedem finalizar; a revisão leva à etapa de Acompanhamentos quando necessário. O catálogo continua atualizando pelo polling existente.
