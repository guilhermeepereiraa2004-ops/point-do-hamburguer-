# Point do Hambúrguer

Sistema de delivery com montagem visual do hambúrguer, cardápio, pedidos, estoque e financeiro. O código da aplicação está em `point-delivery/`.

## Desenvolvimento

Node.js >= 22.13.0. Na pasta `point-delivery`, execute `npm ci` e `npm run dev`. A aplicação usa Next.js no runtime Node e PostgreSQL persistente no Neon. Configure `DATABASE_URL` e `BETTER_AUTH_SECRET` em um arquivo `.env.local` ignorado. Schema PostgreSQL em `db/pg-schema.ts` e migrações versionadas em `drizzle-pg/`.

`npm run gate` executa tipagem, verificação de camadas, testes PostgreSQL descartáveis e build de produção. `npm test` usa PGlite sem alterar o banco real. As migrações SQLite/D1 antigas permanecem como referência da transição.

## Hospedagem

O projeto Vercel `point-do-hamburguer`, em Guilherme Pereira's projects, usa a raiz `point-delivery/` e o preset Next.js. O sistema funciona no endereço `vercel.app`, sem depender de domínio próprio ou Clerk. Credenciais de banco e sessão ficam nas variáveis de ambiente do projeto.

## Administração

O login é próprio, usando Better Auth e sessões no PostgreSQL. Cadastro público desativado; somente usuários registrados em `admin_access` podem entrar no painel. Senhas usam hash scrypt, cookies HttpOnly/SameSite/Secure em HTTPS, sessões revogáveis e limitação persistente de tentativas.

`node --env-file=.env.local scripts/migrate-postgres.mjs` aplica migrações ainda não registradas. `node --env-file=.env.local scripts/admin-access.mjs` cria o primeiro administrador somente se ele não existir. O usuário inicial é `admin`; a senha aleatória é gravada exclusivamente em `.sites-runtime/acesso-inicial-admin.txt`, fora do Git e da publicação. Troca obrigatória no primeiro acesso. A senha pode ser alterada em Minha conta; recuperação operacional pelo responsável autorizado: o mesmo comando com `--reset`, que revoga sessões e exige nova troca. Não há envio de senhas por e-mail.

`scripts/migrate-to-postgres.mjs` é a importação inicial, atômica e não destrutiva do banco D1 original. Ele não sobrescreve um banco já inicializado. Não execute seeds de teste no banco de produção.

O banco local, os pedidos, as credenciais, as dependências e os arquivos gerados não fazem parte do repositório. Dados comerciais e preços confirmados estão em `docs/CARDAPIO.md`; as oito porções de batata frita estão também em `point-delivery/data/fries-menu.json`.
