# Pizza Ambulance: Google Play store listing

The text for Play Console's store listing ("Main store listing" and "Common
text assets"). Paste from here, and change it here first so changes are
tracked. Drafted 2026-10-19.

Rules it follows: Play's metadata policy (no "best" or ranking claims, no
emoji, no keyword lists, nothing the game doesn't do), the game's short, dry
voice, and the standing decision of no story or premise text.

## App name

`Pizza Ambulance` (30 characters at most)

## Short description

80 characters at most. Chosen:

`Stack pizzas high, ride fast, keep every slice. A wobbly delivery bike game.` (77)

Alternatives:

- `Deliver towering pizza stacks by bike before they go cold or hit the road.` (75)
- `One bike. Five pizzas. Every corner is a risk.` (46)

## Full description

4,000 characters at most; this is about 1,500.

```
Pizza Ambulance is a delivery game about one bike, a rack of pizza boxes, and
a town full of corners.

Load up at the pizzeria, ride to every door on your list, and keep the stack
upright. Brake too hard and it lurches. Corner too fast and the top box goes
over. Take too long and the pizzas go cold. Every slice that reaches the door
counts.

RIDE YOUR WAY
The streets have no barriers. Cut across lawns, hop the kerb, take the alley
with its three speed bumps, or stay on the road where it's safe. Shortcuts
save time; they also cost slices.

JOBS AND MEDALS
Each job is a set route with bronze, silver and gold to earn. Gold asks for
speed, stars and a stack that arrives whole. After every ride you see exactly
where it went wrong: which door, which slices, how many seconds.

BIGGER STACKS, BIGGER PAY
Every box you carry raises the multiplier. Start with a small rack and earn
your way to five boxes high. Spend your money at the bike shop on racks,
upgrades and hats that change how your rider looks.

TWO PARTS OF TOWN
Learn the hills and the flyover in Hillside, then take the bus to the Harbour,
where gusts off the water lean your stack and the drawbridge lifts on a timer.
Make it across before the barriers drop, or jump the gap if you're feeling lucky.

PLAY HOW YOU LIKE
Easy, Normal and Hard handling. Left-handed controls. No ads, no account,
no sign-in.

Made by Bryo Studio.
```

## Keep in step with the game

Lines that state facts about the game. When the game changes, check these:

| Line | True because | Change it if |
|---|---|---|
| "No ads, no account, no sign-in" | The game has none | Ads, purchases or sign-in are added |
| "Easy, Normal and Hard handling" | The difficulty settings | Presets are renamed or added |
| "Left-handed controls" | The left-handed setting | It is removed |
| "five boxes high" | The 5-box rack | The rack limit changes |
| "Two parts of town" | Hillside and the Harbour | A district is added |
| "jump the gap" | The drawbridge jump (task 3A-1) | The jump is removed |
| "which door, which slices, how many seconds" | The job result screen (V-1) | That screen changes |

## Other listing fields

- **Category:** Game → Racing (or Casual).
- **Contact email:** `support@bryostudio.com`
- **Website:** `https://bryostudio.com/pizza-ambulance/`
- **Privacy policy:** `https://bryostudio.com/privacy/pizza-ambulance/`
- **Graphics**, ready to upload, in `store/pizza-ambulance/`:
  - `icon-512.png`: the app icon (512 × 512, opaque), the "hero" direction
    with a thin navy outline (game task I-1).
  - `feature-graphic.png`: the feature graphic (1024 × 500, 24-bit, no
    alpha): the hillside corner shot with the Kenney Thick title lockup at
    half the width (tasks F-1 and L-1). Made for a listing without a promo
    video; with one, Play draws a play button over the middle of the title,
    and the lockup would need to shrink to about a third of the width.
  - Phone screenshots are made by the game repository's
    `tools\store_screenshots.ps1` (task S-1) into its git-ignored
    `build\screenshots\s1-store\`: upload `01-riding` to `06-map`, in the
    order result, riding, Harbour, board, shop, map.
- All of these are made from the game: re-make them there when it changes,
  then copy the icon and feature graphic here.
