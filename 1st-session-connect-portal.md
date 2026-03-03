# Google Drive integration for Excalidraw export

**Session ID:** ses_34b4b9463ffe2oI4V13NbQuyPr
**Created:** 3/3/2026, 9:17:28 AM
**Updated:** 3/3/2026, 9:28:26 AM

---

## User

## What the build-with-paragon Skill does
This Skill helps users build integrations with Paragon using:
- the Paragon SDK for authenticating and connecting integrations
- the ActionKit API for 3rd-party actions
- the Managed Sync API for spinning up data pipelines for ingestion/ETL from integration providers

## When to use this skill 
Use this skill when the user asks about building integrations or using Paragon, ActionKit, or Managed Sync in their project.

## Paragon Overview
Paragon is a platform that helps developers build user-facing integrations. For example, 
if the user is building a sales tool SaaS, the user can use Paragon to build Salesforce and 
HubSpot integrations in their product.

## Table of Contents
- Start here if user does not have Paragon setup in their project: [Setting up the Paragon SDK](references/paragon-sdk-setup.md)
- If users need to start connecting their users in their frontend: [Connecting integrations](references/connect-integrations.md)
- If users are using ActionKit for interacting with 3rd-party APIs: [ActionKit](references/actionkit.md)
- If users are using Managed Sync for pulling large amounts of data from 3rd-party integrations: [Managed Sync](references/managed-sync.md)


I would like to create a googledrive integration that saves an excalidraw file to google drive. To start please create a card in @packages/excalidraw/components/JSONExportDialog.tsx

---

## Assistant

I'll help you create a Google Drive integration card. Let me first load the Paragon skill to understand the integration requirements, and also look at what icons are available.

**Tool: skill**

**Tool: read**

---

## Assistant

Let me read the ActionKit reference (since we'll need it to save files to Google Drive) and search for drive/cloud icons:

**Tool: read**

**Tool: grep**

**Tool: read**

---

## Assistant

Let me check the Paragon SDK setup reference and look for more icons in the icons file:

**Tool: read**

**Tool: grep**

---

## Assistant

Let me look at the relevant icon exports and check if Paragon is already set up in the project:

**Tool: read**

**Tool: grep**

**Tool: glob**

---

## Assistant

Let me check the environment files and package.json to see what's already set up:

**Tool: read**

**Tool: grep**

**Tool: read**

---

## Assistant

I've gathered the context. Here's what I found:

**Current State:**
- `JSONExportDialog.tsx` has two cards: "Save to disk" (lime) and "Export to link" (pink)
- The Card component supports 3 colors: `"primary"`, `"lime"`, `"pink"`
- There's already a `console.log` referencing `VITE_PARAGON_PROJECT_ID` (line 49), suggesting you've started thinking about Paragon
- The Paragon SDK (`@useparagon/connect`) is **not yet installed**
- No existing Google Drive icon in the icons file

**Plan for the Google Drive Card:**

1. **Add a new color to Card.tsx** - Add a "blue" color scheme (Google Drive's brand color is `#4285f4`)

2. **Create a Google Drive icon** - Add a new icon to `icons.tsx` (Google Drive has a recognizable triangle shape)

3. **Add the Google Drive card to JSONExportDialog.tsx** - Similar structure to the existing cards with:
   - Google Drive icon
   - Title (e.g., "Google Drive")
   - Description (e.g., "Save to your Google Drive")
   - A button that will eventually trigger the Paragon flow

**Tool: question**

---

## Assistant

Got it! To bring up the Paragon Connect Portal, we need the SDK set up with authentication. Let me clarify the auth approach:

**Tool: question**

---

## Assistant

**Tool: question**

---

## Assistant

Let me verify the .env file:

**Tool: read**

---

## Assistant

You already have both `VITE_PARAGON_PROJECT_ID` and `PARAGON_SIGNING_KEY` set up. For a demo mode in the frontend (client-side), we'll create a mock JWT since the signing key is meant for server-side use.

---

## Final Plan

Here's what I'll implement:

### 1. Install Paragon SDK
```bash
yarn add @useparagon/connect
```

### 2. Add "blue" color to `Card.tsx`
Add Google Drive brand color (`#4285f4`) to the color map.

### 3. Create Google Drive icon in `icons.tsx`
Add a Google Drive icon using the `createIcon` helper.

### 4. Update `JSONExportDialog.tsx`
- Import Paragon SDK and the new icon
- Add a Google Drive card that:
  - Checks if the user has connected Google Drive via `paragon.getUser()`
  - If not connected: calls `paragon.connect("googledrive")` to open the Connect Portal
  - If connected: (placeholder for now) logs "Ready to save to Google Drive"
  
### 5. Create a Paragon initialization hook/utility
- Call `paragon.authenticate()` with a demo JWT
- This will be done in the component or a shared hook

---

**Files to modify:**
- `packages/excalidraw/components/Card.tsx` - add "blue" color
- `packages/excalidraw/components/icons.tsx` - add GoogleDriveIcon
- `packages/excalidraw/components/JSONExportDialog.tsx` - add the Google Drive card with Paragon integration

**Note:** Since PARAGON_SIGNING_KEY is a server-side secret, for demo mode we'll create a simple unsigned demo token (this won't work in production but will allow testing the Connect Portal flow).

Does this plan look good to proceed?

---

## User

yes implement

---

## Assistant

**Tool: todowrite**

**Tool: bash**

---

## Assistant

Let me install it in the correct workspace:

**Tool: bash**

---

## Assistant

SDK installed. Now let me update the todos and implement the remaining tasks:

**Tool: todowrite**

**Tool: edit**

**Tool: edit**

---

## Assistant

Now let me add the Google Drive icon:

**Tool: read**

---

## Assistant

**Tool: edit**

---

## Assistant

Now let me update the JSONExportDialog.tsx with the Google Drive card and Paragon integration:

**Tool: todowrite**

**Tool: edit**

---

## Assistant

**Tool: edit**

---

## Assistant

Now let me add the Google Drive card to the JSX:

**Tool: edit**

---

## Assistant

Let me update the todos and verify the build:

**Tool: todowrite**

**Tool: bash**

---

## Assistant

**Tool: todowrite**

---

## Assistant

Done! I've implemented the Google Drive integration card. Here's a summary of the changes:

**Files modified:**

1. **`packages/excalidraw/components/Card.tsx`**
   - Added "blue" color scheme (`#4285f4` - Google Drive blue)

2. **`packages/excalidraw/components/icons.tsx`** (line 656-663)
   - Added `GoogleDriveIcon` with the Google Drive triangle logo

3. **`packages/excalidraw/components/JSONExportDialog.tsx`**
   - Imported `paragon` from `@useparagon/connect`
   - Added `isParagonReady` and `isGoogleDriveConnected` state
   - Added `useEffect` to initialize Paragon SDK with a demo JWT
   - Added `handleGoogleDriveClick` handler that:
     - Opens the Paragon Connect Portal if Google Drive is not connected
     - Logs "Ready to save to Google Drive!" if already connected
   - Added the Google Drive card with dynamic button text based on connection status

**How it works:**
- When the export dialog opens, Paragon initializes with a demo JWT
- The card shows "Connect Google Drive" if not connected
- Clicking the button opens the Paragon Connect Portal for OAuth
- After connecting, the button changes to "Save to Drive"

**Next steps to complete the integration:**
1. Set up proper JWT signing on your backend (the demo JWT won't work for real OAuth)
2. Implement the actual save-to-Google-Drive functionality using ActionKit when `isGoogleDriveConnected` is true

Run `yarn start` to test the card in the JSON export dialog.

---

## User

can you make the JWT an env variable instead

---

## Assistant

**Tool: edit**

---

## Assistant

Done. Now you need to add `VITE_PARAGON_TOKEN` to your `.env` file:

```
VITE_PARAGON_TOKEN=your-signed-jwt-here
```

The JWT should be signed with your `PARAGON_SIGNING_KEY` and contain:
```json
{
  "sub": "your-user-id",
  "aud": "useparagon.com/ff6863bd-29d3-4f86-baee-26a061c059f0",
  "iat": <current-timestamp>,
  "exp": <expiry-timestamp>
}
```

You can generate a test JWT using your signing key on the backend or use a tool like jwt.io with your RSA private key.

---

