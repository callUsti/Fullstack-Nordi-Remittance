# Integration Layer Audit & Engineering Standard

> **Purpose:** Give the repository-auditing AI agent a rigorous, evidence-driven standard for inspecting, improving, and validating every connection between application clients and backend or external services.
>
> **Scope:** API and data integration only: transport, contracts, DTOs, domain models, repositories, use cases, query hooks, state/cache coordination, pagination, data composition, streaming, websockets, webgrpc, error handling, security, reliability, and performance.
>
> **Out of scope:** General software architecture, visual design, UX redesign, component styling, and broad frontend code-quality reviews except where they directly affect data integration.
>
> **Platforms:** Next.js, React for web, React Native, Flutter, and desktop applications (including Electron/Tauri/native desktop where present).
>
> **Operating principle:** Preserve proven engineering fundamentals—explicit contracts, clear ownership, deterministic data flow, bounded work, predictable failure handling—and use modern capabilities only where they measurably improve correctness, latency, maintainability, or user experience. Do not adopt a tool or abstraction merely because it is fashionable.

---

## 1. Instructions to the auditing agent

You are auditing the **integration/bridge data layer**, not redesigning the whole application. Your job is to discover how data actually travels from a UI action to a remote system and back, determine whether that flow is correct and efficient, compare it with the backend's real contract and business rules, and identify the smallest safe changes that produce a reliable system.

### 1.1 Mandatory rules

1. **Inspect before recommending.** Discover the frameworks, versions, package managers, folder conventions, API clients, query libraries, state stores, generated clients, backend services, and deployment boundaries that actually exist. Do not assume a preferred stack is installed.
2. **Trace real execution paths.** For every important screen or feature, trace: UI event/render → hook/view model → use case/application service (if needed) → repository → API service/transport → backend route/controller → validation → domain/service logic → persistence or upstream provider → response mapping → UI state.
3. **Verify both sides.** A frontend field name or TypeScript type is not proof that the backend returns that field. Compare actual request and response schemas, serializers, validation rules, auth requirements, pagination rules, status codes, and business calculations with backend implementation or the canonical API specification.
4. **Cite evidence in the audit report.** Every finding must include file paths and line ranges or symbol names, the observed behavior, why it matters, severity, and a recommended correction. Mark anything that cannot be verified as `UNVERIFIED`; never invent endpoint behavior.
5. **Do not perform a blind rewrite.** First produce an integration inventory and findings. Preserve working conventions unless they are demonstrably unsafe or inefficient. Make incremental, testable changes. Do not introduce duplicate clients, competing caches, or new libraries without justification.
6. **Respect platform differences.** Share contracts and domain rules where practical, but do not force web-only libraries into Flutter or native desktop. TanStack Query is a React ecosystem tool, not a universal cross-platform data layer.
7. **Keep UI files declarative.** UI components should render state and dispatch intent. They should not own HTTP requests, endpoint URLs, token refresh, response normalization, multi-endpoint orchestration, pagination algorithms, complex mapping, or business calculations.
8. **Avoid needless layers.** A use case is justified when it coordinates multiple repositories, applies meaningful business rules, is reused, or otherwise removes substantial complexity. Do not create a trivial use-case class for every one-line CRUD call solely to satisfy a pattern.
9. **Do not duplicate sources of truth.** Server-owned data belongs in the repository/server-state mechanism. UI-only state belongs in local state or a UI store. Derived data should normally be computed from canonical source data rather than copied into a second mutable store.
10. **Never weaken security to make integration easier.** Do not expose secret API keys in browser/mobile/desktop renderer bundles, disable TLS checks, bypass authorization, log credentials, or persist sensitive responses without an explicit security design.
11. **Do not silently change business semantics.** If a calculation, aggregate, permission, eligibility rule, balance, price, tax, status transition, or ownership rule is unclear, flag it and ask for backend confirmation in the report. Do not guess.
12. **Measure before optimizing.** Distinguish measured latency or request volume from a theoretical risk. Recommend profiling and telemetry where evidence is missing.
13. **Audit first, refactor second.** Unless the user explicitly authorizes implementation in the same task, do not edit application source, upgrade dependencies, change API contracts, or run migrations during the initial audit. Produce the evidence-based audit report and prioritized plan first.
14. **Do not force migrations.** Do not replace Axios with fetch, REST with GraphQL, polling with WebSockets, or one state library with another merely to match this document. Recommend a migration only when the current implementation has a demonstrated problem and the migration's benefits outweigh its risks.

### 1.2 Required audit sequence

Run these phases in order:

- **Phase A — Discovery:** map platforms, versions, apps/packages, API entry points, backend services, and all data-related dependencies.
- **Phase B — Integration inventory:** enumerate endpoints and non-HTTP connections, callers, request parameters, response types, auth model, caching, retry, pagination, and backend owner.
- **Phase C — Trace and contract verification:** follow real feature flows through frontend and backend; verify DTOs, domain mappings, validation, and calculations.
- **Phase D — Reliability and performance review:** inspect redundant calls, waterfalls, fan-out, cancellation, caching, retries, timeouts, payload size, pagination, and background behavior.
- **Phase E — Security review:** inspect credentials, token lifecycle, authorization boundaries, tenant isolation, sensitive cache data, uploads, webhooks, and third-party API use.
- **Phase F — Findings and remediation:** score severity and impact; propose the least invasive fix; identify backend work separately from client work.
- **Phase G — Verification:** run type checks, tests, lint/build, API contract checks, and targeted request/performance tests. State what was not run.

Do not skip discovery and jump straight to editing hooks.

---

## 2. Target integration flow and ownership

Use this as the default dependency direction. Adapt names to the host framework and our project existing structure , but preserve the responsibilities and boundaries.

```text
UI / Screen / Widget
        │ user intent + rendered state
        ▼
Query Hook / ViewModel / Controller
        │ parameters, loading/error state, mutation lifecycle
        ▼
Use Case / Application Service (only when orchestration or business logic warrants it)
        │ coordinates repositories and applies client-side domain rules
        ▼
Repository and types (source of truth for a domain resource)
        │ maps DTOs to domain models; owns resource policy
        ▼
API Service / Data Source Adapter
        │ endpoint-specific request/response mapping
        ▼
Transport Client (Axios / fetch / Dio / package:http / native client)
        │ auth attachment, timeout, cancellation, tracing, normalized transport errors
        ▼
Backend API / BFF / Gateway
        ▼
Backend application/domain services → database / cache / upstream APIs
```

### 2.1 Responsibility boundaries

| Layer | Owns | Must not own |
|---|---|---|
| UI (`.tsx`, React component, Flutter widget) | Rendering, user input, local ephemeral state, invoking a hook/view model | Endpoint URLs, Axios/fetch calls, parsing raw API payloads, business calculations, cache invalidation rules |
| Query hook / ViewModel | Query parameters, invoking use cases/repositories, mapping state to presentation state, mutation lifecycle | Duplicated endpoint logic, raw transport setup, cross-feature data ownership |
| Use case / application service | A user/business operation; multi-repository orchestration; business rules that genuinely belong on the client | Low-level HTTP details, generic cache configuration, UI rendering |
| Repository | Canonical client-side access to a domain resource; source selection; DTO-to-domain mapping; resource-level caching/synchronization policy | Direct dependencies on other repositories; presentation-specific formatting; hidden UI side effects |
| API service / data source | Endpoint calls, query serialization, payload mapping, runtime validation at the boundary | UI state, business decisions, cross-screen orchestration |
| Transport client | Base URL, headers, auth attachment, timeout, cancellation, request IDs, transport-level error normalization | Feature business logic, automatic retries of arbitrary mutations, global response transformations that destroy endpoint metadata |
| Backend | Authorization, canonical business rules, validation, aggregation where efficient, consistency, pagination, data ownership | Trusting client-supplied permissions, totals, prices, balances, or derived security-sensitive fields |

**Important:** Repositories should generally not depend on other repositories. When a workflow requires data from several repositories, coordinate them in a use case/domain/application service. For a read model that is expensive to assemble or requires transactional consistency, prefer a backend aggregation/BFF endpoint rather than making every client perform many requests.

### 2.2 Single source of truth (SSOT)

For every mutable domain resource, identify one authoritative owner:

- Remote truth: backend owns the canonical persisted state.
- Client server-state cache: holds a temporary replica/snapshot of remote truth (for example, TanStack Query in React).
- Local durable state: only for explicitly offline-first or user-owned local data, with a defined synchronization/conflict policy.
- UI state: filters in progress, modal visibility, selected tab, draft input, expanded rows, and other presentation-only values.

Do not keep the same server entity independently in TanStack Query, Zustand/Redux, component state, and a custom cache unless there is a specific synchronization design. Do not mutate query data outside the cache API. Do not treat a client cache as the authoritative source for financial or authorization decisions.

---

## 3. Integration inventory: discover every connection type

The agent must inventory more than REST endpoints. Search for all HTTP libraries, SDKs, generated clients, GraphQL clients, WebSocket/SSE connections, native plugins, database clients, queues, OAuth providers, storage services, and third-party APIs.

### 3.1 Connection and API categories

| Type | Appropriate use | Integration checks |
|---|---|---|
| REST/HTTP JSON | Resource-oriented CRUD, search, commands, uploads/download metadata | Method semantics, status codes, schema, idempotency, pagination, cache headers, auth, timeouts |
| GraphQL | Client-specific nested reads, field selection, graph-shaped data | Query depth/complexity, persisted queries, pagination, N+1 prevention, authorization at every field, normalized cache policy |
| RPC / typed RPC (for example tRPC) | Strongly typed procedure calls in a controlled TypeScript ecosystem | Contract/version coupling, input validation, auth context, batching, error mapping, transport compatibility |
| gRPC / Protocol Buffers | Efficient typed service-to-service or supported native-client communication, streaming | Browser compatibility/gRPC-Web or gateway, deadlines, status mapping, schema evolution, stream lifecycle |
| WebSocket | Bidirectional, low-latency live updates or collaborative operations | Auth handshake, reconnect/backoff, heartbeat, event ordering, deduplication, backpressure, unsubscribe/cleanup |
| Server-Sent Events (SSE) | Server-to-client event streams, progress, notifications, token streaming | Reconnection, event IDs, retry behavior, heartbeat, proxy buffering, auth strategy, stream cleanup |
| Webhooks | Provider-to-backend event delivery | Signature verification, replay protection, idempotent processing, delivery retries, event versioning; never receive provider webhooks directly in a browser/mobile client |
| OAuth 2.0 / OpenID Connect | Delegated identity and third-party authorization | Authorization Code + PKCE for public clients, state/nonce, issuer/audience validation, scoped tokens, refresh and revocation |
| Provider SDK / custom API | Payments, maps, identity, analytics, messaging, AI providers, storage, etc. | Server/client trust boundary, SDK version, data mapping, rate limits, retries, webhook reconciliation, vendor lock-in adapter |
| Object storage / file transfer | Images, documents, exports, large files | Presigned URLs, multipart/resumable upload, checksums, file size/type limits, cancellation, progress, access expiry |
| Message broker / queue | Asynchronous backend workflows and event processing | Client must normally call a backend API, not connect directly to internal Kafka/RabbitMQ or a private broker; use status/poll/SSE/WS for progress |
| Database connection | Backend persistence | Never expose production database credentials or unrestricted direct database access to untrusted client applications |

### 3.2 API selection rules

Do not choose a protocol because it is newer. Choose based on the operation's semantics and measured needs.

- Use **REST** for most ordinary resource operations and when HTTP caching, simple tooling, and broad client support matter.
- Use **GraphQL** when clients materially benefit from flexible graph-shaped field selection. It is not automatically faster; guard query complexity, list sizes, and server-side N+1 patterns.
- Use **gRPC** for typed high-performance service communication or supported native clients; browsers generally need a compatible gateway or gRPC-Web layer.
- Use **WebSocket** only when two-way real-time communication is required. For server-to-client notifications/progress only, evaluate SSE first because it is simpler.
- Use **polling** when update frequency is low, the server does not support push, or a simple bounded refresh is sufficient. Stop or slow polling when the view/app is inactive.
- Use **webhooks** for inbound provider events, but process them on the backend and expose the resulting application state through a normal authenticated API or stream.
- Use **BFF/aggregation endpoints** when multiple remote calls are required for a single screen, when cross-service joins are costly, or when consistency/business rules must be enforced server-side.
- Do not let a mobile or browser client call internal microservices individually just because those service URLs exist. Prefer a stable public API boundary.

### 3.3 Inventory fields

For each integration, record:

- Feature and business capability.
- Client platform(s) and entry file(s).
- Provider/service and protocol.
- Base URL, endpoint/procedure/event name (redact secrets and sensitive query values).
- HTTP method or operation type.
- Request DTO, required/optional fields, validation, query parameters, serialization rules.
- Response DTO, nullable fields, envelope shape, pagination metadata, headers.
- Authentication/authorization method and required scopes/roles/tenant context.
- Timeout/deadline, cancellation support, retry policy, idempotency behavior.
- Cache layers, freshness policy, invalidation triggers, persistence policy.
- Call frequency and trigger: mount, focus, keystroke, polling, mutation, push event, background task.
- Backend owner/route/controller/service and canonical contract source.
- Rate limits, payload limits, provider quotas, and known failure modes.
- Tests, telemetry, trace/correlation identifiers.

---

## 4. API contracts, types, and schema integrity

### 4.1 Contract-first integration

Use a canonical, versioned contract wherever possible. For HTTP APIs, OpenAPI is the preferred machine-readable contract when the backend supports it. For GraphQL, use the schema and generated operation types. For gRPC, use the `.proto` definitions. For custom/event protocols, maintain explicit versioned schemas and event examples.

The agent must identify the source of truth and compare it with:

- frontend request and response types;
- runtime validators;
- generated client code;
- backend request validation and serializers;
- database/domain constraints where relevant;
- integration and contract tests.

Flag drift such as renamed fields, wrong nullability, enum differences, incorrect numeric/string assumptions, optional fields treated as required, or date/time format mismatch.

### 4.2 DTOs are not domain models

Use separate types when the API representation differs from what the application needs.

- **Request DTO:** the exact input contract sent over the wire.
- **Response DTO:** the exact external/backend response shape.
- **Domain model:** normalized application representation with meaningful invariants and stable semantics.
- **Presentation model:** only when a view needs a deliberately formatted projection (for example, a status label or display-ready grouping).

Do not expose raw API DTOs throughout the UI if the backend payload has transport-specific naming, optionality, nested envelopes, or legacy quirks. Do not create a second model for every endpoint if the contract and domain meaning are already identical; avoid unnecessary mapping boilerplate.

### 4.3 Runtime validation

Static TypeScript types do not validate network data at runtime. Treat external responses as untrusted input.

- Validate high-risk or unstable contracts at the boundary using a schema validator (for example Zod, Valibot, or an existing project standard).
- In Dart, parse JSON into typed models and fail clearly on malformed required fields.
- Validate third-party/webhook payloads on the server before using them.
- Avoid silently coercing invalid values to `0`, `false`, empty objects, or empty arrays when that changes business meaning.
- Handle unknown enum values safely for forward compatibility; preserve an `unknown`/fallback state rather than crashing where reasonable.
- Distinguish `null`, missing, empty string, empty list, zero, and false. They are not interchangeable.
- Parse dates with timezone semantics defined in the contract. Store instants in UTC where appropriate; preserve local dates/time zones for calendar/business rules.
- Treat monetary values, rates, quantities, and identifiers according to explicit precision rules. Do not use binary floating-point for exact currency arithmetic; use integer minor units or decimal-safe types as agreed with the backend.

### 4.4 Generated clients and types

Prefer generation from a canonical contract where it reduces drift and is supported by the stack. Generation must not hide important runtime behavior.

- Generate OpenAPI client/types or GraphQL operation types rather than manually duplicating large interfaces.
- Keep generated files separate from handwritten adapters and do not edit generated output directly.
- Pin generator versions and make generation reproducible in CI.
- Check whether generated clients preserve cancellation, headers, response metadata, multipart behavior, and error details.
- Avoid generating an enormous client for a tiny API if a small typed adapter is clearer.
- Never treat generated TypeScript declarations as runtime validation.

### 4.5 API contract standards

Where the backend can be changed, encourage consistent conventions:

- stable resource identifiers;
- explicit API versioning and deprecation policy;
- consistent date/time, currency, enum, and nullability semantics;
- predictable success envelopes (or consistently no envelope);
- machine-readable error responses (RFC 9457 Problem Details or a documented equivalent);
- documented pagination metadata;
- explicit sort/filter semantics;
- idempotency-key support for retryable commands with side effects;
- request/correlation IDs;
- rate-limit headers and `Retry-After` where applicable;
- maximum request/page/payload sizes;
- stable field names and additive-compatible evolution where possible.

Do not impose a wrapper such as `{ data, success, message }` on every endpoint if it adds no value or conflicts with an established contract. Consistency matters more than a particular envelope.

---

## 5. Recommended integration folder structure

Adapt the exact naming to the existing repository. The following is a reference shape, not a mandate to restructure everything at once.

### 5.1 TypeScript / React / React Native feature-oriented structure

```text
src/
  app/                         # routes and composition only
  shared/
    api/
      clients/                 # configured transport instances per trust boundary
      auth/                    # token/session attachment and refresh coordination
      errors/                  # normalized transport/application errors
      telemetry/               # trace IDs, safe request instrumentation
      config/                  # validated public runtime configuration
    lib/
      query-client/            # QueryClient defaults and provider
      validation/              # shared runtime schema helpers
  features/
    orders/
      api/
        orders.api.ts          # endpoint functions; transport DTOs
        orders.schemas.ts      # runtime request/response schemas
        orders.dto.ts          # wire DTO types if not generated
      domain/
        order.model.ts         # domain types and invariants
        order.mapper.ts        # DTO ↔ domain conversion
        use-cases/
          get-order-overview.ts
          submit-order.ts
      repositories/
        orders.repository.ts   # interface/contract
        orders.repository.impl.ts
      queries/
        orders.keys.ts         # query-key factory
        orders.queries.ts      # query options/hooks
        orders.mutations.ts    # mutation hooks and invalidation policy
      state/
        orders.ui-store.ts     # UI-only state, if necessary
      presentation/
        components/
        screens/
```

Rules:

- `*.api.ts` knows endpoint details but not components.
- Repository implementation owns mapping, source selection, and resource-level consistency rules.
- `*.keys.ts` owns canonical query keys.
- Query hooks adapt query library state to the feature; they do not duplicate domain logic.
- A use case exists for real orchestration/business logic, not as a mandatory pass-through.
- A feature's UI imports hooks/use cases through a clean public boundary, not random transport modules.
- Keep `shared` limited to genuinely shared transport/infrastructure primitives. Do not put feature-specific business rules into a global `utils` folder.

### 5.2 Flutter reference structure

```text
lib/
  core/
    network/                   # shared client, interceptors, auth, error mapping
    config/
    telemetry/
  features/
    orders/
      data/
        datasources/           # remote/local services
        dto/
        mappers/
        repositories/          # implementations
      domain/                  # optional: entities, repository contracts, use cases
      presentation/
        view_models/            # or the project's state-management equivalent
        screens/
        widgets/
```

Flutter's data layer should expose repository-owned application data. Services communicate with external sources; repositories transform and coordinate data, including caching, retry, refresh, and synchronization policies. Add a domain/use-case layer when complexity, reuse, or multiple repositories justify it. Keep repositories independent of each other; coordinate them above the repository layer.

### 5.3 Desktop reference boundary

For Electron or similar multi-process apps:

- Put privileged network access and secrets in the trusted main/backend process when required.
- Expose narrow, validated IPC methods rather than a generic unrestricted `fetch(url)` bridge.
- Validate IPC inputs and outputs; authorize each operation.
- Do not bundle private API keys or long-lived provider secrets into renderer code.
- Keep renderer UI state separate from remote server state.

For Tauri/native desktop, use the platform's supported secure networking and credential storage. Reuse the same contract/domain concepts, but use an appropriate native transport and persistence policy.

---

## 6. Transport clients: Axios, fetch, and native clients

### 6.1 Choose one primary HTTP approach per runtime boundary

Do not create multiple unrelated clients for the same backend without a reason. A project may legitimately use Axios for one boundary and native `fetch` for another, but the choice should be explicit.

**Axios is appropriate when** the project benefits from configured instances, interceptors, upload/download progress, adapters, and consistent request configuration.

**Native `fetch` is appropriate when** standard browser/server APIs are sufficient, especially in modern Next.js Server Components and Route Handlers. Avoid adding Axios solely to wrap a simple `fetch` call.

**Flutter:** use a supported cross-platform HTTP package such as `package:http` for straightforward requests or an established client such as Dio when interceptors, cancellation, progress, and advanced configuration are actually required. Keep the transport behind services so it can be replaced.

**React Native:** Axios can work through the platform's XMLHttpRequest implementation; native `fetch` is also available. Test the chosen client on both iOS and Android, including timeouts, TLS, upload/download behavior, and cancellation.

### 6.2 Axios instance standard

Create a small number of configured instances aligned to distinct upstreams or trust boundaries.

```ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: runtimeConfig.apiBaseUrl,
  timeout: 12_000, // example only; choose from measured endpoint latency/SLOs
  headers: { Accept: 'application/json' },
});
```

The value above is illustrative, not a global timeout prescription. Configure different deadlines for ordinary reads, large uploads, and long-running jobs as necessary.

Interceptors may handle cross-cutting transport concerns:

- attach the current access token from the approved session source;
- attach request/correlation IDs and locale when required;
- normalize transport-level errors without destroying useful response metadata;
- coordinate a single token refresh when the auth design permits it;
- emit redacted telemetry.

Interceptors should **not**:

- contain feature-specific business logic;
- run extra API calls for every request;
- implement broad automatic retries without method/idempotency awareness;
- convert every response to `response.data` if callers need headers, status, pagination, ETag, or download metadata;
- swallow errors and return fake empty success values;
- log tokens, cookies, personal data, or full sensitive payloads.

Axios request interceptors execute in reverse registration order by default, while response interceptors execute in registration order. Audit registration order deliberately. Register shared interceptors once; eject dynamically registered interceptors during teardown to avoid accumulating duplicates.

### 6.3 Cancellation and timeouts

Every cancellable read should accept and propagate a cancellation signal from the caller through the repository to the transport.

```ts
export async function getOrder(
  orderId: string,
  signal?: AbortSignal,
): Promise<OrderDto> {
  const response = await apiClient.get<OrderDto>(`/orders/${orderId}`, { signal });
  return response.data;
}
```

Rules:

- Pass TanStack Query's `AbortSignal` into Axios/fetch.
- Cancel outdated search requests when the search term changes.
- Cancel route/screen-scoped requests when they are no longer useful, where supported.
- Distinguish cancellation from a user-visible failure; do not show an error toast for an intentional abort.
- Set connection, response, and overall operation deadlines appropriate to the transport. A single generous timeout is not a complete timeout strategy.
- A timeout does not prove that a mutation did not reach the server. Use idempotency and reconciliation for side-effecting commands.

### 6.4 Retry ownership

Choose one layer to own retries for each operation. Do not independently retry in Axios interceptors, Axios retry plugins, repository wrappers, and TanStack Query.

- Read/query retries can be owned by the query library or a narrowly scoped transport policy.
- Mutation retries should default to off unless the operation is explicitly idempotent or carries a server-enforced idempotency key.
- Respect `Retry-After` for `429` and relevant `503` responses.
- Use bounded exponential backoff with jitter for transient failures; cap attempts and total elapsed time.
- Do not retry validation errors, authentication failures that require user action, permission failures, or deterministic business-rule errors.
- Do not retry every `5xx` blindly; assess method semantics and the backend's documented behavior.

### 6.5 Token refresh coordination

Audit for refresh storms and replay bugs.

A robust client typically needs:

- one in-flight refresh promise shared by concurrent 401 responses;
- a clear allowlist/skip rule for the refresh endpoint to prevent recursion;
- a single controlled replay of eligible requests after successful refresh;
- correct handling of refresh failure (clear invalid session and redirect/notify once);
- no refresh attempt on ordinary `403 Forbidden` responses;
- protection against replaying non-idempotent operations unless the backend supports idempotency;
- cancellation/timeout behavior for requests waiting on refresh;
- no access token in query keys, logs, analytics, crash reports, or persisted query-cache keys.

The auth implementation must match the actual identity provider and platform. Do not invent a refresh-token flow where the provider uses a different session model.

---

## 7. Request orchestration and preventing unnecessary calls

### 7.1 Trace every request trigger

For each call, identify whether it runs on:

- initial page/screen mount;
- component re-render;
- route navigation or prefetch;
- focus/foreground transition;
- every keystroke;
- every list row/item;
- a polling timer;
- a mutation callback;
- a WebSocket/SSE event;
- application startup;
- an automatic retry/reconnect;
- background sync.

Flag request triggers that are accidental, unbounded, or dependent on unstable object/function identities.

### 7.2 Common request waste patterns

Look specifically for:

- `useEffect` fetching on every render or on an unstable dependency;
- duplicate fetches in parent and child components;
- one request per list row (N+1 client pattern);
- a request for each keystroke without debounce, cancellation, or minimum input length;
- repeated identical requests because query keys are missing or unstable;
- query hooks created inside loops or conditionally;
- focus/reconnect refetching for data that should remain fresh for longer;
- multiple libraries caching the same resource independently;
- polling that continues while the screen is hidden or app is backgrounded;
- retries at multiple layers;
- repeated token refresh calls;
- invalidating every query after every mutation;
- refetching data that can be updated from the mutation response;
- fetching a large collection just to compute one count or summary;
- serial dependent requests that could run in parallel;
- multiple similar endpoints used to build one dashboard when a summary endpoint would be cheaper and more consistent.

### 7.3 Parallel versus sequential execution

- Use `Promise.all` for independent required requests. Start them before awaiting any one result to avoid waterfalls.
- Use sequential requests only when request B genuinely requires data from request A, or when sequencing protects a resource/rate limit.
- Use `Promise.allSettled` only when partial success is a valid product/business outcome and each failure is handled explicitly.
- Do not use `Promise.allSettled` to hide a required dependency failure.
- Bound concurrency when fan-out can grow with the number of records or providers.
- If many endpoints must be called for one user-visible outcome, assess a backend aggregator/BFF or batch endpoint.

### 7.4 Search requests

A good search integration normally has:

- normalized input (trim, canonical case rules where appropriate);
- minimum query length only when justified by product behavior;
- debounce at the user-input boundary, not inside every transport method;
- cancellation of superseded requests;
- stable query keys containing the normalized query and all filters;
- server-side filtering and pagination for large datasets;
- a clear empty result versus loading versus error state;
- no request for blank input unless blank search is a deliberate supported feature.

Do not debounce all requests. Debounce only high-frequency user-driven operations such as search or autocomplete; button commands should not be silently delayed.

### 7.5 Request deduplication and batching

- Use the query library's built-in request sharing for identical query keys where available.
- Batch IDs when the backend supports a safe batch endpoint.
- Prefer a bulk endpoint over N requests for N items.
- Batch GraphQL data-source reads on the server to prevent resolver-level N+1 queries.
- Do not build arbitrary client-side batching that breaks per-item authorization, partial errors, or ordering semantics.
- A batch response must preserve item identity and make missing/failed IDs explicit.

---

## 8. Caching policy: cache deliberately, not everywhere

Caching is a correctness and consistency decision, not a universal performance switch. Audit each layer separately and identify duplicate caches.

### 8.1 Cache layers to identify

1. CDN/reverse proxy cache.
2. HTTP/browser cache (`Cache-Control`, `ETag`, `Last-Modified`, conditional requests).
3. Next.js server Data Cache / route or component caching.
4. TanStack Query or another client server-state cache.
5. Repository/in-memory cache.
6. Persistent device cache (IndexedDB, SQLite, secure/local storage).
7. Backend application cache (Redis or equivalent).
8. Provider/SDK cache.

For every resource, define which layers are active, what each one owns, and how changes invalidate or revalidate them. Avoid stacking multiple long-lived caches without a consistency plan.

### 8.2 Cache classification

| Resource class | Examples | Suggested starting policy |
|---|---|---|
| Immutable/versioned | Build metadata, versioned country codes, fixed reference data | Long-lived cache or static cache; invalidate on version change |
| Slow-changing public | Public catalogue, help content, public configuration | Moderate/long freshness; server/CDN cache where safe; targeted revalidation |
| User profile/preferences | Profile, settings | Short/moderate freshness; invalidate after update; scope cache by user/tenant |
| Operational data | Orders, inventory, task status | Short freshness or event-driven updates; targeted invalidation; avoid stale critical decisions |
| Live/volatile | Balance, availability, presence, active job status | Very short freshness, push updates, explicit refresh, or no cache according to business requirement |
| Sensitive/private | Personal records, payment/account data | Private and carefully scoped; often no persistent/shared cache; clear on logout/account change |
| One-time command response | Payment initiation, transfer submission, job creation | Do not treat as a general reusable query cache; retain only necessary mutation/result state |

These are categories, not fixed time values. The agent must justify actual `staleTime`, `gcTime`, HTTP cache headers, and persistence from resource volatility, business risk, request cost, and backend update behavior.

### 8.3 TanStack Query cache rules

For React and React Native projects that use TanStack Query:

- Define one QueryClient per application runtime, not a new client on every render.
- Centralize sensible defaults, then override per resource where required.
- Set `staleTime` intentionally. The default behavior treats cached query data as stale, which can cause refetches on mount, focus, and reconnect. Do not mistake every background refresh for a bug; tune it based on data volatility.
- Understand `gcTime` separately: it controls how long inactive cache entries remain in memory; it is not the freshness duration.
- Avoid `staleTime: 'static'` for data that can change during the session. Use it only for truly static-in-session data. `Infinity` and `'static'` have different invalidation behavior.
- Use `enabled`/dependent queries to avoid calls until required inputs exist. Do not use them to conceal poor data flow.
- Pass `signal` into the transport so superseded queries can be cancelled.
- Define query keys as structured, serializable arrays. Every variable that changes returned data must be represented in the key: resource ID, filters, sort, page/cursor, locale, tenant, and relevant permissions/context.
- Never put secrets or access tokens in query keys.
- Use query-key factories to maintain predictable invalidation scopes.
- Use `select` or memoized selectors for derived views rather than creating a second mutable copy of server data.
- Use `placeholderData` for a deliberate transition such as retaining the previous page while the next page loads; do not display stale data as if it belongs to new filters.
- Avoid infinite refetch intervals. If polling is needed, define the interval, stop conditions, active-screen behavior, and backoff.
- Clear or isolate user-scoped queries on logout, tenant switch, account switch, or permission-context change.
- Hydrate server-fetched data instead of fetching the identical data again immediately on the client.

Example query-key convention:

```ts
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params: OrderListParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (orderId: string) => [...orderKeys.details(), orderId] as const,
};
```

Query keys must reflect the actual response identity. If tenant, locale, or user context changes the result, that context must be represented or the old cache must be cleared/isolated.

### 8.4 Mutation and invalidation rules

After a mutation succeeds:

1. Prefer using the authoritative mutation response to update the exact cached entity when safe and complete.
2. Invalidate only affected query families when the changed data could affect them.
3. Do not invalidate unrelated dashboard, profile, and catalogue queries by default.
4. Use optimistic updates only when the expected result is predictable, reversible, and useful to the user.
5. Snapshot and roll back optimistic changes on failure; account for concurrent mutations and server conflict responses.
6. For complex financial, inventory, permission, or multi-entity transitions, prefer waiting for the server-confirmed result and reconciling authoritative state rather than speculative cache edits.
7. Ensure the mutation's pending lifecycle includes critical invalidation/refetch work when UI correctness depends on it.
8. Prevent duplicate submissions at the UI and backend levels. UI disabling is not a substitute for server idempotency.

### 8.5 HTTP and Next.js caching

- Explicitly decide cache behavior for server `fetch` calls based on the installed Next.js version and enabled caching model. Do not assume older Next.js defaults still apply.
- Use `no-store` for requests that must always reach the origin or contain user-specific/sensitive runtime data that must not enter a shared persistent cache.
- Use explicit revalidation lifetimes or tags for suitable public/slow-changing data.
- Prefer precise tag-based invalidation over broad path invalidation where supported and appropriate.
- Use HTTP `Cache-Control` correctly at the API/CDN boundary; `private` and `no-store` are important for user-specific/sensitive responses.
- Use `ETag`/`If-None-Match` or `Last-Modified`/`If-Modified-Since` where conditional revalidation is useful and supported.
- Remember that a cache key must vary on every input that changes the representation, including authorization/tenant/locale context where applicable.
- A `304 Not Modified` is a successful cache revalidation outcome, not an application failure.
- Do not cache unsafe methods as if they were ordinary reusable reads.

### 8.6 Persistence and offline caches

Persist a query cache only when there is a concrete offline/startup requirement. If persistence is used:

- define which query families may be persisted;
- set maximum age and version/buster rules;
- exclude secrets and highly sensitive data unless a reviewed encrypted-storage design exists;
- clear persisted data on logout/account or tenant change;
- define conflict resolution and stale-write behavior;
- avoid persisting transient queries, one-time tokens, or data that should always be server-confirmed;
- test schema migration and corrupted storage recovery.

Do not add offline persistence simply because the library offers it.

---

## 9. Pagination, filtering, sorting, and query algorithms

Pagination is a backend/frontend contract. The agent must verify the actual server behavior, not merely inspect how the client increments a page number.

### 9.1 Choose the correct pagination strategy

| Strategy | Appropriate use | Risks/checks |
|---|---|---|
| Offset/limit | Small or moderately sized stable datasets; admin tables where random page access is needed | Expensive deep offsets; inserts/deletes can cause duplicates or skipped rows unless ordering/snapshot rules are clear |
| Page/pageSize | Conventional page-number UI and APIs with known totals | Requires stable ordering; verify page indexing (0 vs 1) and out-of-range behavior |
| Cursor/keyset | Large, frequently changing, or feed-like datasets | Cursor must be opaque/stable; sorting key must be deterministic; clients must not fabricate cursors |
| Infinite/continuation token | Load-more feeds, activity streams, provider APIs | Must honor server continuation token; prevent duplicate page fetches; memory can grow unbounded |
| GraphQL connection | Graph-shaped list fields | Use `edges/node/cursor/pageInfo` semantics consistently; enforce page limits and complexity guards |

Prefer cursor/keyset pagination for large or frequently changing datasets when the backend can implement it correctly. Offset pagination remains valid for bounded datasets and page-number interfaces; it is not inherently wrong.

### 9.2 Backend pagination contract

Verify that the backend:

- enforces a maximum page size;
- validates page, limit, cursor, sort, and filter inputs;
- uses deterministic ordering with a unique tie-breaker;
- indexes common filter/sort combinations;
- returns accurate `hasNext`/`nextCursor` or equivalent metadata;
- defines behavior for expired/invalid cursors;
- prevents cursor tampering where required;
- handles concurrent inserts/updates with documented consistency semantics;
- does not return the full dataset only for the client to slice it;
- avoids expensive exact total counts unless the UI truly needs them;
- applies authorization and tenant constraints before pagination;
- keeps page boundaries consistent with search/filter/sort criteria.

### 9.3 Client pagination rules

- Include page/cursor, filters, and sorting in the query key.
- Reset to the first page when filter or sort semantics change.
- Do not append results from two different filter contexts.
- Use server-provided next cursor/continuation tokens; do not guess offsets from item count when the API defines another method.
- Deduplicate appended records by stable ID when the backend may overlap pages, but do not use client deduplication to conceal a broken cursor contract.
- Protect against duplicate `fetchNextPage` calls while a page request is already in progress.
- Preserve `pageParams` and page boundaries for infinite queries.
- Support empty first page, empty subsequent page, deleted records, expired cursors, repeated cursors, and a page that contains fewer than the requested limit.
- Bound infinite-scroll memory or implement page eviction/virtualization for very long sessions.
- Keep an explicit `isFetchingNextPage`/`hasNextPage` distinction from general background refetch state.
- Never run a client-side sort on one loaded page and present it as a global sort over all pages.

### 9.4 Filtering and search semantics

Document whether filters are applied server-side or client-side.

- Apply filters on the server for large, private, paginated, or authoritative datasets.
- Client-side filtering is acceptable for a complete, bounded local dataset when the dataset is already needed and the semantics are identical.
- Normalize filter parameters consistently before using them in URLs/query keys.
- Define inclusive/exclusive range boundaries, timezone handling, case sensitivity, accent handling, null semantics, and multi-value filter behavior.
- Avoid requesting all records to compute counts or summaries that the backend can return cheaply.

### 9.5 Data traversal and algorithmic complexity

The agent must inspect loops and joins around fetched data for avoidable complexity.

- Avoid nested `find`/`filter` loops over large arrays when a `Map`/`Set` index can reduce repeated lookups from approximately O(n × m) to O(n + m).
- Avoid repeatedly sorting or cloning the same large collection on every render.
- Flatten paginated data only when the consumer needs a flat collection; preserve page metadata elsewhere.
- Use stable IDs for deduplication and React list keys.
- Do not mutate arrays/objects owned by a query cache.
- Avoid fetching large nested graphs when only a few fields are needed.
- Use backend filtering, aggregation, and pagination for large datasets instead of expensive client traversal.
- Avoid unbounded recursion over API-provided trees; validate depth and size.
- Guard against cyclic references if normalizing graph-like data.
- Preserve ordering when the business flow requires it; a `Map` join must not accidentally reorder a ranked result.

Example efficient join of two bounded collections:

```ts
const usersById = new Map(users.map((user) => [user.id, user]));

const rows = orders.map((order) => ({
  ...order,
  customer: usersById.get(order.customerId) ?? null,
}));
```

This is appropriate only when both collections are already bounded and authorized for the same client. For large datasets or server-owned relationships, join/aggregate on the backend.

---

## 10. Combining multiple endpoints and reconciling business data

This is a high-priority audit area. Combining data from endpoints is valid, but the client must not invent a business rule that belongs to the backend.

### 10.1 When client-side composition is appropriate

Client-side composition is reasonable when all of the following are true:

- the source resources are independently useful and already available or cheap to fetch;
- the result is a presentation-level view, not a canonical business calculation;
- datasets are bounded and reasonably small;
- the records share compatible identity, tenant, authorization, and freshness semantics;
- temporary partial results are acceptable or failure is handled explicitly;
- the result does not require a transactionally consistent snapshot.

Examples: enrich a small recent-orders list with already-loaded customer display names; combine independently cached profile and notification-preference data for a settings screen; assemble optional dashboard cards from separate endpoints.

### 10.2 When composition belongs on the backend

Prefer a backend aggregation/read-model/BFF endpoint when:

- one screen requires many requests or request fan-out grows with list size;
- the client is doing N+1 calls;
- joins involve large datasets;
- multiple services must be reconciled for correctness;
- values depend on authorization, pricing, tax, inventory, eligibility, account status, or business rules;
- data must come from a consistent point in time;
- the client would otherwise need internal service topology or sensitive credentials;
- all platforms need the same computed result;
- a mobile client would otherwise make many slow network round trips.

### 10.3 How to verify whether a join/merge is correct

For every cross-endpoint result, create a data lineage table:

| Output field | Source endpoint/entity | Join key | Transformation | Canonical owner | Backend verification |
|---|---|---|---|---|---|
| Example: `customerName` | Customer API | `customerId` | Map customer display name | Customer service | Confirm ID relationship and access scope |
| Example: `orderTotal` | Order API or line items | Order ID | Must follow server pricing/rounding rules | Order service | Verify server-calculated total and currency |

Check:

1. Are IDs from the same namespace and environment?
2. Can keys be null, duplicated, stale, or reused?
3. Do both resources belong to the same user/tenant/organization?
4. Is one endpoint filtered by permission while another is not?
5. Are the two responses from compatible versions/snapshots?
6. Is the join one-to-one, one-to-many, or many-to-many?
7. What happens when a related row is missing, deleted, hidden, or unauthorized?
8. Is the transformation deterministic and tested?
9. Does the backend expose an aggregate field that the client is recomputing incorrectly?
10. Does the output need to be authoritative or merely a display convenience?

Never trust a client-computed financial total, available balance, entitlement, permission, final price, tax, fee, inventory guarantee, or transaction status. The backend must validate and own these outcomes.

### 10.4 Consistency and partial failure

Use the right failure policy:

- **All required:** if any source is necessary to render a correct result, fail the composed operation and report which dependency failed.
- **Optional enrichment:** render the required core result and mark optional enrichment as unavailable; do not fabricate defaults that look authoritative.
- **Independent dashboard cards:** allow individual card failure if the product can still be useful; isolate loading/error state per card.
- **Transaction/financial workflow:** obtain one authoritative backend result. Do not combine independent reads and assume they represent one atomic state.

Do not use `Promise.allSettled` to quietly return partial data when the business outcome requires all sources.

### 10.5 Backend alignment check

For any computed output, compare the client algorithm with:

- backend domain service/use case;
- database query or aggregation;
- API response serializer;
- validation and authorization logic;
- backend tests and fixtures;
- existing reports/exports that use the same calculation.

If the same rule is independently implemented on multiple platforms, identify drift risk. Shared contracts or backend-calculated fields are preferable for authoritative rules.

---

## 11. Next.js and React integration rules

### 11.1 Server versus client data fetching

For Next.js App Router, choose the correct execution boundary per request:

- Fetch public/SEO-critical or initial server-renderable data in Server Components where appropriate.
- Fetch interactive, user-driven, rapidly changing client state through client query hooks when that is the actual need.
- Use Route Handlers/BFF endpoints when they provide a meaningful security, aggregation, protocol, or provider boundary—not merely as a pass-through for every backend request.
- Keep provider secrets and privileged server credentials server-side.
- Do not fetch the same data in a Server Component and immediately refetch it in a client hook without hydration/initial data coordination.
- Start independent server requests in parallel to avoid sequential waterfalls.
- Stream non-critical sections when supported rather than blocking the entire route on every independent request.

### 11.2 Next.js cache behavior

Next.js caching behavior is version- and configuration-sensitive. The agent must inspect the installed Next.js version, App Router/Pages Router usage, and whether Cache Components or other cache features are enabled.

- Set request caching/revalidation explicitly where correctness depends on it.
- Use `no-store` for truly dynamic or private data that must not be stored in the Next Data Cache.
- Use `revalidate`/cache lifetimes and tags for safe, slow-changing data.
- Invalidate narrowly after mutations; prefer precise resource tags where available.
- Avoid caching user-specific content in a shared server cache.
- Verify how authentication headers/cookies and dynamic APIs affect the route's caching behavior.
- Remember that Next.js server caching, browser HTTP caching, and TanStack client caching are separate layers.

### 11.3 React web without Next.js

- Use TanStack Query or the project's established server-state tool for remote state.
- Use local React state for ephemeral input and interaction state.
- Do not fetch directly in render.
- Prefer a query hook over a hand-written `useEffect` fetch for shared, cached, retryable, cancellable server state.
- A one-off effect may be acceptable for a genuinely imperative integration, but must include cancellation/cleanup and dependency correctness.

---

## 12. React Native integration rules

- Reuse the React query/repository principles where the app already uses TanStack Query, but verify React Native lifecycle behavior separately from browser behavior.
- Configure app foreground/background and connectivity integration deliberately. Do not assume browser `window` focus events exist or behave the same way.
- Pause or reduce polling in background; resume according to resource freshness and business requirements.
- Use secure platform storage for refresh credentials or secrets as required by the identity provider; avoid plain AsyncStorage for sensitive tokens.
- Test networking on real iOS and Android devices, not only simulators.
- Verify TLS/ATS and Android cleartext network policy. Do not globally relax platform network security to fix a development endpoint.
- Handle flaky mobile connections, app suspension, airplane mode, DNS failures, captive portals, and requests that complete after the user navigates away.
- Support upload/download progress and cancellation where the feature needs it.
- Ensure query cache and persisted state are cleared or isolated on logout, account switch, or tenant switch.
- Do not persist sensitive API responses for offline use unless encryption, retention, logout clearing, and threat model have been reviewed.
- Avoid overly frequent polling and large payloads on cellular connections.
- Reconcile server mutations after app resume; do not assume a request interrupted by OS suspension failed before reaching the backend.

---

## 13. Flutter integration rules

Flutter does not use TanStack Query. Do not attempt to copy React Query APIs into Dart. Use the project's established state-management library and Flutter-native data patterns.

- Keep HTTP calls inside data sources/services.
- Keep repositories as the source of truth for domain data and remote/local coordination.
- Parse JSON into typed DTOs, then map to domain entities when the wire model differs.
- Use ViewModels/Notifiers/BLoC/Cubit/Riverpod providers according to the codebase; avoid mixing multiple state-management systems without a reason.
- Add use cases/interactors only for complex logic, shared operations, or multi-repository orchestration.
- Use one configured HTTP client per relevant trust boundary; reuse persistent connections where supported.
- Configure connection/response timeouts and cancellation where supported by the chosen package.
- Dispose stream subscriptions and controllers; do not leave polling timers or WebSocket streams active after a feature is disposed.
- Use typed `Result`/failure patterns or a consistent exception mapping rather than returning arbitrary nulls.
- Support app lifecycle transitions and connectivity changes without triggering duplicate syncs.
- If offline-first behavior exists, define repository ownership, local database schema, pending operation queue, conflict resolution, retry policy, and synchronization checkpoints.
- Verify platform permissions and entitlements for network access and file transfer.
- Keep UI widgets free of JSON parsing and endpoint orchestration.

---

## 14. Desktop integration rules

Desktop clients introduce process and trust boundaries that the agent must inspect.

- Determine whether requests originate from a renderer, main process, native Rust layer, or backend service.
- Keep long-lived secrets and privileged provider API keys out of renderer bundles and client binaries; client binaries can be reverse engineered.
- For Electron, use narrow IPC channels with schema validation and authorization. Never expose unrestricted filesystem/network capability to renderer code.
- Use operating-system credential storage for user secrets where appropriate.
- Reuse connection pools/clients; avoid creating a new transport client for every button click.
- Cancel requests when windows/views close or operations become irrelevant.
- Handle proxy settings, corporate TLS inspection, offline transitions, application updates, and certificate failures explicitly.
- Define whether local persistence is encrypted and how user data is cleared on sign-out or uninstall.
- Do not put database or internal message-broker credentials in desktop applications.

---

## 15. Real-time, streaming, and long-running operations

### 15.1 Polling

Polling is acceptable if it is bounded and justified. Audit:

- polling interval and maximum duration;
- whether the API response includes a terminal state;
- whether polling stops on success, failure, cancellation, navigation, or backgrounding;
- whether requests overlap (prevent overlap unless intentionally designed);
- backoff after transient failures and rate limits;
- whether SSE/WebSocket/webhook-driven updates would be more efficient.

Do not use a very short polling interval as a substitute for an event protocol when many users or records are involved.

### 15.2 WebSocket

- Establish one managed connection per required scope rather than one per component.
- Authenticate using a supported secure handshake; do not put long-lived secrets in a query string.
- Subscribe and unsubscribe intentionally; clean up handlers on unmount/disposal.
- Implement bounded exponential reconnect with jitter and respect server close/retry signals.
- Use heartbeats or liveness detection where required.
- Include event IDs/sequence numbers or another deduplication strategy when event ordering matters.
- Handle duplicate, delayed, missing, and out-of-order events.
- Prevent unbounded in-memory event queues; use backpressure or coalescing for high-volume events.
- On reconnect, reconcile with an authoritative snapshot or resume token; a successful reconnect does not prove no events were missed.
- Update only affected cache keys/entities. Avoid invalidating the entire application cache for every message.

### 15.3 Server-Sent Events

Use SSE for one-way server-to-client streams when appropriate. Verify:

- reconnect behavior and `Last-Event-ID`/event IDs if supported;
- heartbeat/keep-alive through proxies;
- auth and cookie/header limitations of the client environment;
- proper stream closure on route change/background/disposal;
- event schema/versioning and duplicate handling;
- server/proxy buffering settings for prompt delivery.

### 15.4 Long-running jobs

For exports, AI generation, document processing, payments, or other long operations:

- submit a command and receive a job/operation ID;
- use a status endpoint or stream for progress;
- model terminal states explicitly (succeeded, failed, canceled, expired);
- support cancellation only if the backend guarantees what cancellation means;
- avoid keeping an HTTP request open indefinitely when a job resource is more reliable;
- make job creation idempotent when duplicate submissions would be harmful;
- reconcile final output from the backend rather than trusting only progress events.

### 15.5 File uploads/downloads

- Use short-lived presigned object-storage URLs or a backend streaming endpoint as appropriate.
- Keep credentials and signing logic on the backend.
- Support multipart/resumable transfer for large files when needed.
- Enforce maximum size, content type, file signature, malware scanning, ownership, and authorization server-side.
- Verify checksums/integrity for important uploads.
- Provide cancellation and progress; clean up partial uploads.
- Do not load huge files fully into memory when streaming is available.
- Avoid retrying a completed upload blindly; use upload IDs/part IDs/checksums to resume safely.

---

## 16. Error handling and failure semantics

### 16.1 Normalize errors once

Create a shared transport/application error model appropriate to the project. Preserve:

- HTTP status;
- stable backend error code/type;
- safe user-facing message key;
- validation field errors;
- request/correlation ID;
- retryability classification;
- retry-after duration if supplied;
- original cause for diagnostics (with sensitive values redacted).

Do not reduce every error to `Error('Something went wrong')` at the transport layer. Do not expose stack traces, SQL details, raw provider errors, or internal hostnames to users.

Use RFC 9457 Problem Details (`application/problem+json`) or a documented equivalent where possible. The client should tolerate unexpected error bodies and non-JSON gateway responses without crashing.

### 16.2 Classify failures

| Failure | Typical handling |
|---|---|
| Network unavailable / DNS / connection reset | Show recoverable state; bounded retry for safe reads; retain user input |
| Timeout | Determine whether operation may have reached server; query/reconcile before retrying side effects |
| 400 / validation failure | Show field/domain validation; do not retry unchanged input |
| 401 | Perform one coordinated refresh or require reauthentication according to auth contract |
| 403 | Show permission outcome; do not loop refresh attempts |
| 404 | Distinguish deleted/missing resource from route/config error; avoid indefinite retry |
| 409 | Handle state conflict; refresh authoritative resource and guide resolution |
| 412 | Reconcile version/ETag precondition failure where optimistic concurrency is used |
| 422 | Map validation/business rule errors; no blind retry |
| 429 | Respect `Retry-After`; slow down; do not retry immediately |
| 5xx / gateway error | Bounded retry only when operation semantics allow; report request ID |
| Canceled request | Usually silent cancellation, not a failure toast |
| Malformed response | Record contract/telemetry error; fail safely; do not fabricate successful data |

### 16.3 Error UX and state

The data layer should expose a consistent state model, while the UI chooses the presentation:

- initial loading with no data;
- successful data;
- background refresh while prior data remains usable;
- empty result;
- recoverable failure with retry;
- terminal/permission failure;
- partial success where explicitly supported;
- canceled request;
- offline/stale data, when offline support exists.

Do not conflate empty array, `null`, unavailable, unauthorized, and failed. They represent different outcomes.

---

## 17. Security and privacy controls

The agent must audit every connection as a security boundary.

### 17.1 Credentials and trust boundaries

- Public browser/mobile/desktop code must not contain private API keys, client secrets, signing secrets, database credentials, or privileged service tokens.
- Use backend proxy/BFF integrations for privileged providers.
- Use OAuth Authorization Code + PKCE for public clients where the provider's flow supports it.
- Validate token issuer, audience, expiry, scopes, and signature on the backend.
- Keep authentication separate from authorization; the backend must authorize every resource/action.
- Do not rely on hidden UI controls to enforce permissions.
- Validate tenant/org/workspace scope server-side on every request.
- Avoid sending credentials in URL query parameters.
- Protect cookie-authenticated state-changing endpoints against CSRF.
- Do not store sensitive credentials in unencrypted local storage or logs.

### 17.2 Object- and property-level authorization

For every endpoint accepting an object ID, verify that backend authorization is scoped to the authenticated user/tenant and the requested action. Verify property-level authorization for fields that may be visible or writable only to some roles. Client-side filtering does not fix a broken authorization check.

### 17.3 Third-party APIs and webhooks

- Treat third-party API output as untrusted input.
- Validate schemas and sanitize content before rendering or persisting.
- Keep provider secrets on the backend.
- Verify webhook signatures using the raw request body as required by the provider.
- Enforce timestamp/replay windows and idempotent event processing.
- Record provider event IDs and processing outcomes.
- Handle duplicate, delayed, missing, and out-of-order webhook delivery.
- Do not assume a successful provider API response is final settlement; reconcile asynchronously for payment/financial providers.

### 17.4 Logging and privacy

- Redact authorization headers, cookies, refresh/access tokens, API keys, passwords, payment details, and sensitive personal data.
- Log request IDs, route/operation, duration, status, retry count, and safe error category.
- Avoid logging full request/response bodies by default.
- Define retention and access restrictions for integration logs.
- Make telemetry consent/privacy controls platform-appropriate.

---

## 18. Backend alignment and contract verification checklist

For each audited endpoint, inspect backend implementation and answer:

1. Does the route exist and is it the route the client calls in each environment?
2. Is the HTTP method/operation correct and semantically appropriate?
3. Do path, query, and body parameters match exactly?
4. Are required fields, optional fields, nullability, enums, and defaults aligned?
5. Is runtime validation performed server-side?
6. Is authentication and object/function/property-level authorization enforced server-side?
7. Is pagination/filter/sort performed at the database/service layer rather than after loading all records?
8. Is the query indexed and bounded for expected data volume?
9. Are joins/aggregations computed in the correct layer and with the correct ownership rules?
10. Does the server return authoritative totals, status transitions, balances, permissions, and calculated values where required?
11. Are side-effecting operations idempotent where clients may retry or users may double-submit?
12. Are concurrency conflicts handled (version, ETag, transaction, unique constraint, or domain rule)?
13. Are error status codes and machine-readable error bodies stable?
14. Are rate limits and `Retry-After` documented and implemented?
15. Are timeouts/deadlines and cancellation semantics clear for long-running operations?
16. Are provider webhooks verified and idempotently processed?
17. Are tests present for success, invalid input, unauthorized access, missing records, duplicates, race conditions, and provider failure?
18. Is the API contract generated/published and checked in CI?

When backend source is unavailable, use the OpenAPI/GraphQL/proto contract and integration tests if present. Mark gaps as `UNVERIFIED — backend source not available`; do not claim alignment.

---

## 19. Reliability, concurrency, and consistency edge cases

Audit every applicable case below:

- User navigates away while a request is in flight.
- Search query changes rapidly and responses arrive out of order.
- Two identical requests run concurrently.
- A component mounts twice in development or under framework strict-mode behavior.
- Multiple 401 responses arrive simultaneously.
- Token refresh fails while several requests are waiting.
- Request times out after the backend has already committed the mutation.
- The user double-clicks submit or retries after no visible response.
- Two devices update the same record concurrently.
- A record is deleted between list fetch and detail fetch.
- A paginated dataset changes while the user scrolls.
- Cursor repeats, expires, or is rejected.
- API response is missing a newly required field or contains an unknown enum.
- Server returns HTML/plain text instead of JSON due to gateway failure.
- Response is `204 No Content` and client incorrectly parses JSON.
- Backend returns `304 Not Modified` and client treats it as an error.
- A `429` contains `Retry-After` and client retries too early.
- App is backgrounded mid-request and later resumes.
- Network drops during a streaming response or multipart upload.
- WebSocket reconnects after missing events.
- Webhook is delivered more than once or out of order.
- Provider succeeds but callback/webhook delivery is delayed.
- Tenant/user changes while old requests or cached data remain active.
- Clock skew affects token expiry, signatures, or time-based filters.
- DST/timezone conversion changes date-range boundaries.
- Locale/currency changes but query/cache keys do not.
- Large payload or deeply nested response exhausts memory or blocks the UI thread.
- Partial upstream outage makes only some dashboard widgets unavailable.
- Offline state causes queued writes to conflict with newer server state.
- The backend deploys a compatible schema change while older app versions are still in use.

The agent should classify each edge case as applicable/not applicable and cite the code/test proving it is handled. Do not assume it is handled because a library provides a feature.

---

## 20. Performance and observability standard

### 20.1 Measure the complete path

Measure the user-visible operation, not only the HTTP request. Where possible, capture:

- time from interaction to request start;
- DNS/connect/TLS/TTFB/download phases where supported;
- backend processing and database time;
- request/response bytes;
- time to usable data/render;
- request count per screen transition;
- duplicate and canceled request count;
- retry count and retry delay;
- cache hit/miss/revalidation rate;
- endpoint error rate and status distribution;
- pagination page count and records loaded;
- WebSocket/SSE reconnects and dropped-event reconciliation;
- app memory impact for large result sets.

### 20.2 Tracing

Use a correlation/request ID that can be followed from client to gateway/backend and, where supported, across downstream services. OpenTelemetry is a suitable vendor-neutral standard for traces, metrics, and logs.

- Propagate trace context where supported.
- Do not create a new unrelated trace for every internal layer if there is a parent operation.
- Do not put PII or secrets into trace attributes.
- Record endpoint templates rather than high-cardinality raw URLs/IDs where possible.
- Sample high-volume traces appropriately, while retaining error/slow-request visibility.

### 20.3 Performance questions

- Is the number of requests proportional to the number of records? If so, inspect N+1 behavior.
- Are independent calls unnecessarily serialized?
- Are large JSON payloads being transferred when field selection or summary endpoints would suffice?
- Is compression enabled for suitable payloads?
- Are connections reused/pooled rather than recreated per request?
- Are database indexes aligned with pagination/filter/sort patterns?
- Is the UI doing expensive mapping/sorting repeatedly on large data?
- Is a background polling loop generating avoidable traffic?
- Are retry storms amplifying backend incidents?
- Is a cache saving meaningful network/compute cost without violating freshness/security?

### 20.4 Do not optimize by guesswork

For every performance recommendation, state whether it is:

- `MEASURED` — telemetry/profile/test proves the issue;
- `CODE-EVIDENT` — code structure creates a clear avoidable cost;
- `POTENTIAL` — plausible risk requiring measurement.

Do not state that an endpoint is slow without timing evidence. Do not recommend Redis, GraphQL, WebSockets, local persistence, or a new query library without a concrete bottleneck or requirement.

---

## 21. Testing standard

### 21.1 Unit tests

Test:

- DTO parsing and runtime validation;
- DTO-to-domain mapping and null/unknown enum cases;
- query parameter serialization and canonicalization;
- pagination/cursor helpers;
- join/merge algorithms and missing-reference behavior;
- use-case orchestration and partial failure policy;
- error normalization/classification;
- retryability and idempotency policy;
- cache key factories and invalidation mapping.

### 21.2 Repository/API tests

Test:

- correct URL, HTTP method, headers, body, and query parameters;
- cancellation propagation;
- timeout handling;
- successful response and malformed response;
- non-2xx responses including 401/403/404/409/422/429/5xx;
- empty/no-content responses;
- retry behavior and `Retry-After`;
- token refresh concurrency and failed refresh;
- request deduplication and duplicate mutation prevention;
- multipart upload/download and cancellation where relevant.

### 21.3 Contract and integration tests

- Verify generated types/clients against the canonical schema.
- Detect breaking contract changes in CI.
- Test representative frontend requests against a real or contract-faithful backend.
- Verify auth, tenant isolation, validation, and permission errors.
- Verify backend aggregation outputs against domain rules.
- Test pagination under inserts/deletes and deterministic ordering.
- Test idempotency with repeated command submissions.
- Test webhook signature, replay, duplicate, and out-of-order processing.

### 21.4 Performance tests

Where relevant, test:

- request count for a screen and for a list of N records;
- latency under realistic network conditions;
- concurrency limits and backend rate limits;
- payload sizes;
- pagination query plans/index usage;
- high-volume event stream behavior;
- long-running memory use for infinite lists and persistent caches.

### 21.5 Platform test matrix

| Platform | Minimum integration verification |
|---|---|
| Next.js | Server/client boundary, cache behavior, hydration, route handlers, runtime config, server-only secrets |
| React web | Query deduplication, cancellation, focus/reconnect, browser cache, CORS, credentials/CSRF |
| React Native iOS | Real-device networking, ATS/TLS, foreground/background, secure storage, upload/stream behavior |
| React Native Android | Real-device networking, cleartext policy, permissions, foreground/background, secure storage |
| Flutter Android/iOS | Serialization, client lifecycle, app lifecycle, permissions/entitlements, stream disposal, offline behavior |
| Desktop | Process/IPC boundary, secret exposure, OS credential storage, proxy/TLS, window disposal, local persistence |

---

## 22. Severity and prioritization model

Classify findings consistently.

| Severity | Meaning | Examples |
|---|---|---|
| **P0 — Critical** | Security breach, data corruption, money/authorization correctness, or production outage risk | Exposed secret, cross-tenant data leak, client-trusted balance/permission, duplicate non-idempotent transfer, unverified webhook enabling forged state |
| **P1 — High** | Major functional failure, severe reliability/performance issue, or repeatable data inconsistency | Infinite request loop, N+1 at scale, stale private data after account switch, broken pagination skipping records, unbounded retry storm |
| **P2 — Medium** | Noticeable inefficiency, fragile behavior, or maintainability issue with bounded impact | Duplicate fetches, broad invalidation, weak error mapping, missing cancellation, unnecessary response transformation, inconsistent DTO mapping |
| **P3 — Low** | Small consistency or observability improvement with limited immediate impact | Naming inconsistency, missing low-value telemetry, minor redundant mapping, documentation gap with no known production effect |

Each finding must include:

```text
ID: INT-###
Severity: P0 | P1 | P2 | P3
Status: Confirmed | Likely | Unverified
Platform/Feature:
Evidence: path/to/file.ext:line-range or symbol
Observed behavior:
Expected standard:
Impact:
Root cause:
Frontend remediation:
Backend remediation (if any):
Regression test:
Verification performed:
```

Prioritize by user/business impact, security, probability, scale, and cost—not by how easy the code is to change.

---

## 23. Required agent deliverables

The agent must produce an `INTEGRATION_AUDIT_REPORT.md` (or the repository's existing audit-report convention) with these sections:

1. **Executive result:** overall status, critical risks, and top recommendations.
2. **Repository discovery:** platforms, framework/library versions, API clients, query/state tools, backend components, and contract sources.
3. **Integration inventory:** one row per endpoint/provider/stream with caller and backend owner.
4. **Data-flow maps:** representative flows for high-value features, including request and response transformations.
5. **Contract alignment matrix:** frontend DTO/type vs canonical schema vs backend validation/response.
6. **Cache map:** every cache layer, resource policy, freshness, invalidation, persistence, and user/tenant isolation.
7. **Request-efficiency findings:** duplicate calls, waterfalls, N+1, polling, repeated retries, fan-out, payload waste.
8. **Pagination/query review:** server strategy, client behavior, filters, sorting, cursor consistency, edge cases.
9. **Composition/algorithm review:** joins, aggregation ownership, complexity, partial failure, data lineage, backend alignment.
10. **Auth/security review:** credentials, token refresh, authz, tenant boundaries, sensitive caching, webhook/provider security.
11. **Platform-specific findings:** Next.js, React, React Native, Flutter, and desktop where present.
12. **Reliability/error review:** timeout, cancellation, retries, idempotency, conflict handling, offline and streaming behavior.
13. **Observability/test gaps:** metrics, traces, contract tests, unit/integration/performance coverage.
14. **Prioritized remediation plan:** P0 through P3, dependencies, estimated scope only if repository evidence supports it.
15. **Verification log:** commands/tests run, pass/fail, and anything not verified.

### 23.1 Required inventory table

| ID | Feature | Platform | Protocol/provider | Endpoint/operation | Caller | Repository/use case | Cache/retry/pagination | Backend owner | Contract status |
|---|---|---|---|---|---|---|---|---|---|

### 23.2 Required cache matrix

| Resource | Cache layer(s) | Freshness rule | Invalidation trigger | Persistence | User/tenant scoped? | Risk/decision |
|---|---|---|---|---|---|---|

### 23.3 Required request-flow trace

```text
Feature/action:
UI entry:
Query hook / ViewModel:
Use case:
Repository:
API adapter:
Transport:
Backend route/controller:
Backend service/domain rule:
Database/provider:
Response mapping:
Cache write/invalidation:
UI consumer:
Contract evidence:
Tests:
```

### 23.4 Required final recommendation format

For each proposed change, explain:

- what is wrong now;
- why the current behavior causes incorrectness, latency, extra requests, or risk;
- what should change and in which layer;
- whether the fix belongs to frontend, backend, or both;
- why the chosen tool/pattern is appropriate for this specific codebase;
- migration risk and backward compatibility;
- tests that prove the issue is fixed;
- expected measurable result, if measurable.

---

## 24. Acceptance checklist

The integration layer is considered **audit-ready** only when applicable items below are verified or explicitly accepted as known gaps.

### Contracts and types

- [ ] Every integration has an identified contract/source of truth.
- [ ] Frontend request/response DTOs match backend schemas and validation.
- [ ] Runtime validation exists where external data is unstable or high risk.
- [ ] DTOs are separated from domain types where semantics differ.
- [ ] Unknown enum, nullable, missing, empty, and malformed values are handled intentionally.
- [ ] API versioning and deprecation behavior are documented.

### Layer boundaries

- [ ] UI files do not own transport or complex data orchestration.
- [ ] API services contain endpoint-specific transport logic only.
- [ ] Repositories own resource access and mapping.
- [ ] Use cases exist for actual orchestration/business complexity, not ceremony.
- [ ] Repositories do not depend on each other for cross-resource composition.
- [ ] Server-owned rules remain authoritative on the backend.
- [ ] There is no unexplained duplicate mutable source of truth.

### Requests and performance

- [ ] No accidental request-on-render or unstable-effect loops.
- [ ] No unbounded N+1 request patterns.
- [ ] Independent requests run in parallel where safe.
- [ ] High-frequency searches are normalized, debounced where appropriate, and cancellable.
- [ ] Request fan-out and concurrency are bounded.
- [ ] Duplicate requests are shared/deduplicated where appropriate.
- [ ] Polling stops or slows when no longer needed.
- [ ] Query keys include every response-defining input.

### Caching

- [ ] All active cache layers are documented.
- [ ] Freshness and garbage-collection policies are not confused.
- [ ] Sensitive/private data is not in shared caches.
- [ ] User/tenant/account switch clears or isolates relevant state.
- [ ] Mutation invalidation is targeted.
- [ ] Persistence is justified and has a logout/expiry/migration policy.
- [ ] Next.js server cache and client query cache do not accidentally duplicate fetching or leak user data.

### Pagination and composition

- [ ] Pagination strategy is confirmed with the backend.
- [ ] Ordering is deterministic and page size bounded server-side.
- [ ] Filter/sort changes reset page/cursor correctly.
- [ ] Repeated/expired cursors and changing datasets are handled.
- [ ] Large data joins/aggregations happen on the backend when appropriate.
- [ ] Client-side joins have explicit keys, bounded inputs, and missing-record behavior.
- [ ] Financial, permission, pricing, tax, inventory, and other authoritative values are backend-confirmed.
- [ ] Partial failure semantics are explicit.

### Reliability and security

- [ ] Reads propagate cancellation signals.
- [ ] Timeouts are configured by operation class.
- [ ] Retry policy is bounded and owned by one layer.
- [ ] Side-effecting commands use appropriate idempotency protections.
- [ ] 401 refresh is coordinated; 403 does not cause refresh loops.
- [ ] 429 honors `Retry-After`.
- [ ] Error shape is normalized without losing useful metadata.
- [ ] Secrets never ship to untrusted clients.
- [ ] Backend enforces object/function/property authorization and tenant isolation.
- [ ] Webhooks are verified and idempotent.
- [ ] Logs and traces redact sensitive data.

### Platform and tests

- [ ] Platform-specific lifecycle/network behavior is covered.
- [ ] Streaming subscriptions and controllers are disposed correctly.
- [ ] Upload/download paths handle size, cancellation, and integrity.
- [ ] Contract, unit, integration, and relevant performance tests exist.
- [ ] Verification commands and remaining gaps are documented.

---

## 25. Red flags that require immediate investigation

- An API key, client secret, signing secret, or privileged token exists in a public environment variable or client bundle.
- The frontend computes or decides a balance, final payable amount, permission, entitlement, or transaction success without backend authority.
- A list view performs one API call for every row/item.
- A query runs continuously or on every render with no justified trigger.
- Every mutation invalidates the whole QueryClient cache.
- The same API resource is stored independently in several global stores/caches.
- Sensitive user data remains visible after logout or switching accounts/tenants.
- A payment/transfer/order command is automatically retried without idempotency protection.
- A 401 interceptor retries itself indefinitely or starts many simultaneous token refreshes.
- Repositories directly call one another and create hidden dependency cycles.
- UI components parse raw API payloads or contain multi-endpoint business orchestration.
- The client downloads all records and paginates locally despite large or private datasets.
- The client trusts a response type that does not match the actual backend contract.
- Webhook endpoints do not verify signatures or tolerate duplicate delivery.
- A WebSocket is opened per component and never closed.
- A query cache is persisted without expiry, versioning, or account-isolation rules.
- A cross-platform integration uses a web-only assumption without platform verification.

---

## 26. Decision rules: reliable old principles + modern techniques

Use this table to avoid both legacy under-engineering and fashionable over-engineering.

| Problem | Proven baseline | Modern capability when justified | Avoid |
|---|---|---|---|
| API contract | Explicit documented request/response schema | OpenAPI/GraphQL/proto code generation and CI drift checks | Handwritten duplicate types that drift silently |
| HTTP client | One reusable configured client per boundary | Interceptors, cancellation, telemetry, typed adapters | One client per component; global magic interceptors |
| Server state | Repository/source-of-truth discipline | TanStack Query, hydration, targeted cache updates | Duplicating remote state across multiple stores |
| Freshness | Explicit refresh policy | HTTP validators, tag revalidation, event-driven updates | Cache everything or disable every cache |
| Pagination | Server-enforced bounded pages and stable sort | Keyset/cursor pagination, infinite-query support | Fetching every record or inventing cursors client-side |
| Multiple endpoints | Explicit orchestration and error semantics | Parallel requests, batch endpoints, BFF/read models | N+1 calls and unbounded fan-out |
| Data mapping | Clear DTO/domain boundary | Generated schema types plus runtime validation | Treating TypeScript types as runtime checks |
| Retry | Retry only safe/idempotent operations | Exponential backoff with jitter and Retry-After | Retrying all errors at multiple layers |
| Real time | Bounded polling where sufficient | SSE/WebSocket with replay/reconciliation | WebSockets for data that changes rarely |
| Offline | Explicit local persistence and reconciliation | Persistent query cache, local DB, sync queue | Persisting every response without a conflict model |
| Observability | Correlation IDs and useful structured logs | OpenTelemetry traces/metrics/logs | Logging full payloads and secrets |
| Business aggregation | Backend owns canonical rules | BFF/materialized read model/GraphQL selection | Reimplementing financial or permission logic in each client |

---

## 27. Reference standards and primary documentation

The auditing agent should check the current documentation for the exact installed versions before making version-specific recommendations. Links below are primary specifications or official project documentation, not a claim that every project must adopt every tool.

### HTTP, API contracts, and security

- [OpenAPI Specification 3.2.1](https://spec.openapis.org/oas/v3.2.1.html)
- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html)
- [RFC 6585 — Additional HTTP Status Codes, including 429](https://www.rfc-editor.org/rfc/rfc6585.html)
- [MDN — HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)
- [MDN — Conditional Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Conditional_requests)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)

### React, TanStack Query, Axios, and Next.js

- [TanStack Query — Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
- [TanStack Query — Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [TanStack Query — Query Cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
- [TanStack Query — Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)
- [TanStack Query — Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [TanStack Query — Invalidations from Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)
- [TanStack Query — Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [Axios — Interceptors](https://github.com/axios/axios/blob/v1.x/docs/pages/advanced/interceptors.md)
- [Axios — Cancellation](https://github.com/axios/axios/blob/v1.x/docs/pages/cancellation.md)
- [Next.js — Fetching Data](https://nextjs.org/docs/app/getting-started/fetching-data)
- [Next.js — `fetch` API and cache configuration](https://nextjs.org/docs/app/api-reference/functions/fetch)
- [Next.js — Revalidating Data](https://nextjs.org/docs/app/getting-started/revalidating)

### React Native and Flutter

- [React Native — Networking](https://reactnative.dev/docs/network)
- [React Native — Performance Overview](https://reactnative.dev/docs/performance)
- [Flutter — App Architecture Guide](https://docs.flutter.dev/app-architecture/guide)
- [Flutter — Architecture Concepts](https://docs.flutter.dev/app-architecture/concepts)
- [Flutter — Architecture Recommendations](https://docs.flutter.dev/app-architecture/recommendations)
- [Flutter — Fetch data from the internet](https://docs.flutter.dev/cookbook/networking/fetch-data)
- [Dart — `HttpClient` connection reuse and timeout](https://api.dart.dev/dart-io/HttpClient-class.html)

### GraphQL, observability, and transport security

- [GraphQL — Pagination](https://graphql.org/learn/pagination/)
- [GraphQL — Performance](https://graphql.org/learn/performance/)
- [OpenTelemetry — Signals](https://opentelemetry.io/docs/concepts/signals/)

---

## 28. Final instruction to the AI agent

Do not treat this document as a checklist to rubber-stamp. Use it as the standard against which the actual repository is examined. For every rule, determine whether it applies, inspect the implementation, collect evidence, and classify the result. A clean integration layer is not the one with the most abstractions or the most caching; it is the one that makes the fewest necessary network calls, returns correct and authorized data, handles change and failure predictably, keeps business truth in the correct layer, and remains understandable across every supported platform.
