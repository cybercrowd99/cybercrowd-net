CyberCrowd Multiplex Warehouse Build Plan
Core Idea
Build cybercrowd.net as one adaptive 3D internet desktop: a "multiplex warehouse" where every room, kiosk, wall, and portal represents part of your online identity, projects, tools, links, media, GitHub work, and community spaces.
The same site should work in four modes:
Apple phone: touch-first mobile mode.
Android phone: touch-first mobile mode with broad browser compatibility.
Chromebook or laptop: full desktop mode with keyboard, mouse, panels, windows, and multitasking.
VR headset: immersive WebXR mode where the warehouse becomes a navigable space.
The key is not four separate apps. The key is one flexible program with device-specific control layers.
Recommended Stack
Framework: Next.js or Vite React.
3D engine: Three.js with React Three Fiber.
VR support: WebXR through @react-three/xr.
UI: regular HTML/CSS overlays for menus, desktop windows, profiles, and controls.
Data: JSON or Markdown content files at first, then a CMS later if needed.
Hosting: GitHub repository plus Vercel, Netlify, or Cloudflare Pages.
Assets: compressed GLB models, WebP images, spatial audio, and lightweight textures.
Experience Modes
1. Mobile Mode
For Apple and Android phones, the site opens directly into a simplified warehouse view.
Controls:
One-thumb joystick or swipe movement.
Tap hotspots to open rooms, profiles, links, music, videos, tools, and GitHub panels.
Bottom navigation for Home, Rooms, Desktop, Profile, and Connect.
Optional gyroscope look mode.
Mobile should avoid heavy effects. It needs fast loading, big tap targets, and clear escape/back controls.
2. Laptop / Chromebook Mode
This is the "basic internet desktop" layer.
The user sees:
A 3D warehouse background.
A CyberCrowd desktop overlay.
App icons for GitHub, Profile, Projects, Terminal, Media, Contact, Links, and Rooms.
Windowed panels that can open, close, drag, minimize, or snap.
Keyboard shortcuts and mouse controls.
This mode should feel like an operating system inside a website.
3. VR Headset Mode
VR should be optional, entered through an "Enter VR" button only when the browser supports WebXR.
The headset version becomes:
Walkable warehouse.
Large readable wall panels.
Portal doors to sections.
Laser-pointer selection.
Floating menu attached to controller or hand.
Spatial zones for profile, GitHub, projects, media, and community.
VR must be simpler than desktop visually. Big readable surfaces matter more than tiny UI.
Warehouse Layout
Use the warehouse as the information architecture.
Lobby: identity, headline, current mission, enter buttons.
GitHub Bay: repositories, CyberCrowd99 profile, commits, featured projects.
Project Floors: 2D site history, experiments, apps, games, tools.
Media Wall: videos, images, livestreams, audio.
Command Office: desktop mode, terminal-like panels, site settings.
Portal Dock: external links, social, Discord, email, future platforms.
VR Hangar: optimized VR entry point and spatial tutorial.
Build Phases
Phase 1: Foundation
Create the repo and deploy a simple responsive site.
Deliverables:
Home route.
Shared content config.
Device detection helper.
Responsive shell.
GitHub deployment.
Basic SEO metadata.
Phase 2: 2D Internet Desktop
Build the usable desktop before making the warehouse huge.
Deliverables:
Desktop background.
App launcher.
Window manager.
Profile window.
GitHub window.
Projects window.
Links/contact window.
Mobile fallback navigation.
Phase 3: Warehouse Scene
Add the 3D multiplex environment.
Deliverables:
Three.js warehouse scene.
Rooms/zones.
Clickable hotspots.
Camera movement.
Asset loading states.
Performance settings for mobile vs desktop.
Phase 4: Multiplex Routing
Connect rooms to content and desktop windows.
Deliverables:
Room route/state system.
Hotspot-to-window actions.
Portal transitions.
URL-friendly deep links.
Content loaded from JSON/Markdown.
Phase 5: VR Layer
Add headset support only after desktop and mobile work well.
Deliverables:
WebXR support.
Enter VR button.
VR controller pointer.
Large spatial panels.
VR movement mode.
VR performance pass.
Phase 6: Polish and Launch
Make the experience feel intentional and public-ready.
Deliverables:
Visual identity.
Loading screen.
Error states.
Accessibility pass.
Mobile performance pass.
Browser testing.
Analytics.
README and deployment docs.
Program Architecture
Recommended folder shape:
src/
  app/
    page.tsx
    profile/
    projects/
  components/
    desktop/
      DesktopShell.tsx
      WindowManager.tsx
      AppIcon.tsx
    warehouse/
      WarehouseScene.tsx
      Hotspot.tsx
      RoomPortal.tsx
    mobile/
      MobileControls.tsx
      BottomNav.tsx
    vr/
      XRRoot.tsx
      VRMenu.tsx
  content/
    profile.json
    projects.json
    links.json
  lib/
    device.ts
    routes.ts
    performance.ts
  styles/
Minimum Viable Version
The first launch should include:
CyberCrowd profile page.
Desktop interface with four icons.
3D warehouse lobby.
Clickable GitHub/profile/project hotspots.
Mobile controls.
Public deployment.
Do not start with a massive world. Start with a strong lobby, one desktop, and three useful rooms.
Practical Testing Matrix
Test these before launch:
iPhone Safari.
Android Chrome.
Chromebook Chrome.
Windows Chrome.
Desktop Firefox.
Meta Quest Browser if VR is available.
Use performance targets:
Mobile first load under 3 seconds when possible.
3D scene at 30 FPS minimum on phones.
Desktop scene at 60 FPS where possible.
VR scene at stable headset frame rate with simplified assets.
Start-to-Finish Order
Create the repo.
Build the 2D responsive shell.
Add the internet desktop.
Add content files for profile, GitHub, projects, and links.
Add a lightweight 3D warehouse lobby.
Connect warehouse hotspots to desktop windows.
Add mobile touch controls.
Add asset compression and performance settings.
Add optional WebXR VR mode.
Test across phone, laptop, Chromebook, and headset.
Deploy to cybercrowd.net.
Keep expanding rooms as modules.
Guiding Rule
Every feature should work in 2D first, then become immersive. The warehouse is the spatial layer. The desktop is the usable layer. The profile, GitHub, projects, and links are the content la
