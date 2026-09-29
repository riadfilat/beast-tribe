---
name: Beast Tribe
description: The Operation Beast class board — today's sessions at their times; you're in when your name is on it.
colors:
  deep-teal: "#023C3C"
  slate-deep: "#013131"
  slate-sheet: "#034E4E"
  chalk: "#F4F1EA"
  chalk-soft: "rgba(244,241,234,0.74)"
  chalk-faint: "rgba(244,241,234,0.60)"
  chalk-ghost: "rgba(244,241,234,0.30)"
  chalk-rule: "rgba(244,241,234,0.13)"
  chalk-rule-strong: "rgba(244,241,234,0.32)"
  chalk-wash: "rgba(244,241,234,0.07)"
  marker-orange: "#E88F24"
  brand-aqua: "#56C4C4"
  coral: "#EF8C86"
  strike-red: "#FF7A70"
  whiteboard: "#F2F0EE"
  whiteboard-deep: "#E8E5E1"
  whiteboard-sheet: "#FFFFFF"
  teal-ink-soft: "rgba(2,60,60,0.76)"
  teal-ink-faint: "rgba(2,60,60,0.72)"
  teal-rule: "rgba(2,60,60,0.12)"
  teal-rule-strong: "rgba(2,60,60,0.30)"
  aqua-ink: "#147070"
  coral-ink: "#B23C35"
  strike-red-ink: "#B3261E"
typography:
  display:
    fontFamily: "SlamDunk"
    fontSize: "52px"
    lineHeight: 1.04
    letterSpacing: "0.5px"
  display-ar:
    fontFamily: "NotoKufiArabic-Black"
    fontSize: "41px"
    lineHeight: 1.45
  title:
    fontFamily: "Montserrat-ExtraBold"
    fontSize: "24px"
    lineHeight: 1.18
  title-ar:
    fontFamily: "NotoKufiArabic-Bold"
    fontSize: "24px"
    lineHeight: 1.5
  row:
    fontFamily: "Montserrat-ExtraBold"
    fontSize: "15px"
    lineHeight: 1.25
    letterSpacing: "0.3px"
  time:
    fontFamily: "Montserrat-ExtraBold"
    fontSize: "20px"
    lineHeight: 1.15
    fontFeature: "tnum"
  button:
    fontFamily: "Montserrat-ExtraBold"
    fontSize: "15px"
    lineHeight: 1.2
    letterSpacing: "0.8px"
  headline:
    fontFamily: "SF Pro Text, SF Arabic, system-ui"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "SF Pro Text, SF Arabic, system-ui"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.3
  label:
    fontFamily: "SF Pro Text, SF Arabic, system-ui"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
  meta:
    fontFamily: "SF Pro Text, SF Arabic, system-ui"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  tag: "4px"
  chip: "8px"
  control: "10px"
  group: "12px"
  circle: "9999px"
spacing:
  gutter: "16px"
  row: "12px"
  section: "22px"
  rail: "28px"
components:
  button-marker:
    backgroundColor: "{colors.marker-orange}"
    textColor: "{colors.deep-teal}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    height: "54px"
    padding: "0 20px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    height: "50px"
    padding: "0 18px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    height: "38px"
    padding: "0 13px"
  chip-selected:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.deep-teal}"
    rounded: "{rounded.chip}"
    height: "38px"
  field:
    backgroundColor: "{colors.chalk-wash}"
    textColor: "{colors.chalk}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "52px"
    padding: "0 14px"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.chalk-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "1px 6px"
  magnet:
    backgroundColor: "{colors.chalk-wash}"
    textColor: "{colors.chalk}"
    typography: "{typography.time}"
    rounded: "{rounded.chip}"
    size: "30px"
  magnet-yours:
    backgroundColor: "{colors.marker-orange}"
    textColor: "{colors.deep-teal}"
    rounded: "{rounded.chip}"
    size: "30px"
  tab-bar:
    backgroundColor: "{colors.slate-deep}"
    textColor: "{colors.chalk-faint}"
    typography: "{typography.label}"
    height: "60px"
---

# Design System: Beast Tribe

## Overview

**Creative North Star: "The Box Board"**

Every gym box keeps a class board by the door: today's sessions written at their times, and you're in when your name is on it. Beast Tribe is that board. The screen is the board itself, a deep teal slate (or the light whiteboard), and everything on it is written in chalk: straight hairline rules instead of cards, name magnets instead of avatars, tally strokes instead of progress bars, zig-zag dividers between days. One orange circle, the brand's marker, shows what is yours, what is live, and the act of joining.

The board is dense and legible like a real schedule: time order, a leading-edge rail with a live NOW marker, rows that read in one glance (time, title in caps, sport and place, the crew's magnets). Color is scarce on purpose. Deep Teal is the field, chalk is the ink, orange is the spot color, aqua belongs to packs and links, coral to women-only sessions, and red strikes through what was cancelled. Only real place photography carries full color, always under a teal overlay.

The hand-drawn chalk of a real board is rendered in the brand's own geometry: bold straight rules, the solid circle, angular zig-zags and tally strokes. It works the same in English and in Arabic; the board mirrors, the digits stay Latin, and Arabic titles are set in Noto Kufi.

**Key Characteristics:**
- A board, not a feed: rows on rules, never cards as structure.
- One spot color. Orange marks yours, live, and joining; nothing else.
- People are name magnets; capacity is tally strokes; days are cut by zig-zags.
- Slate (dark) and Whiteboard (light) are the same board in two materials.
- Full RTL parity: mirrored layout, Latin digits, Noto Kufi titles, wider Arabic leading.

## Colors

A two-material palette: the brand's Deep Teal as the slate and Light Gray as the whiteboard, with a single orange marker and three meaning colors.

### Primary
- **Marker Orange** (marker-orange): the brand spot color. Fills the one primary button on a screen, the orange circle behind your session's time, the live NOW marker, your own name magnet, and progress dots. Text on it is always Deep Teal. On the whiteboard it is a fill only; it never sets small text on light.

### Secondary
- **Brand Aqua** (brand-aqua on slate, aqua-ink on the whiteboard): packs, links, and text buttons.

### Tertiary
- **Coral** (coral on slate, coral-ink on the whiteboard): women-only sessions.
- **Strike Red** (strike-red on slate, strike-red-ink on the whiteboard): cancelled sessions and destructive actions.

### Neutral
- **Deep Teal Slate** (deep-teal): the dark board; also the ink colour on the whiteboard.
- **Slate Deep** (slate-deep) and **Slate Sheet** (slate-sheet): the tab bar and pinned action bars; modal sheets.
- **Chalk** (chalk): primary ink on slate, with **Chalk Soft**, **Chalk Faint** (all ≥4.5:1) for secondary and tertiary text, and **Chalk Ghost** for decoration only (past sessions, empty tally strokes).
- **Chalk Rule / Rule Strong** (chalk-rule, chalk-rule-strong): hairlines between rows; day dividers and focused outlines.
- **Chalk Wash** (chalk-wash): pressed rows, input and magnet fills.
- **Whiteboard** (whiteboard, whiteboard-deep, whiteboard-sheet): the light board, its bars, and its sheets, with the teal-ink family doing what chalk does on slate.

### Named Rules
**The One Marker Rule.** Orange appears only on what is yours, what is live, and the act of joining. If orange is on it, the member either owns it or can commit to it right now.

**The Teal-On-Orange Rule.** Anything written on orange is Deep Teal, never white.

## Typography

**Display Font:** Slam Dunk (Noto Kufi Arabic Black in Arabic)
**Title Font:** Montserrat ExtraBold, standing in for Futura PT (Noto Kufi Arabic Bold in Arabic)
**Body Font:** the platform face (SF Pro / SF Arabic)

**Character:** a stencil hero voice used sparingly, a hard geometric title face for times and row titles, and the quiet system face for everything a member reads or taps.

### Hierarchy
- **Display** (Slam Dunk, 52, 1.04): the hero lines only — TODAY, your next time, the welcome line.
- **Title** (Montserrat ExtraBold, 24, 1.18; Arabic 1.5): screen and session titles.
- **Row** (Montserrat ExtraBold, 15, caps in English, 0.3 tracking): row titles and day headings.
- **Time** (Montserrat ExtraBold, 20, tabular figures): times, counts, calories.
- **Button** (Montserrat ExtraBold, 15, caps in English, 0.8 tracking): button labels.
- **Headline / Body / Label / Meta** (SF, 17 semibold / 16 / 13 semibold / 13): everything else. Line height 1.3 in English, 1.55 in Arabic.

### Named Rules
**The Rare Stencil Rule.** Slam Dunk sets at most one line per screen. When everything shouts, nothing does.

**The Case Rule.** Latin row titles and buttons are set in caps; Arabic has no case, so it gets weight and room instead.

## Layout

A single column on a 16px gutter. Screens are lists of rows hanging off hairline rules, with 12–14px of vertical padding per row and about 22px above a section heading. The Board adds a 28px rail down the leading edge carrying the session nodes and the live NOW marker. Primary actions sit in a pinned bar above the tab bar (Slate Deep, a hairline on top). Everything mirrors in Arabic through start/end, never left/right.

## Elevation & Depth

Flat. There are no shadows. Depth comes from the board's own materials: the board, a deeper tone for bars that sit above scrolling content, a lighter sheet for modal sheets, and hairline rules for structure. Photography is the only full-color layer and always sits under a teal overlay.

### Named Rules
**The Chalk-Not-Card Rule.** Group with rules and space, never with raised cards. The only bordered containers are inset groups (settings-shaped lists) and dashed "pinned note" blocks for a request that needs an answer.

## Shapes

Sharp and confident: 10px on buttons and fields, 8px on chips and magnets (about 22% of the magnet's size), 4px on tags, 12px on inset groups. The circle is reserved for the orange marker and the brand patches. Separators are straight 1–1.5px rules, and zig-zags cut between days.

## Components

### Buttons
- **Shape:** 10px corners.
- **Marker (primary):** orange fill, Deep Teal caps label, 54px tall. One per screen.
- **Outline (secondary):** 1.5px chalk outline, chalk caps label, 50px; a danger variant uses Strike Red.
- **Text button:** aqua label, 44px hit area.
- **Pressed:** a slight depress (scale 0.97) with a haptic; disabled drops to 45% opacity.

### Chips
- **Style:** 1.5px chalk-rule outline, chalk label, 38px tall, optional sport glyph.
- **State:** selected fills with chalk and the label turns to board color. Orange is never a selection color.

### Inputs / Fields
- **Style:** chalk-wash fill, 1.5px rule-strong outline, 10px corners, 52px (104px multiline), 17px text.
- **Focus:** the outline turns full chalk; the caret is orange.
- **Error:** Strike Red outline with a warning line underneath.

### Navigation
- **Tab bar:** Board · Explore · Tribe · You on Slate Deep with a hairline on top; solid SF Symbols; active in chalk, inactive in Chalk Faint.
- **Stacks:** a 44pt back chevron on the leading edge (mirrors in Arabic) and a Montserrat title.
- **Sheets:** native page sheets with Cancel · title · action in the header; the action is orange text when enabled.

### Logo ("The Pack")
- **Mark:** three of Operation Beast's wolves howling together, rising left to right, each silhouette whole. Back to front: Dreamer aqua (#56C4C4), Seeker orange (#E88F24), and the surface's ink (chalk on slate, teal on the whiteboard). Gaps between overlapping wolves are real knockouts, so it sits on photos too.
- **Wordmark:** BEAST TRIBE in the parent logotype's letterforms; lockup = mark + wordmark at 0.9 of the mark's height, endorsed "By Operation Beast" where there is room.
- **Where:** the welcome and sign-in, the Board masthead, Settings, the app icon and splash, the admin sidebar and sign-in, and every public web page. The single wolf alone is the "Beast" reaction glyph.
- **Never:** the parent's orange sun as Beast Tribe's logo, recoloured wolves, or the mark on busy photography without the teal overlay.

### Session Row (signature)
Time on the rail (the next one set largest), caps title, sport glyph and place, the crew's magnets and a tally on the trailing line. When the session is yours the orange sun sits behind its time; tapping I'M IN makes the sun rise with a spring while your magnet snaps onto the roster.

### Name Magnet
Squared 8px tag with initials or photo. Yours is orange with Deep Teal initials and always leads the row.

### Tally
Capacity counted the way a coach counts sign-ups: groups of four uprights and a slash, open spots as ghost strokes. Water in Nutrition uses the same strokes, one per glass.

### Measure Line
A straight chalk line filling toward a target, with the orange circle marking where you are now (Nutrition's daily calories). No rings.

## Do's and Don'ts

### Do:
- **Do** keep orange to what is yours, what is live, and the act of joining.
- **Do** separate with rules, space, and zig-zag day headings.
- **Do** show people as name magnets and capacity as tally strokes.
- **Do** keep every text token at 4.5:1 or better against its board; Chalk Ghost is for decoration only.
- **Do** write layout with start/end so the board mirrors in Arabic, and keep digits Latin.
- **Do** put photography under a teal overlay.

### Don't:
- **Don't** use cards, carousels, or stat dashboards as structure.
- **Don't** use progress rings or emoji as icons.
- **Don't** set small orange text on the whiteboard, or white text on orange.
- **Don't** set more than one Slam Dunk line on a screen.
- **Don't** add shadows or glass.
