# Point do Hambúrguer

Aplicação em `point-delivery/`. Leia docs/STACK.md, docs/CARDAPIO.md, plan/STATUS.md, plan/execution-plan.md, ROADMAP.md e log/devlog.md antes de trabalhar.

## Regras
- Preços por soma de quantidades, tabela editável; preservar preço histórico do pedido.
- Pedido e estoque devem ser atômicos; requisições repetidas não duplicam saídas.
- Financeiro recebe apenas pedidos concluídos, uma vez por pedido.
- Administração exige autorização no servidor. Identidade local de teste só em desenvolvimento loopback.
- Não inventar preços de itens não informados nem expor segredos e dados pessoais em logs.

## Organização
Uma raia, responsável `/root`; não há delegação. Registro em plan/LANES.md. Arquitetura em docs/arquitetura.md. Memória plan/ e log/ é local; especificação é versionada.

## Verificação
Comandos executados dentro de point-delivery: `npm run gate` (typecheck, domínio, camadas e build), `npm run dev` (porta 5173). Usar o npm-cli.js absoluto se o shim npm do Windows falhar. Inspecionar UI no navegador antes de declarar conclusão visual. Registrar limites e resultados em plan/STATUS.md.
