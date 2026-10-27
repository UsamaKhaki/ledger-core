# API Reference

All endpoints are defined once in `src/lib/api/contract.ts` (ts-rest) and served
by a single catch-all handler at `src/app/api/[...ts-rest]/route.ts`. Prefer the
typed client (`src/lib/api/client.ts`) over raw `fetch` — it derives request and
response types directly from the contract.

```ts
import { api } from "@/lib/api/client";

const res = await api.auth.login({ body: { email, password } });
if (res.status === 200) {
  res.body.user; // typed AuthUser
}
```

Auth uses an httpOnly `ledger_session` cookie. Because the client is same-origin,
the cookie is sent/received automatically.

## Types

```ts
type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string; // ISO
};
```

## Endpoints

### `POST /api/auth/signup` — `api.auth.signup`
Create an account and start a session.

- **Body:** `{ email: string; password: string; name?: string }`
- **200:** `{ user: AuthUser }`
- **400:** `{ error: string }` (invalid email, weak password, or email taken)

### `POST /api/auth/login` — `api.auth.login`
Verify credentials and start a session.

- **Body:** `{ email: string; password: string }`
- **200:** `{ user: AuthUser }`
- **401:** `{ error: string }` (no such account / wrong password)

### `POST /api/auth/logout` — `api.auth.logout`
End the current session (clears the cookie). No body.

- **200:** `{ ok: boolean }`

### `GET /api/auth/me` — `api.auth.me`
Resolve the current session user.

- **200:** `{ user: AuthUser | null }`

## curl

```bash
# signup (stores the session cookie in cj.txt)
curl -c cj.txt -X POST localhost:6101/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.co","password":"secret123","name":"Ada"}'

# who am I (send the cookie)
curl -b cj.txt localhost:6101/api/auth/me

# logout
curl -b cj.txt -c cj.txt -X POST localhost:6101/api/auth/logout
```

## Debts — `api.debts.*`

Backed by an in-memory store seeded from `src/lib/api/fixtures.ts` (dummy data
today; Supabase later). The planner (`/app`) reads and mutates through these.

### `GET /api/debts` — `api.debts.list`
- **200:** `{ debts: Debt[] }`

### `POST /api/debts` — `api.debts.create`
- **Body:** `{ name: string; balance: number; apr: number; minPayment: number }`
- **200:** `{ debt: Debt }` · **400:** `{ error: string }`

### `PATCH /api/debts/:id` — `api.debts.update`
- **Body:** `Partial<{ name; balance; apr; minPayment }>`
- **200:** `{ debt: Debt }` · **404:** `{ error: string }`

### `DELETE /api/debts/:id` — `api.debts.remove`
- **200:** `{ ok: boolean }`

### `POST /api/debts/clear` — `api.debts.clear`
- Deletes all debts + payments. **200:** `{ ok: boolean }`

## Payments — `api.payments.*`

### `GET /api/payments` — `api.payments.list`
- **200:** `{ payments: Payment[] }`

### `POST /api/payments` — `api.payments.log`
- **Body:** `{ debtId: string; amount: number }`
- **200:** `{ payment: Payment; debt: Debt; cleared: boolean }` — `cleared` is
  true when this payment brought the debt to zero.
- **400/404:** `{ error: string }`

`Debt` and `Payment` types live in `src/lib/types.ts`. The payoff **plan**
(schedule, debt-free date, comparison) is computed client-side from the debts via
`buildPlan` in `src/lib/debt.ts` — it isn't a separate endpoint.

## Adding an endpoint

1. Add the route to a contract in `src/lib/api/contract.ts` (use `c.type<T>()`
   for bodies/responses, `c.noBody()` for empty bodies).
2. Implement it in the router inside `src/app/api/[...ts-rest]/route.ts`.
3. Call it via `api.<resource>.<route>(...)`. Types flow automatically.

Runtime validation (zod) can be added to contract schemas later; today validation
is done manually inside the provider.
