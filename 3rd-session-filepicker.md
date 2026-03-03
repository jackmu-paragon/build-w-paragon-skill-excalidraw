# Google Drive file picker integration

**Session ID:** ses_34a6d7b2bffeQZLh5VhYsLCq8S
**Created:** 3/3/2026, 1:20:04 PM
**Updated:** 3/3/2026, 1:37:55 PM

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


@packages/excalidraw/components/OverwriteConfirm/ please add an option to load a file from google drive using the paragon filepicker const picker = new paragon.ExternalFilePicker("googledrive", {
  allowedTypes: ["application/pdf"],
  allowMultiSelect: false,
  onFileSelect(files) {
    console.log("User picked files", files);
  },
});

---

## Assistant

Let me first load the Paragon skill and read the existing files to understand the component structure.

**Tool: skill**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant

Let me also read the Paragon SDK references to understand the proper integration pattern:

**Tool: read**

**Tool: read**

---

## Assistant

Now let me understand how files are currently loaded in Excalidraw to properly integrate the Google Drive picker:

**Tool: grep**

**Tool: grep**

---

## Assistant

The Paragon SDK is already installed. Let me look at the existing Paragon integration and the file loading mechanism:

**Tool: read**

**Tool: read**

---

## Assistant

Let me check how files are loaded in the App component and what MIME types are used:

**Tool: grep**

**Tool: read**

---

## Assistant

**Tool: grep**

---

## Assistant

**Tool: read**

---

## Assistant

I have a good understanding of the codebase and Paragon integration. Let me clarify a few things before presenting the plan:

**Tool: question**

---

## Assistant

## Plan: Add "Load from Google Drive" Action to OverwriteConfirm

Based on my analysis, here's the plan to add a Google Drive file picker option:

### Files to Modify

1. **`packages/excalidraw/components/OverwriteConfirm/OverwriteConfirmActions.tsx`**
   - Add new `LoadFromGoogleDrive` component
   - Export it via the `Actions` object (alongside `ExportToImage` and `SaveToDisk`)

### Implementation Details

The new `LoadFromGoogleDrive` action will:

1. **Initialize Paragon SDK** - Reuse the pattern from `JSONExportDialog.tsx`:
   - Call `paragon.authenticate()` with project ID and token from env vars
   - Check if Google Drive is connected via `paragon.getUser()`

2. **Handle connection flow**:
   - If not connected: Show "Connect Google Drive" and call `paragon.connect("googledrive")`
   - If connected: Show "Load from Drive"

3. **Use `ExternalFilePicker`** when user clicks:
   ```typescript
   const picker = new paragon.ExternalFilePicker("googledrive", {
     allowedTypes: ["application/vnd.excalidraw+json"],
     allowMultiSelect: false,
     onFileSelect(files) {
       // Download file and load into Excalidraw using loadFromBlob()
     },
   });
   ```

4. **Load the selected file**:
   - Fetch the file content from the returned URL
   - Convert to Blob and call `loadFromBlob()` from `data/blob.ts`
   - Update app state with the loaded scene

### Dependencies
- `@useparagon/connect` (already installed)
- `loadFromBlob` from `../data`
- `MIME_TYPES` from `@excalidraw/common`
- Env vars: `VITE_PARAGON_PROJECT_ID`, `VITE_PARAGON_TOKEN`

### Questions Before Implementation

1. **Where should this action be used?** Currently `OverwriteConfirmDialog` receives `children` to render actions. Should I also update a parent component that uses this dialog to include the new Google Drive action?

2. **Error handling**: Should failures show as a toast message or an error modal?

Shall I proceed with this plan?

---

## User

Just modify @packages/excalidraw/components/OverwriteConfirm/OverwriteConfirm.tsx not the Actions. Handle errors the same as overwriteConfirm

---

## Assistant

## Updated Plan: Modify OverwriteConfirm.tsx Only

Based on your direction, here's the focused plan for adding Google Drive file loading directly to `OverwriteConfirm.tsx`:

### Changes to `OverwriteConfirm.tsx`

**1. New Imports:**
```typescript
import { paragon } from "@useparagon/connect";
import { MIME_TYPES } from "@excalidraw/common";
import { loadFromBlob } from "../../data";
```

**2. Add State for Paragon:**
- `isParagonReady` - tracks if SDK is authenticated
- `isGoogleDriveConnected` - tracks if user has connected Google Drive
- `isLoading` - tracks file loading state

**3. Add `useEffect` for Paragon initialization:**
- Authenticate with `paragon.authenticate(projectId, paragonToken)`
- Check connection status via `paragon.getUser()` (same pattern as `JSONExportDialog.tsx`)

**4. Add `handleLoadFromGoogleDrive` function:**
```typescript
const handleLoadFromGoogleDrive = () => {
  if (!isGoogleDriveConnected) {
    paragon.connect("googledrive", {
      onSuccess: () => setIsGoogleDriveConnected(true),
      onError: (error) => { /* handle error */ },
    });
    return;
  }
  
  const picker = new paragon.ExternalFilePicker("googledrive", {
    allowedTypes: ["application/vnd.excalidraw+json"],
    allowMultiSelect: false,
    onFileSelect: async (files) => {
      // Fetch file content, convert to Blob, call loadFromBlob()
      // On success: close dialog
      // On error: use overwriteConfirmState pattern
    },
  });
};
```

**5. Add UI Button:**
Add a new `FilledButton` in the dialog (after the existing confirm button or in a new section) for "Load from Google Drive" / "Connect Google Drive"

### Error Handling
Will follow the existing pattern - errors will close the dialog and call `onReject()` or `onClose()` as appropriate.

### Environment Variables Required
- `VITE_PARAGON_PROJECT_ID`
- `VITE_PARAGON_TOKEN`

(Already used in `JSONExportDialog.tsx`, so should be configured)

---

**One question:** Where in the dialog UI should the Google Drive button appear? Options:
1. **Next to the existing confirm button** (in the description area)
2. **As part of the Actions section** (alongside child actions like SaveToDisk)
3. **As a separate section** below the description

---

## User

Between the existing overwriteConfirm div and the Actions

---

## Assistant

## Final Plan: Add Google Drive File Picker to OverwriteConfirm.tsx

### File to Modify
`packages/excalidraw/components/OverwriteConfirm/OverwriteConfirm.tsx`

### Changes

**1. Add Imports:**
```typescript
import { paragon } from "@useparagon/connect";
import { MIME_TYPES } from "@excalidraw/common";
import { loadFromBlob } from "../../data";
import { useExcalidrawSetAppState } from "../App";
```

**2. Add State Hooks (inside the component):**
```typescript
const [isParagonReady, setIsParagonReady] = React.useState(false);
const [isGoogleDriveConnected, setIsGoogleDriveConnected] = React.useState(false);
const [isLoading, setIsLoading] = React.useState(false);
const setAppState = useExcalidrawSetAppState();
```

**3. Add useEffect for Paragon Initialization:**
```typescript
React.useEffect(() => {
  const initParagon = async () => {
    const projectId = import.meta.env.VITE_PARAGON_PROJECT_ID;
    const paragonToken = import.meta.env.VITE_PARAGON_TOKEN;
    if (!projectId || !paragonToken) return;
    
    try {
      await paragon.authenticate(projectId, paragonToken);
      setIsParagonReady(true);
      const user = paragon.getUser();
      if (user?.authenticated) {
        const googleDrive = user.integrations?.googledrive;
        setIsGoogleDriveConnected(googleDrive?.enabled === true);
      }
    } catch (error) {
      console.error("Failed to initialize Paragon:", error);
    }
  };
  initParagon();
}, []);
```

**4. Add Handler Function:**
```typescript
const handleLoadFromGoogleDrive = () => {
  if (!isParagonReady) return;
  
  if (!isGoogleDriveConnected) {
    paragon.connect("googledrive", {
      onSuccess: () => setIsGoogleDriveConnected(true),
      onError: (error: Error) => {
        console.error("Failed to connect Google Drive:", error);
      },
    });
    return;
  }
  
  const picker = new paragon.ExternalFilePicker("googledrive", {
    allowedTypes: [MIME_TYPES.excalidraw],
    allowMultiSelect: false,
    async onFileSelect(files) {
      if (!files || files.length === 0) return;
      setIsLoading(true);
      try {
        const file = files[0];
        const response = await fetch(file.url);
        const blob = await response.blob();
        const data = await loadFromBlob(blob, null, null);
        // Success - close dialog and load scene
        setAppState({ ...data.appState });
        handleClose();
      } catch (error: any) {
        console.error("Failed to load file from Google Drive:", error);
        // Follow existing error pattern - close and reject
        overwriteConfirmState.onReject();
        setState((state) => ({ ...state, active: false }));
      } finally {
        setIsLoading(false);
      }
    },
  });
};
```

**5. Add UI Section (between description div and Actions):**
```tsx
{/* Google Drive section - between description and Actions */}
<div className="OverwriteConfirm__GoogleDrive">
  <FilledButton
    variant="outlined"
    color="muted"
    size="large"
    label={
      isLoading
        ? "Loading..."
        : isGoogleDriveConnected
          ? "Load from Google Drive"
          : "Connect Google Drive"
    }
    onClick={handleLoadFromGoogleDrive}
    disabled={!isParagonReady || isLoading}
  />
</div>
```

**6. Optional: Add CSS in OverwriteConfirm.scss:**
```scss
&__GoogleDrive {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}
```

### Final Structure
```
<Dialog>
  <div className="OverwriteConfirm">
    <h3>{title}</h3>
    <div className="OverwriteConfirm__Description">...</div>
    <div className="OverwriteConfirm__GoogleDrive">  ← NEW
      <FilledButton ... />
    </div>
    <Actions>{children}</Actions>
  </div>
</Dialog>
```

---

Ready to implement when you give the go-ahead.

---

## User

implement

---

## Assistant

**Tool: todowrite**

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: todowrite**

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: todowrite**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: todowrite**

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: todowrite**

---

## Assistant

**Tool: bash**

---

## Assistant

Implementation complete. Here's a summary of the changes:

### `OverwriteConfirm.tsx`
- Added imports for `paragon`, `MIME_TYPES`, `loadFromBlob`, and `useExcalidrawSetAppState`
- Added state hooks for Paragon initialization (`isParagonReady`, `isGoogleDriveConnected`, `isLoading`)
- Added `useEffect` to authenticate with Paragon SDK and check Google Drive connection status
- Added `handleLoadFromGoogleDrive` handler that:
  - Opens Connect Portal if Google Drive not connected
  - Opens `ExternalFilePicker` for `.excalidraw` files if connected
  - Downloads selected file and loads it via `loadFromBlob()`
  - Handles errors by calling `onReject()` (following existing pattern)
- Added `FilledButton` UI between the description div and Actions

### `OverwriteConfirm.scss`
- Added `&__GoogleDrive` styling for centered button with padding

TypeScript compilation passes. The button will show "Connect Google Drive" when not connected, or "Load from Google Drive" when connected, and "Loading..." during file fetch.

---

## User

initialize the picker first like this examplse: await picker.init({
  // Google Developer Key
  developerKey: "AIzaS...",
}); and replace the developer key with VITE_GOOGLE_DEVELOPER_KEY from an env var

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: bash**

---

## Assistant

Done. The picker is now initialized with `await picker.init({ developerKey })` using `VITE_GOOGLE_DEVELOPER_KEY` from environment variables.

---

## User

use picker.open() when the FilledButton is clicked and google drive is authed

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: edit**

---

## Assistant

**Tool: bash**

---

## Assistant

Let me also update the button's disabled state to be more accurate when Google Drive is connected but the picker isn't ready yet:

**Tool: edit**

---

## Assistant

**Tool: bash**

---

## Assistant

Done. The flow is now:

1. **On component mount**: Paragon SDK initializes and checks if Google Drive is connected
2. **If already connected**: The picker is automatically initialized via `useEffect`
3. **On button click (not connected)**: Opens Connect Portal, then initializes picker on success
4. **On button click (connected + picker ready)**: Calls `picker.open()` to show the file picker

The button is disabled when:
- Paragon isn't ready
- File is loading
- Google Drive is connected but picker isn't initialized yet

---

