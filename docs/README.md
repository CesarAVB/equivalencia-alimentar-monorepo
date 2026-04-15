# Documentacao

Esta pasta foi reorganizada para refletir o estado atual do projeto. Os quatro arquivos antigos de Stripe foram removidos porque estavam com encoding corrompido, descreviam uma arquitetura antiga de multiplos planos e duplicavam informacoes.

## Arquivos atuais

- `DOCUMENTATION_AUDIT.md`: inventario da documentacao, inconsistencias encontradas e recomendacoes
- `STRIPE_INTEGRATION.md`: guia atual da integracao Stripe com base no codigo

## Criterio de manutencao

Antes de criar novos documentos, prefira:

1. Atualizar o `README.md` da raiz quando a informacao for operacional.
2. Registrar detalhes tecnicos em `docs/` apenas quando forem especificos de um subsistema.
3. Evitar documentos duplicados para o mesmo fluxo.

## Proximas docs recomendadas

- Um guia de setup local completo com `application-local.properties`
- Um documento de contrato frontend/backend para login, usuarios, alimentos e pagamentos
- Um changelog funcional das migrations caso o dominio continue mudando
