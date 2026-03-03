# Replace fetch with actionkit GOOGLE_DRIVE_DOWNLOAD_FILE

**Session ID:** ses_34a4ec6f1ffeXzSb1frSC1UG3t
**Created:** 3/3/2026, 1:53:36 PM
**Updated:** 3/3/2026, 2:07:10 PM

---

## User

@packages/excalidraw/components/OverwriteConfirm/ instead of using the fetch(file.id), use actionkit with the following action name and parameters: {
  "action": "GOOGLE_DRIVE_DOWNLOAD_FILE",
  "parameters": {
    "fileId": "<string>",
    "mimeType": "<string>",
    "fileEncoding": "raw"
  }
} This action will return a byte stream

---

## Assistant

Let me read the files in this directory to understand the current implementation.

**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant

I can see the issue. On line 78 in `OverwriteConfirm.tsx`, there's a `fetch(file.id)` call that needs to be replaced with Paragon's actionkit.

Let me search for how actionkit is used elsewhere in the codebase to understand the correct pattern:

**Tool: grep**

**Tool: grep**

---

## Assistant

Let me look at the existing ActionKit implementation in `JSONExportDialog.tsx` to understand the pattern:

**Tool: read**

---

## Assistant

Now I have a clear picture of the current implementation and the pattern used for ActionKit calls. Let me summarize my plan:

## Plan: Replace `fetch(file.id)` with ActionKit `GOOGLE_DRIVE_DOWNLOAD_FILE`

### Current Code (lines 76-80 in `OverwriteConfirm.tsx`):
```typescript
const file = files.docs[0];
const response = await fetch(file.id);
const blob = await response.blob();
const data = await loadFromBlob(blob, null, null);
```

### Proposed Change:

Replace the `fetch(file.id)` call with an ActionKit POST request following the pattern from `JSONExportDialog.tsx`:

```typescript
const file = files.docs[0];

// Call ActionKit to download from Google Drive
const projectId = import.meta.env.VITE_PARAGON_PROJECT_ID;
const paragonToken = import.meta.env.VITE_PARAGON_TOKEN;

const response = await fetch(
  `https://actionkit.useparagon.com/projects/${projectId}/actions`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paragonToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "GOOGLE_DRIVE_DOWNLOAD_FILE",
      parameters: {
        fileId: file.id,
        mimeType: file.mimeType,
        fileEncoding: "raw",
      },
    }),
  },
);

// Handle byte stream response
const blob = await response.blob();
const data = await loadFromBlob(blob, null, null);
```

### Questions before proceeding:

**Tool: question**

---

## Assistant

Thanks for clarifying. Since the response is JSON with hex-encoded data, I'll need to add a hex-to-bytes conversion function. Looking at `JSONExportDialog.tsx`, there's already a `stringToHex` function for encoding - I'll need the inverse.

## Final Plan

### Changes to `OverwriteConfirm.tsx`:

1. **Add hex-to-Blob helper function** (similar to how `stringToHex` exists in JSONExportDialog):
```typescript
const hexToBlob = (hex: string, mimeType: string): Blob => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return new Blob([bytes], { type: mimeType });
};
```

2. **Replace the `onFileSelect` callback** (lines 76-80) with:
```typescript
const file = files.docs[0];

const projectId = import.meta.env.VITE_PARAGON_PROJECT_ID;
const paragonToken = import.meta.env.VITE_PARAGON_TOKEN;

const response = await fetch(
  `https://actionkit.useparagon.com/projects/${projectId}/actions`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paragonToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "GOOGLE_DRIVE_DOWNLOAD_FILE",
      parameters: {
        fileId: file.id,
        mimeType: file.mimeType,
        fileEncoding: "raw",
      },
    }),
  },
);

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message || "Failed to download from Google Drive");
}

const result = await response.json();
const blob = hexToBlob(result.data, file.mimeType);  // Adjust based on actual response structure
const data = await loadFromBlob(blob, null, null);
```

### Question about response structure:

**Tool: question**

---

## Assistant

Excellent! Now I have all the information needed. Here's the **complete implementation plan**:

---

## Implementation Plan for `OverwriteConfirm.tsx`

### Change 1: Add `hexToBlob` helper function
Add this function near the top of the file (after imports, around line 19):

```typescript
const hexToBlob = (hex: string, mimeType: string): Blob => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return new Blob([bytes], { type: mimeType });
};
```

### Change 2: Update `onFileSelect` callback (lines 76-80)

**Replace:**
```typescript
const file = files.docs[0];
const response = await fetch(file.id);
const blob = await response.blob();
const data = await loadFromBlob(blob, null, null);
```

**With:**
```typescript
const file = files.docs[0];

const projectId = import.meta.env.VITE_PARAGON_PROJECT_ID;
const paragonToken = import.meta.env.VITE_PARAGON_TOKEN;

const response = await fetch(
  `https://actionkit.useparagon.com/projects/${projectId}/actions`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paragonToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "GOOGLE_DRIVE_DOWNLOAD_FILE",
      parameters: {
        fileId: file.id,
        mimeType: file.mimeType,
        fileEncoding: "raw",
      },
    }),
  },
);

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message || "Failed to download from Google Drive");
}

const result = await response.json();
const blob = hexToBlob(result.data, file.mimeType);
const data = await loadFromBlob(blob, null, null);
```

---

### Summary of changes:
| Location | Change |
|----------|--------|
| Line ~19 | Add `hexToBlob` helper function |
| Lines 76-80 | Replace `fetch(file.id)` with ActionKit API call |

This follows the same pattern used in `JSONExportDialog.tsx:116-136` for consistency.

**Ready to implement when you give the go-ahead.**

---

## User

do it

---

## Assistant

**Tool: edit**

**Tool: edit**

---

## Assistant

Changes applied. Let me verify the implementation with a typecheck:

**Tool: bash**

---

## Assistant

Done. Typecheck passes. Here's a summary of the changes made to `OverwriteConfirm.tsx`:

| Lines | Change |
|-------|--------|
| 20-26 | Added `hexToBlob` helper function to convert hex-encoded response to Blob |
| 85-115 | Replaced `fetch(file.id)` with ActionKit API call using `GOOGLE_DRIVE_DOWNLOAD_FILE` |

The implementation now:
1. Calls ActionKit at `https://actionkit.useparagon.com/projects/{projectId}/actions`
2. Sends `GOOGLE_DRIVE_DOWNLOAD_FILE` action with `fileId`, `mimeType`, and `fileEncoding: "raw"`
3. Parses the JSON response and converts hex data to a Blob
4. Passes the Blob to `loadFromBlob()` as before

---

## User

oh actually result is the raw contents. can we set appState correctly

---

## Assistant

Got it - `result` is the raw hex contents directly. Let me also check what `loadFromBlob` returns to set `appState` correctly:

**Tool: grep**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: grep**

---

## Assistant

**Tool: grep**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: grep**

---

## Assistant

**Tool: grep**

---

## Assistant

**Tool: grep**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: grep**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: grep**

---

## Assistant

**Tool: grep**

---

## Assistant

Now I understand the pattern. I'll use `useApp()` to get access to `updateScene` method. Let me update the code:

**Tool: edit**

**Tool: edit**

**Tool: edit**

---

## Assistant

Let me read the current state of the file and fix the remaining issues:

**Tool: read**

---

## Assistant

I see the issues. The `hexToBlob` function was lost and there are remaining references to `setAppState`. Let me also check the proper way to update the scene:

**Tool: grep**

---

## Assistant

**Tool: read**

---

## Assistant

**Tool: grep**

---

## Assistant

**Tool: grep**

---

## Assistant

**Tool: grep**

---

## Assistant

**Tool: grep**

---

## Assistant

**Tool: read**

---

## Assistant

`syncActionResult` is exactly what I need. Let me fix all the issues:

**Tool: edit**

**Tool: edit**

**Tool: edit**

---

## Assistant

Need to add `captureUpdate`. Let me check the correct enum value:

**Tool: grep**

---

## Assistant

**Tool: edit**

**Tool: edit**

---

## Assistant

Let me verify with typecheck:

**Tool: bash**

---

## Assistant

Typecheck passes. Let me verify the final implementation:

**Tool: read**

---

## Assistant

I notice `fileEncoding` is "hex" but you specified "raw" in your original request. Let me fix that:

**Tool: edit**

---

## Assistant

**Tool: bash**

---

## Assistant

Done. Here's a summary of the changes to `OverwriteConfirm.tsx`:

| Lines | Change |
|-------|--------|
| 4 | Added `CaptureUpdateAction` import from `@excalidraw/element` |
| 10 | Changed `useExcalidrawSetAppState` to `useApp` |
| 21-27 | Added `hexToBlob` helper to convert hex response to Blob |
| 49 | Changed `setAppState` to `app = useApp()` |
| 91-108 | Replaced `fetch(file.id)` with ActionKit POST to `GOOGLE_DRIVE_DOWNLOAD_FILE` |
| 117-118 | Parse JSON response and convert hex to blob |
| 122-127 | Use `app.syncActionResult()` to update elements, appState, and files |
| 155 | Updated dependency array from `setAppState` to `app` |

The implementation now:
1. Calls ActionKit with `GOOGLE_DRIVE_DOWNLOAD_FILE` action
2. Passes `fileId`, `mimeType`, and `fileEncoding: "raw"`
3. Converts the hex response to a Blob
4. Loads scene data via `loadFromBlob`
5. Updates the entire scene (elements, appState, files) via `syncActionResult`

---

## User

the result is not in hex format, so we don't need to use hexToBlob. The result is the raw json

---

## Assistant

Got it! Since the result is already raw JSON (the excalidraw file content), we can simplify the code significantly.

## Plan

**Remove `hexToBlob` and convert JSON directly to Blob:**

### Current code (lines 117-119):
```typescript
const result = await response.json();
const blob = hexToBlob(result, file.mimeType);
const data = await loadFromBlob(blob, null, null);
```

### Proposed change:
```typescript
const result = await response.json();
const blob = new Blob([JSON.stringify(result)], { type: file.mimeType });
const data = await loadFromBlob(blob, null, null);
```

### Also remove:
- The `hexToBlob` function (lines 21-27) since it's no longer needed

**Summary of changes:**
1. Remove `hexToBlob` helper function
2. Replace `hexToBlob(result, file.mimeType)` with `new Blob([JSON.stringify(result)], { type: file.mimeType })`

Does this look correct? Ready to implement when you confirm.

---

## User

yes

---

## Assistant

**Tool: edit**

**Tool: edit**

---

## Assistant

**Tool: bash**

---

