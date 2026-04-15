# Stripe Integration

Este documento descreve a integracao Stripe conforme o codigo atual do projeto.

## Estado atual

O backend expoe tres endpoints:

- `POST /api/v1/pagamentos/checkout`
- `GET /api/v1/pagamentos/portal`
- `POST /api/v1/pagamentos/webhook`

O checkout usa um unico `Price ID` configurado por `stripe.price.padrao`.

## Configuracao

### Desenvolvimento

Defina em `backend/src/main/resources/application-local.properties`:

```properties
stripe.api.key=sk_test_...
stripe.webhook.secret=whsec_...
stripe.price.padrao=price_...
```

### Producao

Defina as variaveis:

```text
STRIPE_API_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_PADRAO
```

## Contratos atuais do backend

### Checkout

`POST /api/v1/pagamentos/checkout`

Payload aceito:

```json
{
  "successUrl": "http://localhost:4200/pagamento/sucesso",
  "cancelUrl": "http://localhost:4200/pagamento/cancelado"
}
```

Resposta:

```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### Portal

`GET /api/v1/pagamentos/portal?returnUrl=http://localhost:4200/planos`

Resposta:

```json
{
  "url": "https://billing.stripe.com/..."
}
```

### Webhook

`POST /api/v1/pagamentos/webhook`

Cabecalho obrigatorio:

```text
Stripe-Signature: ...
```

Eventos tratados no codigo:

- `checkout.session.completed`
- `customer.subscription.deleted`

## Limitacoes atuais

- Os handlers privados de webhook ainda estao vazios em `StripeService`.
- A aplicacao valida que `stripe.price.padrao` exista e comece com `price_`.
- O frontend ainda nao esta 100% alinhado ao contrato atual do backend.

## Divergencias do frontend

Hoje o frontend:

- envia `plano` no checkout, embora o backend nao aceite esse campo
- chama o portal sem `returnUrl`
- atualiza a sessao local para `BASIC` apos sucesso, embora o backend trabalhe com `TRIAL` e `PADRAO`

Esses pontos devem ser corrigidos antes de expandir a documentacao com exemplos end-to-end.
