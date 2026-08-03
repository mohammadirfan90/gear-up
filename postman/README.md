# GearUp API — Postman Collection

A complete Postman collection covering every endpoint of the GearUp sports & outdoor gear rental backend.

## Import

1. Open Postman → **Import** → **File** → select `GearUp.postman_collection.json`
2. The collection ships with a `baseUrl` variable pointing at `http://localhost:4000/api`. Adjust it to point at your staging or production URL.

## Authentication flow

The collection uses a **Bearer** auth at the collection level, sourced from the `accessToken` variable. After any successful login/register, the test script persists the issued tokens into the collection variables so subsequent requests pick them up automatically.

### Recommended order of first-time setup

1. **Run `POST /auth/register`** as a customer (or use the seeded admin — see below).
2. **Run `POST /auth/register`** as a provider.
3. **Run `POST /auth/login`** as admin (uses the seeded credentials below).
4. Manually copy the admin's `id` from the response and paste it into the `adminId` collection variable.
5. Continue with the Gear, Rentals, Payments, Reviews, and Admin folders in order.

Variables that auto-populate from successful responses:

| Variable         | Source                                  |
|------------------|-----------------------------------------|
| `accessToken`    | login / register / refresh responses    |
| `refreshToken`   | login / register responses              |
| `customerId`     | customer register response              |
| `providerId`     | provider register response              |
| `adminId`        | admin login response                    |
| `categoryId`     | create-category response                |
| `gearItemId`     | create-gear / first gear list response  |
| `rentalOrderId`  | create-rental response                  |
| `paymentId`      | create-payment response                 |
| `reviewId`       | create-review response                  |

## Seeded admin credentials

If your `.env` follows `.env.example`, the admin user is automatically seeded on first migration:

```
email:    admin@gearup.com
password: Admin@12345
```

Change these in `.env` before running migrations in production.

## Stripe webhook simulation

The webhook endpoint (`POST /api/payments/webhook`) is **not authenticated by JWT** — it is authenticated by Stripe's signature header. To exercise it locally:

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Forward events to your local server:
   ```bash
   stripe listen --forward-to localhost:4000/api/payments/webhook
   ```
   The CLI prints a `whsec_...` signing secret — copy it into `.env` as `STRIPE_WEBHOOK_SECRET`.
3. Trigger a synthetic event:
   ```bash
   stripe trigger payment_intent.succeeded
   ```
   The CLI signs the request with the same secret, so the server's signature verification will pass.

> ⚠️ The "Webhook (Stripe → server)" request in this collection is a hand-crafted template. Replace `{{stripeSignature}}` and `{{stripePaymentIntentId}}` with valid values from a real Stripe event, or use the CLI flow above for an end-to-end test.

## Cross-role endpoint summary

| Folder         | Roles that can access                                           |
|----------------|-----------------------------------------------------------------|
| Health         | public                                                          |
| Authentication | public (register/login/refresh), JWT (logout/me)                |
| Categories     | public (list/get), admin (create/update/delete)                 |
| Gear Catalog   | public (list/get), provider (create/update/delete own)          |
| Rentals        | customer (create/list mine), customer/provider (getById), customer (cancel), provider (incoming + status), admin (list all) |
| Payments       | customer (create/list mine/get own), admin (list all), **Stripe** (webhook) |
| Reviews        | customer (create), public (list-for-gear/getById)               |
| Admin          | admin only                                                      |

## Response envelope

All JSON responses follow the project's consistent envelope:

```json
{
  "success": true,
  "message": "Human-readable status",
  "data": { ... }
}
```

Errors use:

```json
{
  "success": false,
  "message": "Human-readable error",
  "errorDetails": { "field": "explanation" }
}
```

Common HTTP codes:

| Code | Meaning                              |
|------|--------------------------------------|
| 200  | OK                                   |
| 201  | Created                              |
| 400  | Validation error / business rule     |
| 401  | Missing or invalid JWT               |
| 403  | Forbidden (role/suspension/ownership)|
| 404  | Resource not found                   |
| 409  | Conflict (state, duplicate, etc.)    |
| 500  | Unhandled server error               |
