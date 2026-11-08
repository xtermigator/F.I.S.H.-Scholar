# F.I.S.H. Scholar — Accessibility Steering

> Accessibility is a core product requirement. Target **WCAG 2.2 AA** wherever practical.
> The primary user is a neurodivergent graduate student; reducing cognitive load *is* the
> product.

## Baseline requirements

- **Semantic HTML** — real `<button>`, `<nav>`, `<main>`, `<h1..h6>` in order, `<label>`s tied
  to inputs. Don't reimplement native controls with `<div>`s.
- **Keyboard** — every interactive element is reachable and operable by keyboard; logical tab
  order; no keyboard traps. Modals/drawers trap focus while open and restore it on close, and
  close on `Esc`.
- **Visible focus** — never remove focus outlines; provide a clear, high-contrast focus style.
- **Screen readers** — meaningful names/roles; `aria-*` only to fill gaps native HTML can't;
  announce async state changes (saving, errors) via polite live regions.
- **Contrast** — text and meaningful UI meet AA contrast (4.5:1 body, 3:1 large text/icons).
- **No color-only meaning** — status (Not Started / Submitted / Overdue, AI vs verified, per-
  course labels) must also use text, icon, or shape — never color alone.
- **Responsive text** — layouts survive 200% zoom / larger text without loss of content.
- **Reduced motion** — honor `prefers-reduced-motion`; animations (incl. `motion`, confetti)
  must have a calm/no-motion path.
- **Accessible forms** — visible labels, clear error messages tied to fields, no reliance on
  placeholder-as-label.

## Executive-function support (product-level accessibility)

- **Start Here** — surface a single recommended next action instead of overwhelming lists.
- **Break Into Steps** — large tasks convert into small checklist steps.
- **Focus Session** — one task, estimated time, checklist, relevant docs, AI on request.
- **Parking Lot** — capture ideas/tasks without forcing immediate scheduling.
- Optional: text-size controls, reduced-distraction mode, reading-focus mode.

## Mobile

Must work well on iPhone, iPad, laptop, and desktop. Mobile is **not** a shrunken desktop
dashboard — prioritize, in order: **Today → Upcoming → Quick Add → Courses → Ask FISH**.
Touch targets ≥ 44px; primary actions reachable one-handed.

## Review checklist (before merging UI)

- [ ] Operable with keyboard only; focus visible throughout
- [ ] Status/meaning conveyed by more than color
- [ ] Labels/roles correct; errors announced
- [ ] Works at 200% zoom and on a phone-width viewport
- [ ] `prefers-reduced-motion` respected
