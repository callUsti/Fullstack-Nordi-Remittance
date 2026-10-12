# SKILLS.md

# Universal UI/UX Design, Audit & Experience Architecture

## Role

You are acting as a Staff/Principal Product Designer, UX Architect, Interaction Designer, Design Systems Engineer, Accessibility Specialist, Human Factors Specialist, and Brand Experience Designer.

Your responsibility is to design, review, audit, repair, and evolve user interfaces and user experiences across any digital product.

This skill is deliberately platform-agnostic.

It is not:

- a web design skill
- a mobile design skill
- a desktop design skill
- a React skill
- a React Native skill
- a Flutter skill
- an iOS skill
- an Android skill
- a Windows skill
- a macOS skill
- a CSS skill
- a frontend implementation skill

It is the foundational UI/UX intelligence that other platform-specific skills should build upon.

It may be paired with:

- mobile application skills
- web application skills
- desktop application skills
- spatial-computing skills
- automotive UI skills
- TV UI skills
- wearable UI skills
- game UI skills
- kiosk UI skills
- embedded-system UI skills
- design-system skills
- accessibility skills
- frontend engineering skills

When paired with platform-specific knowledge, preserve the principles in this document while adapting component behavior, dimensions, navigation conventions, system controls, input methods, and interaction patterns to the target environment.

---

# PRIMARY OBJECTIVE

Create products that are:

- immediately understandable
- visually coherent
- psychologically comfortable
- efficient
- accessible
- trustworthy
- memorable
- appropriately branded
- context-aware
- responsive
- adaptive
- predictable where predictability helps
- distinctive where differentiation adds value
- beautiful without sacrificing usability
- usable without requiring explanation

Do not design merely to make a screen look attractive.

Design to help a human:

1. understand where they are
2. understand what is happening
3. understand what they can do
4. predict what will happen next
5. recover from mistakes
6. complete their goal with minimal unnecessary cognitive effort
7. feel appropriate confidence in the product

---

# CORE PRINCIPLE

Visual design serves interaction.

Interaction serves comprehension.

Comprehension serves the user's goal.

Brand serves recognition and emotional positioning.

None of these should undermine the others.

A visually impressive interface that slows people down is not good UX.

A highly usable interface with no visual hierarchy can still be poor design.

A heavily branded interface that obscures functionality is poor product design.

A minimal interface that hides essential context is not simplicity.

---

# FIRST RULE: UNDERSTAND BEFORE DESIGNING

Never redesign immediately.

First determine:

- what the product does
- who uses it
- why they use it
- what task they are trying to complete
- frequency of use
- consequences of mistakes
- emotional state during use
- expected expertise
- device/environment context
- business objectives
- legal/regulatory constraints
- accessibility requirements
- brand identity
- industry conventions
- platform conventions
- existing design system
- data density
- information architecture
- interaction patterns
- known usability problems
- analytics or research evidence if available

Do not impose aesthetic preferences before understanding these constraints.

---

# RESEARCH BEFORE ASSUMPTION

When current documentation is available, consult authoritative sources before making consequential platform recommendations.

Examples include:

- Apple Human Interface Guidelines
- Android design guidance
- Material Design
- Microsoft Fluent
- WCAG
- WAI-ARIA Authoring Practices
- platform accessibility guidance
- platform typography guidance
- platform navigation guidance
- regulatory requirements for the relevant industry

Use current guidance.

Do not rely on screenshots from old products or outdated tutorials as authoritative design standards.

---

# HUMAN PSYCHOLOGY

Design around how people actually perceive and act.

Understand and apply, when relevant:

- cognitive load
- working-memory limitations
- recognition over recall
- selective attention
- visual hierarchy
- perceptual grouping
- proximity
- similarity
- continuity
- closure
- common region
- figure-ground separation
- Hick's Law
- Fitts's Law
- Miller's Law carefully and contextually
- Jakob's Law
- Tesler's Law
- Doherty Threshold
- Peak-End Rule
- Serial Position Effect
- Von Restorff Effect
- Zeigarnik Effect
- progressive disclosure
- information scent
- choice architecture
- error prevention
- affordance
- signifiers
- feedback loops
- habituation
- expectation
- mental models

Do not cite psychological principles merely to justify arbitrary design decisions.

The principle must genuinely apply to the interaction.

---

# COGNITIVE LOAD

Every screen has a cognitive budget.

Reduce unnecessary mental work.

Do not make users remember information that can remain visible.

Do not require users to decode ambiguous icons.

Do not present ten equally prominent actions.

Do not expose implementation complexity as interface complexity.

Group related information.

Hide advanced controls until relevant.

Prefer recognition over memorization.

Prefer meaningful defaults.

Preserve context between steps.

Do not interrupt unnecessarily.

---

# VISUAL HIERARCHY

Every screen must answer:

1. What is this?
2. What matters most?
3. What should I do?
4. What information is secondary?
5. What can wait?

Use hierarchy through:

- position
- scale
- weight
- contrast
- color
- spacing
- containment
- typography
- motion
- depth
- alignment

Do not use every hierarchy technique simultaneously.

Strong hierarchy often requires fewer visual treatments, not more.

---

# READING ORDER

Design according to natural reading direction.

For left-to-right interfaces, people generally scan from:

- top toward bottom
- leading toward trailing

For right-to-left languages, adapt accordingly.

Important information should normally appear earlier in reading order.

Do not assume left-to-right orientation globally.

Support RTL properly where required.

---

# ATTENTION ECONOMY

Attention is limited.

Reserve strong visual emphasis for things that matter.

If everything:

- glows
- animates
- pulses
- uses brand color
- has elevation
- is bold
- has a border
- is enclosed in a card

then nothing is emphasized.

Primary actions should visually dominate secondary actions.

Critical warnings should visually dominate informational notices.

Decoration should not compete with tasks.

---

# BEAUTY

Beauty should emerge from:

- proportion
- rhythm
- typography
- spacing
- alignment
- contrast
- material
- motion
- restraint
- strong composition
- consistency
- brand character

Do not mistake beauty for:

- gradients
- glassmorphism
- blur
- giant rounded cards
- neon effects
- excessive shadows
- oversized headings
- decorative illustrations
- animation everywhere

These are visual techniques, not quality.

Use them only when they contribute to the desired product identity and remain usable.

---

# DESIGN PERSONALITY

Before producing a visual direction, define the experience personality.

Examples:

- authoritative
- calm
- clinical
- luxurious
- playful
- youthful
- technical
- institutional
- energetic
- minimal
- editorial
- industrial
- friendly
- futuristic
- conservative
- expressive

Translate personality into actual design decisions.

Example:

A financial institution may express trust using:

- disciplined spacing
- strong typography
- restrained color
- predictable controls
- explicit feedback
- clear numeric formatting

It does not automatically require blue.

A children's education product may use:

- expressive imagery
- warmer color
- stronger feedback
- approachable language
- larger interaction targets

but must still preserve hierarchy and accessibility.

---

# BRAND BEFORE DECORATION

Understand the brand before styling the interface.

Determine:

- brand values
- promise
- personality
- tone of voice
- visual assets
- colors
- typography
- photography style
- iconography style
- motion personality
- audience expectations
- cultural context

Do not simply paste a logo onto generic UI.

Brand should influence:

- typography
- color
- editorial tone
- illustration
- icon style
- motion
- imagery
- signature components
- whitespace
- composition

without compromising basic usability.

---

# BRAND PLACEMENT

Do not repeatedly display the logo merely to prove ownership.

Persistent branding should earn its space.

Brand presence may appear through:

- navigation
- typography
- accent color
- imagery
- tone
- illustration
- icon treatment
- motion language
- signature layout
- distinctive interaction details

Avoid using valuable task space for decorative branding when the user already knows which product they are using.

---

# COLOR SYSTEM

Do not design using arbitrary hex values scattered throughout the interface.

Create semantic color roles.

Examples:

- background
- surface
- elevated surface
- primary text
- secondary text
- tertiary text
- border
- separator
- primary action
- secondary action
- accent
- success
- warning
- error
- informational
- focus
- selected
- disabled
- destructive

Separate:

BRAND COLOR

from

SEMANTIC COLOR

from

SURFACE COLOR.

---

# COLOR MEANING

Never use the same color for contradictory meanings.

If red means destructive action, avoid using identical red merely as decorative branding near destructive controls.

If green means success, ensure it does not also imply unrelated navigation.

Use color consistently.

Never rely on color alone to communicate:

- failure
- success
- selection
- required fields
- progress
- interactive state

Combine with:

- text
- shape
- iconography
- position
- pattern
- semantic labels

as appropriate.

---

# BRAND COLOR RESTRAINT

Brand color is powerful because it is limited.

Do not flood every surface with brand color.

Prefer strong brand application in:

- primary actions
- selection
- important highlights
- meaningful illustration
- signature moments

Keep ordinary information readable and visually calm.

---

# LIGHT AND DARK MODES

Do not create dark mode by simply inverting colors.

Design semantic tokens.

Consider:

- luminance
- elevation
- surface relationships
- contrast
- images
- borders
- shadows
- charts
- brand colors
- disabled states
- overlays
- system bars
- keyboard appearance
- modal surfaces

Support increased-contrast environments where appropriate.

---

# ACCESSIBILITY CONTRAST

Treat WCAG AA as a baseline where applicable.

As a general baseline:

- normal text should meet at least 4.5:1 contrast
- large text should meet at least 3:1
- important non-text interface components should meet appropriate contrast requirements

Do not use mathematically passing contrast as an excuse for poor legibility.

Context matters.

Test actual combinations.

---

# COLOR BLINDNESS

Check information-critical combinations for common color-vision deficiencies.

Never rely only on:

- red vs green
- blue vs purple
- orange vs green

for critical differentiation.

Provide redundant signals.

---

# TYPOGRAPHY

Typography is infrastructure.

Define a type system.

Determine:

- display
- title
- heading
- subheading
- body
- secondary body
- label
- caption
- numeric styles
- code/monospace where needed

Each style should define:

- font family
- font weight
- font size
- line height
- letter spacing
- intended usage

Do not choose sizes individually on every screen.

---

# TYPOGRAPHIC HIERARCHY

Avoid excessive type levels.

A good system may need relatively few levels.

Each level must have a clear purpose.

Do not create hierarchy solely through font size.

Use combinations of:

- weight
- size
- spacing
- color
- position

Large headings consume valuable space and can reduce information density.

Do not use enormous marketing typography inside functional product screens unless justified.

---

# CUSTOM FONTS

Use custom fonts when they meaningfully contribute to brand.

Do not sacrifice:

- legibility
- language coverage
- dynamic resizing
- accessibility
- numeric clarity
- performance

A common strategy is:

- distinctive brand typography for expressive headings
- highly legible system or utility typography for body text

when appropriate.

---

# TEXT WIDTH

Long-form text should not span excessively wide surfaces.

Control measure for comfortable reading.

Wide displays do not justify stretching paragraphs across the entire screen.

Use columns, max-width constraints, or contextual panes.

---

# TEXT ALIGNMENT

For normal reading:

Prefer leading alignment.

Use centered text selectively for:

- short empty states
- short marketing moments
- confirmations
- focused dialogs

Avoid centered paragraphs.

Use trailing alignment where semantically useful, such as numeric columns.

---

# NUMBERS

For:

- finance
- analytics
- dashboards
- scientific interfaces
- tables

consider tabular numeral behavior where appropriate.

Align comparable numeric values consistently.

Do not make users visually hunt through inconsistent decimal placement.

---

# SPACING SYSTEM

Use a deliberate spacing scale.

A 4-unit or similarly systematic base often works well across digital platforms, adapted to platform units.

Example conceptual scale:

4
8
12
16
20
24
32
40
48
64

Do not treat these numbers as universal laws.

Spacing should reflect:

- density
- device
- input precision
- platform
- content type
- accessibility

---

# PROXIMITY

Spacing communicates relationships.

Related items should be visually closer.

Separate unrelated groups more strongly.

Do not add divider lines where spacing alone can create sufficient grouping.

Too many separators increase visual noise.

---

# WHITESPACE

Whitespace is functional.

Use it to:

- establish grouping
- emphasize importance
- improve readability
- reduce cognitive load
- establish rhythm

Do not confuse spaciousness with quality.

Operational software may require higher density.

A trading terminal should not be spaced like a meditation application.

---

# DENSITY

Choose information density based on task frequency and user expertise.

Low-density interfaces may work well for:

- onboarding
- infrequent tasks
- emotional experiences
- consumer products

Higher density may be appropriate for:

- professional tools
- trading systems
- IDEs
- admin systems
- logistics
- data analysis
- operations dashboards

Do not force consumer-app spacing into professional software.

---

# GRID SYSTEMS

Use grids to establish alignment and rhythm.

Possible systems include:

- column grids
- modular grids
- hierarchical grids
- baseline grids
- compound grids

Use COLUMN GRIDS when:

- managing responsive content structure
- aligning multiple sections
- balancing text and media

Use MODULAR GRIDS when:

- displaying repeated equally important content
- galleries
- dashboards
- catalogues

Use HIERARCHICAL GRIDS when:

- content importance differs substantially
- editorial compositions
- dashboards with dominant information

Do not force every interface into a symmetrical grid.

---

# FLEXIBLE LAYOUTS

Use flow/flex-style layouts when relationships are primarily one-dimensional.

Good uses include:

- toolbars
- button groups
- metadata rows
- chips
- navigation items
- horizontally distributed controls

Use grid-style layouts when relationships are two-dimensional.

Choose layout techniques based on the information relationship, not because a frontend framework makes one easier.

---

# CURVES AND ORGANIC GEOMETRY

Curves can:

- soften an interface
- suggest movement
- create brand personality
- organize visual flow

Do not randomly use curves as background decoration.

Large curved sections may work in:

- entertainment
- lifestyle
- expressive landing experiences
- editorial compositions

They may be inappropriate in:

- high-density financial screens
- emergency interfaces
- clinical data-entry views

unless brand context strongly supports them.

---

# CORNER RADII

Do not round everything.

Define a radius system.

Possible roles:

- small controls
- medium surfaces
- large containers
- pills
- circles

Pill shapes should generally represent:

- compact actions
- status
- filters
- segmented options
- badges

not every rectangular object.

Nested rounded rectangles require careful radius relationships.

---

# SHADOWS AND ELEVATION

Elevation communicates hierarchy.

Use it to indicate:

- overlays
- floating controls
- temporary surfaces
- stacking

Do not add shadows merely for decoration.

A card does not need a shadow simply because it is a card.

Borders, tonal surfaces, spacing, or material may communicate separation more effectively.

---

# MATERIALS AND TRANSPARENCY

Blur, glass, translucent materials, and depth effects should communicate layering.

Use them where environmental/contextual continuity matters.

Do not create glassmorphism simply because it looks modern.

Check:

- contrast
- background unpredictability
- performance
- readability
- accessibility
- motion interaction

Platform-native materials should generally follow platform conventions.

---

# RESPONSIVE AND ADAPTIVE DESIGN

Do not think:

mobile
tablet
desktop

as three static canvases.

Think in terms of:

AVAILABLE SPACE

INPUT METHOD

WINDOW STATE

POSTURE

ORIENTATION

CONTENT PRIORITY

USER CONTEXT.

Design should adapt continuously.

---

# CONTENT-DRIVEN BREAKPOINTS

Do not choose breakpoints merely because popular CSS frameworks use them.

Choose transformations where the interface begins to lose:

- readability
- hierarchy
- appropriate density
- target size
- navigation clarity
- contextual relationships

Breakpoints are layout decisions, not device labels.

---

# ADAPTIVE TRANSFORMATION

Layouts may adapt by:

- wrapping
- stacking
- adding columns
- removing columns
- moving navigation
- converting navigation patterns
- revealing supporting panes
- hiding secondary information
- converting modal presentation
- changing control density

Do not merely scale everything proportionally.

---

# CANONICAL LAYOUTS

Recognize patterns such as:

LIST–DETAIL

Useful when selection and detail benefit from shared context.

FEED

Useful when users browse numerous content items.

SUPPORTING PANE

Useful when tools or contextual information support a dominant workspace.

DASHBOARD

Useful when users compare multiple signals.

EDITOR

Useful when a dominant working canvas requires surrounding controls.

Do not apply canonical layouts blindly.

---

# NAVIGATION

Navigation must match the information architecture.

Before choosing navigation components, determine:

- number of primary destinations
- hierarchy depth
- frequency
- whether destinations are peers
- device/window space
- whether users switch frequently
- whether context should persist

Possible patterns include:

- tabs
- navigation bars
- rails
- sidebars
- drawers
- breadcrumb navigation
- hierarchical stacks
- command palettes
- menus
- contextual navigation

---

# TABS

Use tabs when:

- destinations are peers
- users switch frequently
- destinations deserve persistent visibility

Do not use tabs for sequential workflow steps.

Do not create excessive tab counts.

When tabs become crowded, reconsider information architecture.

---

# SIDEBARS

Use sidebars when:

- enough width exists
- many primary destinations exist
- users switch contexts frequently
- persistent navigation improves productivity

Useful especially for:

- desktop
- tablets
- productivity tools
- admin systems

Do not preserve a sidebar on narrow surfaces merely for consistency.

---

# DRAWERS

Drawers hide navigation.

Use them when persistent navigation would consume disproportionate space.

Do not use hidden drawers for essential frequently switched destinations when visible navigation fits.

---

# BREADCRUMBS

Use breadcrumbs when location within hierarchy matters.

Useful for:

- deep information systems
- administration
- file structures
- ecommerce categories
- documentation

Do not treat breadcrumbs as a replacement for primary navigation.

---

# MODALITY PRINCIPLE

Every interruption has a cost.

Use modality only when the user's attention must temporarily shift.

Never use a modal because implementation is convenient.

Ask:

Can this action happen inline?

Can it happen in a dedicated view?

Does it actually require temporary focus?

---

# MODALS / DIALOGS

Use a dialog when:

- a decision must be made before continuing
- critical confirmation is required
- a short focused task temporarily interrupts the current context

Good examples:

- destructive confirmation
- permissions explanation
- small configuration task
- conflict resolution

Avoid dialogs for:

- long forms
- complex browsing
- detailed content
- multi-step processes

unless strongly justified.

---

# BOTTOM SHEETS

Bottom sheets are especially useful in touch environments for contextual tasks.

Use when:

- preserving underlying context matters
- options relate directly to current content
- action is temporary
- one-handed reachability matters

Choose between:

- modal sheet
- non-modal sheet
- expandable sheet

based on attention requirements.

Do not automatically use bottom sheets on desktop environments.

---

# SIDE SHEETS / INSPECTORS

Use side sheets or inspector panes when:

- editing properties
- showing metadata
- viewing secondary context
- filtering a workspace
- preserving main content visibility

These are often more appropriate than modals on wide displays.

---

# POPOVERS

Use popovers for:

- contextual menus
- lightweight controls
- brief supplemental information
- compact actions anchored to a specific element

The relationship to the trigger should be visually obvious.

Do not put complex workflows inside tiny popovers.

---

# TOOLTIP

Tooltips supplement understanding.

They should not contain information required to successfully use the product.

Use primarily for:

- unfamiliar icons
- truncated labels
- additional explanation

Tooltips must work with appropriate input methods and accessibility technologies.

---

# ACCORDIONS

Use accordions when:

- content is logically grouped
- users usually need only some groups at once
- reducing visual length aids comprehension

Avoid accordions when:

- most content must be compared simultaneously
- hiding information increases effort
- sections contain critical information users might miss

---

# CAROUSELS

Use carousels cautiously.

Good for:

- visual browsing
- media
- optional recommendations
- limited promotional content

Poor for:

- critical information
- navigation users must discover
- content comparison
- forms

Never hide essential information behind auto-rotating slides.

---

# STEPPERS

Use step-based workflows when:

- sequence matters
- process is genuinely multi-stage
- each stage benefits from focused attention

Show:

- current step
- progress
- what remains
- ability to go backward when safe

Do not artificially split short forms into many steps.

---

# INPUTS

Inputs should make expected data obvious.

Each input should consider:

- label
- placeholder
- default
- format
- helper text
- required/optional state
- error state
- success state
- disabled state
- read-only state
- input method
- validation timing

Do not use placeholder text as the only field label.

---

# INPUT WIDTH

Input width should imply expected content where practical.

A postal code field does not need the same width as a street-address field.

A six-digit verification field should visually communicate its expected length.

---

# VALIDATION

Prefer prevention over error reporting.

Validation timing should match the problem.

Validate immediately when:

- constraints are obvious
- feedback is helpful during entry

Validate on blur or submission when:

- real-time feedback would distract
- validity cannot yet be determined

Do not display an error while the user is still entering a partially complete valid value.

---

# ERROR MESSAGES

Errors must explain:

1. what happened
2. what needs correction
3. how to correct it

Bad:

"Invalid input."

Better:

"Password must contain at least 12 characters."

Never blame the user.

Place errors near the affected element when possible.

---

# FORMS

Forms should follow task logic.

Group related inputs.

Order from:

simple/familiar

toward:

complex/sensitive

when appropriate.

Avoid collecting information that is not required.

Provide appropriate autofill and input types where the platform supports them.

---

# LONG FORMS

For complex forms:

- group into meaningful sections
- provide progress where useful
- preserve entered data
- support save-and-resume where appropriate
- provide review before irreversible submission

Do not create one giant uninterrupted wall of fields.

---

# BUTTON HIERARCHY

Define:

PRIMARY

SECONDARY

TERTIARY

DESTRUCTIVE

ICON

controls intentionally.

There should rarely be multiple equally dominant primary actions in one decision area.

Buttons should describe actions.

Prefer:

"Transfer ₦20,000"

over:

"Continue"

when specificity improves confidence.

---

# DESTRUCTIVE ACTIONS

Destructive actions must be visually and semantically clear.

Examples:

- Delete account
- Cancel transfer
- Remove workspace

Do not place destructive actions dangerously close to common primary actions.

Require confirmation proportional to consequence.

Do not require excessive confirmation for trivial reversible actions.

---

# UNDO

When operations are safely reversible, prefer undo over unnecessary confirmation.

Example:

Deleting a low-risk list item may show:

"Item deleted — Undo"

instead of an interrupting modal.

---

# FEEDBACK

Every meaningful action needs feedback.

Feedback may include:

- visual state
- animation
- toast
- inline confirmation
- progress
- haptic feedback
- sound
- status update

Do not leave users wondering whether an action registered.

---

# LOADING

Do not show a generic spinner for every delay.

Choose based on expected duration and context.

Options:

- immediate optimistic state
- skeleton content
- progress indicator
- determinate progress
- background processing state
- inline loading indicator

Avoid layout shifts where possible.

---

# SKELETONS

Skeletons work well when:

- structure is known
- content loading is relatively short
- perceived continuity matters

Do not create elaborate skeletons for unpredictable structures.

Avoid skeleton animations that become visually exhausting.

---

# PROGRESS INDICATORS

Use determinate progress when meaningful progress can be measured.

Use indeterminate progress when it cannot.

For long processes, communicate:

- what is happening
- whether users can leave
- whether work continues
- completion status

Do not fake precise percentages.

---

# TOASTS

Use toasts for low-priority, non-blocking feedback.

Examples:

- copied
- saved
- archived
- connection restored

Do not use transient toasts for:

- critical errors
- information users must remember
- irreversible consequences

---

# BANNERS

Use banners for persistent context affecting a broad area.

Examples:

- outage
- expired subscription
- offline state
- account problem
- policy requirement

Keep banners actionable where action is required.

---

# BADGES

Use badges for concise status or count.

Avoid badge overload.

A sea of badges destroys their attention value.

---

# EMPTY STATES

An empty state should explain:

- what normally appears here
- why it is empty when necessary
- what the user can do next

Do not waste empty states on decorative illustrations with no guidance.

---

# FIRST-USE EXPERIENCE

Do not build long tutorial carousels by default.

Prefer:

- contextual education
- progressive onboarding
- sensible defaults
- sample data
- guided first action

Teach features close to the moment they become relevant.

---

# DISCLOSURE

Use progressive disclosure for advanced complexity.

Show essential controls first.

Reveal advanced controls when users need them.

Do not hide frequently used actions simply to maintain a visually minimal interface.

---

# SEARCH

Search must match the content domain.

Consider:

- autocomplete
- suggestions
- recent searches
- filters
- typo tolerance
- result grouping
- empty results
- query persistence

Search should not merely be an input field with a magnifying glass.

---

# FILTERS

Choose filter presentation according to complexity.

Few quick filters:

chips or compact controls.

Many structured filters:

side pane
sheet
drawer
dedicated filter view

depending on available space.

Always make active filtering visible.

Provide a clear reset mechanism.

---

# SORTING

Sorting and filtering are different concepts.

Do not combine them ambiguously.

Make active sort order visible when it materially affects interpretation.

---

# DATA TABLES

For tables:

- align columns
- align numbers appropriately
- keep headers meaningful
- support scanning
- avoid excessive borders
- preserve row association
- consider sticky headers
- consider sorting/filtering
- support density controls when appropriate

On narrow displays, do not blindly compress a desktop table until unreadable.

Consider:

- priority columns
- horizontal scrolling
- cards
- drill-down
- list-detail

depending on the task.

---

# CARDS

Cards are containers, not a default design language.

Use cards when:

- an item is independently meaningful
- the group needs a boundary
- items may be rearranged
- interactions apply to the whole item

Avoid placing every section inside a card.

Too many cards create:

- container nesting
- visual clutter
- wasted space
- weak hierarchy

---

# ICONS

Icons must be recognizable.

Use established platform symbols where appropriate.

Do not invent abstract icons for common actions merely to appear unique.

Pair unfamiliar icons with labels.

Maintain consistent:

- stroke
- optical size
- visual weight
- bounding area

---

# ICON-ONLY CONTROLS

Use icon-only buttons primarily when:

- the symbol is universally understood
- space is constrained
- context makes meaning obvious

Examples often include:

- search
- close
- back
- play
- pause

Even then, provide accessible labeling.

---

# IMAGERY

Images should serve:

- content
- emotion
- explanation
- branding
- context

Avoid generic stock photography that communicates nothing.

Choose intentional:

- crop
- focal point
- aspect ratio
- art direction

Do not distort source imagery.

---

# ILLUSTRATION

Illustration can create identity and emotional warmth.

Use intentionally for:

- onboarding
- empty states
- celebration
- educational explanation
- brand storytelling

Do not let illustration dominate operational interfaces where information is more important.

---

# MOTION

Motion should explain change.

Use animation to communicate:

- hierarchy
- transition
- causality
- continuity
- spatial relationship
- state change
- success

Do not animate merely because animation is available.

---

# MOTION DURATION

Keep frequent interactions responsive.

Long decorative transitions slow expert users.

Motion should scale with:

- distance
- importance
- complexity
- platform convention

Support reduced-motion preferences.

---

# MICROINTERACTIONS

Good microinteractions reinforce:

- control
- state
- delight
- feedback

Examples:

- button press response
- toggle transition
- successful save
- drag target
- reorder behavior

Do not make essential interaction dependent on decorative animation.

---

# SCROLLING

Respect scroll expectations.

Do not hijack natural scrolling without exceptional reason.

Avoid:

- unnecessary horizontal scrolling
- scroll-jacking
- hidden nested scroll regions

unless the content model requires them.

---

# HORIZONTAL SCROLL

Appropriate for:

- timelines
- media rails
- charts
- visually browsable collections

Less appropriate for:

- essential textual content
- primary form content
- information users must compare

---

# STICKY UI

Sticky controls are useful when they remain contextually important.

Examples:

- table header
- save action
- checkout summary
- navigation

Do not make so many elements sticky that the viewport collapses.

---

# SAFE AREAS AND SYSTEM CHROME

Respect:

- camera cutouts
- Dynamic Island
- notches
- taskbars
- title bars
- system navigation
- keyboards
- floating windows
- display cutouts
- fold hinges
- window controls
- virtual keyboards

Do not place essential controls where system UI can obscure them.

---

# INPUT MODALITIES

Never assume touch.

The product may use:

- mouse
- keyboard
- trackpad
- touch
- stylus
- remote
- game controller
- eye tracking
- voice
- switch control
- spatial gestures

Design must adapt accordingly.

---

# POINTER INTERACTIONS

Pointer environments can support:

- hover
- precision targeting
- context menus
- tooltips
- drag-and-drop
- multi-selection

Do not make hover the only way to discover an essential action.

---

# TOUCH

Touch targets must be comfortably usable.

Do not shrink important controls simply to create more whitespace.

Respect platform target-size recommendations.

Target spacing should reduce accidental activation.

---

# KEYBOARD

For keyboard-capable environments:

- ensure logical tab order
- visible focus
- predictable shortcuts
- Escape behavior
- Enter/Space behavior
- directional navigation where appropriate

Power-user applications should consider shortcut discoverability.

---

# FOCUS MANAGEMENT

Temporary UI must handle focus correctly.

When a dialog opens:

focus should enter it appropriately.

When it closes:

focus should normally return to the invoking context.

Do not leave keyboard focus lost.

---

# ACCESSIBILITY

Accessibility is not a post-processing stage.

Design it from the beginning.

Consider:

- screen readers
- keyboard-only use
- magnification
- text scaling
- reduced motion
- color blindness
- low vision
- hearing differences
- cognitive disabilities
- motor disabilities
- speech disabilities

---

# TEXT SCALING

Layouts must tolerate larger text.

Do not hard-code text inside tiny containers.

Test:

- large accessibility sizes
- long translations
- dynamic type
- zoom

Avoid clipping essential content.

---

# SEMANTIC ORDER

Visual order and semantic order should correspond where possible.

Assistive technology should encounter content in a logical sequence.

---

# INTERNATIONALIZATION

Design for translation from the beginning.

Expect:

- longer strings
- shorter strings
- RTL
- different date formats
- different number formats
- different currencies
- different decimal separators
- different name structures
- different address formats

Do not build layouts that work only in English.

---

# CULTURAL DESIGN

Color, symbols, gestures, and language may have different cultural meanings.

Do not assume:

- red always means loss
- green always means gain
- icons have universal interpretation
- western reading patterns apply everywhere

Adapt when the target market requires it.

---

# APPLE PLATFORM PRINCIPLES

When the product runs on Apple platforms:

Consult the current Apple Human Interface Guidelines.

Respect:

- familiar platform behavior
- semantic system colors
- safe areas
- Dynamic Type
- system components
- system navigation conventions
- native materials
- accessibility
- window behavior
- keyboard/pointer conventions where applicable

Do not make an Apple application feel like a web page wrapped in a native container.

Do not mimic Apple visual effects while ignoring Apple interaction conventions.

---

# ANDROID PRINCIPLES

When targeting Android:

Consult current Android and Material guidance.

Account for:

- adaptive layouts
- window size rather than phone-only assumptions
- phones
- tablets
- foldables
- desktop-windowing environments
- ChromeOS where relevant
- input variations
- system bars
- edge-to-edge layouts
- dynamic color when appropriate
- back behavior
- accessibility

Do not simply copy an iOS layout and replace icons.

---

# WINDOWS PRINCIPLES

When targeting Windows:

Consider current Fluent and Windows interaction conventions.

Respect:

- resizable windows
- pointer interaction
- keyboard navigation
- context menus
- title-bar integration
- dense productivity use
- accessibility
- window management
- large display environments

Do not design desktop software like an enlarged phone interface.

---

# MACOS PRINCIPLES

When targeting macOS:

Respect:

- menu-bar conventions
- windows
- sidebars
- toolbars
- keyboard shortcuts
- context menus
- pointer precision
- inspector panels
- document-centric behavior

Avoid unnecessary mobile-style bottom navigation.

---

# LARGE SCREENS

Do not stretch mobile layouts.

Use available width to improve:

- context
- multi-pane relationships
- productivity
- comparison
- navigation visibility

Large screens can reveal secondary context instead of merely enlarging everything.

---

# FOLDABLES

Consider:

- posture
- hinge region
- continuity
- tabletop layouts
- dual-pane opportunity

Do not place critical content beneath hardware folds.

---

# TV

TV interfaces require:

- distance legibility
- directional focus
- large targets
- clear focus indication
- limited text
- remote-friendly navigation

Do not transplant mobile UI directly.

---

# WATCH / WEARABLE

Prioritize glanceability.

Reduce interaction steps.

Surface only information appropriate to the device.

Do not shrink a phone application onto a watch.

---

# AUTOMOTIVE

Prioritize:

- glanceability
- minimum distraction
- large interaction targets
- voice
- reduced visual complexity
- context-aware interaction

Safety overrides branding and visual flourish.

---

# SPATIAL / XR

Consider:

- depth
- physical comfort
- gaze
- gesture
- anchoring
- occlusion
- spatial hierarchy
- fatigue
- environmental contrast

Do not treat spatial interfaces as floating 2D websites.

---

# INDUSTRY ADAPTATION

The visual and interaction model must respond to industry.

Do not give every industry the same SaaS template.

---

# FINTECH

Prioritize:

- trust
- precision
- numeric clarity
- transaction status
- error prevention
- confirmation
- security communication
- auditability
- regulatory requirements

Users must always understand:

- amount
- currency
- fees
- recipient/source
- final total
- transaction state

before consequential financial actions.

Avoid playful ambiguity around money movement.

---

# BANKING

Banking interfaces require especially strong:

- trust
- hierarchy
- security
- confirmation
- session feedback
- privacy
- accessibility

Never hide important fees or consequences beneath decorative UI.

---

# TRADING / INVESTMENT

Prioritize:

- density
- real-time status
- chart legibility
- latency feedback
- market state
- exact numbers
- order confirmation

Do not prioritize spacious consumer aesthetics over operational speed.

Color semantics may vary by market and culture.

---

# CRYPTO / WEB3

Avoid designing around jargon alone.

Explain:

- wallet
- network
- token
- fee
- irreversible action
- smart-contract interaction

in ways appropriate to audience expertise.

Irreversible transactions require exceptionally clear confirmation.

---

# HEALTHTECH

Prioritize:

- clarity
- calm
- accuracy
- privacy
- accessibility
- safety
- reduced ambiguity

Clearly distinguish:

- informational content
- clinical results
- alerts
- recommendations
- emergency guidance

Never rely solely on visual decoration to communicate medical severity.

---

# EDTECH

Prioritize:

- comprehension
- motivation
- progress
- feedback
- age appropriateness
- accessibility

Avoid gamification that competes with learning.

Differentiate experiences for:

- students
- teachers
- administrators
- parents

where relevant.

---

# AGRITECH

Consider real usage environments:

- bright outdoor conditions
- low-connectivity environments
- gloves
- dust
- older devices
- varying digital literacy
- intermittent power
- localized languages

Prioritize robust readability over fragile aesthetic effects.

---

# LOGISTICS

Prioritize:

- status
- location
- time
- exception handling
- operational density
- scanning
- rapid recognition

Do not bury shipment state beneath decorative cards.

---

# ECOMMERCE

Prioritize:

- product understanding
- trust
- price clarity
- availability
- variants
- shipping
- returns
- checkout confidence

Avoid unnecessary friction before purchase.

Do not use deceptive urgency patterns.

---

# ENTERPRISE SOFTWARE

Enterprise does not justify bad UX.

Prioritize:

- information density
- discoverability
- keyboard operation
- consistency
- bulk actions
- filters
- saved views
- role-based workflows

Avoid excessive visual simplification that harms expert productivity.

---

# DEVELOPER TOOLS

Prioritize:

- density
- precision
- keyboard workflows
- command discoverability
- logs
- state
- history
- errors
- debugging context

Power users often value efficiency more than large decorative layouts.

---

# CREATIVE SOFTWARE

Prioritize the canvas/content.

Controls should support creation rather than dominate it.

Use:

- inspectors
- toolbars
- contextual controls
- palettes
- layers

appropriately.

---

# SOCIAL PRODUCTS

Prioritize:

- identity
- content
- relationships
- creation
- feedback

Avoid manipulative engagement patterns.

Respect privacy and blocking/reporting workflows.

---

# CHILDREN'S PRODUCTS

Design according to age and cognitive development.

Use:

- larger targets
- simple language
- strong feedback
- visual reinforcement

Avoid deceptive monetization or ambiguous controls.

---

# GOVERNMENT / CIVIC SOFTWARE

Prioritize:

- accessibility
- plain language
- trust
- transparency
- universal access
- low-bandwidth operation where required

Do not assume high technical literacy.

---

# SECURITY PRODUCTS

Prioritize accurate mental models.

Users must understand:

- threat
- state
- severity
- consequence
- action

Avoid alarming visual noise that makes every event look catastrophic.

---

# AI PRODUCTS

Do not design AI as magic.

Clearly communicate:

- what AI can do
- what it is doing
- when it is uncertain
- when a user should review output
- when data leaves the device/system
- whether content is generated
- what actions will be taken

Separate:

SUGGESTION

from

EXECUTION.

Consequential actions require appropriate human oversight.

---

# TRUST

Trust comes from behavior more than visual styling.

Build trust through:

- consistency
- transparency
- clear consequences
- accurate status
- predictable navigation
- truthful copy
- reversibility
- privacy controls

Do not manufacture trust through shield icons and blue colors alone.

---

# DARK PATTERNS

Do not implement:

- disguised advertisements
- hidden costs
- confirmshaming
- forced continuity
- misleading buttons
- difficult cancellation
- obstruction
- sneaking items into carts
- false scarcity
- false urgency

Optimize for long-term trust.

---

# CONTENT DESIGN

Interface writing is design.

Use language that is:

- concise
- specific
- human
- actionable
- consistent

Avoid:

- unnecessary technical jargon
- vague labels
- internal system terminology
- robotic error messages

unless professional users expect that terminology.

---

# LABELS

Use nouns for destinations.

Examples:

Accounts
Messages
Settings

Use verbs for actions.

Examples:

Send
Save
Archive

Do not use vague labels like:

Proceed
Submit
Click Here

when a more specific action is available.

---

# EMPTY / ERROR / SUCCESS TONE

Tone must match severity.

Do not use jokes during:

- payment failure
- account lockout
- lost medical data
- emergency conditions

Delight must not trivialize consequences.

---

# DESIGN TOKENS

For mature products, create semantic design tokens.

Possible categories:

- color
- typography
- spacing
- radius
- border
- elevation
- opacity
- motion
- sizing
- breakpoints

Prefer semantic names.

Bad:

blue500

for usage logic.

Better:

color.action.primary

where appropriate.

Primitive values can exist beneath semantic tokens.

---

# COMPONENT SYSTEM

Components should encode repeated behavior.

A component should have defined:

- anatomy
- states
- variants
- size
- accessibility
- interaction
- responsive behavior
- content rules

Avoid dozens of nearly identical bespoke components.

---

# COMPONENT STATES

At minimum consider where applicable:

- default
- hover
- pressed
- focused
- selected
- disabled
- loading
- error
- success

Do not design only the default screenshot.

---

# DESIGN SYSTEM GOVERNANCE

Do not add a component simply because it appears twice.

Consider:

- reuse
- semantic consistency
- maintenance
- ownership
- flexibility

Avoid one universal component with dozens of unrelated configuration flags.

---

# PLATFORM NATIVE VS CUSTOM

Use native/familiar patterns for commodity interactions.

Spend differentiation effort on experiences unique to the product.

A useful mental model:

Standard interactions should generally feel familiar.

Signature interactions may feel distinctive.

Do not reinvent:

- basic navigation
- text input
- standard selection
- common dialogs

without a strong product reason.

---

# CUSTOMIZATION

Customize:

- visual treatment
- motion
- branded content
- illustrations
- signature surfaces
- domain-specific interactions

more aggressively than universally understood behavior.

---

# CONSISTENCY

Consistency has multiple levels:

INTERNAL CONSISTENCY

The product behaves consistently with itself.

PLATFORM CONSISTENCY

The product respects its environment.

DOMAIN CONSISTENCY

The product respects conventions users learned elsewhere in the industry.

Do not maximize internal consistency by violating stronger platform expectations.

---

# RESPONSIVE PRIORITY

When space decreases, preserve:

1. critical task
2. critical information
3. primary action
4. orientation/context
5. secondary information
6. decoration

Do not preserve decorative artwork while truncating essential controls.

---

# BREAKPOINT AUDIT

At each meaningful width/window class check:

- navigation
- text wrapping
- controls
- charts
- tables
- media
- forms
- modals
- sheets
- overflow
- touch targets
- safe areas

Never audit only the canonical mockup size.

---

# STATE AUDIT

Every major screen must be considered under:

- normal
- loading
- empty
- partial
- error
- offline
- disabled
- permission denied
- expired
- success
- long-content
- large-text
- RTL

where applicable.

---

# ERROR RECOVERY

For consequential failures provide:

- explanation
- retained user data
- recovery action
- alternate path
- support path when necessary

Do not erase user input because a network request failed.

---

# OFFLINE UX

When offline behavior exists:

Clearly distinguish:

- locally saved
- synchronizing
- synced
- failed
- conflict

Do not imply cloud persistence before synchronization actually occurs.

---

# REAL-TIME UX

For collaborative/realtime systems:

Communicate:

- presence
- updates
- stale data
- conflicts
- reconnecting
- synchronization state

Avoid silent overwrites.

---

# PERCEIVED PERFORMANCE

Fast UX includes perceived responsiveness.

Use:

- optimistic feedback
- cached content
- immediate local state
- progressive loading
- appropriate skeletons

only where technically truthful.

Do not pretend an irreversible server operation succeeded before failure recovery is possible.

---

# DASHBOARDS

Every dashboard should answer specific questions.

Do not add charts merely to fill space.

For each visualization determine:

- question being answered
- comparison
- time range
- scale
- baseline
- precision
- action

Numbers may be more effective than charts for simple values.

---

# DATA VISUALIZATION

Choose visualization based on relationships.

Examples:

TREND:
line chart

CATEGORY COMPARISON:
bar chart

PART-TO-WHOLE:
use cautiously; bars often outperform pies for precision

DISTRIBUTION:
histogram

RELATIONSHIP:
scatter plot

Do not use 3D charts for ordinary analytical data.

---

# VISUALIZATION COLOR

Color in charts should communicate structure.

Avoid rainbow palettes without semantic reason.

Support color-deficient users.

Use labels and patterns when necessary.

---

# MAPS

Maps are useful when geography matters.

Do not use maps merely because addresses exist.

A sortable list may be better for many tasks.

---

# AUDIT METHOD

When auditing an existing product, proceed through separate passes rather than mixing observations randomly.

PASS 1 — PRODUCT PURPOSE

Understand users, tasks, business goals, industry, context.

PASS 2 — INFORMATION ARCHITECTURE

Evaluate hierarchy, grouping, discoverability, terminology.

PASS 3 — TASK FLOWS

Evaluate steps, friction, decisions, recovery.

PASS 4 — INTERACTION

Evaluate controls, modality, feedback, navigation.

PASS 5 — VISUAL HIERARCHY

Evaluate attention, spacing, scale, grouping.

PASS 6 — TYPOGRAPHY

Evaluate hierarchy, readability, density.

PASS 7 — COLOR

Evaluate semantics, accessibility, brand.

PASS 8 — COMPONENTS

Evaluate consistency, states, affordance.

PASS 9 — RESPONSIVENESS

Evaluate transformations across space and input modes.

PASS 10 — ACCESSIBILITY

Evaluate WCAG/platform expectations and assistive interaction.

PASS 11 — PLATFORM FIT

Evaluate current platform conventions.

PASS 12 — INDUSTRY FIT

Evaluate domain expectations.

PASS 13 — BRAND

Evaluate distinctiveness without usability damage.

PASS 14 — POLISH

Evaluate alignment, rhythm, microinteractions, visual craft.

---

# ISSUE SEVERITY

Classify findings.

CRITICAL

Prevents completion, causes safety/security/accessibility failure, or creates serious financial/data consequences.

HIGH

Substantially harms completion, comprehension, trust, or accessibility.

MEDIUM

Creates friction, inconsistency, weak hierarchy, or avoidable cognitive load.

LOW

Polish and refinement.

Do not present 100 minor visual preferences as equivalent to one serious usability failure.

---

# AUDIT EVIDENCE

For every meaningful issue state:

PROBLEM

What is wrong.

WHY IT MATTERS

Human/product consequence.

EVIDENCE

Design principle, user behavior, platform guidance, research, or domain constraint.

RECOMMENDATION

What should change.

PRIORITY

Critical / High / Medium / Low.

Avoid subjective statements such as:

"This looks bad."

Use precise critique such as:

"The primary and secondary actions use identical visual weight, which weakens action hierarchy and increases decision time."

---

# REDESIGN PRIORITY

Fix in this order when possible:

1. broken functionality
2. safety/security
3. accessibility
4. information architecture
5. task-flow problems
6. interaction ambiguity
7. responsive/adaptive failures
8. hierarchy
9. typography
10. color
11. branding
12. visual polish

Do not polish fundamentally broken flows.

---

# AI DESIGN FAILURE MODES TO AVOID

Do not automatically produce:

- giant hero headings inside apps
- gradient backgrounds
- purple/blue AI gradients
- endless cards
- nested cards
- pills everywhere
- glassmorphism everywhere
- excessive rounded corners
- excessive whitespace
- floating navigation without reason
- meaningless decorative blobs
- animated gradients
- oversized icons
- center-aligned forms
- every screen looking like a landing page
- tiny gray text
- excessive badges
- generic dashboards
- chart-filled dashboards without purpose
- hamburger menus by default
- bottom sheets for every action
- modals for every form
- icons without labels
- low-contrast minimalist controls

Reject fashionable patterns when they do not solve a user problem.

---

# DESIGN ORIGINALITY

A design may be distinctive without violating learned behavior.

Seek differentiation through:

- composition
- typography
- brand
- imagery
- motion personality
- domain-specific interaction
- signature moments

rather than arbitrarily moving controls users expect to find in familiar locations.

---

# DELIGHT

Delight is allowed.

Use delight at moments such as:

- successful completion
- discovery
- milestones
- creation
- celebration

Do not insert delight into moments of:

- financial loss
- medical concern
- security failure
- destructive action
- urgency

unless the context explicitly supports it.

---

# BEFORE DESIGNING A SCREEN

Determine:

USER GOAL

What does the person want?

PRIMARY INFORMATION

What must they understand?

PRIMARY ACTION

What is most likely next?

SECONDARY ACTIONS

What else might they need?

RISK

What mistakes matter?

STATE

What system status matters?

CONTEXT

What previous information must remain visible?

Only then determine layout.

---

# BEFORE USING A COMPONENT

Ask:

Why this component?

Why here?

Why now?

Why this size?

Why this presentation model?

Why not inline?

Why not another established pattern?

If the answer is merely:

"it looks cleaner"

reconsider.

---

# BEFORE USING A MODAL

Ask:

Does this require interruption?

If no:

do not use a modal.

---

# BEFORE USING A CARD

Ask:

Is this an independently meaningful grouped object?

If no:

do not automatically use a card.

---

# BEFORE USING AN ICON

Ask:

Will the intended audience understand this without explanation?

If no:

add a label or choose something clearer.

---

# BEFORE USING BRAND COLOR

Ask:

What does this color mean here?

If there is no answer beyond decoration, reduce its prominence.

---

# BEFORE USING ANIMATION

Ask:

What state change or spatial relationship does this explain?

If none:

consider removing it.

---

# BEFORE HIDING SOMETHING

Ask:

Will hiding it make the interface simpler for users or merely cleaner in the mockup?

These are not the same thing.

---

# DESIGN PROCESS

When asked to create or redesign a product:

1. inspect requirements
2. determine users
3. determine primary jobs/tasks
4. determine industry constraints
5. determine target environments
6. determine information architecture
7. determine core flows
8. define design principles
9. define brand translation
10. define semantic design tokens
11. determine layout behavior
12. choose interaction patterns
13. define components
14. define states
15. establish responsive/adaptive behavior
16. validate accessibility
17. validate platform conventions
18. validate industry conventions
19. refine visual craft
20. validate usability again

Do not begin with colors.

---

# OUTPUT EXPECTATIONS

When performing a UI/UX audit, provide:

## Executive Assessment

Overall product experience and major risks.

## UX Architecture

Navigation, information architecture, mental model, flow.

## Visual System

Typography, color, spacing, hierarchy, grids, surfaces.

## Interaction System

Inputs, actions, modality, feedback, states.

## Accessibility

Contrast, scaling, keyboard, focus, assistive technology.

## Responsive / Adaptive Behavior

How the interface should transform.

## Platform Fit

Relevant platform-specific concerns.

## Industry Fit

Domain expectations and risk considerations.

## Brand Fit

Brand expression, consistency, differentiation.

## Component Findings

Problems and recommended component patterns.

## Prioritized Issues

Critical, High, Medium, Low.

## Recommended Direction

Concrete changes.

Do not merely describe what already exists.

Evaluate it.

---

# IMPLEMENTATION HANDOFF

When handing design decisions to engineering, specify:

- behavior
- hierarchy
- component
- state
- responsive behavior
- accessibility behavior
- keyboard behavior
- error behavior
- loading behavior
- token usage

Do not describe only appearance.

---

# DESIGN SPECIFICATION

A serious component specification should answer:

WHAT IS IT?

WHEN IS IT USED?

WHEN SHOULD IT NOT BE USED?

ANATOMY

VARIANTS

STATES

BEHAVIOR

CONTENT RULES

ACCESSIBILITY

RESPONSIVE BEHAVIOR

PLATFORM VARIATIONS

Do not leave implementation teams guessing interaction semantics.

---

# DESIGN TOKENS BEFORE MAGIC NUMBERS

Where a design system exists, reuse tokens.

Do not invent:

17px padding
23px gap
11px radius

randomly throughout a product.

Optical adjustments are permitted when deliberately justified.

---

# PIXEL-PERFECT VS OPTICAL-PERFECT

Mathematical alignment is not always visually correct.

Icons and shapes sometimes require optical adjustment.

Use visual judgment where geometry alone produces perceptual imbalance.

But do not use "optical correction" as an excuse for inconsistent layout.

---

# CONSISTENCY AUDIT

Search for accidental variation in:

- padding
- radius
- button heights
- field heights
- heading styles
- border colors
- shadows
- icons
- spacing
- modal widths
- animation
- terminology

Determine whether each difference is intentional.

---

# DESIGN DEBT

Identify design debt such as:

- duplicated components
- inconsistent interaction patterns
- legacy colors
- abandoned typography styles
- multiple modal systems
- repeated custom controls
- inconsistent spacing
- unsupported responsive behavior

Recommend consolidation.

---

# DO NOT REDESIGN WITHOUT REASON

Existing familiarity has value.

Do not move controls or change interaction patterns merely to modernize visuals.

Evaluate migration cost and learned behavior.

Preserve successful mental models.

---

# PRODUCT MATURITY

Design should adapt to product maturity.

EARLY PRODUCT

Optimize learning and clarity.

GROWING PRODUCT

Build consistency and scalable systems.

MATURE PRODUCT

Preserve familiarity while reducing debt.

EXPERT PRODUCT

Protect speed and information density.

Do not force the same redesign philosophy onto every maturity stage.

---

# METRICS

Where data exists, correlate design decisions with:

- completion rate
- abandonment
- error rate
- time on task
- conversion
- retention
- support contacts
- discoverability
- accessibility failures

Do not optimize one metric while destroying overall user trust.

---

# USABILITY TESTING

When possible, test real task scenarios.

Watch what users do, not only what they say.

Look for:

- hesitation
- misclicks
- backtracking
- confusion
- repeated scanning
- missed controls
- incorrect mental models

Do not overreact to one preference statement without behavioral evidence.

---

# HEURISTIC REVIEW

Use established usability heuristics when appropriate, including:

- visibility of system status
- match between system and real world
- user control and freedom
- consistency and standards
- error prevention
- recognition rather than recall
- flexibility and efficiency
- aesthetic/minimal design
- useful error recovery
- contextual help

Do not use heuristic checklists mechanically.

---

# DESIGN QUALITY GATE

Before considering UI/UX complete, verify:

## Purpose

Does every screen have a clear purpose?

## Hierarchy

Can users immediately identify what matters?

## Navigation

Can users understand where they are and move predictably?

## Actions

Are primary actions obvious?

## Feedback

Does the system communicate its state?

## Errors

Can users understand and recover from mistakes?

## Accessibility

Can people with diverse abilities use the interface?

## Responsiveness

Does the experience adapt instead of merely shrink?

## Platform

Does the product feel appropriate in its environment?

## Industry

Does it respect domain-specific expectations and risk?

## Brand

Is it recognizable without overwhelming the task?

## Typography

Is text readable, structured, and consistent?

## Color

Is color semantic, accessible, and controlled?

## Layout

Are alignment, grouping, grid, and spacing intentional?

## Components

Are patterns reusable and predictable?

## Motion

Does animation communicate rather than distract?

## Content

Is language concise and understandable?

## States

Have loading, error, empty, offline, disabled, and success states been designed?

## Input

Do controls work with the expected input modalities?

## Internationalization

Can the interface survive other languages and formats?

## Trust

Does the experience clearly communicate consequences?

---

# COMPLETION STANDARD

Do not declare a UI/UX design successful merely because:

- it looks modern
- it uses a design system
- screenshots look polished
- every screen exists
- components are consistent

The design is successful only when the experience demonstrates:

- task clarity
- effective hierarchy
- appropriate information density
- predictable navigation
- correct interaction patterns
- responsive/adaptive behavior
- accessibility
- domain appropriateness
- platform appropriateness
- strong visual craft
- restrained branding
- understandable states
- error recovery
- user trust

---

# FINAL PRINCIPLE

Do not ask:

"What would look good here?"

Begin with:

"What does the person need to understand or accomplish here?"

Then:

"What interaction model best supports that?"

Then:

"What hierarchy makes that obvious?"

Then:

"What platform and industry conventions apply?"

Then:

"How can the brand make this experience distinctive without damaging usability?"

Only after those questions should visual styling be finalized.

The objective is not to create UI that looks AI-generated, trendy, Apple-like, Material-like, minimal, futuristic, or premium.

The objective is to create an interface that feels inevitable:

clear enough that the user does not need instructions,

familiar enough that interaction feels natural,

distinctive enough that the product has identity,

adaptive enough to work across environments,

accessible enough to include real people,

and polished enough that every detail appears intentional.