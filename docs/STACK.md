# Stack — Point do Hambúrguer

Atualizado: 20/10/2026, America/Bahia.
Estado: rascunho para decisão. Aprovação: pendente.
Arquétipo: sistema web de delivery, uma hamburgueria, duas áreas no mesmo projeto.

## Superfícies e MVP

| Superfície | Público | Distribuição | Origem |
|---|---|---|---|
| Cardápio e montagem responsivos | Clientes em celular e computador | Navegador | Usuário pede site e front do cliente |
| Administração responsiva | Equipe autorizada | Navegador | Usuário pede admin, pedidos, preços, estoque e financeiro |

Aplicativos nativos e operação offline não fazem parte do pedido. Clientes devem conseguir montar e pedir sem criar conta quando o site estiver liberado ao público. A primeira publicação via Sites começa privada para revisão; abertura ao público é uma decisão posterior de acesso.

## Requisitos e origem

| Requisito | Obrigatório | Estado/evidência |
|---|---|---|
| Visual laranja e branco, hero curta e montador animado | Sim | Dito pelo usuário; docs/DESIGN.md |
| 15 ingredientes e tabela por quantidade | Sim | Imagem transcrita em docs/CARDAPIO.md |
| Nome, telefone, endereço e referência | Sim | Dito pelo usuário |
| Baixa imediata do estoque ao fazer pedido | Sim | Dito pelo usuário; necessita gravação atômica |
| Preços editáveis e pedidos por status | Sim | Dito pelo usuário |
| Receita automática de pedidos concluídos | Sim | Dito pelo usuário |
| Sineta de novo pedido | Sim | Dito; ativação por clique necessária no navegador |
| Admin protegido | Sim | Inferido para proteger dados e operações administrativas |
| Atualização automática em até cerca de 5 segundos | Proposta | Polling inicial; latência não especificada pelo usuário |
| Orçamento, volume e número de administradores | Não informado | Faltando; impede custo anual preciso |

Preferências da casa: não foram fornecidas. Repositório inicial vazio; não há stack anterior a preservar.

## Proposta concreta

Aplicação única em **React + TypeScript**, usando **Vinext com rotas de servidor**, **Cloudflare D1 + Drizzle** para persistência e **Sites** para publicar uma versão privada de revisão. Domínio e regras do negócio ficam separados da interface para facilitar manutenção e eventual troca do ambiente de hospedagem.

| Parte | Base verificada | Motivo e condição |
|---|---|---|
| UI | React 19; starter local fixa 19.2.6 | Composição de ingredientes e painel interativo; validar patches antes de instalar |
| Tipagem | TypeScript 5.9.3 no starter | Contratos entre catálogo, pedidos e estoque |
| Framework | Vinext 1.0.0-beta.5 no starter; API de rotas Next.js | Integração fornecida por Sites para aplicação com servidor; versão do starter é beta e deve ser validada no ambiente |
| Estilos | CSS/Tailwind 4.2.1 do starter | Identidade própria, responsividade e movimento reduzido |
| Banco | Cloudflare D1, binding DB | Registros compartilhados entre dispositivos; transações por batch e restrições SQL |
| Acesso a dados | Drizzle ORM 0.45.2, kit 0.31.10 no starter | Schema versionado e migrações revisáveis |
| Admin | Identidade de hospedagem Sites + autorização explícita no servidor | Autenticação não concede permissão administrativa automaticamente; definir IDs autorizados antes do uso real |
| Pedidos novos | Consulta periódica com cursor/id e reconhecimento persistente | Simples de operar; sem prometer tempo real com painel fechado |
| Sineta | Web Audio com botão de ativação e teste | Respeita restrições de reprodução do navegador |
| Deploy | Sites, Worker com banco D1 | Ferramentas já disponíveis nesta sessão; não exige provisionar outro fornecedor nesta fase |

Versões acima são as do template local lido, não uma afirmação de que sejam as últimas versões estáveis de cada projeto. A página oficial do React já lista 19.3. O conjunto efetivamente instalado deve ser fixado no lockfile, com compatibilidade e patches verificados durante a fundação.

## Fontes verificadas em 20/10/2026

- [React — versões oficiais](https://react.dev/versions).
- [Vinext — documentação](https://vinext.dev/docs) e [deploy em Cloudflare](https://vinext.dev/docs/deploying/cloudflare).
- [D1 — API do banco e batch](https://developers.cloudflare.com/d1/worker-api/d1-database/).
- [D1 — migrações](https://developers.cloudflare.com/d1/reference/migrations/).
- [MDN — reprodução automática de áudio](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).
- [Cloudflare — preços D1](https://developers.cloudflare.com/d1/platform/pricing/) e [Workers](https://developers.cloudflare.com/workers/platform/pricing/).
- Referência local Sites: `C:/Users/Mara Rubia/.codex/plugins/cache/openai-curated-remote/sites/1.0.2-remix-b.1/skills/sites/SKILL.md`, referências de storage/identity e template `vinext-starter`.

## Eliminatórios e alternativas

| Opção | Dados compartilhados | Estoque atômico | Admin autorizado | Resultado |
|---|---|---|---|---|
| React/Vinext + D1 via Sites | Atende no desenho | API batch documentada; provar com teste de concorrência e restrições SQL | Suporte documentado; falta configurar responsáveis | Candidata proposta, validação local pendente |
| HTML/JS + localStorage | Não atende entre dispositivos | Não atende concorrência entre clientes | Não oferece fronteira de servidor | Descartada para o sistema operacional solicitado |

Não há ranking definitivo entre fornecedores: orçamento, volume e preferências não foram fornecidos. Não usar notas fictícias para preencher incógnitas.

## Matriz da candidata proposta

Pesos padrão da skill; máximo teórico 80. Notas são avaliação de adequação, não benchmark.

| Critério | Peso | Nota | Justificativa |
|---|---|---|---|
| Facilidade para agentes | 3 | 4 | Template, tipagem, ferramentas locais e documentação disponíveis; execução pendente |
| Reuso da stack da casa | 3 | A verificar | Usuário não informou preferências |
| Compartilhamento de código | 2 | 4 | Duas áreas web usam os mesmos contratos e ações de servidor |
| Velocidade até MVP | 2 | 4 | Deploy e persistência integrados ao fluxo Sites |
| Custo no ano 1 | 2 | A verificar | Volume e condições Sites desconhecidos |
| Escala/desempenho | 1 | A verificar | Sem volume informado; medir latência e carga do polling |
| Segurança e privacidade | 2 | 3 | Possibilidade de identidade e autorização no servidor; exige implementação e teste |
| Risco de fornecedor | 1 | 2 | Runtime e identidade vinculados a Sites; versão Vinext do starter é beta |
| Total | 16 | Não calculado / 80 | Critérios decisivos sem base não recebem nota automática |

## Compatibilidade e regras técnicas

- Runtime Cloudflare Workers com D1 por binding; não usar drivers que exijam TCP de PostgreSQL.
- Domínio em TypeScript sem imports da UI. Interface chama ações de servidor com validação e autorização.
- Pedido, itens, cópia de preços, movimentos de estoque e chave única de idempotência gravados atomicamente.
- SQL deve transformar falta de estoque em falha transacional. Um UPDATE que modifica zero linhas não causa rollback sozinho: usar restrições/estratégia de SQL testada, sem depender apenas da leitura prévia do saldo.
- Conclusão e lançamento financeiro com vínculo único por pedido; cancelamento e restituição também idempotentes.
- Autorização administrativa independente de estar autenticado. Não usar “primeiro visitante vira admin”.
- Rascunho do carrinho pode ficar no navegador; pedidos, estoque, preços e financeiro permanecem no servidor.
- Sem dependência de pagamentos externos ou IA para operar o restaurante. Animação visual não altera cálculo nem estoque.

## Custos do ano 1

Moeda operacional: BRL. Tabelas diretas Cloudflare são em USD; sem converter sem câmbio e sem assumir que sejam a cobrança de Sites.

| Item | Implantação | Mensal/variável | Situação |
|---|---|---|---|
| Desenvolvimento | Não estimado | Não aplicável | Sem prazo ou orçamento fornecido |
| Hospedagem e banco via Sites | A verificar | A verificar para a conta | Não prometer gratuidade ou contratar plano |
| Cloudflare direto, referência alternativa | A verificar | Workers e D1 têm franquias e consumo; consultar links oficiais | Valores diretos não equivalem a proposta comercial Sites |
| Domínio próprio | A verificar | Renovação anual depende do domínio | Não solicitado nem comprado |
| Pagamentos e mensagens | Não aplicável nesta proposta | Não aplicável | Sem integração solicitada |

Sem volume, orçamento ou preços contratuais de Sites suficientes, o total do ano 1 permanece **a verificar**. Não há contratação autorizada nesta fase.

## Estrutura proposta

```text
docs/                   decisões, cardápio e critérios
point-delivery/         aplicação Sites em subdiretório próprio
  app/                  rotas cliente, admin e API
  components/           componentes visuais
  domain/               contagem, preços e transições
  actions/              casos de uso e autorização
  db/                   schema e persistência
  drizzle/              migrações
  tests/                regras e integração
  public/               assets licenciados ou criados para o projeto
  scripts/              gate, medição e verificador de camadas
AGENTS.md               instruções a criar após a decisão
ROADMAP.md              marcos a criar após a decisão
plan/ e log/            memória operacional, local por padrão
```

Proposta de memória: manter `plan/` e `log/` locais/ignorados; decisões, critérios e arquitetura versionados. Consequência: a memória operacional não acompanha clones até que o usuário escolha compartilhá-la.

## Comandos e evidência

| Finalidade | Procedimento | Estado |
|---|---|---|
| Inspecionar projeto | `git status --short` e inventário de arquivos | Executado: repositório vazio, sem commits, sem arquivos de aplicação |
| Runtime | `node --version` e `npm --version` | Executado: Node 24.12.0 e npm 11.6.2; Node atende ao mínimo >=22.13.0 declarado pelo starter |
| Criar template | Helper Sites `scripts/project-setup.mjs`, com caminho absoluto | Documentado; não executado |
| Dependências | Helper Sites `scripts/install-dependencies.mjs` | Documentado; não executado |
| Desenvolvimento | `npm run dev` no app | Documentado; não executado |
| Migrações | `npm run db:generate` e aplicação local conforme README do starter | Documentado; não executado |
| Build | Helper Sites `scripts/build-site.mjs` | Documentado; não executado |
| Gate | Agregar typecheck, domínio/integração, camadas e build | Pendente de implementação; nenhum comando fictício registrado como funcional |
| Inspeção visual | Preview local + navegador; seguir referência de preview Sites antes de iniciar | Pendente; nenhuma tela renderizada |

## Camadas propostas

| Camada | Pasta | Dependências permitidas |
|---|---|---|
| Base/domínio | domain/ | Tipos, validadores puros e módulos do próprio domínio |
| Persistência | db/ | Domínio e driver D1/Drizzle |
| Ações | actions/ | Domínio, persistência e identidade de servidor |
| HTTP | app/api/ | Ações e contratos públicos |
| UI | app/, components/ | Contratos públicos e endpoints/ações; nunca segredos ou driver DB no cliente |

Aliases e exceções do framework devem ser incluídos no verificador durante a fundação.

## Decisões pendentes

1. Aprovar ou ajustar a stack proposta antes da inicialização técnica, conforme a skill escolher-stack.
2. Confirmar contagem de ingredientes repetidos e se pão entra na tabela; enquanto isso, as hipóteses estão explicitadas em CARDAPIO.md.
3. Fornecer tipos de pão, bebidas, preços dos complementos e regra da entrega para liberar pedidos reais.
4. Definir administradores autorizados e configurar acesso antes da operação real.

Próxima etapa após aprovação: aplicar iniciar-projeto-agentes nesta decisão, criar fundação, implementar os fluxos de REQUISITOS.md, validar visual e regras de dados e publicar versão privada para revisão. Nesta etapa de proposta não houve criação de Site, instalação, implementação, build ou deploy.
