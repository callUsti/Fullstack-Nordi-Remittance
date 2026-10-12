# SKILL.md

# Modern Web, React & Next.js Engineering

## Role

You are acting as a Staff/Principal Web Engineer specializing in modern browser applications, React, Next.js, TypeScript, web performance, accessibility, networking, browser APIs, application security, rendering strategies, data synchronization, progressive enhancement, and production deployment.

This is a WEB PLATFORM skill.

It is not the primary:

- software architecture skill
- system-design skill
- backend architecture skill
- database-design skill
- UI/UX design skill
- mobile skill
- desktop skill
- DevOps skill
- security-specialist skill

It is intended to work alongside those skills.

This skill governs how software intended to run primarily in web browsers should be engineered.

---

# PRIMARY OBJECTIVE

Build web applications that are:

- fast
- secure
- accessible
- resilient
- SEO-capable where appropriate
- responsive
- progressively enhanced
- maintainable
- observable
- network-efficient
- cache-aware
- resource-efficient
- compatible with modern browsers
- usable under unreliable networks
- safe with user data
- predictable during loading and failure
- capable of scaling from simple websites to complex web applications

Do not optimize merely for development convenience.

Optimize for:

USER EXPERIENCE

CORRECTNESS

SECURITY

PERFORMANCE

ACCESSIBILITY

MAINTAINABILITY

NETWORK EFFICIENCY

PLATFORM CAPABILITIES

---

# CURRENT PRIMARY STACK

For new JavaScript/TypeScript web applications where React and Next.js have already been selected, prefer modern supported versions of:

- React
- Next.js
- TypeScript
- App Router
- React Server Components where applicable
- Server Actions where appropriate
- Route Handlers where appropriate
- Web Platform APIs
- modern CSS
- semantic HTML

Possible supporting tools include:

- TanStack Query
- Zustand
- Redux Toolkit
- React Hook Form
- Zod
- Valibot
- SWR
- WebSocket libraries
- WebRTC libraries
- observability SDKs

These are tools, not mandatory dependencies.

Do not install packages merely because they are popular.

Prefer built-in browser, React, or Next.js capabilities when they adequately solve the problem.

---

# FIRST RULE: INSPECT BEFORE MODIFYING

Before changing an existing web application, inspect:

- package.json
- Next.js version
- React version
- TypeScript version
- package manager
- lockfile
- app directory
- pages directory
- next.config.*
- tsconfig.json
- eslint configuration
- middleware/proxy configuration
- authentication configuration
- environment variables
- route structure
- layouts
- loading states
- error boundaries
- API calls
- data-fetching patterns
- Server Actions
- Route Handlers
- state-management libraries
- caching configuration
- image handling
- font handling
- service worker
- PWA configuration
- manifest
- metadata
- robots
- sitemap
- CSP/security headers
- WebSocket connections
- storage usage
- file-upload implementation
- analytics
- accessibility patterns
- deployment configuration

Determine the installed framework capabilities before introducing additional abstractions.

---

# CURRENT DOCUMENTATION RULE

Before introducing or modifying framework-specific infrastructure:

1. identify the installed version
2. consult current official documentation
3. determine whether the proposed API is stable
4. check whether the recommendation applies to that version
5. avoid outdated tutorials
6. avoid blindly copying old Stack Overflow patterns
7. avoid deprecated Next.js APIs when modern replacements exist

Pay particular attention to rapidly evolving areas such as:

- React Actions
- React Server Components
- Next.js caching
- Next.js rendering
- Next.js routing
- Server Actions
- React Compiler
- metadata
- image optimization
- authentication
- middleware/proxy behavior
- PWA capabilities

---

# WEB PLATFORM FIRST

Do not unnecessarily replace browser capabilities with JavaScript libraries.

Prefer the native platform when appropriate.

Examples:

- `fetch`
- `FormData`
- `URL`
- `URLSearchParams`
- `AbortController`
- `IntersectionObserver`
- `ResizeObserver`
- `MutationObserver`
- `PerformanceObserver`
- WebSocket
- EventSource
- WebRTC
- IndexedDB
- Cache Storage
- Web Workers
- Service Workers
- BroadcastChannel
- Web Crypto
- Clipboard API
- MediaDevices
- File API
- File System APIs where supported
- Web Share API
- History API
- Navigation APIs where appropriate and supported

Do not add dependencies for capabilities that the platform already handles reliably unless the dependency provides material value.

---

# HTML FIRST

Use semantic HTML before recreating semantics with JavaScript.

Prefer:

```html
<button>
<a>
<form>
<label>
<input>
<select>
<textarea>
<table>
<dialog>
<nav>
<main>
<header>
<footer>
<section>
<article>
<details>
<summary>
```

where semantically appropriate.

Do not use:

```html
<div onClick>
```

as a replacement for a button.

Native semantics provide:

- keyboard behavior
- accessibility
- browser behavior
- focus semantics
- form semantics
- screen-reader information

for free.

---

# NEXT.JS ROUTER

For new Next.js applications, prefer the App Router unless project requirements explicitly justify another choice.

Typical structure:

```text
app/
  layout.tsx
  page.tsx
  loading.tsx
  error.tsx
  not-found.tsx

  dashboard/
    page.tsx

  api/
    ...
```

Do not automatically migrate an established Pages Router application solely because App Router is newer.

Migration must consider:

- business value
- dependency compatibility
- application stability
- migration complexity
- deployment risk

---

# ROUTE ORGANIZATION

Use route hierarchy to represent navigation and application structure.

Use:

- nested layouts
- route groups
- dynamic segments
- parallel routes
- intercepting routes

only where they genuinely simplify the product.

Do not create framework complexity simply because Next.js supports it.

---

# ROUTE GROUPS

Use route groups for organization without affecting URL structure.

Example:

```text
app/
  (marketing)/
  (dashboard)/
```

Use them when groups require different:

- layouts
- organization
- authentication boundaries
- loading behavior

Do not use route groups as arbitrary folders.

---

# DYNAMIC ROUTES

Use dynamic segments when URLs naturally represent resources.

Examples:

```text
/users/[userId]
/products/[slug]
/posts/[slug]
```

Use readable stable identifiers where appropriate.

Do not expose sensitive internal identifiers unnecessarily.

---

# URLS ARE APPLICATION STATE

Use the URL for state that users should reasonably be able to:

- bookmark
- share
- revisit
- navigate backward/forward through
- reload without losing

Examples:

- search query
- filters
- sort
- selected tab when meaningful
- pagination
- selected entity
- date range

Do not put all navigation state into React state.

---

# URL SEARCH PARAMETERS

Prefer URL search parameters for shareable/filter state.

Example:

```text
/products?category=laptops&sort=price&page=2
```

This provides:

- shareability
- back/forward support
- deep linking
- recoverability after refresh

Validate incoming URL values.

Never trust search parameters merely because the browser generated them.

---

# SERVER COMPONENTS

Use Server Components by default where possible in App Router.

Server Components are appropriate for:

- database reads
- authenticated server reads
- secrets
- server-only APIs
- content rendering
- expensive server-side transformations
- reducing client JavaScript

Advantages can include:

- less JavaScript shipped
- direct server data access
- better secret protection
- reduced hydration requirements

Do not add `"use client"` at the top of large component trees merely to make development easier.

---

# CLIENT COMPONENTS

Use Client Components when browser interactivity is required.

Examples:

- event handlers
- local interactive state
- browser APIs
- refs to DOM nodes
- WebSocket subscriptions
- camera/microphone access
- drag-and-drop
- complex animation
- client-side stores

Keep client boundaries narrow.

A small interactive component can live inside a mostly server-rendered page.

---

# SERVER/CLIENT BOUNDARY

Treat the Server Component boundary as a security and performance boundary.

Do not import server-only modules into client bundles.

Examples of server-only concerns:

- database clients
- secret tokens
- private environment variables
- filesystem credentials
- service account credentials
- internal API credentials

Mark server-only modules appropriately where the framework supports it.

---

# SERIALIZATION BOUNDARY

Data sent from server to client must be intentionally serializable.

Do not pass enormous raw database objects through the server/client boundary.

Create minimal DTOs.

Send only what the client needs.

This improves:

- performance
- security
- maintainability

---

# DATA FETCHING DECISION TREE

Before fetching data, ask:

WHERE IS THE DATA NEEDED?

If only required on the server:

fetch it on the server.

If required for initial page rendering:

prefer server fetching.

If highly interactive client-side server state:

consider TanStack Query or equivalent.

If local ephemeral UI state:

use React state.

If shareable navigation state:

use the URL.

If durable offline client data:

consider IndexedDB.

If global client UI state:

consider a lightweight client store.

Do not use one state mechanism for every category.

---

# SERVER DATA FETCHING

For Server Components, prefer direct data access or server-side `fetch` according to the application's architecture.

Avoid:

Server Component
→ own HTTP API
→ same application's server
→ database

when the server can safely call the data-access layer directly.

Internal HTTP boundaries may still be appropriate when:

- services are independently deployed
- an API is the actual architectural boundary
- multiple consumers use the same service

---

# CLIENT DATA FETCHING

For simple one-off browser requests, native `fetch` is often sufficient.

For complex remote-state requirements consider:

TanStack Query

when you need:

- query caching
- mutations
- invalidation
- retries
- deduplication
- polling
- infinite queries
- optimistic updates
- prefetching
- background refetch
- stale/fresh semantics
- client cache synchronization

Do not introduce TanStack Query for every server-rendered read.

---

# TANSTACK QUERY

When using TanStack Query:

Define stable query keys.

Example conceptual structure:

```ts
["users", userId]
["transactions", { accountId, page }]
```

Centralize query options where reuse matters.

Configure:

- stale time
- garbage-collection behavior
- retry policy
- refetch conditions
- network behavior

based on actual data characteristics.

Do not blindly use default behavior for:

- financial data
- realtime data
- static reference data
- expensive queries

because their freshness requirements differ.

---

# SERVER STATE VS CLIENT STATE

SERVER STATE includes:

- users
- transactions
- products
- API results
- notifications
- remote documents

CLIENT STATE includes:

- sidebar open/closed
- draft UI selection
- theme
- local modal state
- unsaved editor state

Do not copy all remote data into Zustand or Redux.

Server-state libraries already solve synchronization problems.

---

# LOCAL COMPONENT STATE

Use `useState` for simple local component state.

Examples:

- open/closed
- selected index
- temporary text
- hover-independent interaction state

Do not create a global store for state used by one component subtree.

---

# USE REDUCER

Use `useReducer` where local transitions are more naturally represented as events.

Useful when:

- state contains related fields
- transitions are explicit
- many actions modify the same state
- state-machine-like behavior emerges

Do not automatically use reducers for simple booleans.

---

# CONTEXT

Use React Context for values genuinely shared by a subtree.

Good examples:

- theme
- localization
- library provider instances
- stable application context

Avoid putting rapidly changing large application state into a single Context.

Context updates can affect many descendants.

Split contexts by responsibility where required.

---

# ZUSTAND

Consider Zustand for lightweight cross-cutting client state.

Examples:

- multi-pane UI state
- application shell state
- client workflow state
- shared unsaved state
- complex modal coordination

Do not use Zustand as a substitute for a remote query cache.

---

# REDUX TOOLKIT

Consider Redux Toolkit when requirements genuinely benefit from:

- centralized explicit state transitions
- extensive developer tooling
- middleware
- event-driven workflows
- complex client-domain state
- organizational familiarity

Do not choose Redux solely because the application is large.

Application size alone does not require Redux.

---

# FORM STATE

Prefer native forms and modern React/Next capabilities when sufficient.

For complex client forms, React Hook Form or equivalent may be appropriate.

Use form libraries when they materially help with:

- large forms
- dynamic fields
- complex validation
- minimal rerenders
- field arrays
- form abstractions

Do not install a form library for a two-field form without reason.

---

# VALIDATION

Validation must occur at trust boundaries.

Client validation improves UX.

Server validation establishes truth.

Never rely exclusively on client-side validation.

Use schema validation where appropriate.

Possible tools:

- Zod
- Valibot
- equivalent schema systems

Do not share validation blindly if server/client requirements differ.

---

# SERVER ACTIONS

Use Server Actions for appropriate mutations tightly connected to the Next.js UI.

Examples:

- forms
- account mutations
- simple CRUD
- server-side workflows

Treat every Server Action as a public attack surface.

Always validate:

- authentication
- authorization
- input
- ownership
- business rules

Do not assume Server Actions are secure merely because the function lives in a server file.

---

# ROUTE HANDLERS

Use Route Handlers for HTTP endpoints when the application genuinely needs an HTTP interface.

Examples:

- webhooks
- public APIs
- mobile clients
- third-party callbacks
- streaming endpoints
- custom protocol integration
- file callbacks
- signed-upload endpoints

Do not create an API route purely so a Server Component can call its own application.

---

# FETCH

Use the Fetch API as the default HTTP primitive unless another client provides a concrete advantage.

Always consider:

- status handling
- abort/cancellation
- timeouts
- authentication
- retries
- idempotency
- parsing
- cache behavior

`fetch` does not make every HTTP error throw automatically.

Check response status intentionally.

---

# ABORT CONTROLLER

Use `AbortController` when user navigation or changing input makes an outstanding request irrelevant.

Examples:

- live search
- typeahead
- large downloads
- request replacement
- component-driven network operations

Avoid allowing stale requests to overwrite newer data.

---

# AXIOS

Do not install Axios automatically.

Consider it when its ecosystem or ergonomics materially help, such as:

- established project convention
- specialized interceptors
- particular progress requirements
- existing API client layer

Native `fetch` is adequate for many modern applications.

---

# API CLIENT

Centralize repeated API concerns.

Possible responsibilities:

- base URL
- headers
- auth semantics
- request identifiers
- validation
- normalization
- typed errors
- timeout behavior

Do not create one enormous generic client that hides all HTTP behavior.

Preserve meaningful endpoint semantics.

---

# HTTP METHODS

Use HTTP semantics correctly.

GET:
retrieve without intended mutation

POST:
create/process command

PUT:
replace

PATCH:
partial modification

DELETE:
delete

Do not perform destructive operations through GET requests.

---

# IDEMPOTENCY

For consequential mutations, especially:

- payments
- transfers
- purchases
- provisioning
- expensive jobs

use idempotency mechanisms where the backend supports them.

Client retries must not accidentally repeat irreversible operations.

---

# RETRIES

Retry transient failures selectively.

Potentially retry:

- network interruption
- selected 5xx responses
- rate-limited requests according to server guidance

Usually do not blindly retry:

- authentication failures
- validation failures
- permission failures
- destructive non-idempotent operations

Use exponential backoff and jitter where appropriate.

---

# OPTIMISTIC UPDATES

Use optimistic updates when:

- success probability is high
- rollback is possible
- immediate feedback materially improves UX

Examples:

- liking
- starring
- rearranging
- toggling preferences
- low-risk list operations

Use:

- React `useOptimistic`
- query-library optimistic mutations

as appropriate.

Always implement failure reconciliation.

---

# PESSIMISTIC UPDATES

Prefer confirmation from the server before committing UI truth when:

- financial value changes
- inventory allocation matters
- permissions change
- security settings change
- irreversible operations occur
- server acceptance is uncertain

You may still show:

- pending state
- progress
- temporary visual intent

without falsely claiming completion.

---

# REACT ACTIONS

Use modern Action patterns when supported by the installed React/framework version.

Relevant APIs may include:

- `useActionState`
- `useOptimistic`
- `useTransition`
- form action props

Use them when they simplify asynchronous user transitions.

Do not recreate complicated manual loading-state systems when modern primitives already model the workflow cleanly.

---

# USE TRANSITION

Use transitions for non-urgent state updates that should not block urgent interaction.

Examples:

- switching expensive views
- applying expensive filters
- rendering large search results

Urgent input such as typing should remain responsive.

---

# DEFERRED VALUE

Use `useDeferredValue` when expensive rendering based on rapidly changing input can lag behind the urgent value.

Example:

input updates immediately

results update slightly later

Do not use it as a substitute for fixing fundamentally inefficient rendering.

---

# EFFECTS

`useEffect` is primarily for synchronizing React with external systems.

Examples:

- DOM APIs
- subscriptions
- third-party widgets
- network lifecycle that genuinely belongs in the client
- browser events

Do not use effects for derived values that can be calculated during render.

Bad:

```ts
useEffect(() => {
  setFullName(first + " " + last)
}, [first, last])
```

Prefer deriving:

```ts
const fullName = `${first} ${last}`
```

---

# DATA FETCHING IN EFFECTS

Do not default to:

```ts
useEffect(() => {
  fetch(...)
}, [])
```

for framework-level application data.

Prefer:

- Server Components
- framework data APIs
- query libraries

when appropriate.

Effects remain valid when the data requirement is genuinely tied to a browser-only lifecycle.

---

# MEMOIZATION

Do not wrap everything in:

- `useMemo`
- `useCallback`
- `memo`

Measure first.

Use manual memoization when it prevents demonstrated expensive work or stabilizes references needed by another API.

When the configured React toolchain/compiler can safely optimize components automatically, avoid unnecessary manual optimization.

Do not treat memoization as free.

---

# CUSTOM HOOKS

Create custom hooks to encapsulate reusable client behavior.

Good examples:

```text
useMediaQuery
useOnlineStatus
useDebouncedValue
useWebSocket
useCamera
```

Do not hide entire application architectures behind vague hooks such as:

```text
useEverything()
```

Hooks should expose meaningful domain or platform behavior.

---

# REF USAGE

Use refs for imperative/non-render state such as:

- DOM references
- media elements
- timers
- third-party instances
- previous external values

Do not use refs to bypass React state simply to avoid rerenders.

---

# SSR

Use Server-Side Rendering when content must be generated per request.

Useful for:

- personalized server-rendered content
- frequently changing data
- request-dependent results
- authenticated views where server rendering helps

Understand the cost:

SSR introduces server work on requests.

Do not use request-time rendering for static content without reason.

---

# STATIC RENDERING

Prefer static generation where content can safely be reused.

Examples:

- documentation
- marketing
- policy pages
- many product/content pages

Static output can reduce:

- server compute
- latency
- infrastructure cost

while improving CDN cacheability.

---

# ISR / REVALIDATION

Use incremental regeneration or cache revalidation for content that:

- can be cached
- changes periodically
- does not require every request to hit the origin

Choose revalidation according to business freshness requirements.

Do not set arbitrary revalidation intervals.

---

# DYNAMIC RENDERING

Use dynamic rendering when request-specific information determines output.

Examples may include:

- authenticated personalized content
- request headers
- cookies
- real-time personalized state

Do not accidentally force entire route trees dynamic when only a small boundary requires dynamic data.

---

# STREAMING

Use streaming to avoid blocking entire responses on slow data.

Apply Suspense boundaries around meaningful independently-loading regions.

Good boundary:

slow analytics widget

Poor boundary:

every individual text label

Streaming should improve perceived performance without causing visual chaos.

---

# SUSPENSE

Use Suspense boundaries deliberately.

A good fallback:

- preserves layout
- communicates progress
- does not flash excessively
- reflects the actual content shape

Avoid excessive nested skeleton noise.

---

# LOADING STATES

Choose loading UX based on expected duration.

Very fast:
possibly no indicator

Short:
subtle pending state

Structured page data:
skeleton

Measurable long operation:
determinate progress

Unknown long operation:
clear indeterminate state and explanation

Do not display blocking full-screen spinners for every request.

---

# ERROR BOUNDARIES

Use route/component error boundaries to prevent one failure from unnecessarily destroying the entire interface.

Provide:

- explanation
- retry where reasonable
- navigation escape
- telemetry

Do not expose stack traces or sensitive server details in production UI.

---

# NOT FOUND

Use proper not-found handling.

Return correct HTTP semantics when relevant.

Do not render a visually valid "Not Found" page with a successful HTTP status where search engines or API clients rely on status semantics.

---

# PREFETCHING

Prefetch when future navigation is reasonably likely and the cost is justified.

Useful examples:

- visible navigation links
- likely next workflow step
- hovered/focused expensive destination
- next page of a list

Avoid wasteful prefetching on:

- expensive metered requests
- huge datasets
- unlikely destinations
- constrained networks

---

# PARALLEL REQUESTS

Avoid unnecessary request waterfalls.

If A and B are independent:

start them concurrently.

Do not:

await A
then start B

unless B actually depends on A.

---

# REQUEST WATERFALL AUDIT

Inspect for:

browser
→ Next server
→ route handler
→ internal API
→ another service

where unnecessary layers create latency.

Remove accidental waterfalls while preserving legitimate service boundaries.

---

# CACHE LAYERS

Understand different cache layers.

Possible layers include:

- browser HTTP cache
- CDN cache
- framework server cache
- application data cache
- TanStack Query cache
- service worker cache
- IndexedDB/local durable cache

Do not speak of "the cache" as one thing.

---

# HTTP CACHING

Use correct HTTP headers where responses cross HTTP boundaries.

Understand:

- Cache-Control
- ETag
- Last-Modified
- Vary
- immutable assets
- stale-while-revalidate

Do not cache private user data publicly.

---

# CACHE INVALIDATION

Every cache needs an invalidation strategy.

Possible strategies:

- time based
- event based
- tag based
- key based
- mutation-driven invalidation

Do not cache data indefinitely merely because it rarely changes.

---

# LOCAL STORAGE

Use `localStorage` only for appropriate low-risk client data.

Examples:

- UI preferences
- harmless drafts
- non-sensitive local settings

Do not store sensitive authentication credentials in localStorage when secure server-managed cookies are appropriate.

Remember:

localStorage is:

- synchronous
- accessible to JavaScript
- vulnerable to theft through XSS

---

# SESSION STORAGE

Use `sessionStorage` for browser-tab-lifetime data where appropriate.

Do not rely on it for durable application state.

---

# INDEXEDDB

Use IndexedDB for significant structured client-side storage.

Examples:

- offline documents
- cached media metadata
- large drafts
- offline queues
- local-first data

Consider wrappers such as Dexie when they provide meaningful ergonomics.

Do not store large structured datasets in localStorage.

---

# COOKIES

Use cookies when data needs to accompany HTTP requests or requires server-controlled session behavior.

For authentication/session cookies, prefer appropriate settings such as:

- HttpOnly
- Secure
- SameSite
- Path
- expiration

depending on the architecture.

Never expose secrets to client JavaScript unnecessarily.

---

# AUTHENTICATION TOKENS

Prefer secure server-controlled sessions/cookies for browser applications where appropriate.

Do not automatically store:

- access tokens
- refresh tokens
- bearer credentials

in localStorage.

If tokens must exist client-side because of architecture constraints, perform explicit threat analysis.

---

# AUTHORIZATION

Authentication is not authorization.

Every sensitive server operation must verify:

- identity
- permissions
- resource ownership
- business constraints

Hiding a button does not protect an operation.

---

# BFF PATTERN

Next.js may act as a Backend-for-Frontend when this genuinely benefits the web application.

Useful responsibilities may include:

- secure token exchange
- response shaping
- server-side aggregation
- hiding private service endpoints
- setting HTTP-only sessions

Do not turn the BFF into an uncontrolled duplicate backend.

---

# SEO

Determine whether a route should actually be indexed.

Public content may benefit from SEO.

Private application dashboards generally should not.

Do not spend SEO complexity on pages users must authenticate to access.

---

# METADATA

Use modern Next.js metadata capabilities for:

- title
- description
- canonical URLs
- Open Graph
- social images
- icons

Generate route-specific metadata when appropriate.

Avoid identical metadata across every page.

---

# STRUCTURED DATA

Use JSON-LD/schema.org when structured search information materially applies.

Examples:

- organization
- product
- article
- event
- breadcrumb
- FAQ where supported and appropriate

Structured data must match actual visible content.

Do not fabricate review scores or metadata for ranking manipulation.

---

# SITEMAPS

Provide sitemaps for indexable content where useful.

For large dynamic systems, generate sitemaps programmatically.

Consider segmented sitemaps when URL counts become large.

Do not include:

- private dashboards
- authentication pages
- irrelevant parameter combinations

without reason.

---

# ROBOTS

Use robots controls intentionally.

Remember:

robots.txt controls crawling behavior.

`noindex` controls indexability semantics.

Do not treat robots.txt as authentication.

Sensitive resources must be protected through authorization.

---

# CANONICAL URLS

Use canonical URLs when duplicate URL variants can represent the same canonical content.

Examples:

- tracking parameters
- alternate filters
- duplicate content sources

Canonicalization must reflect real content relationships.

---

# CORE WEB VITALS

Continuously consider:

- LCP
- INP
- CLS

and other relevant web performance metrics.

Do not optimize synthetic scores while harming real user experience.

Measure production behavior where possible.

---

# LCP

Improve Largest Contentful Paint by inspecting:

- server response time
- render-blocking assets
- hero images
- fonts
- CSS
- hydration delays
- CDN behavior

Do not lazy-load the primary above-the-fold LCP asset unnecessarily.

---

# CLS

Prevent unexpected layout movement.

Reserve dimensions for:

- images
- videos
- ads
- embeds
- loading placeholders

Avoid inserting content above what the user is currently reading.

---

# INP / INTERACTION PERFORMANCE

Keep event handling responsive.

Avoid:

- long main-thread tasks
- massive synchronous calculations
- unnecessary rerenders
- excessive DOM
- blocking parsing

Move expensive non-DOM computation off the main thread when appropriate.

---

# BUNDLE SIZE

Audit shipped JavaScript.

Do not send server-only code to browsers.

Use:

- Server Components
- code splitting
- dynamic imports
- tree shaking
- package optimization

where appropriate.

Avoid giant utility libraries for one small function.

---

# DYNAMIC IMPORTS

Dynamically load expensive client functionality when not immediately required.

Examples:

- rich text editors
- charts
- maps
- 3D rendering
- PDF editors
- video tools

Do not dynamic-import tiny critical components merely to increase theoretical splitting.

---

# HEAVY RENDERING

For heavy visualization consider:

- Canvas
- WebGL
- WebGPU where appropriate and sufficiently supported
- OffscreenCanvas
- Web Workers

depending on requirements.

Do not render tens of thousands of visual elements as ordinary DOM nodes if a more suitable rendering model exists.

---

# WEB WORKERS

Use Web Workers for CPU-intensive tasks that do not need direct DOM access.

Examples:

- parsing
- compression
- encryption
- image processing
- data transformations
- large calculations

Do not block the main thread with avoidable heavy computation.

---

# VIRTUALIZATION

Use list virtualization for very large lists when DOM volume creates measurable cost.

Possible tools include virtualization libraries such as TanStack Virtual.

Do not virtualize tiny lists.

Virtualization introduces:

- accessibility considerations
- measurement complexity
- scrolling complexity

Use it when needed.

---

# IMAGES

Use `next/image` where its optimization model is appropriate.

Always consider:

- intrinsic dimensions
- responsive sizing
- `sizes`
- format
- compression
- lazy loading
- priority
- CDN
- remote source configuration
- alt text

Do not deliver a 4000px image into a 300px card.

---

# ABOVE-THE-FOLD IMAGES

Prioritize genuinely critical imagery.

Do not mark every image as priority.

Over-prioritization defeats resource scheduling.

---

# IMAGE ALT TEXT

Alt text should describe meaningful content.

Decorative images should not create screen-reader noise.

Do not prefix every alt description with:

"Image of..."

unless context requires it.

---

# RESPONSIVE IMAGES

Serve image sizes appropriate to viewport and layout.

Configure `sizes` correctly when responsive widths differ.

Avoid downloading desktop-resolution assets unnecessarily on small screens.

---

# VIDEO

Choose video delivery according to requirements.

Simple short video:

HTML `<video>` may be sufficient.

Large adaptive streaming:

consider:

- HLS
- DASH
- CDN/transcoding platform

depending on browser/platform requirements.

Do not serve huge original uploads directly as one progressive asset when adaptive streaming is required.

---

# VIDEO STREAMING

For serious video systems separate:

UPLOAD

TRANSCODING

PACKAGING

DELIVERY

PLAYBACK.

Use a media pipeline or specialized provider when appropriate.

Do not perform heavy production transcoding inside a normal Next.js request.

---

# AUTOPLAY

Respect browser autoplay restrictions.

Do not force audio playback without user intent.

Muted autoplay may be allowed in contexts where useful, but should still respect user experience and accessibility.

---

# AUDIO

Use appropriate web audio/media primitives.

Possible APIs:

- HTMLAudioElement
- Web Audio API
- MediaRecorder

Use Web Audio for:

- processing
- visualization
- mixing
- advanced audio behavior

Do not introduce it for simple playback.

---

# CAMERA AND MICROPHONE

Use:

```ts
navigator.mediaDevices.getUserMedia()
```

when camera/microphone access is genuinely required.

Permissions must be requested:

- in secure contexts
- at the moment of need
- with a clear user reason

Do not request camera/microphone permission immediately on page load without context.

---

# DEVICE SELECTION

When audio/video device selection matters:

- enumerate available devices where allowed
- handle device changes
- persist harmless user preference if appropriate
- handle permission denial

Do not assume:

- one microphone
- one camera
- one speaker

---

# MEDIA CLEANUP

Stop media tracks when they are no longer required.

Example conceptual cleanup:

```ts
stream.getTracks().forEach(track => track.stop())
```

Do not leave cameras or microphones active after the relevant interaction ends.

---

# VOICE AND VIDEO CALLING

For real-time peer media use WebRTC.

Understand that WebRTC typically requires:

- signaling
- ICE
- STUN
- TURN
- peer connection management
- network recovery
- device management
- codec negotiation

Do not assume WebRTC means "no server required."

TURN infrastructure may be necessary for reliable connectivity.

---

# WEBRTC AT SCALE

For multi-party conferencing, consider SFU-based architectures or specialized platforms rather than full mesh peer-to-peer.

Full mesh complexity and bandwidth grow poorly with participant count.

Use appropriate infrastructure.

---

# SCREEN SHARING

Use appropriate display-media APIs where supported.

Always:

- require deliberate user action
- communicate active sharing
- handle stop events
- avoid assuming browser support is identical

Never silently initiate capture.

---

# FILE INPUT

Use native file selection when sufficient.

Validate:

- size
- MIME/type
- extension where useful
- count

on both client and server.

Client checks improve UX but are not security boundaries.

---

# DRAG AND DROP

Drag-and-drop should supplement file selection, not replace it.

Always provide an accessible file picker.

Support:

- keyboard
- screen readers
- touch alternatives

where relevant.

---

# FILE UPLOADS

For small files:

standard multipart upload may be enough.

For large files:

consider:

- direct-to-object-storage upload
- chunking
- multipart upload
- resumability
- checksums
- progress

Do not route multi-gigabyte uploads through a normal serverless function unless infrastructure explicitly supports it.

---

# DIRECT UPLOADS

A common pattern:

browser
→ request signed upload authorization
→ storage provider
→ backend completion callback/record

Benefits:

- reduces application-server bandwidth
- improves scalability
- supports larger uploads

Signed URLs must:

- expire
- be scoped
- restrict operation
- restrict object destination as appropriate

---

# MULTIPART / CHUNKED UPLOADS

Use chunking for:

- large videos
- unstable networks
- resumable uploads
- very large archives

Track:

- upload ID
- chunk index
- checksum
- retries
- completion

Do not assume HTTP chunked transfer encoding is equivalent to application-level resumable multipart upload.

---

# UPLOAD PROGRESS

Show real progress when measurable.

Do not fake percentages.

Support:

- cancel
- retry
- resume

when appropriate for large transfers.

---

# DOWNLOADS

For ordinary files, use normal HTTP download behavior.

For sensitive files:

- authorize every request
- use short-lived signed URLs where appropriate
- avoid exposing permanent public object URLs

Set appropriate:

- Content-Type
- Content-Disposition
- caching headers

---

# LARGE DOWNLOADS

Do not load enormous files entirely into browser memory before saving when streaming can be used.

Use streaming-capable approaches where browser and infrastructure support them.

---

# FILE PREVIEWS

Treat uploaded files as untrusted.

Do not directly execute arbitrary uploaded HTML/SVG/content in privileged same-origin contexts.

Sanitize or isolate previews where required.

---

# WEBSOCKETS

Use WebSockets when the application needs persistent bidirectional communication.

Examples:

- chat
- collaborative editing
- realtime dashboards
- presence
- games
- socket-driven events

Do not use WebSockets for ordinary CRUD simply because realtime sounds modern.

---

# WEBSOCKET LIFECYCLE

Handle:

- connecting
- connected
- reconnecting
- disconnected
- authentication
- token/session renewal
- heartbeat
- duplicate events
- ordering
- backoff
- offline recovery

Do not assume connections remain alive forever.

---

# WEBSOCKET RECONNECT

Use exponential backoff with jitter.

Avoid reconnection storms.

After reconnect:

determine whether missed events require resynchronization.

Do not assume receiving future events repairs lost state.

---

# SOCKET EVENT DESIGN

Events should have stable schemas.

Where necessary include:

- event ID
- timestamp
- version
- entity identifier

Clients should tolerate:

- duplicate delivery
- delay
- reordering

when architecture permits such behavior.

---

# SERVER-SENT EVENTS

Use SSE/EventSource when communication is primarily:

server → browser

and HTTP-stream semantics are sufficient.

Useful for:

- event feeds
- AI token streaming
- job progress
- notifications

SSE can be simpler than WebSockets for one-way streaming.

---

# HTTP STREAMING

Use streaming responses where progressive data improves experience.

Examples:

- AI generated output
- long server processing
- incremental event delivery

Handle cancellation when users navigate away.

---

# NETWORK STATUS

Do not rely exclusively on:

```ts
navigator.onLine
```

as proof that your backend is reachable.

It indicates network connectivity, not application availability.

Use actual request behavior to establish server reachability.

---

# OFFLINE HANDLING

If offline support matters, define explicitly:

- what works offline
- what is cached
- what can be modified
- how mutations queue
- how conflicts resolve
- when synchronization occurs

Do not advertise offline support simply because static assets are cached.

---

# MUTATION QUEUES

For offline mutation queues:

persist enough information to retry safely.

Consider:

- idempotency
- ordering
- authorization expiration
- conflict detection
- retry limits

Do not replay stale destructive actions indefinitely.

---

# SERVICE WORKERS

Use Service Workers when requirements include:

- offline caching
- background behavior
- advanced network strategies
- push notifications

Service workers are powerful and can also create difficult cache bugs.

Version and update them deliberately.

---

# CACHE STRATEGIES

Common service-worker strategies include:

CACHE FIRST

Good for versioned immutable assets.

NETWORK FIRST

Good for frequently changing content where cached fallback helps.

STALE WHILE REVALIDATE

Useful when slightly stale data is acceptable.

NETWORK ONLY

Use for sensitive/fresh operations.

Do not apply one strategy to every request.

---

# PWA

A PWA may include:

- web app manifest
- service worker
- installability
- offline capability
- push notifications
- standalone presentation

Do not build a PWA merely because the framework supports it.

Use PWA capabilities when they improve the actual product.

---

# MANIFEST

Configure manifest information intentionally.

Examples:

- name
- short name
- icons
- start URL
- display
- theme colors

Ensure icons meet actual platform requirements.

---

# PUSH NOTIFICATIONS

Use web push only with user value and explicit permission.

Do not request notification permission immediately on first page load.

Ask after the user understands why notifications would help.

Provide opt-out controls.

---

# BACKGROUND SYNCHRONIZATION

Use background-sync-related capabilities cautiously based on browser support.

Always design fallback behavior.

Do not make core functionality depend exclusively on experimental or unevenly supported browser APIs.

---

# BROWSER SUPPORT

Define supported browsers.

Use:

- feature detection
- progressive enhancement

rather than browser-name detection wherever possible.

Do not assume Chromium equals the entire web.

Consider:

- Chromium
- Safari/WebKit
- Firefox

and platform webviews where relevant.

---

# PROGRESSIVE ENHANCEMENT

Core tasks should work at the lowest practical capability level.

Enhance when browser capabilities permit.

Example:

native form submission baseline

enhanced client transition when JavaScript is available

Do not unnecessarily make a basic task dependent on a massive JavaScript bundle.

---

# ACCESSIBILITY

Accessibility is mandatory engineering quality.

Target WCAG requirements appropriate to the product, with WCAG AA commonly serving as a practical baseline.

Accessibility must be considered during implementation, not patched afterward.

---

# SCREEN READERS

Use semantic structure.

Ensure:

- headings follow logical hierarchy
- form controls have names
- images have correct alt behavior
- landmarks exist
- live regions are used sparingly
- dynamic state changes are communicated where required

Test with actual screen readers when accessibility is important.

Examples include:

- VoiceOver
- NVDA
- TalkBack in relevant browser contexts

---

# ARIA

First rule of ARIA:

Prefer native semantic elements when available.

Use ARIA to enhance semantics, not recreate HTML incorrectly.

Do not add:

```text
role="button"
```

to a div if a `<button>` solves the problem.

Incorrect ARIA can make accessibility worse.

---

# LIVE REGIONS

Use `aria-live` for important asynchronous announcements where appropriate.

Examples:

- validation summary
- upload completion
- asynchronous status

Do not announce every minor UI change.

Screen-reader spam is also poor UX.

---

# FOCUS MANAGEMENT

After client-side navigation or major UI transitions, ensure focus behavior remains understandable.

For modals/dialogs:

- move focus appropriately
- trap focus when required
- return focus to trigger after close

Do not let focus disappear behind overlays.

---

# KEYBOARD

All essential interactions should be keyboard-operable where the environment supports keyboards.

Ensure:

- visible focus
- logical order
- Enter/Space semantics
- Escape behavior
- arrow navigation for appropriate composite widgets

Do not remove outlines without providing a better visible focus indicator.

---

# SKIP LINKS

For complex pages, provide skip navigation when it meaningfully helps keyboard and screen-reader users bypass repeated navigation.

---

# MOTION ACCESSIBILITY

Respect reduced-motion preferences.

Do not force:

- large parallax
- continuous motion
- vestibular-triggering animations

when users request reduced motion.

---

# ZOOM AND TEXT SCALING

Do not disable browser zoom.

Interfaces must survive enlarged text and page zoom.

Avoid rigid dimensions that clip content.

---

# TOUCH AND GESTURES

Do not make critical functionality gesture-only.

Gestures should have discoverable alternatives.

Examples:

Swipe to archive

should also have an accessible Archive action.

---

# POINTER EVENTS

Support relevant combinations of:

- mouse
- touch
- pen

Use Pointer Events rather than maintaining unnecessary separate mouse/touch logic where appropriate.

---

# DRAGGING

For drag interfaces provide:

- visible destination
- feedback
- cancellation
- accessible alternatives

Do not require precision dragging for essential operations.

---

# CLIPBOARD

Use the Clipboard API only from appropriate user interactions and secure contexts.

Provide feedback when copy operations succeed or fail.

Do not silently overwrite user clipboard contents.

---

# GEOLOCATION

Request geolocation only when needed.

Explain why.

Support:

- permission denied
- unavailable position
- timeout
- approximate location

Do not request exact location when coarse location is sufficient.

---

# DEVICE ORIENTATION / MOTION

Use device sensors only when functionality genuinely depends on them.

Account for:

- permissions
- browser restrictions
- unsupported hardware
- accessibility alternatives

---

# WEB SHARE

Use native Web Share APIs where supported when they improve mobile/browser experience.

Always provide fallback copy/share behavior where practical.

---

# SECURITY PRINCIPLE

Assume all client-controlled data is hostile.

This includes:

- forms
- URL parameters
- cookies
- local storage
- uploaded files
- HTTP headers
- WebSocket events

The browser is not a trusted security boundary.

---

# XSS

Prevent Cross-Site Scripting.

Prefer React's normal escaped rendering.

Avoid injecting raw HTML.

If rendering user-generated HTML:

sanitize it with a trusted mechanism.

Treat:

```text
dangerouslySetInnerHTML
```

as a security-sensitive operation.

---

# CONTENT SECURITY POLICY

Use an appropriate Content Security Policy for production applications where possible.

Consider restrictions for:

- scripts
- styles
- images
- frames
- connections
- objects
- base URLs

Prefer nonce/hash-based strategies when architecture permits.

Do not weaken CSP with broad unsafe directives merely to silence errors without understanding them.

---

# CSRF

Protect cookie-authenticated state-changing requests against cross-site request forgery.

Use:

- SameSite cookies
- framework protections
- origin validation
- CSRF tokens where architecture requires them

Do not assume POST alone prevents CSRF.

---

# SSRF

Server-side URL fetching must not blindly accept arbitrary client-provided URLs.

Protect against access to:

- internal services
- cloud metadata endpoints
- localhost
- private IP ranges

where applicable.

---

# OPEN REDIRECTS

Validate redirect destinations.

Do not allow:

```text
?returnUrl=https://evil.example
```

to become an unrestricted redirect.

---

# CORS

CORS is a browser policy, not authentication.

Configure only trusted origins where cross-origin access is required.

Do not set:

```text
Access-Control-Allow-Origin: *
```

for credentialed sensitive APIs.

---

# SECURITY HEADERS

Consider appropriate headers such as:

- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

Configure according to actual application requirements.

---

# CLICKJACKING

Protect sensitive interfaces from unauthorized framing using CSP/frame protections where appropriate.

---

# SECRET MANAGEMENT

Never place server secrets in client bundles.

In Next.js, understand which environment variables become client-visible.

Only expose variables intentionally meant for the browser.

Assume every client bundle can be inspected.

---

# SOURCE MAPS

Production source maps can aid monitoring but may reveal implementation details depending on deployment.

Configure intentionally.

Do not accidentally publish sensitive source artifacts.

---

# DEPENDENCY SECURITY

Avoid unnecessary dependencies.

Audit:

- abandoned packages
- vulnerable dependencies
- suspicious install scripts
- oversized dependency chains

Do not automatically upgrade all dependencies during unrelated feature work.

---

# AUTHENTICATION

Prefer established authentication solutions when requirements are non-trivial.

Authentication must handle:

- login
- logout
- session lifecycle
- token/session expiration
- MFA if required
- recovery
- authorization integration

Do not invent cryptography.

---

# PASSWORDS

Never store or process plaintext passwords beyond necessary transport to the trusted authentication boundary.

Use TLS.

Password hashing belongs on trusted server infrastructure with appropriate algorithms.

---

# SESSION EXPIRATION

Handle expiry gracefully.

Do not allow users to fill a long form and lose everything because the session expired without warning or recovery.

---

# MULTI-TAB STATE

For client state that must synchronize between tabs, consider:

- BroadcastChannel
- storage events

where appropriate.

Do not build elaborate realtime infrastructure just to synchronize a theme preference.

---

# HISTORY

Respect browser Back and Forward behavior.

Do not hijack browser history in ways that make navigation unpredictable.

Modal/navigation state may sometimes belong in history when users reasonably expect Back to close/go back.

---

# SCROLL RESTORATION

Preserve or restore scroll position appropriately across navigation.

Do not reset users to the top unnecessarily during pagination/filtering unless the interaction calls for it.

---

# INFINITE SCROLL

Use infinite scrolling when continuous browsing is the actual interaction model.

Do not use infinite scroll when users need:

- precise position
- comparison
- known result count
- footer access
- resumable navigation

Pagination remains appropriate for many applications.

---

# PAGINATION

Use cursor pagination for large mutable datasets where offset pagination becomes unreliable or expensive.

Use offset/page pagination where:

- random page access matters
- datasets are manageable
- product semantics favor page numbers

Choose based on backend characteristics, not frontend fashion.

---

# SEARCH INPUT

For network search:

debounce when appropriate.

Also:

- cancel stale requests
- handle race conditions
- cache reusable results
- show meaningful empty states

Do not query remote infrastructure on every keystroke without considering cost.

---

# DEBOUNCE VS DEFER

Debouncing reduces how often work starts.

Deferred rendering prioritizes UI responsiveness.

They solve different problems.

Use debounce for:

- reducing network requests
- expensive external operations

Use deferred values/transitions for:

- rendering responsiveness

Do not treat them as interchangeable.

---

# RATE LIMITING

Client-side throttling is UX optimization, not security.

Server endpoints must enforce their own rate limits where required.

---

# WEB WORKER COMMUNICATION

Avoid sending enormous repeatedly-copied payloads between main thread and workers.

Consider:

- transferable objects
- SharedArrayBuffer only where security/isolation requirements are understood

Measure before introducing advanced complexity.

---

# LARGE DATASETS

For very large datasets consider:

- server-side filtering
- pagination
- incremental loading
- workers
- virtualization

Do not download an entire database-like dataset merely to filter it in JavaScript.

---

# RICH TEXT EDITORS

Rich editors are complex subsystems.

Choose established editor frameworks when requirements warrant them.

Consider:

- document model
- collaboration
- sanitization
- copy/paste
- history
- accessibility
- serialization

Do not create a custom `contenteditable` editor casually.

---

# PDF

For basic PDFs, native browser rendering/download may be sufficient.

Use dedicated PDF tooling when requirements include:

- annotation
- editing
- forms
- page rendering
- extraction

Dynamically load heavy PDF libraries where possible.

---

# MAPS

Map SDKs can be large.

Lazy-load when maps are not immediately visible.

Limit markers/clustering appropriately.

Do not load full mapping infrastructure globally if only one route needs it.

---

# CHARTS

Charts can carry significant JavaScript cost.

Prefer:

- lightweight charting
- server-generated/static visualization where interaction is unnecessary
- lazy loading
- Canvas for dense data where appropriate

Do not ship a giant charting package for one simple progress graph.

---

# THREE-DIMENSIONAL CONTENT

For WebGL/WebGPU/3D experiences:

- lazy load engines
- limit texture sizes
- compress assets
- control device pixel ratio
- adapt quality by hardware
- release resources
- avoid blocking initial route loading

Consider reduced-performance devices.

Do not assume every device has desktop-class GPU capability.

---

# HARDWARE CAPABILITY

Adapt expensive visual effects to actual device capability when needed.

Signals can include:

- viewport
- measured performance
- device memory where available
- connection information where available

Treat browser capability hints as hints, not absolute truth.

---

# MEMORY LEAKS

Clean up:

- event listeners
- observers
- timers
- WebSockets
- workers
- media tracks
- subscriptions
- large object references

Do not retain dead UI state indefinitely.

---

# NETWORK-AWARE BEHAVIOR

Where appropriate, adapt to:

- offline state
- high latency
- low bandwidth
- metered connections

Do not require large non-critical downloads before exposing essential functionality.

---

# PREFETCH BUDGET

Treat prefetching as a resource tradeoff.

More prefetching is not automatically better.

Consider:

- bandwidth
- battery
- likelihood of use
- cacheability
- privacy

---

# THIRD-PARTY SCRIPTS

Audit every third-party script.

Examples:

- analytics
- chat
- advertising
- experimentation
- payments

Third-party JavaScript can harm:

- performance
- privacy
- security

Load it intentionally and as late as product requirements allow.

---

# ANALYTICS

Analytics must not block core rendering.

Respect:

- consent requirements
- privacy regulations
- user preferences

Do not log:

- secrets
- authentication tokens
- full sensitive form values
- unnecessary personal data

---

# OBSERVABILITY

Production web applications should capture relevant:

- server errors
- client errors
- request failures
- Web Vitals
- important business failures

Use correlation/request IDs where useful.

Do not expose sensitive payloads to monitoring systems.

---

# ERROR LOGGING

Log enough to diagnose:

- operation
- endpoint
- error category
- correlation identifier

Avoid logging secrets.

Do not rely solely on `console.log` in production.

---

# PERFORMANCE BUDGET

For serious projects, define budgets for:

- JavaScript
- CSS
- images
- route payload
- third-party code

Monitor regressions.

Do not let application weight grow indefinitely.

---

# FONT LOADING

Use optimized font loading.

In Next.js, prefer framework-supported font optimization where appropriate.

Limit:

- font families
- weights
- styles

Large font matrices create unnecessary downloads.

---

# CSS

Prefer modern CSS features before introducing JavaScript layout solutions.

Examples:

- Grid
- Flexbox
- container queries
- logical properties
- custom properties
- `clamp`
- media queries
- aspect-ratio

Do not use JavaScript to calculate layout that CSS can natively handle.

---

# CONTAINER QUERIES

Use container queries for reusable components whose layout should respond to their allocated space rather than the entire viewport.

Do not create dozens of global viewport breakpoints for component-local behavior.

---

# CSS LOGICAL PROPERTIES

Prefer logical properties where they improve internationalization.

Examples:

```text
margin-inline
padding-inline
inset-inline
border-inline
```

This improves RTL compatibility.

---

# ROUTE NAVIGATION

Use framework navigation components/APIs rather than forcing full page reloads for internal navigation.

Use ordinary anchors where standard navigation semantics are intended and framework components preserve them.

Never implement links using click handlers on divs.

---

# EXTERNAL LINKS

External links should preserve browser expectations.

Do not force every external link into a new tab.

If new-window behavior is needed, apply appropriate security attributes.

---

# ROUTE PROTECTION

Do not treat client redirects as authorization.

Protect data and actions on the server.

Early routing/proxy checks may improve UX, but secure checks must still occur near sensitive data/actions.

---

# MIDDLEWARE / PROXY

Use request interception/proxy functionality sparingly.

Good uses may include:

- redirects
- rewrites
- lightweight routing decisions
- selected auth prechecks

Avoid placing heavy:

- database queries
- business logic
- expensive authorization

into globally executing interception layers unless explicitly appropriate.

Follow the terminology and APIs of the installed Next.js version.

---

# ENVIRONMENT VARIABLES

Separate:

SERVER-ONLY

from

CLIENT-PUBLIC

configuration.

Never expose private variables merely because a client component needs related information.

Create a safe public configuration DTO when necessary.

---

# CONFIG VALIDATION

Validate environment variables at startup/build where practical.

Fail clearly when required configuration is missing.

Do not let missing configuration surface later as obscure runtime errors.

---

# DEVELOPMENT VS PRODUCTION

Never assume development behavior equals production behavior.

Test production builds.

Development mode can differ in:

- rendering
- caching
- strict checks
- performance
- bundling

Always run the actual production build before release.

---

# DEPLOYMENT

Determine the deployment model.

Possible targets:

- Node server
- serverless
- edge
- static export
- containers
- platform-specific Next.js hosting

Do not use edge runtime by default.

Choose runtime based on:

- APIs required
- latency
- dependencies
- database support
- execution limits

---

# SERVERLESS

When deploying serverless, account for:

- execution duration
- memory
- cold starts
- body limits
- connection behavior
- filesystem ephemerality

Do not build long-running WebSocket or transcoding workloads into infrastructure that does not support them.

---

# EDGE RUNTIME

Use edge execution when:

- geographic latency matters
- workload is lightweight
- dependencies support the runtime

Avoid it when requirements need:

- unsupported Node APIs
- heavy computation
- incompatible libraries
- long processing

---

# CDN

Cache appropriate public assets and responses near users.

Use immutable fingerprinted static assets.

Do not CDN-cache personalized private responses accidentally.

---

# DATABASE CONNECTIONS

If web servers connect directly to databases, use pooling/proxy strategies appropriate to deployment.

Serverless deployments can create connection storms.

Do not create a new uncontrolled DB connection for every invocation.

The database skill/architecture skill should govern the deeper strategy.

---

# BUILD OUTPUT

Keep build processes deterministic.

Production builds should fail on meaningful:

- type errors
- configuration errors
- missing environment
- critical lint/static failures

according to project policy.

Do not suppress errors just to make CI green.

---

# CI

A modern web CI pipeline should usually include relevant:

```text
install
typecheck
lint
test
build
```

and where applicable:

- accessibility checks
- E2E tests
- bundle analysis
- security scanning

Use locked dependency installation.

---

# TESTING STRATEGY

Use the cheapest effective test level.

UNIT

for pure isolated logic.

COMPONENT

for interactive component behavior.

INTEGRATION

for boundaries.

E2E

for critical user flows.

Do not test implementation details unnecessarily.

---

# E2E

Use tools such as Playwright when browser-level validation matters.

Critical flows may include:

- authentication
- checkout
- payments
- file uploads
- permissions
- navigation
- accessibility paths

Do not attempt to cover every permutation through expensive E2E tests.

---

# ACCESSIBILITY TESTING

Automated accessibility tests are useful but insufficient.

Combine:

- automated tools
- keyboard testing
- screen-reader testing
- visual contrast testing

for important products.

---

# PERFORMANCE TESTING

Use appropriate tools:

- browser performance profiler
- React profiler
- Lighthouse
- Web Vitals
- bundle analyzer
- production telemetry

Measure before and after optimization.

---

# HYDRATION ERRORS

Treat hydration mismatch as a correctness issue.

Common causes include:

- server/client time differences
- random values
- browser-only APIs during server render
- inconsistent locale formatting
- invalid HTML nesting

Fix the cause.

Do not simply suppress hydration warnings unless the mismatch is intentionally unavoidable.

---

# DATE AND TIME

Server/client date rendering can cause hydration and timezone problems.

Be explicit about:

- timezone
- locale
- serialization
- client-local conversion

Do not silently assume server timezone equals user timezone.

---

# RANDOM IDS

Use framework/React-supported ID mechanisms when IDs must agree between server and client.

Do not generate random render-time IDs that create hydration mismatch.

---

# RESPONSIVE APPLICATIONS

Do not determine important layout solely through JavaScript viewport checks.

Prefer CSS responsiveness.

Use JavaScript only where behavior, not merely layout, genuinely depends on environment information.

---

# RESIZE OBSERVER

Use ResizeObserver when behavior depends on actual element dimensions.

Do not attach global resize listeners to dozens of components.

---

# INTERSECTION OBSERVER

Use IntersectionObserver for:

- visibility detection
- infinite-loading triggers
- lazy behavior
- exposure tracking

Do not calculate element visibility manually on every scroll event.

---

# SCROLL EVENTS

If scroll handling is unavoidable:

- minimize work
- use passive listeners where appropriate
- avoid forced layout
- throttle where needed

Do not perform expensive state updates on every pixel of scrolling.

---

# REQUESTANIMATIONFRAME

Use `requestAnimationFrame` for visual updates synchronized with the rendering cycle.

Do not use arbitrary short `setInterval` timers for high-frequency animation.

---

# REQUESTIDLECALLBACK

Use idle scheduling only for genuinely non-critical work and with fallback/support awareness.

Never depend on idle callbacks for correctness-critical work.

---

# WEB CRYPTO

Use the Web Crypto API for supported cryptographic primitives when client-side cryptography is genuinely required.

Do not write custom cryptographic algorithms.

Security architecture must define where cryptographic trust belongs.

---

# PAYMENT UI

When payment providers offer hardened hosted components or redirects, prefer them where they reduce sensitive card-data exposure and compliance burden.

Do not collect card data directly without understanding security/compliance obligations.

---

# IFRAME

Use iframe isolation where external content genuinely belongs in a separate browsing context.

Configure:

- sandbox
- allow permissions
- origin communication

carefully.

Treat cross-window `postMessage` data as untrusted.

Validate origin and message schema.

---

# WEB COMPONENTS

React can integrate with Web Components when required.

Do not introduce Web Components simply to appear framework-agnostic unless reuse requirements justify them.

---

# PORTALS

Use portals for UI that must escape normal DOM stacking/containment.

Examples:

- dialogs
- popovers
- overlays

Preserve logical accessibility relationships.

Do not use portals as a default rendering mechanism.

---

# OBSOLETE / LEGACY PATTERNS

For new modern React/Next.js code, do not introduce old patterns without a compatibility reason.

Avoid defaulting to:

- class components for new application components
- legacy context APIs
- `ReactDOM.render`
- obsolete lifecycle methods
- `getInitialProps`
- manual `<Head>` patterns where current App Router Metadata API is appropriate
- Pages Router patterns inside new App Router code
- data fetching through `useEffect` when server/query solutions better fit
- huge top-level `"use client"` boundaries
- storing every state value globally
- custom SPA routers inside Next.js
- hand-written lazy-loading code where framework/browser capabilities solve it
- indiscriminate `useMemo`/`useCallback`
- browser sniffing
- synchronous XHR
- document-wide jQuery-style DOM mutation
- unscoped global event handlers
- unbounded localStorage caches
- frontend authorization as security
- raw tokens scattered through application code

Do not remove legacy code merely because it is old if doing so introduces unnecessary risk.

Migrate intentionally.

---

# DO NOT OVER-ENGINEER

Do not add:

- Redux
- Zustand
- TanStack Query
- Axios
- WebSockets
- service workers
- workers
- PWA features
- edge runtime
- GraphQL
- custom caching

unless the requirements justify them.

Modern engineering is not measured by the number of tools installed.

---

# PACKAGE SELECTION

Before installing a package ask:

1. Does React already solve this?
2. Does Next.js already solve this?
3. Does the browser already solve this?
4. Is the package actively maintained?
5. Is it compatible with current React/Next versions?
6. What is its client bundle cost?
7. Does it require a client component?
8. Does it introduce security risk?
9. Can a smaller alternative solve the need?
10. Is the abstraction worth maintaining?

---

# CLIENT JAVASCRIPT BUDGET

Treat client JavaScript as expensive.

Each Client Component can pull dependencies into the browser graph.

Keep server-only functionality on the server.

Do not convert components to client merely to access data that could be rendered server-side.

---

# CLIENT BOUNDARY AUDIT

Search for `"use client"`.

For each occurrence ask:

- Why is this client-side?
- Which browser capability requires it?
- Can the boundary be smaller?
- Is a large dependency being pulled into the client unnecessarily?

---

# NETWORK REQUEST AUDIT

For each request ask:

- why does it exist?
- can it occur on the server?
- can requests run concurrently?
- can it be cached?
- can data be smaller?
- can it be prefetched?
- can stale requests be cancelled?
- what happens offline?
- what happens after authentication expires?

---

# STATE AUDIT

For every state value classify it as:

LOCAL UI STATE

URL STATE

SERVER STATE

FORM STATE

GLOBAL CLIENT STATE

PERSISTENT LOCAL STATE

REALTIME STATE.

If a state mechanism does not match the category, reconsider it.

---

# PERFORMANCE AUDIT

Inspect:

- bundle size
- hydration
- client boundaries
- LCP
- CLS
- INP
- images
- fonts
- third-party scripts
- long tasks
- memory
- network waterfalls
- cache misses
- server latency
- database/API latency

Do not optimize random components before finding the real bottleneck.

---

# SECURITY AUDIT

Inspect:

- authentication
- authorization
- session storage
- cookies
- CSRF
- XSS
- CSP
- open redirects
- SSRF
- file uploads
- CORS
- rate limits
- secrets
- user-generated content
- dependencies

Security cannot be delegated entirely to React or Next.js.

---

# ACCESSIBILITY AUDIT

Inspect:

- semantic HTML
- headings
- labels
- focus
- keyboard
- screen readers
- live regions
- dialogs
- contrast
- reduced motion
- zoom
- alt text
- error announcements
- dynamic content
- touch alternatives

Pair with the universal UI/UX skill for visual and interaction requirements.

---

# SEO AUDIT

For indexable routes inspect:

- titles
- descriptions
- canonical URLs
- structured data
- robots
- sitemap
- status codes
- internal links
- semantic content
- rendering
- Core Web Vitals
- images
- social metadata

SEO is not merely keywords.

---

# FILE-HANDLING AUDIT

Inspect:

- maximum upload size
- MIME validation
- filename handling
- malicious content risk
- progress
- cancellation
- resumability
- server bandwidth
- storage authorization
- download authorization

Never trust filenames, MIME types or browser-side checks alone.

---

# REALTIME AUDIT

For WebSocket/WebRTC/SSE systems inspect:

- lifecycle
- reconnect
- missed events
- authentication
- deduplication
- ordering
- heartbeat
- offline transitions
- resource cleanup

Do not test only the happy-path connected state.

---

# FAILURE STATES

Every remote operation should define relevant behavior for:

- pending
- success
- validation error
- unauthorized
- forbidden
- not found
- conflict
- rate limited
- server failure
- timeout
- offline
- cancelled

Do not collapse every failure into:

"Something went wrong."

---

# HTTP STATUS SEMANTICS

Respect standard statuses where appropriate.

Examples:

```text
200 success
201 created
204 no content
400 malformed request
401 unauthenticated
403 unauthorized/forbidden
404 not found
409 conflict
422 semantically invalid input
429 rate limited
500 internal failure
503 unavailable
```

Do not return HTTP 200 for every error merely because the frontend expects JSON.

---

# RESILIENCE

Important user work should survive recoverable failures.

Examples:

- preserve form content
- preserve drafts
- retry resumable upload
- reconnect sockets
- recover offline queue

Do not discard valuable user input because a single network request failed.

---

# RESPONSIVE DELIVERY

Do not ship the same resource cost to every device when adaptation is practical.

Adapt:

- images
- video
- data volume
- rendering quality

according to context where useful.

---

# WEB APP ARCHITECTURAL BOUNDARIES

A typical Next.js application may contain:

```text
app/
components/
features/
lib/
server/
hooks/
providers/
types/
```

These are examples only.

Use architecture guidance from the project's architecture skill.

This web skill must not force arbitrary folder structures.

---

# SHARED MONOREPO PACKAGES

When the website exists in a monorepo, consume shared functionality through real package boundaries.

Examples:

```text
@repo/api-client
@repo/auth
@repo/domain
@repo/schemas
@repo/types
@repo/ui
```

Do not import another application's private source through deep relative paths.

The monorepo skill governs workspace configuration.

---

# CROSS-PLATFORM SHARED CODE

Do not allow web-specific modules to leak into universal packages without explicit boundaries.

Browser-only APIs such as:

```text
window
document
navigator
localStorage
indexedDB
```

must not accidentally execute in server/native environments.

Use platform adapters or explicit package boundaries.

---

# COMPLETION CHECKLIST

Before declaring a modern React/Next.js web implementation production-ready, verify all applicable areas.

## Framework

- supported React version
- supported Next.js version
- correct router
- no obsolete configuration without reason

## Rendering

- appropriate server/client boundaries
- static/dynamic strategy intentional
- streaming where useful
- hydration errors absent

## State

- local state remains local
- server state has correct owner
- URL state used where appropriate
- global stores justified

## Data

- request waterfalls minimized
- caching intentional
- invalidation defined
- retries safe
- cancellation considered

## Mutations

- pending behavior
- optimistic/pessimistic decision
- reconciliation
- idempotency where necessary

## Routing

- semantic URLs
- correct navigation
- deep linking
- back/forward behavior

## Accessibility

- semantic HTML
- keyboard
- focus
- screen-reader support
- motion
- zoom

## SEO

- metadata
- indexing strategy
- canonical
- sitemap
- robots
- structured data where appropriate

## Security

- authentication
- authorization
- secure sessions
- XSS
- CSRF
- CSP
- CORS
- upload security
- no client secrets

## Media

- image optimization
- video strategy
- media cleanup
- heavy assets lazy-loaded

## Files

- upload validation
- size limits
- multipart/chunking where needed
- cancellation/retry
- secure downloads

## Realtime

- reconnect
- authentication
- missed event recovery
- cleanup
- offline behavior

## Storage

- cookies appropriate
- localStorage limited
- IndexedDB for larger/offline data
- sensitive tokens protected

## Performance

- Core Web Vitals checked
- bundle size reasonable
- client JavaScript minimized
- long tasks addressed
- large lists optimized

## Network

- slow/offline behavior
- timeout handling
- cancellation
- retry policy
- cache policy

## PWA

where applicable:

- manifest
- service worker
- offline behavior
- update behavior
- push permission UX

## Testing

- typecheck
- lint
- unit/integration tests
- critical E2E
- accessibility validation
- production build

## Deployment

- deployment runtime appropriate
- environment variables validated
- caching correct
- CDN behavior correct
- observability enabled

---

# AGENT EXECUTION PROCESS

When asked to create, audit or repair a website:

## Phase 1 — Discover

Inspect:

- framework versions
- route structure
- server/client boundaries
- data architecture
- package dependencies
- deployment target

## Phase 2 — Classify

Classify:

- rendering requirements
- state categories
- network requirements
- browser capabilities
- SEO requirements
- accessibility requirements
- offline/realtime requirements

## Phase 3 — Detect Problems

Identify:

- outdated patterns
- request waterfalls
- duplicate state
- excessive Client Components
- dependency bloat
- unsafe token storage
- missing authorization
- poor accessibility
- hydration issues
- cache mistakes
- performance bottlenecks

## Phase 4 — Design Correct Web Implementation

Choose the minimum set of:

- browser APIs
- React APIs
- Next.js APIs
- external packages

required.

## Phase 5 — Implement

Make focused changes.

Do not rewrite unrelated architecture merely for stylistic consistency.

## Phase 6 — Validate

Run relevant:

```text
install
typecheck
lint
test
build
```

Then validate actual browser behavior.

## Phase 7 — Production Audit

Check:

- performance
- security
- accessibility
- SEO
- caching
- deployment

## Phase 8 — Report

Explain:

- what was changed
- why
- what obsolete patterns were removed
- what packages were added
- what packages were avoided
- security implications
- performance implications
- remaining risks

---

# FINAL ENGINEERING PRINCIPLE

Do not begin by asking:

"What React package can solve this?"

Ask:

"Can the web platform solve it?"

Then:

"Can React solve it?"

Then:

"Can Next.js solve it?"

Then:

"Does an external package provide enough additional value to justify another dependency?"

Likewise, do not ask:

"Should this be client-side?"

Ask:

"Does this actually require the browser?"

Do not ask:

"Should this go in Zustand?"

Ask:

"What category of state is this?"

Do not ask:

"Should we make this realtime?"

Ask:

"Does realtime communication improve the actual product requirement?"

Do not ask:

"Can we cache this?"

Ask:

"How stale is this data allowed to become, who is allowed to see it, and how will it be invalidated?"

The objective is not to build the most complicated React or Next.js application.

The objective is to use the browser, React and Next.js at the correct boundaries so that the resulting website is:

FAST

ACCESSIBLE

SECURE

RESILIENT

NETWORK-EFFICIENT

SEO-CORRECT

CACHE-CORRECT

OBSERVABLE

MAINTAINABLE

and capable of exploiting modern web-platform features without becoming dependent on unnecessary framework or package complexity.