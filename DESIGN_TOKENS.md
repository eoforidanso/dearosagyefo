# Design Tokens: Interaction Semantics System

## 📋 Overview
This document codifies the canonical interaction semantics system for the Osagyefo Letters platform.
Each interaction state has explicit meaning and consistent implementation.

---

## 1. **Idle State** — Neutral Presence
*"I'm here if you need me."*

### CSS Variables
```css
--idle-lift: translateY(0);
--idle-scale: scale(1);
--idle-shadow: 0 2px 8px rgba(0,0,0,0.12);
--idle-opacity: 1;
```

### Implementation Pattern
- No motion
- Baseline shadow (--shadow-sm)
- Natural color (no emphasis)
- Full opacity

### Examples
- Primary button at rest
- Modal tabs (unselected)
- Card baseline state
- Form inputs (unfocused)

### Code Template
```css
.component {
  background: var(--color-base);
  box-shadow: var(--shadow-sm);
  transform: scale(1);
  transition: all 0.2s var(--motion-ease-smooth);
}
```

---

## 2. **Hover State** — Invitation
*"You may proceed."*

### CSS Variables
```css
--hover-lift: translateY(-2px);
--hover-scale: scale(1.02);
--hover-shadow: 0 6px 16px rgba(0,0,0,0.18);
--hover-color-boost: +10% lightness;
```

### Semantics
- Small lift (`translateY(-2px)`)
- Subtle scale increase (`1.02x`)
- Shadow depth increases one tier
- Color brightens slightly (via hue-shift or opacity change)
- Active cursor pointer

### Implementation Pattern
```css
@media (hover: hover) {
  .component:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: var(--shadow-md);
    background: var(--color-hover);
  }
}
```

### Component Variants

#### Primary Button (Red)
```css
.btn-primary:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 6px 16px rgba(212, 63, 58, 0.25);
  background: linear-gradient(175deg, #ff6b60 0%, #e63d36 100%);
}
```

#### Secondary Button (Gold)
```css
.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(232, 185, 35, 0.22);
  border-color: var(--gold);
  background: rgba(232, 185, 35, 0.08);
}
```

#### Card Component
```css
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  --shadow-lift: var(--motion-lift-md);
}
```

#### Form Input
```css
input:hover:not(:focus) {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 1px rgba(232, 185, 35, 0.3);
}
```

---

## 3. **Active State** — Commitment
*"You are doing this now."*

### CSS Variables
```css
--active-lift: translateY(2px);
--active-scale: scale(0.96);
--active-shadow: 0 1px 4px rgba(0,0,0,0.15);
--active-color-deepen: -15% lightness;
```

### Semantics
- **Downward motion** (compressed feel)
- **Scale reduction** (visual press)
- **Shadow collapses** (contact with surface)
- **Color deepens** (intensity increases)
- Must feel **tactile** and **intentional**

### Implementation Pattern
```css
.component:active {
  transform: translateY(2px) scale(0.96);
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  background: var(--color-active);
}
```

### Component Variants

#### Primary Button (Red)
```css
.btn-primary:active {
  transform: translateY(3px) scale(0.95);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  background: linear-gradient(175deg, #d12e22 0%, #9a1f18 100%);
}
```

#### 3D Button (Listen)
```css
.modal-listen-3d:active {
  transform: translateY(4px);
  box-shadow: 0 1.5px 0 #16392a, 0 3px 8px rgba(0,0,0,0.25);
}
```

#### Form Submission
```css
button[type="submit"]:active {
  transform: translateY(2px) scale(0.98);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}
```

---

## 4. **Focus State** — Clarity
*"I see you."*

### CSS Variables
```css
--focus-outline: 2px solid var(--gold);
--focus-outline-offset: 2px;
--focus-glow: 0 0 0 4px rgba(232, 185, 35, 0.2);
--focus-ring-color: var(--gold);
```

### Semantics
- **Outline ring** (gold or context-specific)
- **NO lift** (distinct from hover)
- **NO scale** (distinct from active)
- **NO shadow change** (visual clarity only)
- **Keyboard-first design**

### Implementation Pattern
```css
.component:focus-visible {
  outline: var(--focus-outline);
  outline-offset: var(--focus-outline-offset);
  box-shadow: var(--focus-glow);
  /* Do NOT add lift, scale, or shadow depth */
}
```

### Component Variants

#### Button Focus
```css
button:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(232, 185, 35, 0.2);
}
```

#### Form Input Focus
```css
input:focus,
textarea:focus,
select:focus {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
  border-color: var(--gold);
  box-shadow: 0 0 0 4px rgba(232, 185, 35, 0.15);
}
```

#### Modal Tab Focus
```css
.modal-tab:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: -2px;
  border-radius: 2px;
}
```

#### Card Focus (Keyboard Nav)
```css
.card:focus-within {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
}
```

---

## 5. **Disabled State** — Unavailable
*"Not available right now."*

### CSS Variables
```css
--disabled-opacity: 0.5;
--disabled-cursor: not-allowed;
--disabled-shadow: none;
```

### Semantics
- Reduced opacity (visual de-emphasis)
- Cursor changes to `not-allowed`
- No interactive effects on hover/active
- Shadow removed

### Implementation Pattern
```css
.component:disabled,
.component[aria-disabled="true"] {
  opacity: var(--disabled-opacity);
  cursor: var(--disabled-cursor);
  pointer-events: none;
  box-shadow: none;
}
```

---

## 6. **Loading State** — Pending
*"Processing your request."*

### CSS Variables
```css
--loading-opacity: 0.7;
--loading-cursor: progress;
--loading-animation: spin 1s linear infinite;
```

### Semantics
- Subtle opacity reduction
- Cursor changes to `progress`
- Spinning animation (spinner or shimmer)
- Disabled interaction

### Implementation Pattern
```css
.component.is-loading {
  opacity: var(--loading-opacity);
  cursor: var(--loading-cursor);
  pointer-events: none;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 7. **Motion System Reference**

### Easing Functions
```css
--motion-ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1);   /* Deceleration */
--motion-ease-spring: cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Bounce */
--motion-ease-sharp: cubic-bezier(0.4, 0.0, 1, 1);     /* Quick */
```

### Duration Tiers
```css
--motion-duration-xs: 0.1s;
--motion-duration-sm: 0.2s;
--motion-duration-md: 0.3s;
--motion-duration-lg: 0.5s;
```

### Shadow Depth Levels
```css
--shadow-xs: 0 1px 2px rgba(0,0,0,0.08);
--shadow-sm: 0 2px 8px rgba(0,0,0,0.12);
--shadow-md: 0 6px 16px rgba(0,0,0,0.18);
--shadow-lg: 0 12px 24px rgba(0,0,0,0.22);
--shadow-xl: 0 20px 40px rgba(0,0,0,0.28);
```

### Color-Specific Glow Shadows
```css
--shadow-glow-red: 0 4px 12px rgba(212, 63, 58, 0.22);
--shadow-glow-gold: 0 4px 12px rgba(232, 185, 35, 0.22);
--shadow-glow-green: 0 4px 12px rgba(61, 168, 101, 0.22);
```

---

## 8. **Component-Specific Applications**

### Buttons
| Component | Idle | Hover | Active | Focus |
|-----------|------|-------|--------|-------|
| Primary (Red) | shadow-sm | lift-2px, scale-1.03, shadow-md | lift+2px, scale-0.95, shadow-xs | outline-gold, glow |
| Secondary (Gold) | border-outline | lift-2px, bg-tint, shadow-md | lift+2px, shadow-xs | outline-gold |
| Tertiary (Link) | underline-scale-0 | underline-scale-1, lift-2px | scale-0.98 | outline-gold |

### Cards
| Component | Idle | Hover | Active | Focus |
|-----------|------|-------|--------|-------|
| Timeline | shadow-sm | lift-4px, shadow-lg, dot-scale-1.25 | lift+4px, shadow-md | outline-gold |
| Featured | shadow-sm | lift-3px, shadow-md | lift+3px, shadow-sm | outline-gold |
| Letter Row | border-gray | lift-2px, bg-tint, shadow-md | bg-darker | outline-gold |

### Form Elements
| Element | Idle | Hover | Active | Focus |
|---------|------|-------|--------|-------|
| Text Input | border-gray | border-accent, shadow-sm | border-accent-dark | border-gold, outline-gold, glow |
| Checkbox | bg-white, border | border-accent | scale-0.95, bg-accent | outline-gold, glow |
| Textarea | border-gray | border-accent | border-accent-dark | border-gold, outline-gold, glow |

---

## 9. **Accessibility Considerations**

### Prefers Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast Mode
```css
@media (prefers-contrast: more) {
  .component:hover {
    outline: 2px solid currentColor;
  }
}
```

### Dark Mode Adjustments
```css
html.dark .component:hover {
  box-shadow: 0 6px 16px rgba(0,0,0,0.35);
}

html.dark .component:focus-visible {
  outline-color: var(--gold-light);
  box-shadow: 0 0 0 4px rgba(232, 185, 35, 0.15);
}
```

---

## 10. **Implementation Checklist**

### Phase 1: Audit & Document ✅
- [x] Document all existing interaction states
- [x] Create canonical semantic model
- [x] Identify deviations and gaps

### Phase 2: Normalize (Next)
- [ ] Apply focus states to all interactive elements
- [ ] Ensure no lift/scale on focus (keyboard clarity)
- [ ] Add prefers-reduced-motion support
- [ ] Standardize disabled state handling

### Phase 3: Enhance
- [ ] Add loading state animations
- [ ] Implement group hover patterns (card + child interactions)
- [ ] Add transition timing to all interactive elements
- [ ] Create interactive component library

### Phase 4: Test
- [ ] Keyboard navigation audit
- [ ] Screen reader testing
- [ ] Motion preferences testing
- [ ] Cross-browser validation

---

## 11. **Quick Reference Template**

Use this template for all new interactive components:

```css
/* ═══ IDLE ═══ */
.my-component {
  background: var(--color-base);
  box-shadow: var(--shadow-sm);
  transition: all var(--motion-duration-sm) var(--motion-ease-smooth);
}

/* ═══ HOVER ═══ */
@media (hover: hover) {
  .my-component:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    background: var(--color-hover);
  }
}

/* ═══ ACTIVE ═══ */
.my-component:active {
  transform: translateY(2px);
  box-shadow: var(--shadow-xs);
  background: var(--color-active);
}

/* ═══ FOCUS ═══ */
.my-component:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(232, 185, 35, 0.2);
}

/* ═══ DISABLED ═══ */
.my-component:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

---

## 12. **Color Palette Reference**

### Primary Colors
- **Red**: `#D43F3A` (idle), `#E63D36` (hover), `#9a1f18` (active)
- **Gold**: `#E8B923` (accent), `#f0c93e` (hover), `#d4a71a` (active)
- **Green**: `#3DA865` (brand), `#2D5F3F` (deep), `#16392a` (shadow)

### Semantic Colors
- **Success**: `#2D5F3F` (green tones)
- **Warning**: `#E8B923` (gold)
- **Error**: `#D43F3A` (red)
- **Info**: `#3DA865` (green)

---

## 13. **Version History**

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-05-29 | Initial canonical system |

---

## References
- [Interaction Semantics Audit](./INTERACTION_STATES_AUDIT.md)
- [Motion System Documentation](./BUTTON_ANIMATIONS.md)
- [Accessibility Guidelines](./ACCESSIBILITY.md)
