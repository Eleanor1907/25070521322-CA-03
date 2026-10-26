---
name: Pine
description: Workspace booking where every half hour of a desk, room or cabin is a seat, in a dark editorial style.
colors:
  page: "#000000"
  surface: "#121212"
  surface-raised: "#181818"
  sunken: "#1f1f1f"
  frame: "#292929"
  line: "#262626"
  line-strong: "#666666"
  ink: "#ffffff"
  ink-muted: "#bdbdbd"
  ink-faint: "#8c8c8c"
  go: "#9dff7c"
  go-hover: "#b8ff9f"
  go-press: "#85e865"
  go-soft: "#1c2a17"
  on-go: "#000000"
  seat-taken: "#3a3a3a"
  seat-mine: "#ffffff"
  seat-past: "#1c1c1c"
  seat-now: "#b49cff"
  glitch-violet: "#7c4dff"
  danger: "#ff5c70"
  danger-soft: "#2b1015"
  warn: "#ffc56b"
typography:
  display:
    fontFamily: "Archivo Variable, Arial Black, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 5.6vw, 4.75rem)"
    fontWeight: 900
    lineHeight: 0.98
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo Variable, Arial Black, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "0.005em"
    fontVariation: "'wdth' 125"
  light-display:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4.25rem)"
    fontWeight: 300
    lineHeight: 1
  body:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Archivo Variable, Segoe UI, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.04em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "10px"
  pill: "999px"
  seat: "10px 10px 5px 5px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "20px"
  s-6: "24px"
  s-7: "32px"
  s-8: "40px"
  s-9: "56px"
  s-10: "80px"
components:
  button-primary:
    backgroundColor: "{colors.go}"
    textColor: "{colors.on-go}"
    rounded: "{rounded.pill}"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.page}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "42px"
  pill-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.page}"
    rounded: "{rounded.pill}"
    height: "32px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  frame:
    backgroundColor: "{colors.frame}"
  seat-free:
    backgroundColor: "{colors.page}"
    textColor: "{colors.go}"
    rounded: "{rounded.seat}"
    height: "46px"
  seat-chosen:
    backgroundColor: "{colors.go}"
    textColor: "{colors.on-go}"
    rounded: "{rounded.seat}"
    height: "46px"
  seat-mine:
    backgroundColor: "{colors.seat-mine}"
    textColor: "{colors.on-go}"
    rounded: "{rounded.seat}"
    height: "46px"
  ticket-stub:
    backgroundColor: "{colors.frame}"
    textColor: "{colors.ink}"
    width: "104px"
---

# Design System: Pine

## Overview

**Creative North Star: "The Editorial Seat Map"**

The look follows a reference video the owner supplied: a black page, grey frames around showcase panels, very wide heavy uppercase headings, small uppercase labels, white and outlined pills, and a single neon-green accent. Pine keeps its own content inside that frame. Every half hour of a space is a seat, and every booking is a ticket. The reference's photography and 3D artwork were not copied; Pine's own live board, seat maps and tickets fill those positions.

**Key Characteristics:**
- Black page, #121212 panels, #292929 frames.
- One accent, neon green, for free and chosen seats, the main action and the numbering.
- Archivo set expanded (125% width) and heavy for headings; normal width for reading.
- Navigation, filters and tabs are rows of pills: outlined, the current one filled white.
- Motion lives on the home page only: a glitch between showcase slides and a scrolling type marquee.

## Colors

Monochrome with one neon accent; colour carries meaning, not decoration.

### Primary
- **Neon Green** (#9dff7c): primary buttons (black text), free seat outlines, chosen seats, step numbers, links, focus rings.

### Secondary
- **Glitch Violet** (#7c4dff): only in the slide glitch's colour split, paired with the green.
- **Now Lilac** (#b49cff): the bar above the seat that holds the current time.

### Neutral
- **Page Black** (#000000), **Panel** (#121212), **Frame Grey** (#292929): the three surface layers.
- **White** (#ffffff): text, selected pills, and seats that are already yours.
- **Muted** (#bdbdbd) and **Faint** (#8c8c8c): secondary text and meta; both pass 4.5:1 on the panels.
- **Taken Grey** (#3a3a3a): taken seats.
- **Line Strong** (#666666): input and outline-pill borders, at 3:1 or more against the page.

### Named Rules
**The One Accent Rule.** Neon green is the only accent. Use it for availability, the main action and numbering, never as decoration.

**The Seat Meaning Rule.** Free is a green outline, chosen is solid green, taken is grey, yours is white, passed is hatched. The colours never change meaning between screens.

## Typography

**Display and Body Font:** Archivo Variable (bundled), with Arial Black / system-ui fallbacks.

**Character:** one family across its width axis. Expanded and black for posters, normal and light for large names ("Pine" on the showcase), and normal for reading.

### Hierarchy
- **Display** (900, clamp 2.25–4.75rem, 125% width, uppercase): the home headline only.
- **Headline** (800, 1.875rem, 125% width, uppercase): page titles; panel titles use the same style at 1.125rem.
- **Light display** (300, up to 4.25rem): the name on the showcase slide and step numbers.
- **Body** (400, 1rem, 1.55): reading text.
- **Label** (600, 0.75rem, uppercase, 0.04em tracking): pills, buttons, navigation, table headers.

### Named Rules
**The Wide For Shouting Rule.** Only headings, prices and the marquee use the expanded width. Paragraphs stay at normal width.

## Layout

Pages sit in a centred 1240px column. The home page follows the reference: a grey frame holding two slides, a headline row with pills and a light uppercase line on the right, then a two-column collage (profile block, caption bars, numbered steps, an example figure, a staggered uppercase statement and the type marquee). App pages keep their structure: title row, pill filters, then panels. At 960px the collage and headline row stack. At 920px the top-bar pills move into a menu panel. At 720px rows stack, tables become labelled cards, and the booking page pins its total and Confirm button to the bottom.

## Elevation & Depth

Depth comes from the three surface layers, not shadows. Shadows appear only on toasts, dialogs and tickets, always offset and soft and black.

## Shapes

Panels are almost square (4–10px). Buttons, inputs, tabs and filters are full pills. Seats keep their seat silhouette (taller top radius) with a cushion pad. Tickets keep the notched perforation between stub and body.

## Components

### Buttons
- **Primary:** neon-green pill with black uppercase label.
- **Secondary:** transparent pill with a grey outline that turns white on hover.
- **Danger:** red pill with black text, used only to confirm a destructive action inside a dialog.

### Pills (navigation, tabs, filters)
- Outlined grey pills with small uppercase labels; the current item is filled white with black text.

### Inputs / Fields
- Pill-shaped, #121212 fill, #666 outline, green outline on focus. Errors turn the outline red with a message underneath.

### Showcase (home page)
- Two slides in a grey frame: the live board, and a poster with a decorative seat field. Slides change every 7 seconds with a 480ms glitch (slices plus a green and violet colour split), pause on hover or focus. The pause button stops the slides and the type marquee together, and both start paused when the visitor prefers reduced motion.

### Seat Row, Seat Map and Ticket
- Behaviour is unchanged: one seat per half hour, click a start seat and then an end seat, or drag; arrow keys work. Tickets have a grey stub, a green "Today" or "Tomorrow" tag, and the notched edge.

## Do's and Don'ts

### Do:
- **Do** keep green for availability, the main action and numbering.
- **Do** use pills for any choice between a few options.
- **Do** keep every seat state coming from the API; label illustrations as examples.
- **Do** stop all motion for reduced-motion visitors.

### Don't:
- **Don't** add a second accent colour.
- **Don't** set paragraphs in the expanded width.
- **Don't** copy the reference's photography or artwork; use Pine's own content and data.
