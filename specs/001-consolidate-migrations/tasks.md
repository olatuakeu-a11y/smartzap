
---

description: "Task list — Consolidação de migrations"

---

# Tasks: Consolidação de migrations

**Input**: Design documents from `/specs/001-consolidate-migrations/`

## Notas

- Este arquivo segue o formato estrito do Speckit: **cada task é uma linha checklist com ID**.
- `[P]` = pode ser feito em paralelo (arquivos diferentes, sem depender de tasks anteriores ainda não concluídas).
- Labels `[US1]`, `[US2]`, `[US3]` mapeiam diretamente para as user stories do `spec.md`.

## Fase 1 — Setup (infra de validação)

Critério de pronto (independente): conseguimos executar scripts de validação localmente/CI com variáveis e diretórios padronizados.

- [ ] T001 Criar diretório de artefatos locais de validação em `tmp/schema-parity/` (documentar uso em `specs/001-consolidate-migrations/quickstart.md`)
- [ ] T002 [P] Adicionar script npm `schema:parity` em `package.json` apontando para `scripts/schema-parity-check.ts`
- [ ] T003 [P] Adicionar placeholders de variáveis em `.env.example` (ex.: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) e referenciar em `specs/001-consolidate-migrations/quickstart.md`

## Fase 2 — Fundacional (decisões + utilitários compartilhados)

Critério de pronto (independente): base de código preparada para (a) executar SQL de forma consistente e (b) eliminar ambiguidade de fonte de migrations.

- [ ] T004 Consolidar a decisão “fonte única de verdade” em `specs/001-consolidate-migrations/research.md` (confirmar `supabase/migrations` como canônico)
- [ ] T005 Inventariar baselines existentes e registrar diffs (hash/linhas) em `specs/001-consolidate-migrations/research.md` (arquivos: `lib/migrations/0001_initial_schema.sql` e `supabase/migrations/0001_initial_schema.sql`)
- [ ] T006 [P] Criar helper de leitura/ordenação de migrations em `lib/migrations/fs-migrations.ts` (listar `.sql`, ordenar, validar prefixos únicos)
- [ ] T007 [P] Criar helper de execução SQL transacional via `pg` em `lib/migrations/pg-runner.ts` (execução por arquivo, logs, rollback)
- [ ] T008 [P] Criar helper de “is-empty-db” (detectar schema já inicializado) em `lib/migrations/db-safety.ts`
- [ ] T009 Padronizar o contrato de chamada do RPC `exec_sql` e documentar em `specs/001-consolidate-migrations/research.md` (decidir `sql_query` vs `sql`)

## Fase 3 — User Story 1 (P1): Criar ambiente do zero com 1 baseline

Objetivo do story: um banco vazio sobe 100% via **uma única migration baseline**.

Teste independente (critério): criar DB vazia e aplicar apenas o baseline canônico → sucesso; aplicar duas vezes → idempotente ou falha segura sem estado parcial.

- [ ] T010 [US1] Definir baseline canônico em `supabase/migrations/0001_initial_schema.sql` (fonte única) e alinhar conteúdo ao schema atual
- [ ] T011 [US1] Remover/arquivar baseline duplicado em `lib/migrations/0001_initial_schema.sql` (ou converter `lib/migrations/` em “mirror” explícito) e atualizar referências em `specs/001-consolidate-migrations/research.md`
- [ ] T012 [US1] Ajustar o bundle serverless para incluir migrations canônicas em `next.config.ts` (incluir `supabase/migrations/**/*` na rota `app/api/setup/migrate/route.ts`)
- [ ] T013 [US1] Atualizar `app/api/setup/migrate/route.ts` para usar `supabase/migrations` como fonte primária e validar presença no runtime (erro claro se não existir)
- [ ] T014 [US1] Implementar guard-rail de DB não-vazio na rota `app/api/setup/migrate/route.ts` usando `lib/migrations/db-safety.ts` (falhar cedo sem executar nada)
- [ ] T015 [US1] Atualizar `app/api/setup/auto-migrate/route.ts` para usar o baseline canônico (mesma fonte) e evitar divergência entre caminhos
- [ ] T016 [US1] Resolver numeração duplicada de migrations em `supabase/migrations/` (renomear `0006_*` e `0018_*` para versões únicas e ordenação determinística)
- [ ] T017 [US1] Adicionar validação automática de “prefixos duplicados” no loader em `lib/migrations/fs-migrations.ts` e falhar com mensagem orientativa
- [ ] T018 [P] [US1] Documentar fluxo “bootstrap do zero” em `specs/001-consolidate-migrations/quickstart.md` apontando para o baseline canônico

## Fase 4 — User Story 2 (P2): Validar equivalência (parity check)

Objetivo do story: uma validação automatizada prova que baseline == full chain e gera relatório legível quando diverge.

Teste independente (critério): rodar parity check em CI/local → passa quando igual; falha e mostra diff quando diferente.

- [ ] T019 [P] [US2] Criar script principal do parity check em `scripts/schema-parity-check.ts` (orquestra DB A e DB B)
- [ ] T020 [P] [US2] Criar utilitário de snapshot (pg_dump) em `scripts/schema-parity/pg-dump.ts` (schema-only, normalização básica)
- [ ] T021 [P] [US2] Criar utilitário de snapshots de catálogo em `scripts/schema-parity/catalog-snapshots.ts` usando queries de `specs/001-consolidate-migrations/contracts/schema-snapshots.sql`
- [ ] T022 [P] [US2] Criar gerador de relatório (diff + resumo) em `scripts/schema-parity/report.ts` (saída em `tmp/schema-parity/report.md`)
- [ ] T023 [US2] Implementar criação de DB A/DB B efêmeras em `scripts/schema-parity/db-lifecycle.ts` com **Docker Postgres como padrão** e fallback para `DATABASE_URL` com schemas isolados quando Docker não estiver disponível
- [ ] T024 [US2] Aplicar baseline em DB A usando loader `lib/migrations/fs-migrations.ts` (somente `0001_*`) em `scripts/schema-parity-check.ts`
- [ ] T025 [US2] Aplicar full chain em DB B (todas migrations) em `scripts/schema-parity-check.ts`
- [ ] T026 [US2] Comparar dumps e snapshots e retornar exit code não-zero na divergência em `scripts/schema-parity-check.ts`
- [ ] T027 [US2] Adicionar teste automatizado (Vitest) que executa o parity check em modo “smoke” (mock/skip se faltar Docker) em `lib/schema-parity.test.ts`
- [ ] T028 [US2] Documentar `npm run schema:parity` como gate local (pré-merge/CI) em `specs/001-consolidate-migrations/quickstart.md` e explicar como interpretar `tmp/schema-parity/report.md`

## Fase 5 — User Story 3 (P3): Proteger ambientes existentes

Objetivo do story: impedir aplicação acidental do baseline em staging/prod e fornecer caminho seguro (read-only + repair de histórico).

Teste independente (critério): tentar rodar bootstrap em DB não-vazia → falha cedo e claramente; validar equivalência em DB existente funciona sem recriar banco.

- [ ] T029 [US3] Implementar detecção robusta de “DB já inicializada” em `lib/migrations/db-safety.ts` (ex.: presença de tabelas do produto / schema version)
- [ ] T030 [US3] Aplicar o guard-rail também em `app/api/setup/auto-migrate/route.ts` (não permitir baseline em DB não-vazio)
- [ ] T031 [US3] Criar endpoint opcional read-only de validação (se adotado) em `app/api/setup/validate-schema/route.ts` (executa snapshots e retorna relatório)
- [ ] T032 [US3] Documentar procedimento seguro de `supabase migration repair` em `specs/001-consolidate-migrations/quickstart.md` (quando usar, checklist de backup)
- [ ] T033 [US3] Criar script auxiliar “history repair guide” (somente imprime instruções e valida pré-condições) em `scripts/migration-history-repair-guide.ts`

## Fase Final — Polimento & cross-cutting

- [ ] T034 [P] Normalizar logs/telemetria dos scripts (níveis, prefixos) em `lib/logger.ts` (ou criar `scripts/schema-parity/logger.ts`)
- [ ] T035 [P] Adicionar documentação curta no `README.md` apontando para `specs/001-consolidate-migrations/quickstart.md`
- [ ] T036 Garantir que `npm run lint` e `npm run build` continuam passando (ajustes finais conforme necessário) em `eslint.config.mjs`/`tsconfig.json` se precisar

## Dependências (ordem de entrega)

- US1 (P1) → bloqueia US2 e US3 (baseline canônico é pré-requisito)
- US2 (P2) pode evoluir em paralelo com a documentação de US3 após US1

Grafo (alto nível):

US1 → US2

US1 → US3

## Exemplos de paralelização (por story)

- US1: T012 (next.config) [P] pode ocorrer em paralelo com T018 (docs quickstart) [P] e com T016 (renomear migrations) após T010.
- US2: T020/T021/T022 [P] podem ser feitos em paralelo (arquivos diferentes), antes de integrar no T019.
- US3: T032 [P] (docs) pode ocorrer em paralelo com T029/T030 (guard-rails).

## Estratégia de implementação (MVP primeiro)

- **MVP**: entregar US1 (baseline único + bundling correto + rota de migrate segura).
- Depois: US2 (parity check forte como gate), então US3 (hardening operacional + endpoint read-only opcional).

- [ ] T037 [US1] Criar teste/smoke de rerun do baseline (2ª execução) garantindo idempotência **ou** falha segura antes de alterações (sem estado parcial)

## Validação de formato

- Todas as linhas de task acima seguem: `- [ ] T### [P] [US#] descrição + caminho de arquivo`.
- Setup/Fundacional/Final não usam label `[US#]`.

