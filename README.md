# Orbit — A little intelligence. A new universe.

Live production site: https://orbit-companion-dusky.vercel.app

Source: https://github.com/kallurayaankit/orbit-desk-companion

Launch script, post drafts and capture/narration helpers: `launch/README.md`.

A cinematic, original ESP32 companion concept with a real-time Three.js droid, a procedural planet and starfield, scroll-controlled exploded assembly, five device personalities, time-of-day lighting, and an interactive simulation lab.

## Circuit workshop

Open https://orbit-companion-dusky.vercel.app/circuit.html for all five application builds. The Circuit button walks through the assembly order; use Assembled, Exploded, or PCB plan to explore. Select components for their role, placement, wiring, and checks. The document tabs contain pin-to-pin tables, BOM quantities, an Arduino diagnostic scaffold, and the path from breadboard to a KiCad-designed carrier. Download JSON plans, CSV wiring/BOM, and `.ino` sketches.

The electrical plan targets the ESP32-S3-DevKitC-1 v1.1 N8R8. Sources from Espressif, component manufacturers, and Adafruit are linked in the inspector. It is a proposed modular build, not physically validated or ERC/DRC-checked. The 3D board is not to scale and the lines are logical nets, not routed copper or fabrication output. Arduino scaffolds are not full application firmware and have not been compiled here.

## Explore

- Home: `dist/index.html` — the 3D journey, core, fleet, and launch sequence.
- Lab: `dist/lab.html` — five device simulators with temperature, humidity, light, presence, power, a real focus countdown, scripted voice responses, hardware notes, and JSON configuration export.
- Fleet links preselect the matching device in the lab.
- Drag the fleet droid or use arrow keys to rotate it. Fleet tabs support arrow, Home and End keys.
- Scrub time to change the screen and scene lighting. Play a complete day in the lab.
- Use Pause motion, or your system's reduced-motion preference. Ambient sound is off until explicitly enabled and is synthesized locally; it suspends when the tab is hidden.
- A lightweight CSS fallback activates if WebGL is unavailable.

“4D” means three-dimensional visuals plus time-based interaction, not four spatial dimensions. The enclosure is a visual concept, not production CAD. Sensor values, weather, presence and voice are simulated. No physical device, live weather API, audio recording, or cloud AI service is connected.

## Run and check

```sh
npm run build
npm test
npm run dev
```

Open http://localhost:3000. No package installation is required for local development. Three.js 0.170.0 and fonts are vendored, with their licenses, so browsers make no third-party asset requests.

Tests verify the existing lab behavior and the new scene geometry/scroll math, profile switching, keyboard navigation, time controls, motion control, and relative assets. Scene tests use real Three.js geometry with a renderer stub; they do not substitute for visual browser testing. A later local Chromium/Playwright recording verified rendered scenes and interactions across the homepage, all five lab applications and all five circuit guides, with no page errors. Representative frames were inspected. This does not validate physical hardware.

## Hosting

Vercel project: `orbit-companion`
Project ID: `prj_lIbR8JPVPw4HnluFiiWxUtOUzM2c`
Team ID: `team_BmyYgfY41V198EkfvuVTJVlh`

The deployment is static: no paid API, database, server function, or purchased domain is needed. The connected account reported Hobby. Vercel Standard Protection was left enabled; the production domain is distinct from protected generated deployment URLs.

To redeploy from a machine authenticated to this team:

```sh
npx vercel --prod
```

Choose the existing project. `vercel.json` sets build command `npm run build` and output directory `dist`.

## Design direction

The user supplied Hanwha Space Hub as a reference. Its direct page could not load in this session. Published design documentation described cinematic, scroll-controlled scale changes, parallax, and a narrative journey. Orbit interprets those principles with original copy, a procedural 3D droid and planet, and a desk-companion story. No Hanwha models, videos, branding, or page code are included.

## Physical build boundary

The lab lists candidate components, not a validated circuit. GPIO assignments, display drivers, power design, and enclosure dimensions depend on the selected hardware. Begin on USB; add a battery only with an appropriate protected cell and charging/power-path board. Keep model API keys on an authenticated backend, never in public browser code.
