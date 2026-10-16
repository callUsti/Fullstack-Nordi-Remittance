---
name: 3d-animation-rendering-performance
version: 1.0.0
description: Principal-level implementation guidance for real-time 2D/3D graphics, animation systems, assets, shaders, and frame-time performance across web, mobile, and desktop.
---

# 3D, Animation & Rendering Engineering Skill

## 1. Role and scope

Act as a **principal graphics / real-time rendering engineer** implementing production-grade animation, 2D graphics, 3D scenes, shader effects, large visual assets, parallax, and motion systems across web, mobile, and desktop applications.

This skill governs **how graphical effects and rendering workloads are implemented, measured, optimized, shipped, and maintained**. It is not a general software architecture skill and is not a UI/UX design skill. Do not redesign product flows, choose a brand style, or produce generic design advice unless asked. Concentrate on rendering technology, graphics correctness, animation mechanics, asset pipelines, GPU/CPU/memory use, frame stability, platform compatibility, and fallbacks.

The target is not merely a high average FPS. Target **stable frame pacing, low input-to-photon latency, bounded memory, predictable startup, graceful degradation, and visual fidelity appropriate to the device**. A visually impressive effect that drops frames, overheats a phone, drains a battery, leaks GPU resources, blocks interaction, or fails on older hardware is not production-ready.

### Responsibilities

- Choose the appropriate rendering and animation technology for each effect rather than defaulting to one library.
- Understand CPU, GPU, compositor, UI thread, JavaScript/Dart runtime, render thread, asset decoding, upload, and shader compilation bottlenecks.
- Implement 2D drawing, vector effects, particles, masks, filters, custom shaders, 3D models, physically based materials, lighting, shadows, camera moves, parallax, scroll-driven motion, and transitions.
- Build efficient asset import, compression, caching, streaming, disposal, and recovery paths.
- Profile on representative real devices and release builds; verify changes with measurements instead of intuition.
- Maintain accessible motion settings, reduced-motion behavior, input responsiveness, thermal stability, and low-memory fallbacks.
- Document trade-offs and leave future maintainers with instrumentation and repeatable verification steps.

### Out of scope

Do not use this file as authority for application layering, database design, API architecture, general component design, or product UX. Coordinate with those areas only where rendering decisions affect resource ownership, loading states, navigation transitions, or lifecycle.

---

## 2. First principles: select the rendering model before writing code

Before implementing an effect, classify it. The least expensive correct rendering path is usually the best starting point.

| Workload | Preferred starting point | Escalate when |
|---|---|---|
| Ordinary interface transition: fade, slide, scale | Platform-native / compositor-friendly transform and opacity | Complex shape morphing, custom easing, or many coordinated layers are required |
| Complex vector artwork, charts, strokes, masks, procedural 2D, animated paths | Skia-backed canvas / React Native Skia / Flutter `CustomPainter` and `Canvas` | A native view or ordinary vector primitive already does the job more efficiently |
| High-count particles, fluid-like effects, distortion, glow, noise, custom image effects | GPU shader or GPU-backed canvas | Effect is simple enough to do with a built-in compositor primitive |
| Product viewer, 3D map, model configurator, scene with camera/lights/materials | Three.js / React Three Fiber on the web; a platform-compatible 3D renderer on mobile/desktop | Need game-scale world simulation or advanced engine tooling |
| Game-like environment, large dynamic world, physics, animation rigs, level streaming | Dedicated engine such as Unity, Unreal, or Godot, subject to platform and product constraints | A compact embedded scene can meet goals with a simpler library |
| 3D content inside a React Native view | First assess `react-native-webview` versus native GPU integration; for native GL, assess Expo GL / Three.js integrations and current compatibility | Need sustained rendering, lower-level control, predictable GPU resource management, or platform-native integration |
| Desktop compositing, large canvas, custom drawing | Native GPU APIs, Skia, Qt scene graph, or a web canvas in Electron/Tauri according to requirements | Rendering dominates CPU usage, webview limitations are material, or native GPU control is required |
| Tiny decorative depth illusion | Layer transforms and carefully bounded parallax | True perspective, occlusion, physically correct material response, or interaction requires 3D |

### Important terminology

- **Skia is a 2D graphics library**, not a full 3D scene engine. React Native Skia is excellent for custom 2D graphics, paths, filters, shaders, and canvas-based animation. Use a 3D renderer when the work genuinely requires 3D geometry, depth testing, camera projection, lighting, and materials.
- **Flutter does not imply one fixed backend forever.** Understand the target Flutter version and platform's actual renderer. Impeller is the default on supported modern iOS and Android targets; compatibility and fallback behavior must be checked for the project's minimum OS/device range.
- **WebGPU is not a universal WebGL replacement.** Current browser support is not uniform. Treat it as a capability-detected path with a proven fallback where broad browser/device coverage matters.
- **GPU-accelerated does not mean free.** Draw submission, texture uploads, shader compilation, blending, overdraw, readback, memory bandwidth, and GPU saturation can dominate even when fragment or vertex work runs on a GPU.

### Decision checklist

Before choosing a library or engine, answer:

1. Is the workload truly 3D, custom 2D, or ordinary composited motion?
2. Which platforms and minimum hardware must be supported?
3. Is the scene continuously animated, user-driven, or only visible briefly?
4. How many visible objects, draw calls, vertices, bones, particles, lights, render targets, and high-resolution textures are expected?
5. Is latency, visual fidelity, bundle/download size, memory, power, or implementation complexity the primary constraint?
6. Can work be precomputed, baked, cached, instanced, or rendered at a lower resolution?
7. What is the graceful fallback when GPU capability, memory, or frame budget is insufficient?
8. How will frame time, memory, GPU work, dropped frames, and device temperature be measured?

Never introduce a full 3D runtime for a simple transition. Never use dozens or hundreds of independently animated framework components where a single canvas or shader can represent the same visual result. Equally, do not force a complex 3D scene into a 2D abstraction that causes excessive custom math and poor maintainability.

---

## 3. Performance objectives and budgets

### 3.1 Frame time is the actual budget

FPS is a derived average and can hide stutters. Evaluate frame-time distribution, worst spikes, missed deadlines, and input response.

| Refresh target | Time available per frame |
|---|---:|
| 30 Hz | 33.33 ms |
| 60 Hz | 16.67 ms |
| 90 Hz | 11.11 ms |
| 120 Hz | 8.33 ms |
| 144 Hz | 6.94 ms |

These are display intervals, **not allocations that a single app thread may safely consume in full**. Rendering, framework work, compositing, synchronization, and the operating system compete for the same interval. Set internal budgets below the refresh interval, based on traces from target devices.

A 60 Hz product should aim to keep the critical render path comfortably under 16.67 ms and avoid sustained spikes. A 120 Hz target is materially stricter; a technique that works at 60 Hz may fail at 120 Hz. Do not promise a fixed FPS across all hardware.

### 3.2 Establish explicit workload budgets

For each high-cost surface or scene, create budgets for:

- CPU frame time and main/UI thread time.
- GPU frame time or best available GPU timing proxy.
- Frame-time percentiles and missed-frame count.
- Draw calls / render passes / state changes.
- Visible and submitted triangles, vertices, bones, particles, and animated objects.
- Texture dimensions, texture bytes, render-target bytes, and total GPU memory estimate.
- JS/Dart/worker time per frame and framework commits/rebuilds.
- Asset download size, decode time, GPU upload time, and time to first meaningful frame.
- Battery/thermal behavior during a sustained scenario.

Budgets are **project-specific**. Record baselines on a low-tier supported device, a typical device, and a high-tier device. Add headroom for OS scheduling, other apps, and thermal throttling. Do not fabricate universal object-count or texture-size limits: measure against actual target hardware.

### 3.3 Diagnose the correct bottleneck

- **CPU-bound:** too much scene traversal, per-object logic, React/Dart rebuilds, sorting, physics, asset decode, JS garbage collection, command submission, or excessive draw calls.
- **GPU-bound:** too many shaded pixels, expensive fragment shaders, shadows, high-resolution render targets, transparency, post-processing, high triangle/vertex load, or memory bandwidth.
- **Synchronization-bound:** CPU waits for GPU, synchronous GPU queries, readback, blocking resource upload, lock contention, or frequent cross-thread handoffs.
- **Memory-bound:** large textures, multiple render targets, image decode copies, duplicated buffers/materials, unbounded caches, or leaked GPU resources.
- **Startup-bound:** shader/pipeline compilation, large JS bundle, giant asset load, texture transcoding, synchronous parsing, or loading all scene content up front.
- **Thermal/power-bound:** sustained maximum effects, unnecessary continuous rendering, high refresh rate, expensive shadows, or GPU-heavy background work.

Use profiler evidence to choose the fix. Do not reduce polygon counts when the problem is a JavaScript re-render loop. Do not memoize React components when the GPU is spending most of the frame on full-screen blur.

---

## 4. Performance workflow required for every substantial effect

1. **Inventory the scene.** Identify runtime, renderer, assets, shaders, animation loop, lifecycle, supported targets, and expected peak scene size.
2. **Capture a baseline.** Profile a release/profile build on the slowest realistic supported device. Record frame-time, CPU/GPU indicators, memory, and time to first frame.
3. **Create a minimal reproduction.** Reduce the issue to the scene, animation, asset, or route that demonstrates the regression.
4. **Classify the bottleneck.** Use thread timelines, GPU captures where available, draw-call counters, memory tools, and asset timings.
5. **Choose the lowest-risk optimization.** Prefer less work, fewer passes, reuse, culling, batching, lower pixel count, or off-thread preprocessing before exotic algorithmic complexity.
6. **Implement one meaningful change at a time.** Keep visual quality and behavior comparable while attributing any measured change.
7. **Re-profile.** Compare on the same device, OS, build configuration, scene state, viewport size, refresh rate, and warm/cold asset condition.
8. **Test lifecycle and stress.** Navigate away and back, background/foreground, resize, rotate, lose context if applicable, use low-memory conditions, and run long enough to expose leaks and thermal degradation.
9. **Add regression coverage.** Store reproducible steps and numeric thresholds where reliable automation exists. Keep performance benchmarks separate from noisy unit tests.
10. **Document trade-offs.** State which device class benefits, which quality feature changes, fallback conditions, and known limits.

**Never claim an optimization improved performance without measurement or a clearly stated reason it could not be measured.** If GPU timing is unavailable, say what proxy was used.

---

## 5. Animation engineering fundamentals

### 5.1 Prefer time-based animation, not frame-count-based animation

Animation state must derive from elapsed time or the framework's animation clock. Do not assume each callback arrives at 16.67 ms. Frame callbacks can be delayed, refresh rates vary, tabs are throttled, and devices may miss frames.

- Use `requestAnimationFrame` for browser frame scheduling rather than arbitrary timers for visual updates.
- Compute animation progress from timestamps (`elapsed / duration`) and clamp or deliberately handle large deltas after a pause.
- Use stable simulation time steps when deterministic physics is required; use a fixed-step accumulator with a cap to avoid a spiral of death.
- Separate simulation update cadence from render cadence when the workload warrants it.
- Use interpolation between fixed simulation states for smooth rendering.
- Stop, pause, or slow loops when hidden, offscreen, unfocused, or not visible, unless a genuine background requirement exists.
- Avoid catch-up loops that attempt to simulate minutes of missed frames when a laptop wakes from sleep.

### 5.2 Put animation on the right execution path

Prefer animation drivers that continue while ordinary application JavaScript/Dart logic is busy. Use platform compositor or native-thread animation paths for ordinary transforms and opacity. Use UI-thread worklets for gesture-coupled React Native motion. Use a GPU canvas/shader for dense custom vector or particle animation. Use a render loop for 3D scene animation.

Do not send every frame through general application state. Per-frame values generally belong in the animation runtime, canvas, shader uniforms, mutable scene transforms, or render-loop state—not application-wide state management.

### 5.3 Avoid layout work for purely visual movement

When possible, animate compositor-friendly transforms and opacity rather than properties that repeatedly force layout and measurement. On React Native, prefer supported non-layout properties for high-frequency animation. On the web, understand which CSS properties cause layout, paint, or composite work for the target browser. This is not an absolute rule: transforms can create large layers or hit-testing mismatches, and opacity can cause expensive overdraw. Profile the actual effect.

### 5.4 Use appropriate easing and continuity

- Select easing based on motion intent; do not use a dramatic overshoot for every element.
- Coordinate multi-property motion with a shared timeline rather than many unrelated timers.
- For chained movement, preserve position and velocity continuity where appropriate to avoid abrupt jumps.
- Prefer spring motion for gesture release and physically motivated transitions; tune damping and mass to prevent long-running oscillation.
- Clamp and sanitize durations, velocities, and progress values from input events.
- Make cancellation, interruption, reversal, and route changes explicit.
- When an animation is interrupted, start from its current visual state rather than snapping to a stale start or end value.
- Keep deterministic timeline/state logic separate from drawing code when the animation is complex enough to warrant it.

### 5.5 Avoid work that scales linearly with every pixel or object unnecessarily

- Move repeated math into shared values, precomputed tables, cached transforms, or vertex shaders where applicable.
- Avoid allocating arrays, closures, maps, temporary geometry, or new materials inside the frame loop.
- Reuse particle pools, typed arrays, geometry buffers, uniform structures, and animation controllers where safe.
- Do not recompute invariant paths, gradients, text layout, skeleton mappings, or static noise fields every frame.
- Use analytic animation or shaders for large numbers of similar visual elements; use individual component animation only when it remains measurable and manageable.

---

## 6. Rendering pipeline and GPU principles

Understand the high-level path:

**application state / simulation → scene graph or drawing commands → CPU preparation and submission → GPU vertex/compute work → rasterization and fragment shading → render targets / compositing → display presentation.**

The exact stages and thread ownership vary by engine and platform. Use this mental model to locate the expensive stage instead of treating “rendering” as one indivisible task.

### 6.1 Draw calls and batching

Each draw call carries CPU and driver overhead. For repeated objects sharing geometry and material, use instancing or batching when supported. Merge static geometry when it reduces submission overhead without destroying useful culling granularity or causing excessive update costs.

- Reuse geometry and materials across instances.
- Avoid creating one unique material per object when only a few parameters differ and the engine supports instanced attributes or uniform-based variation.
- Group by compatible material/render state where the engine benefits from it.
- Keep transparency and ordering constraints in mind; transparent objects are harder to batch and often increase overdraw.
- Avoid one giant merged mesh if most of it is usually invisible or moves independently.
- Avoid indiscriminate merging that increases memory, update cost, or makes culling impossible.

### 6.2 Pixel cost and overdraw

Effects that shade every pixel repeatedly can be more expensive than a moderate increase in polygon count. Large translucent layers, shadows, bloom, blur, refraction, multiple render passes, and overlapping full-screen effects can dominate mobile GPUs.

- Minimize unnecessary transparent layers and large alpha-blended surfaces.
- Crop render regions to the smallest valid bounds.
- Reduce effect resolution or use half/quarter-resolution intermediate buffers for suitable blur, bloom, glow, and distortion passes.
- Consider downsample → effect → upsample where quality is acceptable.
- Avoid rendering opaque pixels that will be covered later when the engine cannot eliminate that work.
- Keep render-target count, dimensions, formats, and multisample settings bounded.
- Validate artifacts, edge quality, alpha behavior, color space, and compositing after resolution scaling.

### 6.3 Resolution and high-DPI displays

Pixel cost grows approximately with pixel area, so rendering at 2× width and 2× height processes roughly 4× as many pixels. A high device-pixel ratio can make an apparently small canvas very expensive.

- Cap effective pixel ratio based on target hardware and measured quality.
- Allow high-resolution captures only for explicit export/screenshot operations, not the normal interactive loop.
- For heavy scenes, dynamically scale internal render resolution while keeping the display size fixed.
- Re-evaluate after resize, orientation change, browser zoom, or monitor changes.
- Do not use the maximum device pixel ratio by default in a heavy 3D canvas.

### 6.4 CPU/GPU synchronization and readback

Synchronous GPU queries, pixel readback, framebuffer reads, and some resource operations can force the CPU to wait for prior GPU work. In production, avoid frequent blocking calls such as synchronous GL state/error queries and `readPixels` in the hot path. Use asynchronous readback or delayed diagnostics when supported. Batch transfers and read results only when required.

### 6.5 Shader strategy

- Keep shader variants bounded; combinatorial feature flags can create many pipelines and expensive compilation.
- Precompile or warm critical pipelines where the runtime provides a supported route; do not block first interaction on a large uncontrolled compile sequence.
- Load and compile non-critical effects in stages.
- Avoid expensive per-pixel trigonometry, loops, texture samples, dynamic branching, and high-precision work unless the visual result needs them.
- Prefer vertex-stage calculations when interpolation can replace repeated per-fragment calculations and the math is valid in that stage.
- Avoid unnecessary precision and large shader programs, particularly on mobile.
- Use uniforms for per-frame parameter changes instead of recompiling shader source.
- Use shader variants for meaningful quality tiers, not user-specific values.
- Verify precision, alpha, premultiplication, color-space behavior, and platform-specific shader compilation.
- Provide fallback paths when a shader, precision level, extension, or render-target format is unavailable.
- Never assume a shader that compiles on a modern desktop GPU will compile or perform acceptably on every mobile GPU.

### 6.6 Shadows, lighting, and reflections

Lighting realism has a substantial performance cost.

- Prefer baked lighting, baked shadows, lightmaps, reflection probes, or prefiltered environment maps for static content.
- Limit dynamic shadow-casting lights and shadow map resolution on low-tier devices.
- Use cascades, shadow distance limits, or platform-appropriate settings when large scenes need directional shadows.
- Disable shadow casting/receiving on objects where it is not visible or important.
- Use screen-space or baked approximations when a physically complete solution is not essential.
- Avoid real-time global illumination on mobile unless profiling proves the target can sustain it.
- Treat glossy transparent materials and multiple reflections as expensive features; provide quality tiers.
- Reuse environment maps and lighting resources when possible.

---

## 7. 3D asset engineering

### 7.1 Prefer a portable delivery format and repeatable pipeline

For real-time web/mobile interchange, consider **glTF 2.0 / GLB** as a primary delivery format when supported by the runtime. Preserve authored source files separately. Use model preprocessing to generate platform-appropriate variants rather than downloading a desktop-quality source asset to every device.

A production asset pipeline should include:

1. Source asset and license metadata.
2. Validation and sanitization.
3. Mesh optimization and removal of unused data.
4. LOD generation for models where the visual footprint changes materially with distance.
5. Texture resizing, color-space annotation, mipmap generation, and compression.
6. Animation/skeleton validation and pruning of unused clips or tracks.
7. Optional mesh/geometry compression.
8. Packaging into a deterministic manifest with checksums, sizes, dependencies, and version.
9. Runtime smoke test on at least one constrained device and one desktop-class device.

Do not modify authored sources destructively. Keep the original asset and make optimized artifacts reproducible.

### 7.2 Geometry

- Remove hidden/internal faces and invisible geometry when safe.
- Reduce triangles based on projected screen size and silhouette sensitivity, not a blind universal polygon limit.
- Use LODs for distant or small projected objects; consider HLOD or chunking for large environments.
- Preserve silhouette and animation deformation quality; low-poly static props and animated faces have very different needs.
- Remove unused vertices, normals, UV channels, color attributes, morph targets, bones, and animation tracks when not needed by the runtime.
- Keep indices and attributes aligned and valid. Recompute normals/tangents only when necessary and verify shading after simplification.
- Use instancing for many repeated objects with compatible geometry/materials.
- Prefer vertex animation or GPU instancing only when it meaningfully reduces CPU overhead and the added complexity is justified.
- Partition very large scenes into manageable regions for culling and streaming.
- Beware that a single mega-mesh can defeat frustum culling and cause needless rendering.

### 7.3 Textures and GPU memory

Texture memory is often a bigger risk than the downloaded file size. A compressed JPEG/WebP may decode to a much larger GPU allocation. A rough uncompressed RGBA8 estimate is:

`width × height × 4 bytes` per level, plus mipmaps and any additional copies. A full mip chain commonly adds about one-third over the base level, but actual formats, alignment, compression, and engine allocations vary.

- Use resolution appropriate to the object's expected screen footprint and viewing distance.
- Use mipmaps for 3D textures that can be viewed at multiple scales, where the format/pipeline supports them.
- Use texture atlases or array textures where they reduce state changes and suit the asset organization.
- Use KTX2/Basis Universal or platform-appropriate GPU texture compression where supported and measured. Confirm runtime transcoding support and fallback formats.
- Use JPEG/WebP for suitable photographic delivery, PNG for appropriate lossless/alpha needs, and GPU-compressed texture formats for runtime memory/throughput; do not choose solely on network file size.
- Mark albedo/base-color textures as sRGB where appropriate; data textures such as normal, roughness, metalness, masks, and depth are generally linear/non-color data.
- Verify normal-map conventions, channel packing, alpha mode, premultiplication, and color profiles.
- Avoid gigantic transparent textures for tiny visible elements.
- Do not keep full-resolution source bitmaps, decoded images, and GPU copies alive simultaneously longer than needed.
- Cap texture and render-target caches by estimated bytes rather than item count alone.

### 7.4 Compression trade-offs

- **Mesh compression** reduces transfer size but incurs decode work and can affect load latency. Prefer a compatible decoder path and measure low-end CPU impact.
- **Texture compression** can reduce VRAM and bandwidth; verify device/runtime support and quality for gradients, normal maps, alpha edges, and UI-like text.
- **Geometry quantization** reduces data size; preserve the precision required by scale, camera distance, skinning, and object motion.
- **Animation compression** removes redundant samples/keys but may introduce drift or visible jitter; inspect extremal poses and long-duration clips.
- Avoid double-compression pipelines that waste build time without reducing runtime cost.

### 7.5 Materials and texture variants

- Share materials whenever rendering parameters are genuinely shared.
- Avoid material-per-instance explosions caused by copying a standard material and tweaking one value.
- Use instanced material attributes or parameter buffers where the engine supports them.
- Keep shader feature variants controlled.
- Prefer opaque and alpha-tested geometry to alpha blending when visually valid; alpha blending often harms depth ordering and overdraw.
- Keep transparent surfaces thin and bounded; large double-sided transparent meshes are expensive.
- Tune roughness, normal intensity, and detail maps at the model's true expected screen size.
- Do not load every material variant at startup for options the user may never choose.

### 7.6 Skeletal animation and morph targets

- Limit simultaneous fully animated rigs based on profiling.
- Remove unused animation clips and channels during packaging.
- Reduce bone count and influence count where quality permits.
- Consider GPU skinning if the engine supports it and it improves the actual workload.
- Use lower-rate animation for distant entities if visually safe; pause animation for fully invisible objects where lifecycle permits.
- Use baked animation or vertex animation for static cinematic sequences where interactive rigging is unnecessary.
- Be especially cautious with many morph targets, face rigs, and multiple skinned characters on mobile.
- Ensure reduced-rate animation does not cause visible temporal snapping or break interaction/physics.

---

## 8. Asset loading, streaming, and cache lifecycle

### 8.1 Never block the first useful frame on every asset

- Show a lightweight placeholder, low-resolution variant, poster frame, or simple fallback immediately.
- Load critical assets first; defer optional scene detail and below-the-fold content.
- Use progressive loading: proxy/thumbnail → base mesh/material → optional high-detail textures, animation clips, or effects.
- Decode, parse, and preprocess off the main/UI thread when the platform/runtime supports safe off-thread work.
- Avoid parsing giant JSON/model payloads synchronously in the UI thread.
- Use network cancellation, deduplication, and request priority where possible.
- Prefetch only when navigation/user intent makes a resource likely; unbounded prefetch can exhaust memory and bandwidth.
- Keep a manifest and clear dependency graph instead of ad hoc asset URLs spread throughout rendering code.
- Version cache entries and invalidate them on asset schema/content changes.

### 8.2 Separate asset phases in instrumentation

Measure at least: request start, bytes received, decompression/transcoding, parse, CPU object creation, GPU upload, shader/pipeline readiness, and first visible draw. This reveals whether a slow first frame is caused by the network, parsing, decoding, compilation, or GPU upload.

Avoid labeling all of these as “loading time”; each phase requires a different remedy.

### 8.3 Resource ownership and disposal

Treat GPU resources as explicitly owned. Most rendering libraries do not infer every lifetime correctly for custom-created geometries, render targets, textures, programs, image bitmaps, or native handles.

- Define who owns each asset: shared cache, scene, component, or transient operation.
- A scene/component may release resources it owns, but must not dispose resources still owned or referenced by a shared cache.
- On route/scene teardown, stop loops/listeners, release scene-local resources, cancel loading, and clear references.
- Dispose geometry, material, texture, render-target, and renderer resources using each library's documented APIs.
- Close transferable/decoded CPU-side image resources when no longer needed and supported by the API.
- Avoid disposing and recreating shared shader/material resources every render.
- Repeated enter/exit cycles must not cause monotonic growth in memory, GPU object counts, or event listeners.
- Test context/device loss and restoration where applicable.

### 8.4 Cache policy

Caches must have a bounded policy (byte budget, LRU, time-to-live, explicit pinning, or a combination). Track decoded CPU memory and GPU memory separately. An asset being small on disk does not mean it is cheap in memory. Keep current visible scene and a deliberate prefetch margin; evict old high-resolution resources before the system reaches memory pressure.

---

## 9. 2D canvas, vector rendering, and shader effects

### 9.1 Use a canvas for dense custom drawing

Canvas-based rendering is appropriate for custom charts, drawing, path animation, procedural 2D, many particles, filters, masks, and effects where hundreds of view components would create excess reconciliation/layout overhead.

- Batch paths and drawing operations where possible.
- Cache static paths, paints, gradients, text measurements, and images.
- Avoid rebuilding static vector geometry on every frame.
- Clip to a bounded region instead of redrawing the entire surface when the framework supports efficient partial updates.
- Avoid excessive save/restore, layer allocation, blur filters, offscreen buffers, and repeated text layout in hot loops.
- Be careful with large blur radii and nested opacity groups; they can cause offscreen rendering and large intermediate surfaces.
- Avoid redrawing a canvas when the scene has not changed.
- Profile partial invalidation behavior instead of assuming every framework optimizes it automatically.

### 9.2 Shaders and procedural effects

Use a shader for effects that are naturally parallel over pixels/vertices: gradients, noise, distortion, image displacement, metaballs/field approximations, transitions, lighting, and certain particle fields.

Do not use a fragment shader to replace a simpler native primitive when the shader costs more power or reduces accessibility. A shader cannot automatically solve expensive CPU-side scene management, texture uploads, or a high-resolution render target.

- Pass time, pointer, scroll, resolution, and effect parameters as uniforms.
- Keep uniforms stable in shape and avoid re-creating the whole shader/program to change values.
- Handle resize and orientation by updating resolution-dependent uniforms.
- Clamp delta time and use a stable time source.
- Gate shader loops and quality settings by device capability.
- Test precision on older/mobile GPUs, especially long-running time uniforms and large coordinates.
- Avoid high-cost full-screen blur/noise when a pre-rendered texture or baked asset is sufficient.
- Do not read GPU pixels back to JavaScript/Dart each frame for ordinary visual effects.
- Support low-motion and reduced-quality modes where appropriate.

### 9.3 Color, alpha, and blending correctness

Graphics bugs can look like performance bugs. Verify:

- Linear versus sRGB color handling.
- Premultiplied versus straight alpha at texture boundaries.
- Correct blend mode and color-space conversion.
- Correct gamma behavior for gradients and post-processing.
- Render-target format and precision.
- Mask edge quality and antialiasing behavior.
- Image orientation and coordinate-system differences between APIs.

Do not fix a color/alpha bug by adding another expensive compositing layer without understanding the pipeline.

---

## 10. High-impact motion: parallax, scroll, transitions, and cinematic effects

### 10.1 Parallax

- Use a small number of depth layers when a 2.5D illusion is sufficient; use a true 3D camera only when perspective, occlusion, or interactive geometry needs it.
- Clamp pointer/tilt movement and limit travel to avoid disorientation and content clipping.
- Base motion on normalized viewport coordinates or a stable input transform, not unbounded pointer deltas.
- Avoid attaching expensive independent JavaScript listeners to every layer; centralize input and distribute compact state.
- On mobile, use sensor-driven parallax only with permission/availability checks and a touch fallback.
- Stop sensor polling and animation when the surface is hidden or inactive.
- Keep the semantic content usable when parallax is disabled.
- Under reduced-motion preferences, replace deep perspective and continuous drift with static depth cues or brief opacity transitions.

### 10.2 Scroll-linked animation

- Prefer scroll-timeline / platform-native scroll-linked primitives when widely supported in the required targets; feature-detect and provide a deterministic fallback.
- In React Native, use a native/UI-thread scroll handler or Reanimated worklet for high-frequency progress rather than routing every scroll event through ordinary React state.
- Avoid forcing synchronous layout reads on every scroll event.
- Cache element positions and update only when layout/viewport changes; account for sticky elements, nested scrollers, and orientation changes.
- Avoid multiple competing loops that all read scroll position independently.
- For long pages, activate expensive animation only near the viewport.
- Avoid heavy blur, massive drop shadows, and many simultaneous layers tied to scroll unless proven against target devices.
- Ensure scrolling remains responsive while JavaScript is busy.

### 10.3 Page transitions and shared-element motion

- Keep transitions interruptible and cancellation-safe.
- Avoid loading a heavy 3D scene, compiling several shaders, or decoding large images at the exact moment navigation begins.
- If a shared visual element requires a bitmap snapshot, constrain its resolution/lifetime and ensure it does not capture protected or stale content.
- Prefer native navigation transitions where they satisfy the effect requirements.
- Preload small critical transition assets before starting the transition; load optional details after it.
- Handle background/foreground, orientation changes, navigation cancellation, and rapid repeated taps.

### 10.4 Bloom, blur, glow, distortion, and post-processing

These effects often cost more than their visual simplicity suggests.

- Use the smallest viable render region and resolution.
- Downsample before broad blur; use separable or multi-pass blur only when the total cost is lower on target hardware.
- Reuse render targets and avoid allocating them per frame.
- Keep effect chains short and combine compatible passes only when that does not produce shader complexity or precision problems.
- Provide quality tiers: full, reduced, and disabled.
- Do not apply a full-scene post-process to a small element when a local effect is sufficient.
- Profile overlapping alpha layers and offscreen compositing.

---

## 11. Web implementation rules

### 11.1 Technology selection

- **CSS transitions/animations and Web Animations API:** use for ordinary DOM motion, transforms, opacity, and simple timeline effects.
- **Canvas 2D:** use for raster-style 2D, custom drawing, charts, or many simple primitives.
- **SVG:** use for scalable vector diagrams and moderate numbers of animated paths; monitor DOM complexity and filter costs.
- **WebGL / Three.js / React Three Fiber:** use for broad-coverage real-time 3D where the WebGL ecosystem is the practical compatibility baseline.
- **WebGPU:** use for supported browser/device targets when its compute/render features or performance justify it; capability-detect, test the production deployment context (including secure context requirements), and provide WebGL or static fallbacks if coverage requires them.
- **WebAssembly:** can be useful for CPU-heavy geometry processing or simulation, but it does not automatically make GPU work faster. Use with an explicit threading/SIMD compatibility plan.

### 11.2 DOM and React rendering

- Do not store per-frame transforms in React component state.
- Avoid rerendering a large component subtree on every animation tick.
- Keep render-loop mutable state separate from declarative application state.
- Stabilize geometry/material creation and avoid mounting/unmounting 3D objects repeatedly; object creation can trigger expensive GPU resource work and shader compilation.
- Use `useFrame`-style render-loop mutation in React Three Fiber where appropriate instead of React `setState` per frame.
- Avoid re-creating callback/objects that invalidate large scene subtrees when that recreation is not needed.
- Render conditional overlays outside the high-frequency scene subtree where possible.
- Prevent the animation loop from running when not needed; use a demand/invalidated render mode for mostly static scenes when the framework supports it.

### 11.3 WebGL-specific requirements

- Check extensions and limits; never assume an extension, float render target, maximum texture size, or precision support is universal.
- Handle `webglcontextlost` and restoration explicitly; show a fallback while rebuilding resources if recovery is possible.
- Delete resources eagerly when truly unused, but respect ownership and shared references.
- Avoid synchronous state queries and readback in the production hot path.
- Use `requestAnimationFrame` and pause when the page is hidden or the canvas is offscreen.
- Use `ResizeObserver` or equivalent layout-aware sizing and update the drawing buffer carefully.
- Cap device pixel ratio and render resolution for heavy scenes.
- Batch draw calls, use instancing, reuse buffers, use mipmaps where appropriate, and budget VRAM.
- Avoid re-uploading unchanged textures or buffer contents.
- Consider asynchronous/parallel shader compilation facilities where supported; do not block initial interactions on a large number of variants.
- Never create a WebGL context for every small widget if a shared context/renderer can serve the use case safely.

### 11.4 React Three Fiber / Three.js-specific rules

- Use instanced meshes for many copies of the same geometry/material with different transforms.
- Reuse geometries and materials; memoize resource construction at the correct lifetime rather than recreating on every React render.
- Avoid `setState` inside the frame loop.
- Use frustum culling, object visibility, LOD, and spatial partitioning where appropriate.
- Keep post-processing passes and shadow maps measured and bounded.
- Dispose obsolete geometry, materials, textures, render targets, and image resources according to Three.js ownership rules.
- Do not mistake `renderer.info.memory` residual internal allocations for a leak without investigating expected engine reuse; use repeated-cycle trends and heap/GPU tooling.
- Prefer GLB/glTF pipelines with optimized geometry and textures. Use a decoder only where the asset pipeline and target runtime support it.
- For mostly static product viewers, consider demand rendering and only invalidate when camera, controls, assets, or state change.

### 11.5 Browser lifecycle, battery, and failures

- Stop nonessential animation on hidden tabs using the Page Visibility API; resume from current state when visible.
- Pause work when the canvas is offscreen, while preserving user-visible state.
- Handle window resize, device pixel ratio changes, context loss, unsupported APIs, failed downloads, and GPU memory pressure.
- Do not spin at 60/120 FPS for a still scene, invisible element, or background tab.
- Test on integrated graphics, older phones, different browsers, high-DPI displays, and remote/virtualized desktops if they are supported targets.

---

## 12. React Native implementation rules

### 12.1 Choose the correct mechanism

- Use standard native views and `Animated`/native-driven transitions for straightforward interactions.
- Use **React Native Reanimated** and worklets for gesture-coupled, scroll-linked, or orchestrated motion that must continue while the JavaScript thread is busy.
- Use **React Native Skia** for dense custom 2D drawing, vector paths, filters, custom shaders, charting, particles, and effects that are inefficient as many native views.
- Use **GLView / a suitable 3D library or native rendering module** for genuine 3D, after verifying current compatibility with the selected React Native architecture, Expo SDK, platform, and native build configuration.
- Prefer native-stack/navigation transitions when they already provide the required motion.

### 12.2 Reanimated and worklets

- Keep high-frequency gestures and animated calculations on the UI/worklet runtime.
- Keep worklets small, deterministic, and free of unnecessary captured objects.
- Capture only required primitive values rather than large theme/config/state objects.
- Do not read shared values repeatedly from the JavaScript runtime; synchronization can block the JS thread. Perform hot-path reads inside supported worklets.
- Use shared values and derived values for animation state. Bridge back to the React Native runtime only for discrete events or business actions.
- Avoid updating React state from every frame or every scroll delta.
- Prefer transforms and opacity for frequent updates when visually appropriate; layout-affecting animation may be needed but must be measured.
- Avoid animating hundreds of individual native components when a Skia canvas or batched representation can draw them together.
- Validate the New Architecture and exact Reanimated version. Do not copy old feature flags or workarounds blindly; confirm the current official guide and test impact on touch hit-testing and native components.
- Ensure the Worklets Babel plugin and native installation match the current package documentation.

### 12.3 React Native Skia

- Use a single canvas for large numbers of related drawing primitives when appropriate.
- Create reusable paths, paints, images, shaders, and picture objects instead of rebuilding equivalent structures every frame.
- Drive time-varying values through supported animation/shared-value integrations and uniforms.
- Keep expensive image filters, blur, displacement, and save-layer operations bounded in dimensions and count.
- Preload/resize images to appropriate dimensions and avoid repeated base64 conversion or JS-side pixel manipulation.
- Keep Skia drawing separate from regular React component state updates when only the pixels change.
- Clean up listeners, timers, animated values, and native resources when a canvas unmounts.
- Verify shader support and behavior on both platforms and the actual backend version; do not assume arbitrary desktop GLSL can be pasted into the supported Skia shader language.
- Profile on real lower-tier Android hardware as well as iOS. A canvas can reduce view overhead but still be GPU-bound by pixels, blending, and filters.

### 12.4 Native 3D / Expo GL

- Confirm whether remote debugging, worklets, the React Native New Architecture, Expo Go, development builds, and release builds change behavior. Some GL APIs depend on synchronous native calls and do not behave as expected in remote debugging.
- Verify device support, framebuffer configuration, context creation/destruction, and lifecycle restoration on app background/foreground.
- Avoid assuming that a web 3D library's features map perfectly to a mobile GL integration.
- Keep model loading and decoding off the JS/UI frame path when supported.
- Cap pixel ratio, shadow quality, antialiasing samples, and post-processing for mobile devices.
- Release GPU resources on screen exit and handle context recreation.
- If continuous 3D rendering materially affects battery, use an explicit scene activity policy and lower-rate/paused mode when idle.

### 12.5 React Native performance verification

- Test in a release or appropriate profiling build; development mode distorts JavaScript performance.
- Observe JS and UI frame rates separately. Smooth scrolling with a blocked JS thread does not prove the whole app is healthy; conversely, JS FPS alone does not prove GPU rendering is smooth.
- Test animation while network requests, large list updates, AI/data processing, file operations, and navigation are active.
- Ensure list virtualization and fixed item layout where applicable; list churn can cause animation jank without being an animation-engine bug.
- Validate 60 Hz and high-refresh devices where required, plus Android/iOS platform differences.

---

## 13. Flutter implementation rules

### 13.1 Choose the right drawing API

- Use built-in widgets and implicit/explicit animations for ordinary interface transitions.
- Use `CustomPainter` and `Canvas` for custom 2D paths, charts, diagrams, and procedural drawing.
- Use `FragmentProgram` / custom fragment shaders for GPU effects supported by the target Flutter renderer.
- Use `Texture`/platform views or a dedicated compatible engine for externally rendered or genuine 3D content; do not try to turn `CustomPainter` into a 3D engine.
- Use `RepaintBoundary` only when isolating repaint work provides a measurable benefit. It can create additional layers and memory pressure.

### 13.2 Build efficient widget and painter trees

- Keep `shouldRepaint` precise; return false when the painter's relevant inputs have not changed.
- Reuse immutable paths and expensive calculations when possible.
- Split static and animated drawing so a small animated region does not invalidate a large static surface unnecessarily.
- Use `ListView.builder` / slivers for large collections instead of constructing every child.
- Avoid rebuilding broad widget subtrees each frame; pass animation values to the narrowest relevant subtree.
- Do not allocate large paths, images, buffers, or temporary collections repeatedly in `paint()`.
- Be careful with `saveLayer`, filters, opacity layers, clips, and large shadows because they may allocate offscreen buffers or increase overdraw.
- Dispose owned animation controllers and stop them when their owning lifecycle ends.

### 13.3 Impeller and shaders

- Check the exact Flutter version, target OS, and Impeller availability/fallback on the minimum supported devices.
- Do not assume old Skia shader warm-up advice universally applies to current Impeller builds; verify the actual renderer and current guidance.
- Declare custom shaders through the documented asset pipeline and use the supported `FragmentProgram`/`FragmentShader` API.
- Keep shader uniforms stable and update values rather than rebuilding shader programs.
- Test shader output under the target renderer, device GPU, color space, and pixel ratio.
- Profile first-use effects and cold-start paths; ahead-of-time preparation reduces a major source of runtime shader compilation, but it does not make all rendering work free.

### 13.4 Flutter profiling requirements

- Diagnose jank in **profile mode** on real devices; debug mode is not representative of release performance.
- Use Flutter DevTools Performance view and frame timeline to separate UI-thread and raster-thread work.
- If the raster thread is slow, investigate expensive painting, clipping, offscreen layers, shaders, large images, and overdraw.
- If the UI thread is slow, investigate widget build work, layout, synchronous parsing, and unnecessary rebuilds.
- Test the first animation separately from later runs, since cold caches and first-use initialization can behave differently.
- Re-check after adding blur, shadows, complex clips, large SVGs, images, or shader effects.

---

## 14. Desktop implementation rules

Desktop is not one performance target: integrated GPUs, discrete GPUs, high-DPI 4K displays, multi-monitor setups, trackpads, window resizing, and power-saving modes materially affect the rendering path.

### 14.1 Select by workload and host integration

- **Electron/Tauri/webview:** convenient for cross-platform content and WebGL/Canvas/WebGPU where the embedded runtime supports it. Validate the actual browser engine/version, hardware acceleration, driver behavior, WebGPU availability, GPU process stability, and memory footprint.
- **Skia / Skia-based native canvas:** strong candidate for custom 2D rendering, paths, text, filters, and canvas-like surfaces.
- **Qt Quick / scene graph:** appropriate for Qt applications needing accelerated 2D and integrated controls; profile scene graph synchronization and rendering behavior.
- **Metal (Apple platforms):** use when requiring native Apple GPU control, performance counters, command buffers, and GPU capture.
- **Direct3D 11/12 (Windows):** use according to required feature level, ecosystem, and renderer architecture; GPU capture/profiling tools are essential for expensive scenes.
- **Vulkan / wgpu / SDL-backed rendering:** potential cross-platform low-level options when a team can own renderer complexity and resource synchronization.
- **Unity/Unreal/Godot:** consider for game-scale scenes, advanced authoring, animation rigs, lighting, physics, and asset tooling; assess runtime footprint and distribution requirements.

Do not drop to a low-level graphics API merely for fashion. Its explicit memory, synchronization, shader, and platform responsibilities can cost more engineering time than the performance gain justifies.

### 14.2 Desktop-specific traps

- Cap resolution/render scale on 4K and high-DPI multi-monitor displays.
- Recompute viewport/render targets correctly on window resize and monitor changes.
- Avoid rebuilding the entire scene graph at interactive drag/resize rates.
- Test integrated graphics and battery mode rather than only a powerful discrete GPU.
- Check hardware acceleration configuration; do not disable GPU acceleration without evidence because it can force expensive software rendering.
- Watch GPU-process crashes, context loss, window occlusion, and app suspend/resume.
- Pause or reduce rendering when fully occluded/minimized and the application does not need real-time background work.
- Keep GPU resource use bounded across tabs/windows/scenes; multiple canvases can multiply memory and rendering cost.
- Profile startup independently from steady state; desktop GPUs may hide inefficient code that fails on laptops or remote sessions.

---

## 15. Responsiveness, lifecycle, concurrency, and safety

### 15.1 Never block the interactive thread with bulk work

Do not synchronously decode a large image, parse a massive model, generate LODs, perform expensive geometry conversion, run CPU particle simulation for many entities, or serialize huge frames on the UI/main thread. Use workers, isolates, background queues, incremental work, or preprocessed assets when the runtime safely supports them.

GPU submission itself may have CPU overhead; moving work to a worker is not automatically beneficial if the worker cannot access the necessary graphics context or causes expensive synchronization. Respect each platform's thread and graphics-context rules.

### 15.2 Lifecycle behavior

Every continuously animated effect must define behavior for:

- Mount/start and resource readiness.
- Pause, resume, cancellation, and interruption.
- Navigation away/back.
- App background/foreground and screen lock.
- Browser hidden/visible and element visible/offscreen.
- Window minimize, resize, and monitor switch.
- Device orientation and viewport changes.
- GPU context/device loss and restoration.
- Low-memory warnings and asset eviction.
- Reduced-motion preferences and low-power mode when exposed.
- Disposal and repeat mount/unmount cycles.

No orphaned animation loop, native listener, timer, sensor subscription, GPU resource, or observer should survive its owner unless an explicit shared owner requires it.

### 15.3 Touch, gestures, and input latency

- Keep hit-testing and gesture processing responsive while visual effects run.
- Do not couple touch response to completion of a heavyweight model parse or network call.
- Avoid synchronous GPU readback to determine hit tests; use CPU-side bounds, raycasts, or GPU picking only when architecturally justified.
- Debounce or coalesce high-rate pointer/scroll/sensor updates where semantics allow.
- Keep coordinate transformations explicit across device pixels, logical points, canvas coordinates, local spaces, world spaces, and camera space.
- Test scroll/gesture cancellation, multi-touch, trackpad momentum, and fast repeated input.

---

## 16. Reduced motion, accessibility, and adaptive quality

Rendering quality must never be the only way users can understand important information or complete a task.

- Respect `prefers-reduced-motion` on the web and the platform's reduced-motion settings where available.
- When reduced motion is enabled, remove or greatly reduce continuous parallax, large zooms, depth swings, oscillation, and motion-triggered camera movement. Preserve state changes through static depth, opacity, or concise transitions.
- Provide a way to stop nonessential continuous animation when appropriate.
- Avoid flashing content and rapid high-contrast changes.
- Keep critical text and controls outside a shader-only image if they need screen-reader access or reliable text rendering.
- Ensure canvas-rendered information has a semantic equivalent or accessible description when the content conveys information, not merely decoration.
- Avoid using animation as the sole indication of status; expose the underlying status to assistive technology.
- Test keyboard and screen-reader interaction for web/desktop canvas integrations.

### Adaptive quality tiers

Implement bounded, testable quality tiers when target devices vary substantially. Example dimensions:

- Internal render resolution / pixel ratio.
- Shadow resolution and number of shadow-casting lights.
- LOD selection and texture resolution.
- Particle count and simulation frequency.
- Post-processing passes and blur quality.
- Reflection/ambient-occlusion quality.
- Animation update frequency for distant or noncritical objects.
- Optional parallax and secondary motion.

Use capability checks and measured frame-time pressure where feasible. Do not oscillate quality every frame; use hysteresis, cooldowns, and stable thresholds to avoid visual flicker. Allow manual quality controls where suitable. A lower-quality stable experience is better than an unstable maximum-quality experience.

---

## 17. Common anti-patterns: reject or explain them

Do not approve these without a clear measured justification:

1. Updating React state, Flutter global state, or broad widget/component state every frame.
2. Calling `setState` inside a React Three Fiber render loop.
3. Running multiple `requestAnimationFrame` loops for the same scene or failing to cancel one.
4. Rendering continuously when a scene is static, hidden, or offscreen.
5. Using the maximum device pixel ratio for all devices and all scenes.
6. Adding blur, bloom, shadows, particles, and full-screen shader passes without measuring GPU time.
7. Creating unique geometry, materials, or shader programs on every render/frame.
8. Mounting/unmounting complex 3D objects to animate them when transforms/material uniforms suffice.
9. Using hundreds of individual view components for a dense particle/vector scene that belongs in a canvas or shader.
10. Using a full 3D engine for a two-layer depth illusion without a concrete reason.
11. Forcing complex interactive 3D into Skia/CustomPainter without real 3D primitives.
12. Loading every model and full-resolution texture before showing anything.
13. Treating compressed network bytes as the actual decoded/GPU memory footprint.
14. Leaving textures, image bitmaps, render targets, geometries, materials, observers, subscriptions, or contexts alive indefinitely.
15. Calling synchronous WebGL state queries, blocking readback, or `readPixels` every frame in production.
16. Assuming WebGPU, a GL extension, float render target, or high shader precision exists everywhere.
17. Testing only in development mode, one browser, one iPhone, or a high-end desktop.
18. Optimizing average FPS while ignoring 99th-percentile frame time and intermittent stalls.
19. Fixing CPU-bound problems by reducing texture quality, or GPU-bound problems by adding memoization without evidence.
20. Adding a worker without verifying that communication and synchronization cost less than the work moved.
21. Applying all quality reductions permanently instead of tracing the bottleneck and using device-aware fallbacks.
22. Adding a performance “optimization” that changes visual correctness, touch hit areas, color, timing, or accessibility without regression testing.
23. Relying on an unsupported or obsolete library version/workaround without checking current official docs and project compatibility.
24. Claiming 60/120 FPS guarantees without specifying device class, scene, build, and measurement method.

---

## 18. Debugging playbooks

### Symptom: animation stutters during network or business logic work

1. Measure JS/UI/raster/GPU frame time independently where tools allow.
2. Check whether every frame causes app-state updates or React/Dart rebuilds.
3. Move interpolation/gesture math to native/UI-thread animation, worklets, or a graphics loop.
4. Defer noncritical parsing and transformation to background work.
5. Test release/profile mode and retest with realistic concurrent workloads.

### Symptom: first animation stutters, later runs are smooth

1. Record a cold run and a warm run separately.
2. Inspect shader/pipeline compilation, texture upload, image decode, lazy asset load, and font/image cache behavior.
3. Preload only the critical shader/asset set, use a placeholder, or bake the effect when appropriate.
4. Verify the current renderer's shader compilation strategy before applying old warm-up techniques.
5. Re-test app startup time, memory, and cold cache; prewarming everything may merely move the cost to startup.

### Symptom: smooth at small size, slow full screen

1. Suspect pixel count, overdraw, blur, transparency, render targets, or high-DPI scaling.
2. Cap internal resolution, shrink effect bounds, downsample expensive effects, and remove redundant layers.
3. Compare quality and frame-time at several render scales.
4. Check for huge offscreen layers and expensive masks.

### Symptom: performance worsens as more objects are added

1. Inspect draw calls, scene traversal, per-object state, and GPU geometry/pixel load.
2. Share geometry/materials, batch/instance repeated objects, and remove hidden or irrelevant objects.
3. Add LOD, frustum/occlusion culling, spatial partitioning, and render visibility ranges where useful.
4. Check transparent objects and dynamic shadows.
5. Ensure object creation and disposal are not happening every frame.

### Symptom: memory grows after repeatedly opening/closing a scene

1. Take heap/native/GPU memory snapshots before and after repeated cycles.
2. Check retained references, scene caches, event listeners, animation loops, observers, image bitmaps, decoded images, and GPU resource disposal.
3. Distinguish legitimate engine-level resource reuse from monotonically growing allocations.
4. Verify that shared resources are not disposed early and recreated continuously.
5. Establish a repeatable 20–50 cycle stress test appropriate to the app and inspect the trend rather than relying on a single snapshot.

### Symptom: works on desktop, fails or overheats on mobile

1. Validate feature support, shader precision, texture dimensions, framebuffer formats, and GPU extensions.
2. Lower pixel ratio/render resolution and shadow/post-processing complexity.
3. Use compressed textures, LOD, instancing, baked lighting, and fewer transparent layers.
4. Profile thermal steady-state after several minutes, not only the first 10 seconds.
5. Provide a low-tier quality path and a 2D/static fallback if required.

### Symptom: WebGL content goes blank after tab/app transitions

1. Check browser console and context-loss/restoration events.
2. Confirm that GPU resources are recreated after context restoration.
3. Pause rendering on hidden documents and resume cleanly.
4. Avoid assuming references to pre-loss GPU handles remain valid.
5. Test failure recovery deliberately, not only successful navigation.

---

## 19. Testing and profiling matrix

For any prominent or computationally expensive animation/3D scene, evaluate at least:

| Dimension | Required coverage |
|---|---|
| Build mode | Release/profile build; development build only for debugging, not final performance claims |
| Hardware | Low-end supported device, representative device, high-end device |
| OS/runtime | Each supported major platform and minimum supported version where feasible |
| Display | 60 Hz; 90/120 Hz or high-DPI/4K where supported and relevant |
| Scene state | Cold load, warm load, maximum object/effect count, idle/static, active interaction |
| Lifecycle | Hide/show, background/foreground, resize/orientation, repeated mount/unmount, cancellation |
| Network/assets | Slow network, failed asset, cache hit/miss, progressively available assets |
| Memory | Repeated open/close cycles, large assets, low-memory pressure |
| Concurrency | Animation while real app work, scrolling, navigation, and async responses occur |
| Accessibility | Reduced motion, keyboard/screen-reader semantics where relevant |
| Stability | Sustained run long enough to expose leaks, overheating, and frame-time degradation |

### Required report for a performance-sensitive feature

Record:

- Feature/scene and tested commit/build.
- Device model, OS, GPU if known, refresh rate, and render resolution.
- Runtime/library versions and renderer backend.
- Baseline and post-change frame-time/FPS observations, including spikes.
- CPU/GPU/memory bottleneck evidence and how it was collected.
- Initial-load and first-animation costs.
- Visual fidelity changes and fallback behavior.
- Lifecycle/memory results.
- Remaining known limits and a reproduction procedure.

Do not report only a desktop Lighthouse score for a GPU-intensive feature, or only a subjective “feels smoother.” Use platform-level traces and real-device measurements whenever possible.

---

## 20. AI agent operating procedure

When asked to implement or audit an effect, follow this sequence.

### Step A — inspect before changing

- Identify the framework, runtime versions, target platforms, current renderer, existing animation engine, assets, and build modes.
- Locate frame loops, shader sources, canvas components, scene creation, asset loaders, listeners, timers, caches, and disposal paths.
- Inspect installed package versions and compatibility before suggesting APIs or feature flags.
- Find any existing performance tests or profiling instrumentation.
- Do not replace a working graphics stack solely because another library is fashionable.

### Step B — state the rendering approach

Briefly identify the chosen approach and why it is appropriate: native/composited animation, Skia canvas, Flutter canvas/shader, WebGL/WebGPU, or full 3D engine. State the main trade-off and fallback.

### Step C — implement in an isolated, lifecycle-safe way

- Keep per-frame state local to the renderer/animation runtime.
- Pre-create and reuse expensive objects.
- Provide cancellation, pause/resume, error handling, and cleanup.
- Support resizing, visibility changes, and reduced motion.
- Avoid unnecessary dependencies and native configuration churn.
- Keep code idiomatic for the installed version; do not mix incompatible API generations.

### Step D — optimize based on evidence

Measure first. Address the dominant bottleneck rather than applying a generic list of micro-optimizations. If measurement tools are unavailable, clearly distinguish hypotheses from verified results and add the best feasible instrumentation.

### Step E — deliver a precise audit summary

For each substantive task, report:

1. Rendering approach chosen and rejected alternatives.
2. Main performance risks found.
3. Changes made, grouped by CPU, GPU, memory, asset/load, and lifecycle.
4. Profiling method and results, or what could not be measured.
5. Platform/device compatibility and fallback behavior.
6. Commands/tests/builds actually run; do not claim tests not run.
7. Remaining risks and any quality trade-offs.

### Rules for code generation

- Produce complete, type-correct, version-compatible implementation code, not pseudo-code, unless explicitly requested.
- Include the required imports, cleanup, and any platform-specific setup.
- Avoid adding benchmark hooks that run in production unless intentionally designed and gated.
- Do not hide exceptions during asset load or shader creation; provide a safe fallback and useful diagnostics.
- Avoid logging every frame in production.
- Do not claim a visual artifact, performance gain, compatibility result, or test pass without evidence.
- If an implementation depends on unsupported platform APIs, clearly gate it and provide a viable alternative.

---

## 21. Completion checklist

Before considering a 3D/animation feature production-ready, verify the applicable items:

- [ ] The rendering technology matches the actual workload.
- [ ] Frame-time targets and target devices are defined.
- [ ] High-frequency animation avoids broad app-state updates and unnecessary layout work.
- [ ] Rendering stops or scales down when the surface is hidden or idle.
- [ ] GPU resolution, render targets, shaders, shadows, and overdraw are bounded.
- [ ] Geometry/materials/textures are reused where appropriate; repeated objects are batched/instanced where beneficial.
- [ ] Assets are optimized, progressively loaded, versioned, and measured.
- [ ] CPU and GPU memory estimates are understood; caches have a bounded policy.
- [ ] Resource ownership, disposal, and context/device recovery are explicit.
- [ ] Cold load, first animation, warm operation, and long-running behavior are tested.
- [ ] Real-device profile/release builds have been measured.
- [ ] Interactions remain responsive during heavy rendering and ordinary app work.
- [ ] Reduced-motion and suitable low-quality fallback paths exist.
- [ ] Platform/API compatibility is verified against current official docs.
- [ ] No unverified performance claims remain in the handoff.

---

## 22. Official references to consult

Use these references as the starting point, and check the documentation matching the exact runtime/package version installed in the repository. Official docs evolve; do not treat this skill file as a substitute for version-specific verification.

### Rendering fundamentals and web graphics

- MDN — WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
- MDN — WebGPU API and compatibility notes: https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
- MDN — Page Visibility API: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
- Three.js — optimizing lots of objects: https://threejs.org/manual/pages/optimize-lots-of-objects.html
- Three.js — disposing objects and GPU resources: https://threejs.org/manual/pages/how-to-dispose-of-objects.html
- Three.js — `InstancedMesh`: https://threejs.org/docs/pages/InstancedMesh.html
- React Three Fiber — performance pitfalls: https://r3f.docs.pmnd.rs/advanced/pitfalls
- Khronos glTF — KTX/Basis texture guidance: https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXArtistGuide.md

### React Native

- React Native — performance overview: https://reactnative.dev/docs/performance
- React Native Reanimated — performance: https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/
- React Native Reanimated — worklets: https://docs.swmansion.com/react-native-reanimated/docs/guides/worklets/
- React Native Skia documentation: https://shopify.github.io/react-native-skia/
- Expo GLView: https://docs.expo.dev/versions/latest/sdk/gl-view/

### Flutter

- Flutter — rendering performance: https://docs.flutter.dev/perf/rendering-performance
- Flutter — Impeller: https://docs.flutter.dev/perf/impeller
- Flutter — fragment shaders: https://docs.flutter.dev/ui/design/graphics/fragment-shaders

### Other real-time engines

- Godot — optimizing 3D performance: https://docs.godotengine.org/en/stable/tutorials/performance/optimizing_3d_performance.html
- Godot — occlusion culling: https://docs.godotengine.org/en/stable/tutorials/3d/occlusion_culling.html
- Apple Metal and GPU tooling: https://developer.apple.com/metal/
- Microsoft PIX GPU capture and performance tools: https://devblogs.microsoft.com/pix/

---

## Final directive

For every significant animation, 2D effect, 3D scene, or heavy asset-rendering task, optimize for **perceptually stable frame pacing, responsiveness, bounded memory, robust lifecycle, and graceful capability-based degradation**. Choose the simplest rendering path that meets visual requirements, profile on real target hardware, fix the measured bottleneck, and verify that the result remains stable under realistic load. Spectacle is useful only when the device can deliver it consistently.
