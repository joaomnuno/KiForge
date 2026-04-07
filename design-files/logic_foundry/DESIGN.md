# Design System Specification: Technical Precision & Tonal Depth

## 1. Overview & Creative North Star: "The Orchestrated Engine"
The Creative North Star for this design system is **"The Orchestrated Engine."** We are moving away from the "cluttered dashboard" trope and toward a high-performance environment that feels like a precision instrument.

While the engineering context demands high density and an "IDE-like" structure, we avoid the "Windows 95" trap of rigid boxes and heavy borders. Instead, we use **Tonal Architecture**. By utilizing subtle shifts in surface luminosity and intentional asymmetry in the layout (e.g., an expansive central canvas flanked by precise, high-density sidebars), we create a sense of calm authority. The design breaks the "template" look by treating data not just as information, but as a visual texture.

---

## 2. Colors: The Tonal Architecture
The palette is rooted in deep slates and charcoals, using the primary `Logic Blue` (`#66d9cc`) as a surgical tool—used only where focus is required.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off the UI. Standard borders create visual noise that fatigues the engineer’s eye. Instead, define boundaries through **background color shifts**. Use `surface-container-low` for the main background and `surface-container-high` for active utility panels. 

### Surface Hierarchy & Nesting
Treat the UI as a series of nested, monolithic slabs.
- **Base Layer:** `surface-dim` (#131313) for the global background.
- **Primary Workspaces:** `surface-container-low` (#1c1b1b).
- **Active Utility Panels (Navigation/Inspector):** `surface-container-high` (#2a2a2a).
- **Floating Overlays/Modals:** `surface-container-highest` (#353534).

### The "Glass & Gradient" Rule
To elevate the "Logic Blue" primary color beyond a flat fill, apply a subtle linear gradient to main CTAs (from `primary` to `primary_container`). For floating contextual menus, use **Glassmorphism**: a background of `surface_container_highest` at 80% opacity with a `20px` backdrop-blur to allow the technical data beneath to ghost through.

---

## 3. Typography: The Dual-Tone System
We utilize a sophisticated pairing of an editorial Sans-Serif and a high-readability Monospace font to distinguish between "UI Guidance" and "Technical Truth."

- **The Sans-Serif (Inter):** Used for labels, titles, and navigation. It provides a human, approachable layer to a technical tool.
- **The Monospace (JetBrains Mono/Roboto Mono):** Reserved for technical data, pin numbers, coordinates, and code snippets.
- **The Display Scale:** `display-lg` and `headline-lg` use **Space Grotesk**. This adds a subtle "Brutalist-Tech" flair to empty states or high-level summaries, breaking the monotony of the dense grid.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows have no place in a precision engineering tool. We replace them with **Ambient Luminosity**.

- **The Layering Principle:** Achieve depth by stacking. A `surface-container-lowest` card placed on a `surface-container-low` section creates a natural "recessed" look without a single pixel of shadow.
- **Ambient Shadows:** For floating elements like Tooltips, use an extra-diffused shadow: `box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4)`. The shadow color should never be pure black; it should be a tinted version of `on_surface`.
- **The "Ghost Border" Fallback:** If high-density tables require separation, use the "Ghost Border"—the `outline_variant` token at **15% opacity**. It should be felt, not seen.

---

## 5. Components: High-Density Precision

### Buttons
- **Primary:** Gradient fill (`primary` to `primary_container`). `4px` corner radius. Text is `on_primary` (Inter, Bold).
- **Secondary:** Ghost style. No background, only a `Ghost Border` and `primary` colored text.
- **Tertiary/Icon:** No background or border. These should feel like integrated parts of the toolbars.

### High-Density Tables & Tree Views
- **No Dividers:** Forbid horizontal lines. Use a `4px` vertical spacing scale and alternating row highlights using `surface-container-low` and `surface-container-lowest`.
- **Tree Views:** Use `Logic Blue` (`primary`) solely for the "active" selection state. Use the Monospace font for node IDs and Sans-Serif for node descriptions.

### Small Status Badges
- **Success/Warning/Error:** Use a "dot and tint" approach. A small 6px circular dot of the semantic color (`error`, `primary`, etc.) next to text. Do not use heavy background pills; keep the UI "breathable."

### Inspector Panels (Right-Hand)
- Use `surface-container-highest` to differentiate the Inspector from the main Canvas.
- **Nesting:** Grouped attributes should be placed in `surface-container-low` buckets inside the panel to create a "card-within-a-slab" feel.

### Input Fields
- **State:** Resting state has no border, only a `surface-container-highest` background. On focus, a `2px` "Ghost Border" of `primary` appears.
- **Data Entry:** All numerical inputs must use the Monospace font for character alignment.

---

## 6. Do's and Don'ts

### Do
- **Do** use `space-grotesk` for large headers to provide a "signature" editorial feel.
- **Do** allow the central canvas to have asymmetrical margins to create visual breathing room in a high-density environment.
- **Do** use `surface-variant` for inactive or disabled states to maintain the "Slate" aesthetic.

### Don't
- **Don't** use 100% opaque borders. They clutter the "Engine" and distract from the data.
- **Don't** use standard "Material Design" shadows. They feel too "mobile-app" for a professional engineering tool.
- **Don't** mix Monospace and Sans-Serif within the same text string. Use them for distinct data roles.
- **Don't** use dividers between list items. Use white space (`spacing-sm`) or tonal shifts instead.