# App Substituicao

Monorepo com frontend Angular e backend Spring Boot para consulta de equivalencias alimentares, autenticacao com JWT, gestao administrativa de alimentos e usuarios, e integracao de pagamento via Stripe.

## Visao geral

O projeto esta dividido em duas aplicacoes:

- `frontend/`: SPA em Angular 20 com rotas protegidas, pagina de consulta de equivalencias, area administrativa e fluxo de pagamento.
- `backend/`: API REST em Spring Boot 3.5 com autenticacao JWT, persistencia em MySQL, migrations Flyway, Swagger e integracao Stripe.

## Principais funcionalidades

- Login com JWT e controle de acesso por perfil (`ADMIN`, `NUTRICIONISTA`, `PACIENTE`)
- Catalogo de alimentos com filtros, paginação e calculo dinamico de equivalencias caloricas
- CRUD administrativo de alimentos
- CRUD administrativo de usuarios com ativacao e desativacao
- Pagina de planos e fluxo de checkout/portal com Stripe
- Bootstrap opcional de usuario administrador via propriedades

## Stack

| Camada | Tecnologias |
| --- | --- |
| Frontend | Angular 20, TypeScript 5.9, SCSS, Bootstrap 5, Font Awesome |
| Backend | Java 21, Spring Boot 3.5, Spring Security, Spring Data JPA, Flyway, SpringDoc |
| Infra | MySQL 8, Maven Wrapper, npm, Stripe |

## Estrutura do repositorio

```text
.
|-- backend/
|   |-- src/main/java/br/com/sistema/alimentos/
|   |-- src/main/resources/
|   `-- pom.xml
|-- frontend/
|   |-- src/app/
|   |-- src/environments/
|   `-- package.json
`-- docs/
```

## Requisitos

- Java 21
- Node.js 18+ e npm
- MySQL 8
- Conta Stripe para testar checkout/portal

## Como rodar

### Backend

1. Crie um arquivo `backend/src/main/resources/application-local.properties`.
2. Configure, no minimo:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/equivalencia_alimentar?createDatabaseIfNotExist=true&serverTimezone=UTC&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=sua_senha
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

app.cors.allowed-origins=http://localhost:4200,http://localhost:5173

jwt.secret=uma_chave_com_32_ou_mais_caracteres
jwt.expiration=86400000

stripe.api.key=sk_test_...
stripe.webhook.secret=whsec_...
stripe.price.padrao=price_...
```

3. Inicie a API:

```bash
cd backend
./mvnw spring-boot:run
```

4. Acesse:

- API: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

### Frontend

1. Instale dependencias:

```bash
cd frontend
npm install
```

2. Verifique a URL da API em `frontend/src/environments/environment.ts`.
3. Inicie a aplicacao:

```bash
npm start
```

4. Acesse `http://localhost:4200`.

## Banco e migrations

As migrations ficam em `backend/src/main/resources/db/migration` e mostram a evolucao funcional do projeto:

- `V1__init.sql`: estrutura inicial
- `V2__seed_alimentos.sql`: carga inicial do catalogo
- `V3__add_cpf_usuario.sql`: CPF em usuarios
- `V4__migrate_plano_padrao.sql`: migracao de planos antigos para `PADRAO`
- `V5__seed_equivalencias.sql`, `V6__add_quantidade_gramas_equivalencias.sql`, `V7__drop_equivalencias.sql`: historico do modelo antigo de equivalencias persistidas
- `V8__add_trial_plano.sql`: novo padrao `TRIAL` para usuarios

O codigo atual nao usa mais a tabela `equivalencias` como regra principal de negocio; as equivalencias sao calculadas dinamicamente no backend com base nas calorias dos alimentos do mesmo grupo.

## Endpoints principais

| Metodo | Rota | Observacao |
| --- | --- | --- |
| `POST` | `/api/v1/auth/login` | Login |
| `GET` | `/api/v1/alimentos/catalogo` | Catalogo agrupado por grupo alimentar |
| `GET` | `/api/v1/alimentos` | Lista paginada e filtravel |
| `GET` | `/api/v1/alimentos/{id}` | Busca por ID |
| `GET` | `/api/v1/alimentos/{id}/equivalencias?quantidadeGramas=100` | Calculo dinamico |
| `POST` | `/api/v1/alimentos` | `ADMIN` ou `NUTRICIONISTA` |
| `PUT` | `/api/v1/alimentos/{id}` | `ADMIN` ou `NUTRICIONISTA` |
| `DELETE` | `/api/v1/alimentos/{id}` | `ADMIN` |
| `GET` | `/api/v1/usuarios` | `ADMIN` |
| `POST` | `/api/v1/pagamentos/checkout` | Checkout Stripe |
| `GET` | `/api/v1/pagamentos/portal` | Portal Stripe |
| `POST` | `/api/v1/pagamentos/webhook` | Webhook publico |

## Qualidade verificada

Validacao executada neste ambiente:

- `backend`: `mvn test` passou com `60` testes
- `frontend`: `npm run build` passou e gerou `frontend/dist/frontend-food-equivalence`

## Achados importantes

- A documentacao antiga em `docs/` estava desatualizada e foi consolidada.
- Existe divergencia de contrato entre frontend e backend no fluxo de pagamento:
  - o frontend ainda envia `plano` no checkout, mas o backend aceita apenas `successUrl` e `cancelUrl`
  - o backend exige `returnUrl` em `GET /pagamentos/portal`, mas o frontend nao envia esse parametro
- `StripeService` ainda nao implementa a logica de ativacao/cancelamento dentro dos webhooks; os metodos privados existem, mas estao vazios.
- O projeto mistura historico de planos antigos (`FREE`, `BASIC`, `PRO`) com o modelo atual (`TRIAL`, `PADRAO`) em partes do frontend e em migrations legadas.

## Documentacao

- [docs/README.md](docs/README.md)
- [docs/DOCUMENTATION_AUDIT.md](docs/DOCUMENTATION_AUDIT.md)
- [docs/STRIPE_INTEGRATION.md](docs/STRIPE_INTEGRATION.md)
