# Google Drive save with ActionKit

**Session ID:** ses_34ab95390ffecEgpESi2Xprp2A
**Created:** 3/3/2026, 11:57:13 AM
**Updated:** 3/3/2026, 12:11:44 PM

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


@packages/excalidraw/components/JSONExportDialog.tsx After Google Drive is connected, i'd like to implement the GOOGLE_DRIVE_SAVE_FILE action with the following parameters: file, filename. filename is a string. file is an object in this format: {
"data": "48656c6c6f2c20776f726c6421",
"dataType": "FILE",
"mimeType": "text/plain"
}

---

## Assistant

**Tool: skill**

---

## Assistant

**Tool: read**

---

## Assistant

I can see the current implementation has a TODO at line 95-96 for implementing the save to Google Drive functionality. Let me check how the existing export to disk works to understand the data format:

**Tool: read**

---

## Assistant

**Tool: read**

---

## Assistant

Let me check the `saveAsJSON` function to understand how the data is serialized:

**Tool: grep**

---

## Assistant

**Tool: read**

---

## Assistant

Let me check the MIME_TYPES to understand the correct content type:

**Tool: grep**

---

## Assistant

**Tool: grep**

---

## Assistant

Now I have all the information needed. Let me present a plan for implementing the GOOGLE_DRIVE_SAVE_FILE action:

---

## Implementation Plan

### Overview
Implement saving Excalidraw files to Google Drive using Paragon ActionKit when Google Drive is connected.

### Changes to `JSONExportDialog.tsx`

**1. Add imports:**
```typescript
import { DEFAULT_FILENAME, MIME_TYPES } from "@excalidraw/common";
import { serializeAsJSON } from "../data/json";
```

**2. Add a helper function to convert string to hex:**
```typescript
const stringToHex = (str: string): string => {
  return Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};
```

**3. Implement the save functionality in `handleGoogleDriveClick`:**

Replace the TODO block (lines 94-97) with:
- Serialize the drawing using `serializeAsJSON(elements, appState, files, "local")`
- Convert to hex using `stringToHex`
- Call ActionKit API at `https://actionkit.useparagon.com/projects/{projectId}/actions`
- Action: `GOOGLE_DRIVE_SAVE_FILE`
- Parameters:
  - `filename`: `{appState.name || DEFAULT_FILENAME}.excalidraw`
  - `file`: `{ data: hexData, dataType: "FILE", mimeType: "application/vnd.excalidraw+json" }`
- Handle success (show toast, close dialog) and error (show error message)

**4. Add loading state for save operation:**
- Add `const [isSaving, setIsSaving] = React.useState(false);`
- Disable button while saving and show loading indicator

### File format details
- **MIME type:** `application/vnd.excalidraw+json`
- **Extension:** `.excalidraw`
- **Data format:** Hex-encoded JSON containing elements, appState, and files

### Questions

Before proceeding, I have a couple of clarifications:

1. **File naming:** Should the filename include the `.excalidraw` extension, or just use the project name as-is?

2. **UI feedback:** After successful save, should the dialog close automatically, or stay open with a success message?

Would you like me to proceed with this implementation plan?

---

## User

Yes use the .excalidraw extension. Similar to the actionSaveFileToDisk in @packages/excalidraw/actions/actionExport.tsx , use the toast.fileSaved

---

## Assistant

Based on the `actionSaveFileToDisk` pattern (lines 228-231), I'll close the dialog and show the `toast.fileSaved` message on success.

## Final Implementation Plan

### Changes to `JSONExportDialog.tsx`

**1. Add new imports** (after existing imports):

```typescript
import { DEFAULT_FILENAME, MIME_TYPES } from "@excalidraw/common";
import { serializeAsJSON } from "../data/json";
```

**2. Add helper function** (before `JSONExportModal`):

```typescript
const stringToHex = (str: string): string => {
  return Array.from(new TextEncoder().encode(str))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};
```

**3. Add saving state** (in `JSONExportModal`, after existing state):

```typescript
const [isSaving, setIsSaving] = React.useState(false);
```

**4. Update `handleGoogleDriveClick`** - Replace the TODO block (lines 94-97) with:

```typescript
if (isGoogleDriveConnected) {
  setIsSaving(true);
  try {
    trackEvent("export", "googledrive", `ui (${getFrame()})`);
    
    const projectId = import.meta.env.VITE_PARAGON_PROJECT_ID;
    const paragonToken = import.meta.env.VITE_PARAGON_TOKEN;
    const filename = `${appState.name || DEFAULT_FILENAME}.excalidraw`;
    
    // Serialize the drawing data
    const serialized = serializeAsJSON(elements, appState, files, "local");
    const hexData = stringToHex(serialized);
    
    // Call ActionKit to save to Google Drive
    const response = await fetch(
      `https://actionkit.useparagon.com/projects/${projectId}/actions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paragonToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "GOOGLE_DRIVE_SAVE_FILE",
          parameters: {
            filename,
            file: {
              data: hexData,
              dataType: "FILE",
              mimeType: MIME_TYPES.excalidraw,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to save to Google Drive");
    }

    // Success: close dialog and show toast (matching actionSaveFileToDisk pattern)
    setAppState({
      openDialog: null,
      toast: { message: t("toast.fileSaved") },
    });
  } catch (error: any) {
    console.error("Failed to save to Google Drive:", error);
    setAppState({ errorMessage: error.message });
  } finally {
    setIsSaving(false);
  }
}
```

**5. Update button to show loading state** (lines 168-179):

```typescript
<ToolButton
  className="Card-button"
  type="button"
  title={
    isSaving
      ? "Saving..."
      : isGoogleDriveConnected
        ? "Save to Drive"
        : "Connect Google Drive"
  }
  aria-label={
    isGoogleDriveConnected ? "Save to Drive" : "Connect Google Drive"
  }
  showAriaLabel={true}
  onClick={handleGoogleDriveClick}
  disabled={isSaving}
/>
```

### Summary of Changes
| Location | Change |
|----------|--------|
| Line 3-4 | Add `DEFAULT_FILENAME`, `MIME_TYPES` imports |
| Line 8 | Add `serializeAsJSON` import |
| Line 28 | Add `stringToHex` helper function |
| Line 52 | Add `isSaving` state |
| Lines 94-97 | Replace TODO with full ActionKit implementation |
| Lines 168-179 | Update button with loading state |

### Data Flow
1. User clicks "Save to Drive"
2. Serialize elements + appState + files via `serializeAsJSON`
3. Convert JSON string to hex using `stringToHex`
4. POST to ActionKit with `GOOGLE_DRIVE_SAVE_FILE` action
5. On success: close dialog, show toast
6. On error: display error message

---

Should I proceed with implementing these changes?

---

## User

yes implement

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

**Tool: read**

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

TypeScript typecheck passed. Let me show you the final implementation:

**Tool: read**

---

## Assistant

Let me run the fix command to ensure consistent formatting:

**Tool: bash**

---

## Assistant

There's a warning about a console statement that was already in the original code. Let me remove it:

**Tool: edit**

---

## Assistant

**Tool: bash**

---

## Assistant

All checks passed. Let me show the final implementation:

**Tool: read**

---

## Assistant

Implementation complete. Here's a summary of the changes:

## Summary

**File:** `packages/excalidraw/components/JSONExportDialog.tsx`

### Changes Made:

1. **Added imports** (lines 3, 12):
   - `DEFAULT_FILENAME`, `MIME_TYPES` from `@excalidraw/common`
   - `serializeAsJSON` from `../data/json`

2. **Added `stringToHex` helper** (lines 26-30):
   - Converts UTF-8 string to hex-encoded format for ActionKit file upload

3. **Added `isSaving` state** (line 59):
   - Tracks save operation progress

4. **Implemented `GOOGLE_DRIVE_SAVE_FILE` action** (lines 102-155):
   - Serializes drawing data using `serializeAsJSON(elements, appState, files, "local")`
   - Converts to hex format
   - Calls ActionKit API at `https://actionkit.useparagon.com/projects/{projectId}/actions`
   - Parameters: `filename` (with `.excalidraw` extension), `file` (hex data, `dataType: "FILE"`, `mimeType: "application/vnd.excalidraw+json"`)
   - On success: closes dialog and shows `t("toast.fileSaved")` toast
   - On error: displays error message

5. **Updated button with loading state** (lines 228-241):
   - Shows "Saving..." while operation is in progress
   - Disables button during save

---

