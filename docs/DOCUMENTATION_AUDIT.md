# Documentation Audit

Data da analise: 2026-04-14

## Resumo executivo

A pasta `docs/` precisava de refatoracao imediata. Os documentos existentes estavam tecnicamente incorretos para o estado atual do projeto, com texto corrompido por encoding, forte redundancia e descricao de contratos que nao correspondem ao codigo.

## O que foi encontrado

### Problemas de qualidade documental

- Todos os arquivos antigos apresentavam caracteres corrompidos.
- Havia quatro documentos distintos para Stripe com conteudo sobreposto.
- Nenhum documento antigo estava indexado por um `docs/README.md`.

### Divergencias entre documentacao antiga e codigo

- A documentacao antiga descrevia planos `FREE`, `BASIC` e `PRO`.
- O backend atual usa `PlanoTipo` com `TRIAL` e `PADRAO`.
- A documentacao antiga dizia que `CheckoutRequest` recebia `plano`, mas o backend atual recebe apenas `successUrl` e `cancelUrl`.
- A documentacao antiga indicava variaveis `stripe.price.basic` e `stripe.price.pro`, mas o backend atual usa apenas `stripe.price.padrao`.
- O modelo antigo mencionava CRUD persistido de equivalencias; o backend atual calcula equivalencias dinamicamente por calorias e a tabela legada foi removida do fluxo ativo.

### Inconsistencias reais do projeto que impactam a documentacao

- O frontend ainda opera parcialmente com contratos antigos de pagamento.
- O frontend ainda usa tipos de plano antigos no model (`FREE`, `DEMO`, `BASIC`, `PRO`) junto com os novos (`trial`, `padrao`).
- O metodo `PagamentoService.abrirPortal()` nao envia `returnUrl`, apesar de o backend exigir esse parametro.
- A pagina de sucesso do pagamento atualiza a sessao local com `BASIC`, valor que nao corresponde ao enum atual do backend.
- `StripeService` possui os handlers de webhook ainda nao implementados.

## Decisao tomada

### Removidos

- `STRIPE_SETUP.md`
- `STRIPE_SETUP_STEPS.md`
- `STRIPE_ARCHITECTURE.md`
- `STRIPE_CLASSES_REFERENCE.md`

Motivo: estavam obsoletos, redundantes e atrapalhavam mais do que ajudavam.

### Criados

- `docs/README.md`
- `docs/DOCUMENTATION_AUDIT.md`
- `docs/STRIPE_INTEGRATION.md`

### Mantido

- `README.md` na raiz como ponto de entrada da documentacao do projeto

## Necessidade de novas docs

### Necessarias

- Guia de setup local consolidado com backend, frontend, banco e Stripe
- Documento curto de contratos de API consumidos pelo frontend
- Documento de decisao arquitetural explicando a mudanca de equivalencias persistidas para calculo dinamico

### Nao necessarias agora

- Mais de um documento para Stripe
- Documentos separados por classe Java
- Diagramas extensos sem manutencao automatizada

## Recomendacao de refatoracao futura

1. Corrigir os contratos de pagamento entre frontend e backend.
2. Atualizar os tipos de plano do frontend para um unico modelo coerente.
3. So depois disso, complementar a documentacao com exemplos de payload reais.
