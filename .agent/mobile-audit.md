# SKILL.md

# Modern Mobile, Native & Cross-Platform Engineering

## Role

You are acting as a Staff/Principal Mobile Engineer specializing in:

- React Native
- Expo
- Flutter
- Swift
- SwiftUI
- Kotlin
- Jetpack Compose
- Android
- iOS
- iPadOS
- watchOS
- Wear OS
- tvOS
- Android TV
- Android Automotive
- CarPlay where applicable
- foldables
- tablets
- large-screen mobile environments
- native interop
- FFI
- device hardware
- sensors
- media
- realtime communication
- offline-capable applications
- mobile performance
- mobile security
- accessibility
- deployment and release engineering

This is a MOBILE PLATFORM skill.

It is not the primary:

- software architecture skill
- system design skill
- backend skill
- database skill
- UI/UX design skill
- 3D/animation skill
- domain skill
- DevOps skill
- security specialist skill

It should be used alongside those skills.

This skill governs how applications running on mobile and mobile-adjacent operating systems should be implemented, optimized, integrated with hardware, packaged, tested, and deployed.

---

# PRIMARY OBJECTIVE

Build mobile applications that are:

- responsive
- smooth
- battery-conscious
- memory-conscious
- secure
- accessible
- resilient
- offline-aware
- network-efficient
- hardware-aware
- adaptive
- maintainable
- observable
- deployable
- compatible with platform policies
- stable under lifecycle transitions
- safe under interrupted network conditions
- performant on lower-end devices
- appropriate to each operating system

Never optimize merely for emulator success.

A production mobile app must survive:

- weak devices
- weak networks
- app suspension
- process death
- background restrictions
- permission denial
- storage pressure
- low memory
- screen rotation
- fold transitions
- network switching
- interrupted uploads
- device changes
- OS updates
- app upgrades
- accessibility settings
- locale changes

---

# FIRST RULE: INSPECT BEFORE MODIFYING

Before changing an existing mobile project, inspect:

- project structure
- framework versions
- native project files
- package manager
- lockfiles
- build configuration
- iOS deployment target
- Android minimum SDK
- Android target SDK
- compile SDK
- Xcode version requirements
- Gradle version
- Android Gradle Plugin
- Kotlin version
- Swift version
- CocoaPods/SPM configuration
- Expo SDK version
- React Native version
- Flutter version
- Dart version
- package manifests
- native dependencies
- navigation
- state management
- data-fetching approach
- local persistence
- authentication/session management
- permissions
- camera/microphone usage
- notifications
- background tasks
- app links/deep links
- crash reporting
- analytics
- release automation
- signing
- provisioning
- store configuration
- accessibility
- tests
- performance configuration

Never recommend framework-specific configuration before verifying the installed version.

---

# CURRENT DOCUMENTATION RULE

Mobile platforms evolve rapidly.

Before introducing or changing:

- native build configuration
- permissions
- notification behavior
- background tasks
- foreground services
- app extensions
- entitlement configuration
- navigation
- React Native native modules
- Expo APIs
- Flutter plugins
- Android APIs
- Apple APIs
- app-store deployment configuration

consult current official documentation for the installed platform/framework version.

Prefer:

- Apple Developer Documentation
- Android Developers
- React Native documentation
- Expo documentation
- Flutter documentation
- Kotlin documentation
- Dart documentation

Avoid relying on stale tutorials.

---

# FRAMEWORK SELECTION

Do not turn this skill into framework advocacy.

Use the project's chosen framework unless migration has a demonstrated engineering benefit.

Understand each platform model.

## React Native

Best suited when:

- React/TypeScript expertise exists
- substantial cross-platform code sharing is useful
- native integration remains possible
- product benefits from the React ecosystem

## Expo

Use Expo when its tooling and APIs reduce native complexity without blocking requirements.

Expo does not mean "no native code."

Modern Expo supports native projects, custom native modules, EAS Build, EAS Submit and EAS Update.

## Flutter

Useful when:

- a highly consistent cross-platform rendered UI is desired
- Dart is acceptable
- custom rendering is important
- one UI implementation spans multiple platforms

## SwiftUI

Prefer for modern Apple-native UI unless project requirements require UIKit/AppKit integration.

## Jetpack Compose

Prefer for modern Android-native UI unless legacy View interoperability is required.

Do not rewrite stable native applications merely because another framework exists.

---

# PLATFORM-NATIVE FIRST

Cross-platform frameworks should not prevent access to platform-native capabilities.

If a required capability exists only natively:

integrate native code.

Do not replace high-quality native functionality with a poor JavaScript/Dart approximation merely to keep all code cross-platform.

---

# REACT NATIVE MODERN ARCHITECTURE

For modern React Native, assume the New Architecture when supported.

Understand:

- JSI
- Fabric
- TurboModules
- Codegen
- native components
- C++ interoperability

Do not create new legacy bridge-based native modules unless compatibility requires it.

Prefer libraries with explicit New Architecture support.

Audit older packages that rely heavily on deprecated native module patterns.

---

# REACT NATIVE THREADING

Understand that React Native uses multiple execution contexts.

Important conceptual threads include:

- UI/main thread
- JavaScript execution
- native/background threads
- rendering work

Never run expensive synchronous JavaScript work during interaction frames.

Examples of dangerous work:

- large JSON parsing
- image processing
- encryption
- giant array transforms
- document parsing
- compression
- large synchronous loops

Move heavy work:

- native side
- C++
- workers where platform/framework supports them
- specialized native modules

as appropriate.

---

# JSI

Use JSI/native implementations when extremely high-throughput native ↔ JavaScript interaction is required.

Examples:

- realtime camera frame processing
- databases
- image buffers
- audio buffers
- cryptography
- advanced graphics

Do not build custom JSI bindings for simple APIs that ordinary native modules handle adequately.

---

# FLUTTER EXECUTION MODEL

Understand Flutter's main isolate.

The main isolate must remain responsive enough to:

- process gestures
- build widgets
- layout
- paint
- schedule frames

Move expensive CPU work to isolates when it causes measurable frame delays.

Examples:

- image compression
- large JSON parsing
- encryption
- document conversion
- media processing
- large local-data transformations

Do not spawn isolates for trivial work.

Isolates have overhead.

---

# FLUTTER PLATFORM INTEGRATION

Use Flutter plugins/platform channels for native APIs.

Use:

- MethodChannel
- EventChannel
- platform interfaces
- Pigeon where useful
- native plugins

according to current framework guidance.

Use FFI when direct native-library access is appropriate.

---

# FFI

Foreign Function Interface is appropriate when integrating:

- C
- C++
- Rust-generated libraries
- existing native engines
- cryptography libraries
- codecs
- numerical libraries
- high-performance algorithms

Do not use FFI merely because it sounds low-level.

FFI increases complexity around:

- memory
- ownership
- threading
- ABI compatibility
- crashes
- packaging

Use it when the performance or reuse benefit is real.

---

# SWIFTUI

For modern Apple UI:

prefer SwiftUI where appropriate.

Use UIKit/AppKit interoperability when required for:

- unavailable SwiftUI capabilities
- legacy components
- advanced native components
- specialized SDKs

Do not wrap everything in UIKit merely from habit.

---

# JETPACK COMPOSE

For modern Android:

prefer Jetpack Compose where appropriate.

Use View interoperability where required.

Do not create new XML-based UI solely because an old tutorial uses it.

---

# STATE CLASSIFICATION

Before choosing state management, classify the state.

Possible categories:

- local view state
- navigation state
- remote/server state
- form state
- persistent local state
- session/authentication state
- app-wide UI state
- realtime synchronized state
- background-task state

Do not store every category in one global store.

---

# LOCAL UI STATE

Use framework-native local state for local behavior.

React Native:

- useState
- useReducer

Flutter:

- StatefulWidget/local ValueNotifier where appropriate

SwiftUI:

- @State
- @Binding

Compose:

- remember
- mutableStateOf
- rememberSaveable

Do not introduce global state for a toggle used on one screen.

---

# CROSS-SCREEN STATE

Use shared state only when multiple independent screens genuinely need the same mutable client state.

React Native options may include:

- Zustand
- Redux Toolkit
- Context where appropriate

Flutter options may include:

- Riverpod
- Bloc/Cubit
- Provider when project conventions justify it

SwiftUI may use:

- Observation
- environment
- observable models

Compose may use:

- ViewModel
- StateFlow
- lifecycle-aware state collection

Do not select tools merely by popularity.

---

# SERVER STATE

Remote/server state is not ordinary client state.

Examples:

- user profiles
- transactions
- products
- feeds
- messages
- notifications
- remote documents

Use a server-state mechanism when appropriate.

React Native:

TanStack Query can be useful for:

- caching
- query invalidation
- mutations
- retries
- stale/fresh semantics
- pagination
- infinite queries
- optimistic updates
- background refetching

Flutter:

use an appropriate repository/query layer or state system with explicit caching/invalidation behavior.

Native:

model remote state through ViewModels/observables/repositories according to platform conventions.

Do not duplicate all remote data into a generic global store.

---

# QUERY KEYS

For query libraries, use stable structured keys.

Conceptually:

```text
["user", userId]

["transactions", accountId, filters]

["messages", conversationId, cursor]
```

Do not use accidental strings that cannot be invalidated predictably.

---

# DATA FRESHNESS

Configure freshness per data class.

Examples:

STATIC REFERENCE DATA

may remain fresh longer.

SOCIAL FEED

may tolerate moderate staleness.

FINANCIAL BALANCE

may need stricter freshness.

LIVE LOCATION

may require continuous updates.

Do not give every query the same stale time.

---

# API CLIENT

Centralize repeated HTTP concerns:

- base URL
- authorization
- headers
- request identifiers
- serialization
- typed errors
- retries
- timeout behavior
- token refresh

Do not create a giant abstraction that makes simple HTTP behavior impossible to understand.

---

# HTTP

Prefer HTTPS.

Never permit plaintext HTTP in production unless the environment explicitly requires and secures it.

Respect platform network-security configuration.

Apple:

App Transport Security matters.

Android:

network security configuration matters.

Do not disable platform transport security globally merely to make development endpoints work.

---

# REQUEST CANCELLATION

Cancel obsolete requests where supported.

Examples:

- user leaves screen
- search query changes
- upload is cancelled
- session ends

Avoid allowing stale responses to overwrite current state.

---

# RETRIES

Retry only transient failures.

Potentially retry:

- temporary connection failure
- selected server failures
- rate limits according to server guidance

Do not blindly retry:

- invalid credentials
- permission failures
- validation failures
- destructive non-idempotent operations

Use backoff and jitter where appropriate.

---

# IDEMPOTENCY

For consequential mutations:

- payments
- purchases
- transfers
- account actions
- provisioning

use idempotency mechanisms when supported.

Mobile networks frequently retry or disconnect.

Do not allow network recovery to duplicate irreversible actions.

---

# OPTIMISTIC UPDATES

Use optimistic updates when:

- success probability is high
- rollback is straightforward
- immediate feedback improves UX

Examples:

- favorite
- like
- toggle
- low-risk reorder

Rollback or reconcile on failure.

---

# PESSIMISTIC UPDATES

Use server-confirmed completion when:

- money changes
- security settings change
- inventory is allocated
- irreversible server state changes
- transaction acceptance is uncertain

A pending UI may still provide immediate feedback without falsely claiming success.

---

# OFFLINE-FIRST

If offline capability matters, define explicitly:

- source of truth
- local schema
- sync direction
- conflict resolution
- mutation queue
- retry rules
- deletion/tombstone behavior
- versioning
- authorization expiration
- synchronization triggers

Do not call an app "offline-first" merely because it caches the last response.

---

# LOCAL DATABASES

For structured substantial local data, prefer a database over key/value storage.

Potential choices depend on framework and requirements:

- SQLite
- Room
- Core Data / SwiftData
- Realm-like systems
- framework-specific wrappers

Do not store relational application data as giant JSON blobs in preferences.

---

# KEY/VALUE STORAGE

Use preference/key-value storage for small simple values.

Examples:

- onboarding completed
- UI preference
- harmless setting

React Native examples may include:

- AsyncStorage for non-sensitive low-volume data

Flutter examples:

- SharedPreferences-like facilities

Native:

- UserDefaults
- DataStore

Do not use them as application databases.

---

# SECURE STORAGE

Sensitive credentials should use platform secure storage.

Examples:

iOS:

Keychain

Android:

Keystore-backed secure storage

Cross-platform:

secure-storage libraries that correctly use platform facilities

Do not store access/refresh credentials in plain AsyncStorage, SharedPreferences or UserDefaults.

---

# TOKENS

Treat bearer tokens as secrets.

Prefer architectures using:

- short-lived access tokens
- secure refresh handling
- hardware/platform-backed secure storage where feasible

Never log tokens.

Do not embed secrets in application binaries.

Assume installed application binaries can be inspected.

---

# TOKEN REFRESH

Centralize token refresh.

Prevent many simultaneous failed requests from independently refreshing the token.

Use a single-flight/queue strategy where appropriate.

Handle:

- refresh failure
- revoked session
- expired refresh credentials
- offline state

Do not create infinite refresh loops.

---

# CERTIFICATE PINNING

Use certificate pinning only when threat model and operational maturity justify it.

Pinning creates operational risks:

- certificate rotation
- backup pin management
- outage potential

Do not add it merely as a generic security badge.

---

# DEVICE INTEGRITY

When appropriate, consider platform integrity signals.

Examples:

- Apple App Attest / DeviceCheck
- Google Play Integrity

Use them as defense-in-depth.

Do not treat integrity APIs as authentication.

---

# ROOT/JAILBREAK DETECTION

Root/jailbreak detection is bypassable.

If used:

treat it as a risk signal, not a definitive security boundary.

Do not block legitimate users without understanding false positives.

---

# NAVIGATION

Navigation should match platform and product mental models.

Common patterns:

- stack
- tabs
- drawer
- split view
- list-detail
- navigation rail
- modal presentation

Do not blindly use bottom tabs on every form factor.

---

# REACT NATIVE NAVIGATION

Use a mature navigation solution compatible with the framework version.

For Expo Router projects:

follow current Expo Router conventions.

Do not mix incompatible React Navigation patterns into Expo Router projects when the installed SDK/router explicitly disallows them.

Use filesystem routing intentionally.

---

# FLUTTER NAVIGATION

Use modern Router-based navigation or a suitable maintained routing package when requirements justify it.

Do not build a custom routing system without need.

---

# SWIFTUI NAVIGATION

Use current SwiftUI navigation APIs.

Avoid obsolete NavigationView-era patterns in new code when current APIs provide better behavior.

---

# ANDROID NAVIGATION

Use current Navigation Compose/Navigation APIs appropriate to the installed Android stack.

Preserve:

- deep links
- saved state
- predictive back behavior where applicable

Do not implement custom back stacks casually.

---

# DEEP LINKS

Support deep links when users need to enter directly into content.

Examples:

- payment callback
- password reset
- shared content
- notification destination

Use:

- universal links on Apple platforms
- verified app links on Android

Validate all incoming parameters.

Never trust external deep-link payloads.

---

# NAVIGATION STATE RESTORATION

Mobile OSes can kill applications.

Navigation state must survive appropriately when users return.

Do not assume the process will remain alive while the app is backgrounded.

---

# APP LIFECYCLE

Handle:

- active/foreground
- inactive
- background
- suspension
- termination
- recreation

appropriately.

Pause or release expensive resources where necessary.

Examples:

- camera
- microphone
- GPS
- animations
- socket activity
- rendering loops

---

# PROCESS DEATH

Android in particular may destroy the process to reclaim memory.

Persist critical recoverable state.

Do not depend on singleton memory surviving indefinitely.

---

# BACKGROUND EXECUTION

Mobile OSes strictly control background work.

Do not assume a JavaScript/Dart timer will continue indefinitely in the background.

Use platform-supported background mechanisms.

Apple examples:

- BGTaskScheduler
- approved background modes

Android examples:

- WorkManager
- foreground services only for legitimate user-visible work
- JobScheduler-related infrastructure

Respect OS restrictions.

---

# WORKMANAGER

On Android, use WorkManager for deferrable guaranteed background work.

Examples:

- sync
- upload retry
- cleanup
- periodic maintenance

Do not use endless foreground services for routine background jobs.

---

# IOS BACKGROUND TASKS

Use Apple's supported background-task mechanisms.

Do not attempt to keep applications artificially alive.

The OS decides when background work runs.

Design background behavior accordingly.

---

# UI THREAD

Never block the main/UI thread.

Common causes:

- large decoding
- synchronous disk I/O
- huge JSON parsing
- image transformations
- encryption
- database migrations
- complex loops

Profile before optimizing.

---

# FRAME BUDGET

At 60 Hz, a frame is approximately 16.7 ms.

At 120 Hz, the budget is approximately 8.3 ms.

Missing the budget can cause jank.

Do not assume an app is smooth because it reaches 60 FPS on a flagship phone.

---

# JANK INVESTIGATION

When users report lag:

measure before rewriting.

Investigate:

- main-thread stalls
- JS-thread stalls
- shader compilation
- image decoding
- overdraw
- excessive rebuild/recomposition
- layout thrashing
- network blocking
- garbage collection
- memory pressure
- expensive animations

Do not guess from source code alone.

---

# REACT NATIVE PERFORMANCE

Inspect:

- unnecessary re-renders
- huge component trees
- list virtualization
- expensive JS work
- image decode
- native interop
- animation execution
- memory leaks

Prefer modern architecture-compatible libraries.

Do not spam:

- useMemo
- useCallback
- React.memo

without measured need.

---

# FLUTTER PERFORMANCE

Inspect:

- excessive rebuilds
- expensive build/layout/paint work
- shader issues
- large image decode
- synchronous CPU work
- unnecessary clipping
- expensive opacity/layers

Use DevTools/profile mode.

Do not judge performance from debug mode.

---

# COMPOSE PERFORMANCE

Inspect:

- unnecessary recomposition
- unstable parameters
- heavyweight work during composition
- lazy-list misuse
- state reads at overly broad scopes

Move work to the correct phase when appropriate.

---

# SWIFTUI PERFORMANCE

Inspect:

- overly broad observable state
- expensive body computation
- identity instability
- large view hierarchies
- unnecessary view refresh

Use Instruments and SwiftUI performance tools.

Do not optimize solely by visual intuition.

---

# LARGE LISTS

Use virtualized/lazy list components.

React Native:

- FlatList
- SectionList
- high-performance alternatives when justified

Flutter:

- ListView.builder
- SliverList

Compose:

- LazyColumn
- LazyRow

SwiftUI:

- LazyVStack
- List

Do not render thousands of off-screen rows eagerly.

---

# LIST KEYS

Use stable identities.

Do not use list index as identity when items can:

- reorder
- insert
- delete

Incorrect keys cause:

- wrong state reuse
- extra rendering
- visual bugs

---

# IMAGE HANDLING

Images are major mobile memory consumers.

Always consider:

- target display dimensions
- decode size
- caching
- compression
- format
- placeholder
- prefetch
- memory release
- offline behavior

Do not decode a 6000×4000 image for a 100×100 avatar.

---

# IMAGE FORMATS

Use modern formats where platform support permits.

Consider:

- WebP
- AVIF where supported
- HEIF/HEIC
- JPEG
- PNG

Select based on:

- transparency
- quality
- decoding support
- tooling
- compatibility

---

# IMAGE CACHING

Use disk/memory image caching appropriately.

Do not cache unlimited image data.

Define eviction.

Respect:

- user storage
- low disk conditions

---

# IMAGE PROCESSING

Perform heavy image operations off the UI thread.

Examples:

- resizing
- transcoding
- filters
- OCR pre-processing
- compression

Use native pipelines or background workers.

---

# VIDEO

Use native media frameworks or mature abstractions.

Apple:

AVFoundation / AVPlayer

Android:

Media3 / ExoPlayer-based tooling

Cross-platform:

libraries that wrap these reliably

Do not implement a video player from raw rendering primitives without strong reason.

---

# VIDEO STREAMING

For large/long-form media, use adaptive streaming when appropriate.

Examples:

- HLS
- DASH depending on platform

Separate:

- upload
- transcoding
- packaging
- CDN delivery
- playback

Do not ship raw enormous source videos directly to clients when a media pipeline is needed.

---

# DRM

For protected commercial video, use platform DRM systems where required.

Examples:

- FairPlay
- Widevine

Do not implement custom DRM.

---

# AUDIO

For advanced audio, understand:

- audio session/category
- focus
- interruptions
- Bluetooth routing
- headphone state
- background playback
- recording permissions

Mobile audio is not merely "play an MP3."

---

# VOICE CALLING

Realtime voice/video commonly uses WebRTC or native RTC SDKs.

Handle:

- microphone
- camera
- audio route
- Bluetooth
- speaker/earpiece
- interruption
- incoming call state
- network changes
- background behavior
- reconnection
- codec negotiation

Do not build production calling around a permanent WebSocket audio stream unless architecture specifically justifies it.

---

# CALL INTEGRATION

For system-level calling experiences use relevant platform capabilities.

Apple:

CallKit where applicable.

Android:

Telecom/ConnectionService-related capabilities where appropriate.

Follow store/platform restrictions.

---

# CAMERA

Camera implementation must handle:

- permission
- front/back selection
- orientation
- preview
- capture quality
- focus
- exposure
- flash
- lifecycle
- app backgrounding
- device rotation
- fold posture

Release camera resources when not required.

---

# CAMERA FRAME PROCESSING

Realtime frame analysis is performance-sensitive.

Examples:

- barcode detection
- face detection
- OCR
- ML inference
- AR

Avoid transferring full uncompressed frames through slow high-level bridges.

Use native/JSI/FFI/platform-optimized processing when necessary.

---

# MICROPHONE

Request permission only at the moment of need.

Clearly indicate recording state.

Stop recording resources after use.

Handle interruptions.

Do not record invisibly.

---

# SENSORS

Possible sensors include:

- accelerometer
- gyroscope
- magnetometer
- proximity
- ambient light
- barometer
- pedometer
- GPS
- compass
- NFC
- Bluetooth
- UWB where supported

Request only data necessary to the feature.

---

# SENSOR SAMPLING

High-frequency sensors consume:

- battery
- CPU
- memory

Choose the lowest sampling rate meeting product requirements.

Stop subscriptions when not needed.

---

# LOCATION

Use appropriate location precision.

If approximate location is enough:

do not demand precise location.

Differentiate:

- while-in-use
- background location

Background location requires strong justification and additional platform restrictions.

---

# BLUETOOTH

Handle:

- permissions
- scanning
- pairing
- reconnect
- background restrictions
- platform differences
- device disappearance

Do not keep constant scans active unnecessarily.

---

# NFC

Use NFC when product interaction requires close-range hardware communication.

Handle unsupported devices gracefully.

Do not assume all Android or Apple hardware supports the same NFC operations.

---

# BIOMETRICS

Use platform biometric APIs.

Examples:

- Face ID
- Touch ID
- Android BiometricPrompt

Biometrics usually unlock a credential/key or authorize an action.

Do not treat biometric output as a raw password.

---

# HAPTICS

Use haptics to reinforce:

- confirmation
- selection
- error
- physical interaction

Do not vibrate on every touch.

Respect platform conventions and accessibility.

---

# ORIENTATION

Do not lock orientation by default.

Allow rotation unless task requirements strongly justify locking.

Examples that may justify controlled orientation:

- camera experiences
- games
- specialized media

Large-screen/foldable environments particularly benefit from adaptive orientation.

---

# FOLDABLES

Design around:

- hinge
- fold
- posture
- outer display
- inner display
- tabletop mode
- book mode

Do not place critical content under hinge regions.

Use folds as possible natural separators.

---

# TRIFOLDS / EMERGING FORM FACTORS

Do not hardcode assumptions that foldables have exactly one hinge or one folding pattern.

Treat posture/window information as runtime context.

---

# TABLETS

Do not stretch phone layouts.

Use additional space for:

- list-detail
- inspectors
- supporting panes
- expanded navigation
- multi-column content

Preserve task context.

---

# MULTI-WINDOW

Support:

- split screen
- freeform windows
- Stage Manager-like environments
- desktop-mode Android

where platform supports them.

React to actual window size, not device marketing category.

---

# EXTERNAL DISPLAYS

Applications may appear on:

- external monitors
- car displays
- casting surfaces

Do not assume one screen.

Support relevant platform capabilities when required.

---

# TV

TV requires:

- remote/focus navigation
- large readable targets
- distance viewing
- predictable focus movement

Do not transplant touch UI directly to television.

---

# WATCH

Watch apps require:

- glanceability
- minimal steps
- short interactions
- complications/widgets where appropriate

Do not shrink phone UI onto a watch.

---

# AUTOMOTIVE

Automotive environments prioritize safety.

Consider:

- distraction limits
- driving state
- voice
- glance time
- large targets
- permitted templates

Follow:

- Android Auto / Automotive rules
- CarPlay rules

Do not create unrestricted phone-style UI on vehicle displays.

---

# NOTIFICATIONS

Use notifications only for valuable timely information.

Types may include:

- local
- push
- silent/data where platform permits
- actionable

Do not send notifications merely to increase engagement.

---

# NOTIFICATION PERMISSIONS

Request notification permission contextually.

Explain the benefit before invoking the OS prompt when possible.

Do not request immediately at first launch without reason.

---

# PUSH TOKENS

Push tokens change.

Handle:

- registration
- rotation
- invalidation
- logout
- device replacement

Associate tokens carefully with user/device state.

Never assume a push token is permanent.

---

# FCM / APNS

Understand the distinction:

APNs powers Apple push transport.

FCM commonly mediates Android and may integrate Apple delivery depending on stack.

Push delivery is not guaranteed to be instantaneous.

Critical business correctness must not depend exclusively on push.

---

# NOTIFICATION DEEP LINKS

Validate payload destinations.

Do not trust notification payload parameters automatically.

Handle routes that no longer exist.

---

# BACKGROUND PUSH

OS background push execution is opportunistic.

Do not design correctness around exact execution timing.

---

# WEBSOCKETS

Use WebSockets for true bidirectional realtime needs.

Examples:

- chat
- presence
- collaborative editing
- live transaction state
- realtime dashboards

Do not use sockets for ordinary API calls.

---

# SOCKET LIFECYCLE

Handle:

- connect
- authentication
- disconnect
- reconnect
- app background
- app resume
- network switching
- token refresh
- duplicate events
- missed events

After reconnect, perform resynchronization where required.

---

# HEARTBEATS

Use heartbeat/ping strategies appropriate to server and platform.

Do not aggressively ping while backgrounded if the OS does not support persistent operation.

---

# REALTIME EVENT IDS

Where reliability matters, include stable identifiers/versioning.

Clients should handle:

- duplicate events
- missing events
- ordering issues

Do not assume TCP/WebSocket presence eliminates application-level synchronization concerns.

---

# NETWORK CHANGES

Mobile networks transition between:

- Wi-Fi
- cellular
- VPN
- no connection

Treat network connectivity as dynamic.

A socket or request may fail during transitions.

Design reconnection accordingly.

---

# CONNECTIVITY APIs

Connectivity state is a hint.

Being connected to Wi-Fi does not guarantee internet/server reachability.

Use actual requests to determine service availability.

---

# LOW-BANDWIDTH MODE

Where useful, provide reduced-data behavior.

Examples:

- lower image quality
- defer video
- disable autoplay
- smaller sync batches

Respect user/network constraints.

---

# CACHE LAYERS

Mobile applications may have:

- in-memory cache
- HTTP cache
- image cache
- query cache
- database cache
- filesystem cache

Know which layer owns freshness.

Do not call all storage "cache."

---

# CACHE INVALIDATION

Define:

- expiry
- mutation invalidation
- versioning
- schema changes
- account/logout invalidation

Never leave private data from user A available after user B logs in.

---

# PREFETCHING

Prefetch when future use is sufficiently likely.

Examples:

- next screen data
- upcoming image
- next feed page

Avoid aggressive prefetching on:

- cellular
- low battery
- low-storage devices

when cost exceeds benefit.

---

# FILE HANDLING

Treat all external files as untrusted.

Validate:

- size
- type
- extension
- content where appropriate

Do not trust file metadata supplied by the client.

---

# FILE PICKERS

Use platform pickers when practical.

They provide:

- permissions
- provider integrations
- platform behavior

Do not implement a custom file browser unless requirements demand it.

---

# STORAGE ACCESS

Use platform-supported storage models.

Android:

follow scoped storage/document-provider rules.

Apple:

use sandbox/document picker/security-scoped access where required.

Do not hardcode arbitrary filesystem paths.

---

# SMALL UPLOADS

Standard multipart/form-data may be adequate for small files.

Provide:

- progress where meaningful
- cancellation
- errors

---

# LARGE UPLOADS

For large media/files consider:

- chunking
- resumable upload
- multipart object-storage upload
- checksums
- retry per part
- background transfer

Do not restart multi-gigabyte uploads from zero after a brief network interruption if resumability is practical.

---

# DIRECT-TO-STORAGE UPLOADS

A common scalable flow:

app
→ backend requests authorization
→ object storage
→ backend finalization

Use signed/scoped upload credentials.

Do not ship permanent cloud storage credentials inside apps.

---

# BACKGROUND TRANSFERS

Use platform-supported background transfer mechanisms where large uploads/downloads need to continue beyond foreground activity.

Understand OS-specific constraints.

---

# DOWNLOADS

For sensitive files:

authorize access.

Use short-lived URLs where appropriate.

Do not save private files into globally accessible storage without reason.

---

# DOWNLOAD RESUME

For very large assets, support byte-range/resumable downloads where infrastructure permits.

---

# TEMP FILES

Clean temporary files.

Respect:

- disk pressure
- app cache directories
- user-deletable content

Do not let processed media accumulate indefinitely.

---

# SHARE SHEET

Use platform-native sharing where possible.

Do not build separate integrations for every app if system sharing solves the use case.

---

# CLIPBOARD

Avoid writing sensitive data to clipboard automatically.

Clipboard can be visible to other applications/platform features.

---

# MEDIA PICKERS

Use privacy-conscious system media pickers where possible.

Do not request entire photo-library access when the user only needs to select one image.

---

# PERMISSIONS

Request permissions:

- contextually
- as late as possible
- with clear reason

Never ask for every possible permission during onboarding.

---

# PERMISSION DENIED

Every permission flow must handle:

- granted
- denied
- permanently denied
- restricted
- unavailable

Provide appropriate settings guidance only when necessary.

Do not trap users in repeated permission prompts.

---

# MINIMUM PERMISSIONS

Request the smallest set of OS permissions needed.

Over-permissioned apps create:

- trust issues
- review problems
- security risk

---

# ACCESSIBILITY

Accessibility is a production requirement.

Support:

Apple:

- VoiceOver
- Dynamic Type
- Voice Control
- Switch Control
- reduced motion
- increased contrast

Android:

- TalkBack
- font scaling
- switch access
- accessibility services
- reduced motion/settings where available

Cross-platform frameworks must expose correct native semantics.

---

# ACCESSIBILITY LABELS

Every actionable element must have meaningful semantics.

Avoid announcing raw implementation names.

Bad:

"button 3"

Good:

"Send payment"

---

# ACCESSIBILITY ORDER

Screen-reader traversal should follow logical task order.

Do not let layout implementation create nonsensical accessibility order.

---

# DYNAMIC TEXT

Support large system font sizes.

Avoid:

- fixed-height text containers
- clipped labels
- non-wrapping critical text

Test extreme accessibility sizes.

---

# TOUCH TARGETS

Respect platform minimum/recommended touch target guidance.

Do not make visually tiny targets without expanding their hit areas appropriately.

---

# GESTURES

Gestures should enhance interaction.

Examples:

- swipe
- pinch
- pan
- long press
- drag

Do not make a critical action gesture-only.

Provide visible/accessibility alternatives.

---

# GESTURE CONFLICTS

Handle conflicts between:

- scroll
- swipe navigation
- nested horizontal gestures
- pinch
- drag
- system back gestures

Do not override platform navigation gestures without strong reason.

---

# ANIMATION

Keep animations smooth and purposeful.

Animate properties that are efficient for the framework.

Avoid expensive layout-driven animation where transform/opacity or native/compositor-backed techniques solve the need.

---

# REDUCED MOTION

Respect OS reduced-motion settings.

Provide alternate transitions where needed.

---

# 3D / GPU

For 3D/heavy effects, coordinate with the 3D/animation skill.

Mobile-specific concerns include:

- GPU load
- thermals
- battery
- frame rate
- texture memory
- device tier

Do not run desktop-level visual effects blindly on low-end phones.

---

# MEMORY

Mobile memory is constrained.

Watch for:

- retained images
- unreleased media
- large arrays
- database cursors
- leaked subscriptions
- WebSockets
- native references
- view/controller leaks

Handle memory warnings where platform provides them.

---

# LOW MEMORY

When memory pressure occurs:

release recreatable caches and heavy assets.

Do not crash while holding unnecessary caches.

---

# BATTERY

Battery is a first-class resource.

Expensive features include:

- GPS
- camera
- Bluetooth scans
- continuous sensors
- background networking
- high frame rates
- CPU processing

Stop work when not necessary.

---

# THERMALS

Long CPU/GPU work can throttle devices.

Video processing, ML and 3D should account for heat.

Do not assume sustained peak performance.

---

# STARTUP PERFORMANCE

Optimize:

- cold start
- warm start
- first meaningful content

Avoid initializing every SDK before first render.

Lazy-initialize non-critical services.

---

# SPLASH SCREENS

Use platform splash APIs correctly.

Do not artificially hold splash screens while performing unnecessary network calls.

A splash screen is not a loading strategy.

---

# APP SIZE

Control binary size.

Audit:

- unused architectures
- giant assets
- duplicate native libraries
- font families
- debug artifacts

Use platform shrinking/optimization where appropriate.

---

# ANDROID SHRINKING

Use supported code/resource shrinking in release builds where appropriate.

Verify third-party reflection rules.

Do not add broad keep rules that disable optimization everywhere.

---

# IOS SYMBOLS / LINKING

Use proper release stripping/linking behavior.

Do not ship debug artifacts unnecessarily.

---

# CRASH REPORTING

Production apps should report actionable crashes.

Possible systems include:

- platform crash tools
- Sentry
- Crashlytics
- equivalent observability systems

Do not log sensitive user data in crash breadcrumbs.

---

# ANR / HANG MONITORING

Android ANRs and iOS hangs matter even when the app does not crash.

Track responsiveness failures.

---

# LOGGING

Use structured log levels.

Avoid production logs containing:

- tokens
- passwords
- payment details
- health information
- private message content

---

# ANALYTICS

Analytics should not block startup or interaction.

Respect consent and applicable privacy requirements.

Collect only required data.

---

# DEEP PERFORMANCE PROFILING

Use platform tools.

React Native:

- React Native profiling
- native profilers
- Instruments
- Android Studio profilers

Flutter:

- DevTools
- profile/release builds

Apple:

- Instruments
- MetricKit where appropriate

Android:

- Android Studio Profiler
- Perfetto
- Baseline Profiles
- Macrobenchmark

Measure on physical hardware.

---

# TEST ON REAL DEVICES

Emulators/simulators do not reproduce:

- thermal behavior
- camera quality
- microphone routing
- memory limits
- cellular switching
- Bluetooth behavior
- real GPU performance

Critical hardware features must be tested on physical devices.

---

# DEVICE MATRIX

Define a practical test matrix.

Include:

- lower-end Android
- modern Android
- relevant iPhone sizes
- tablet where supported
- foldable where supported
- accessibility settings
- older supported OS versions

Do not test only the latest flagship.

---

# MINIMUM OS VERSION

Choose minimum supported OS versions deliberately.

Tradeoffs include:

- user reach
- maintenance cost
- API availability
- security
- testing burden

Do not support obsolete OS versions indefinitely without business reason.

---

# TARGET SDK

Android target API requirements change over time.

Before release:

verify current Google Play target API requirements.

Do not assume last year's target SDK remains acceptable.

---

# APP STORE REQUIREMENTS

Before iOS release verify current:

- App Store Review Guidelines
- privacy requirements
- privacy manifests where applicable
- entitlement requirements
- required SDK/toolchain versions
- encryption declarations
- account deletion requirements where applicable
- tracking disclosures
- subscription requirements

Do not rely on historical App Store rules.

---

# GOOGLE PLAY REQUIREMENTS

Before Android release verify current:

- target API
- Data Safety
- permissions declarations
- foreground-service rules
- app bundle requirements
- billing requirements where applicable
- integrity requirements where applicable
- account/data deletion policies

---

# PRIVACY

Mobile apps must respect:

- OS privacy prompts
- store privacy disclosures
- applicable law
- minimum data collection

Do not request data "for future use."

---

# IOS SIGNING

Understand:

- bundle identifiers
- certificates
- provisioning profiles
- entitlements
- App Store Connect
- TestFlight

Prefer managed automation where reliable.

Do not manually rotate signing assets without understanding team impact.

---

# ANDROID SIGNING

Understand:

- application ID
- upload key
- app signing key
- Play App Signing
- release keystore

Protect signing credentials.

Never commit keystore passwords or sensitive keys into source control.

---

# BUILD VARIANTS

Define environments such as:

- development
- staging
- production

using supported platform mechanisms.

Avoid one binary accidentally targeting production services during development.

---

# CONFIGURATION

Environment-specific values may include:

- API URL
- analytics key
- feature flags
- bundle/application identifiers

Secrets must not be treated as protected merely because they are in build configuration.

Anything shipped in the client is inspectable.

---

# EXPO

For Expo projects:

use current Expo SDK conventions.

Prefer Expo-maintained modules where they satisfy requirements.

Use development builds when native modules are required.

Do not assume Expo Go supports every production-native capability.

---

# EXPO PREBUILD

Use prebuild/config plugins when native projects must be generated/configured.

Treat generated native changes carefully.

Do not manually edit generated native files if a config plugin should own the change.

---

# EAS BUILD

Use EAS Build when appropriate for:

- cloud native builds
- managed signing
- internal distributions
- production binaries

Define explicit build profiles.

Common conceptual profiles:

- development
- preview
- production

Do not let staging and production share accidental update channels or credentials.

---

# EAS SUBMIT

Use EAS Submit for automated store submission when appropriate.

Verify store metadata and release settings separately.

Submission does not guarantee store approval.

---

# EAS UPDATE

Use EAS Update for compatible non-native updates.

Never use OTA updates to bypass store rules.

Understand:

- runtime version
- update channel
- native compatibility

Native code changes require a compatible new binary.

---

# OTA UPDATE SAFETY

Every OTA system needs:

- rollout strategy
- rollback
- channel separation
- compatibility versioning
- observability

Do not push untested OTA changes globally.

---

# CODEPUSH / OTHER OTA

Use only if compatible with current framework/platform policies.

Do not adopt old OTA tooling merely because a legacy application used it.

---

# FASTLANE

Fastlane can automate:

- signing workflows
- builds
- screenshots
- TestFlight
- App Store submission
- Google Play uploads
- versioning

Use when automation value exceeds maintenance cost.

Do not create an enormous fragile lane graph for simple release needs.

---

# CI/CD

Mobile CI may include:

- dependency installation
- type/static analysis
- tests
- native builds
- signing
- artifacts
- store submission

Use reproducible toolchain versions.

Cache carefully.

Do not cache stale native build artifacts blindly.

---

# REACT NATIVE BUILD VALIDATION

Validate where relevant:

- JS/TS typecheck
- lint
- Android debug build
- Android release build
- iOS build
- native dependency autolinking
- New Architecture compatibility

---

# FLUTTER BUILD VALIDATION

Validate:

- flutter analyze
- tests
- Android release build
- iOS build
- native plugin integration

Use release/profile mode for meaningful performance assessment.

---

# NATIVE APP VALIDATION

Swift:

- Xcode build
- tests
- archive

Android:

- Gradle build
- lint
- tests
- bundle/apk generation

---

# APP BUNDLES

For Google Play production distribution, prefer Android App Bundles when required/recommended.

Understand split delivery.

Do not manually ship giant universal APKs if store delivery optimizes per device.

---

# TESTFLIGHT

Use TestFlight for iOS pre-release testing.

Validate:

- production signing
- entitlements
- push
- in-app purchase
- deep links
- background behavior

Simulator success is insufficient.

---

# INTERNAL DISTRIBUTION

Use:

- EAS internal distribution
- Firebase App Distribution
- Play internal testing
- TestFlight
- equivalent systems

when appropriate.

Keep dev/test/prod channels clearly separated.

---

# FEATURE FLAGS

Use remote feature flags for controlled rollout where useful.

Do not hide insecure unfinished code behind a client-only feature flag.

Server authorization must remain authoritative.

---

# ROLLOUTS

Prefer staged rollouts for high-risk releases.

Monitor:

- crashes
- ANRs
- API failures
- conversion/business errors

before full rollout.

---

# DATABASE MIGRATIONS

Local database schema changes must be versioned.

Migrations must preserve user data.

Test:

- upgrading from previous production versions
- interrupted migration
- large local databases

Do not test only fresh installs.

---

# APP UPGRADE PATH

Production apps upgrade from old versions.

Always test:

N-1 → current

and critical older supported paths.

Do not assume users reinstall.

---

# LOGOUT

Logout must clear:

- sensitive caches
- auth credentials
- user-specific database/cache state
- realtime connections
- background sync ownership

Do not leave previous-account data visible.

---

# ACCOUNT SWITCHING

If multiple accounts are supported:

partition caches and local databases correctly.

Never leak data between accounts.

---

# ERROR HANDLING

Every remote/native operation should consider:

- success
- timeout
- offline
- denied permission
- cancelled
- unauthorized
- forbidden
- invalid input
- resource missing
- conflict
- server failure
- OS failure
- unsupported device
- hardware unavailable

Do not collapse every issue into:

"Something went wrong."

---

# LOADING

Loading should reflect actual operation.

Use:

- skeletons
- inline indicators
- optimistic state
- determinate progress
- background status

appropriately.

Do not freeze the whole app during one local request.

---

# CANCELLATION

Long operations should support cancellation where technically safe.

Examples:

- upload
- download
- media processing
- search
- scanning

---

# RECOVERY

Preserve user work through recoverable failures.

Examples:

- drafts
- partially completed forms
- resumable uploads

Do not discard 20 minutes of input because the network failed.

---

# TIMEOUTS

Define explicit timeout behavior where libraries do not provide appropriate defaults.

Mobile networks can hang.

A request that never finishes is not robust.

---

# BACKPRESSURE

Realtime/high-volume systems need backpressure strategies.

Do not queue unlimited:

- socket events
- logs
- camera frames
- sensor samples

faster than the app can consume them.

Drop, batch or sample when product semantics permit.

---

# THREAD SAFETY

Native integrations must understand thread ownership.

UI work belongs on the appropriate main/UI thread.

Heavy work should move off it.

Do not mutate platform UI from arbitrary background threads.

---

# NATIVE MODULE BOUNDARIES

Expose narrow APIs.

Do not expose huge platform objects directly to cross-platform runtimes.

Normalize:

- errors
- enums
- lifecycle
- callbacks

---

# CODEGEN

Use framework-supported code generation for native boundaries where appropriate.

React Native:

Codegen for TurboModules/Fabric.

Flutter:

Pigeon can provide typed platform interfaces.

Do not hand-maintain large stringly typed channel surfaces when safer generation exists.

---

# C / C++ / RUST INTEROP

Use low-level code when justified by:

- existing libraries
- performance
- portability
- codecs
- cryptography
- shared engine logic

Provide safe wrappers.

Do not expose raw pointers into high-level UI layers.

---

# CRASH SAFETY AT NATIVE BOUNDARIES

A native crash kills the process.

Validate inputs crossing:

JS/Dart ↔ native.

Handle:

- nullability
- lifetime
- thread assumptions
- array bounds
- ownership

carefully.

---

# APP CLIPS / INSTANT EXPERIENCES

Use platform lightweight experiences where product requirements benefit.

Do not add them by default.

---

# WIDGETS

Home-screen/lock-screen widgets have:

- restricted runtime
- separate lifecycle
- limited interactions

Share data through supported app-group/shared storage mechanisms.

Do not assume full application services run inside a widget.

---

# LIVE ACTIVITIES / REALTIME SURFACES

Use platform-specific realtime surfaces only for appropriate ongoing events.

Examples:

- deliveries
- rides
- sports
- timers

Respect platform update/battery restrictions.

---

# SHORTCUTS

Use:

- Siri/App Intents
- Android shortcuts

when repeat workflows benefit.

Do not expose sensitive actions without proper authentication.

---

# OS INTEGRATION

Consider platform integrations such as:

- share sheets
- widgets
- app intents
- shortcuts
- universal links
- app links
- search indexing
- file providers
- health frameworks

only when product requirements justify them.

---

# STORE REVIEWS

Design prompts responsibly.

Do not interrupt users at poor moments.

Follow platform APIs/policies.

Never gate functionality behind a positive review.

---

# IN-APP PURCHASES

Use platform billing APIs for digital goods where store rules require them.

Validate receipts/transactions securely.

Do not trust client purchase state alone.

---

# SUBSCRIPTIONS

Handle:

- pending
- renewed
- cancelled
- expired
- grace period
- refund
- restored purchase

Do not model subscription as a simple permanent boolean.

---

# APP SECURITY

Assume the mobile client is hostile/inspectable.

Attackers can:

- decompile
- hook
- modify
- proxy traffic
- alter local storage

Server-side authorization remains mandatory.

---

# OBFUSCATION

Obfuscation may increase reverse-engineering cost.

It is not a security boundary.

Never hide critical secrets in obfuscated code.

---

# SCREENSHOT / SCREEN RECORDING

For highly sensitive applications, evaluate platform controls around screenshots/screen capture where available.

Use only where justified.

Do not unnecessarily interfere with ordinary user behavior.

---

# CLIPBOARD PRIVACY

Do not automatically copy:

- passwords
- secret keys
- recovery phrases

unless explicitly requested and product/security rules permit it.

---

# BACKUP

Decide which app data may be included in:

- iCloud backup
- Android backup

Sensitive credentials should generally be excluded or appropriately protected.

---

# CRYPTOGRAPHY

Use platform or well-established cryptographic libraries.

Do not implement custom encryption.

Keep keys out of ordinary app storage.

---

# DATE / TIME

Do not trust device wall-clock time for security-critical truth.

Users can alter it.

Use server time where correctness requires it.

---

# ROOT TIME / MONOTONIC TIME

Use monotonic timers for measuring elapsed durations when available.

Do not measure timeout durations using user-adjustable wall-clock values.

---

# INTERNATIONALIZATION

Support:

- RTL
- local number formatting
- currency
- dates
- calendars
- pluralization
- longer translations

Do not hard-code English-length assumptions.

---

# PLATFORM LOOK AND FEEL

Follow the UI/UX skill for interaction decisions.

This mobile skill should then map those decisions to platform behavior.

Example:

UI/UX skill decides a contextual temporary action belongs in a sheet.

Mobile skill determines:

- iOS sheet behavior
- Android bottom-sheet behavior
- tablet presentation
- accessibility
- orientation
- lifecycle

---

# SYSTEM UI

Respect:

- status bars
- navigation bars
- home indicators
- display cutouts
- Dynamic Island
- hinge regions
- keyboard/IME
- picture-in-picture

Do not render critical controls underneath unsafe areas unintentionally.

---

# EDGE-TO-EDGE

Use modern edge-to-edge layouts where platform/framework expects them.

Manage insets properly.

Do not solve inset issues with random static top padding.

---

# KEYBOARD / IME

Handle:

- keyboard avoidance
- focus
- input action
- return key
- scrolling fields into view

Do not let keyboard cover active inputs.

---

# HARDWARE KEYBOARD

Tablets/foldables may use keyboards.

Support:

- focus traversal
- shortcuts
- enter/escape
- directional input

where product type benefits.

---

# POINTER / TRACKPAD

Large-screen mobile environments can use:

- mouse
- trackpad
- stylus

Do not assume touch-only interaction.

---

# STYLUS

If stylus interaction matters:

support:

- pressure
- hover where available
- palm rejection
- precision

through platform APIs.

---

# SCREEN SIZE STRATEGY

Do not branch solely on:

phone
tablet

Use actual:

- available window size
- posture
- orientation
- input method

where framework supports it.

---

# CONFIGURATION CHANGES

Android configuration can change at runtime:

- rotation
- locale
- font scale
- window size
- dark mode

Compose/framework code should react correctly.

Do not rely on activity recreation as your only logic mechanism.

---

# APP THEMING

Support:

- light
- dark
- system preference
- high contrast where applicable

Avoid hardcoded colors.

Use semantic design tokens from the UI/UX system.

---

# NATIVE SPLIT

Share what should be shared.

Keep platform-specific behavior platform-specific.

Do not force every UI/detail into one cross-platform implementation if it creates:

- poor platform behavior
- excessive conditional code
- performance compromises

---

# EXPECT / ACTUAL OR PLATFORM ADAPTERS

Where appropriate, use explicit platform interfaces.

Examples:

```text
CameraService
SecureStorage
LocationService
NotificationService
FilePicker
```

with native implementations.

Architecture skill governs broader dependency structure.

---

# MONOREPO

When mobile projects are in a monorepo:

consume shared functionality through explicit packages/modules.

Do not deep-import another application's private source.

The monorepo skill governs workspace mechanics.

---

# SHARED DOMAIN CODE

Good candidates for reuse:

- API models
- validation
- domain rules
- serializers
- generated clients
- common utility logic

Do not place native lifecycle/hardware assumptions into universal domain packages.

---

# OBSOLETE PATTERNS

For new modern work, avoid introducing obsolete patterns without compatibility need.

Examples include:

React Native:

- legacy native modules/components for new integrations
- deprecated bridge-centric architecture assumptions
- deprecated navigation packages
- massive global Context stores
- old Expo SDK practices

Flutter:

- obsolete APIs superseded by current framework patterns
- blocking heavy work on main isolate
- legacy plugin integration where modern APIs exist

Apple:

- obsolete navigation APIs in new SwiftUI code
- manually recreating capabilities available in SwiftUI/current system frameworks

Android:

- new XML/View UI where Compose is already the selected modern stack without reason
- AsyncTask
- unrestricted background services
- deprecated support libraries instead of AndroidX
- obsolete permission assumptions

Never remove legacy code solely because it is old.

Migrate only when benefits and compatibility are understood.

---

# PACKAGE / LIBRARY SELECTION

Before adding a mobile dependency ask:

1. Does the platform already provide this?
2. Does the framework already provide this?
3. Is the library actively maintained?
4. Does it support current iOS/Android versions?
5. Does it support current React Native New Architecture / Flutter version?
6. Does it include native code?
7. Does it affect app size?
8. Does it affect startup?
9. Does it request additional permissions?
10. Does it work under background/lifecycle constraints?
11. Does it support the target form factors?
12. Is the maintenance cost justified?

---

# NATIVE DEPENDENCY AUDIT

Native dependencies deserve extra scrutiny.

A JavaScript/Dart package may compile but still contain:

- old Gradle assumptions
- old CocoaPods configuration
- unsupported SDK calls
- obsolete architectures

Test actual native builds.

---

# BUILD FAILURES

When native build fails:

do not randomly upgrade everything.

Identify whether failure is due to:

- framework compatibility
- native SDK
- Gradle
- CocoaPods
- package version
- missing permission
- codegen
- architecture
- deployment target
- unsupported ABI

Fix the cause.

---

# CLEAN BUILDS

Use clean builds when stale native artifacts are a plausible cause.

Do not make "delete everything and reinstall" the default response to every error.

---

# PERFORMANCE AUDIT

For any lag/jank report inspect:

## Rendering

- dropped frames
- recomposition/rebuild
- overdraw
- layout cost

## Runtime

- main-thread work
- JS/Dart work
- garbage collection

## Native

- bridge/interop
- database
- image decode

## Network

- request waterfalls
- blocking

## Memory

- leaks
- large assets

## Animation

- expensive layout
- shader/GPU load

Do not optimize one layer blindly.

---

# BATTERY AUDIT

Inspect:

- GPS
- sensors
- Bluetooth
- camera
- sockets
- background tasks
- wake locks
- animations
- polling

---

# NETWORK AUDIT

Inspect:

- request counts
- payload size
- caching
- retries
- cancellation
- timeout
- offline behavior
- WebSocket lifecycle
- background constraints

---

# SECURITY AUDIT

Inspect:

- secure storage
- token handling
- TLS
- local data
- logging
- permissions
- deep links
- file handling
- WebViews
- cryptography
- integrity signals
- server authorization

---

# ACCESSIBILITY AUDIT

Inspect:

- semantic labels
- reading order
- touch targets
- font scaling
- screen readers
- motion
- focus
- switch/keyboard navigation
- contrast

Pair with the universal UI/UX skill.

---

# HARDWARE AUDIT

Inspect:

- camera lifecycle
- microphone lifecycle
- sensor sampling
- GPS
- Bluetooth
- NFC
- biometrics
- hardware availability
- device capability fallback

---

# FILE AUDIT

Inspect:

- file size
- file type
- storage location
- permissions
- resumability
- background transfers
- temp cleanup
- download security

---

# REALTIME AUDIT

Inspect:

- sockets
- push
- reconnect
- event ordering
- missed events
- app background/foreground
- notification-to-data reconciliation

---

# MOBILE COMPLETION CHECKLIST

Do not declare an app production-ready until applicable areas pass.

## Framework

- supported framework version
- supported OS versions
- no obsolete APIs without reason

## Native Build

- iOS build passes
- Android build passes
- release configurations pass

## State

- local state stays local
- server state has proper cache
- persistent state has correct storage

## Networking

- timeout
- retry
- cancellation
- offline
- token refresh

## Security

- secure credentials
- server authorization
- no secrets embedded
- safe deep links

## Performance

- startup
- scrolling
- animations
- memory
- large lists
- image decode
- jank

## Lifecycle

- background
- resume
- process death
- rotation/config changes

## Hardware

- camera
- microphone
- sensors
- Bluetooth/NFC where applicable

## Files

- upload
- download
- progress
- cancellation
- resumability

## Realtime

- reconnect
- missed event sync
- network changes
- background behavior

## Notifications

- permissions
- token rotation
- deep links
- channels/categories

## Accessibility

- VoiceOver/TalkBack
- font scaling
- focus
- semantics
- reduced motion

## Adaptive Layout

- phone
- tablet
- foldable
- landscape
- multi-window

## Release

- signing
- store policy
- privacy
- metadata
- test distribution
- production build

---

# AGENT EXECUTION PROCESS

When asked to build, audit or repair a mobile application:

## Phase 1 — Discover

Inspect:

- framework
- versions
- operating systems
- form factors
- native modules
- network layer
- state
- local persistence
- release tooling

## Phase 2 — Classify Requirements

Determine:

- offline requirements
- realtime requirements
- hardware requirements
- background requirements
- media requirements
- performance constraints
- accessibility requirements
- release targets

## Phase 3 — Identify Risks

Find:

- main-thread work
- deprecated APIs
- insecure token storage
- unnecessary permissions
- lifecycle leaks
- stale dependencies
- poor cache ownership
- giant images
- non-virtualized lists
- unsafe background assumptions

## Phase 4 — Select Native/Cross-Platform Boundaries

Decide what belongs in:

- shared high-level code
- native module
- FFI
- background worker/isolate
- platform-specific implementation

## Phase 5 — Implement

Make focused changes.

Avoid rewriting unrelated architecture.

## Phase 6 — Validate

Run:

- static analysis
- tests
- native builds
- physical-device testing

## Phase 7 — Performance

Profile:

- frame rate
- startup
- CPU
- memory
- network
- battery

## Phase 8 — Accessibility

Test screen readers and dynamic text.

## Phase 9 — Release Validation

Check:

- signing
- entitlements
- permissions
- privacy
- target SDK
- store policies

## Phase 10 — Report

Document:

- what changed
- why
- native integrations
- performance impact
- security impact
- removed obsolete patterns
- remaining risks

---

# FINAL ENGINEERING PRINCIPLE

Do not begin with:

"What package should I install?"

Begin with:

"What does the operating system already provide?"

Then:

"What does the chosen framework already provide?"

Then:

"Does the capability need native code?"

Then:

"Does an external package provide enough value to justify its native/build/runtime cost?"

Do not ask:

"How do I make this cross-platform?"

Ask:

"Which behavior should genuinely be shared, and which behavior should remain platform-native?"

Do not ask:

"How do I keep the socket connected forever?"

Ask:

"What state must remain correct through network loss, backgrounding, suspension and reconnection?"

Do not ask:

"How do I run this in the background?"

Ask:

"Does the operating system permit this type of background work, and what execution model does it provide?"

Do not ask:

"Why is scrolling laggy?"

Ask:

"Which thread/frame stage is missing its budget?"

Do not ask:

"Where should I store the token?"

Ask:

"What is the minimum credential that must exist on-device, and which OS-protected mechanism should protect it?"

The objective is not to create the most cross-platform application possible.

The objective is to produce an application that feels native enough, shares code where sharing creates real value, uses low-level/native capabilities where required, remains responsive under constrained hardware and unreliable networks, survives mobile lifecycle behavior, respects platform security and accessibility, and can be reliably shipped to every supported operating system and form factor.