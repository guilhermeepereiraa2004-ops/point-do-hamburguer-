# Point do Hambúrguer

Sistema de delivery com montagem visual do hambúrguer, cardápio, pedidos, estoque e financeiro. O código da aplicação está em `point-delivery/`.

## Desenvolvimento

Node.js >= 22.13.0. Na pasta `point-delivery`, execute `npm ci` e `npm run dev`. A persistência atual usa Cloudflare D1; o desenvolvimento local usa Miniflare. Schema e migrações ficam em `db/` e `drizzle/`.

Validação disponível: `npm run typecheck`, `npm test` e `npm run build`. Os scripts referenciados por `npm run gate` e `npm run check:layers` ainda precisam ser implementados.

## Hospedagem

O projeto foi desenvolvido para Vinext/Cloudflare Workers, com D1 e identidade da hospedagem Sites. O vínculo Git na Vercel usa a raiz `point-delivery/`. Esse vínculo não converte o runtime: antes de publicar uma versão operacional na Vercel, é necessário adaptar a execução do servidor, a conexão de banco e a autenticação administrativa. Não disponibilizar um build estático como se os pedidos e o estoque estivessem funcionando.

O banco local, os pedidos, as credenciais, as dependências e os arquivos gerados não fazem parte do repositório. Dados comerciais e preços confirmados estão em `docs/CARDAPIO.md`; as oito porções de batata frita estão também em `point-delivery/data/fries-menu.json`.
