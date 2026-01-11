# TaskGlitch Bug Fixes Documentation

> **Version**: 1.0.0  
> **Date**: January 11, 2026  
> **Status**: All Critical Bugs Resolved ✅

---

## Summary

This document describes 5 critical bugs identified and fixed in the TaskGlitch application. All fixes have been verified through automated browser testing and manual validation.

| Bug # | Issue | Severity | Status |
|-------|-------|----------|--------|
| 1 | Double Fetch Issue | High | ✅ Fixed |
| 2 | Undo Snackbar Bug | Medium | ✅ Fixed |
| 3 | Unstable Sorting | Medium | ✅ Fixed |
| 4 | Double Dialog Opening | Medium | ✅ Fixed |
| 5 | ROI Calculation Errors | High | ✅ Fixed |

---

## Bug 1: Double Fetch Issue

### Description
The task retrieval API was called twice on page load, resulting in duplicate network requests and potentially duplicated task data in the UI.

### Root Cause
A secondary `useEffect` hook in `src/hooks/useTasks.ts` was intentionally fetching tasks and appending them to the existing state, causing data duplication.

### Fix
Removed the redundant `useEffect` hook that performed an opportunistic second fetch with `setTimeout`.

### Files Modified
- `src/hooks/useTasks.ts`

### Verification
- API called exactly once on page load (excluding React StrictMode development behavior)
- No duplicate task entries in UI
- Task count matches source data (50 tasks)

---

## Bug 2: Undo Snackbar Bug

### Description
When a task was deleted and the snackbar auto-closed (or was manually dismissed), the `lastDeleted` state was not reset. This caused subsequent undo operations to restore incorrect (stale) tasks.

### Root Cause
The `handleCloseUndo` function in `App.tsx` was an empty function that did nothing when the snackbar closed.

### Fix
1. Added `clearLastDeleted()` function to `useTasks` hook
2. Updated `TasksContext` interface to expose the new function
3. Modified `handleCloseUndo` in `App.tsx` to call `clearLastDeleted()`

### Files Modified
- `src/hooks/useTasks.ts`
- `src/context/TasksContext.tsx`
- `src/App.tsx`

### Verification
- Snackbar auto-close properly resets undo state
- Only the most recently deleted task can be restored within the active snackbar window
- No phantom data restoration after snackbar closes

---

## Bug 3: Unstable Sorting

### Description
Tasks with identical ROI and priority values randomly reordered on each re-render, causing UI flickering and inconsistent user experience.

### Root Cause
The `sortTasks` function in `src/utils/logic.ts` used `Math.random()` as a tie-breaker when ROI and priority were equal, causing non-deterministic sorting.

### Fix
Replaced the random tie-breaker with a deterministic sorting strategy:
1. Primary: ROI (descending)
2. Secondary: Priority weight (High > Medium > Low)
3. Tertiary: Title (alphabetical)
4. Final: Task ID (for guaranteed uniqueness)

### Files Modified
- `src/utils/logic.ts`

### Verification
- Tasks with same ROI and priority maintain consistent order across reloads
- No flickering or random reshuffling in the task table

---

## Bug 4: Double Dialog Opening

### Description
Clicking Edit or Delete buttons on a task row triggered both the button action AND the row's View dialog, resulting in overlapping dialogs.

### Root Cause
Event bubbling caused click events on buttons to propagate to the parent `TableRow`, which had its own `onClick` handler for opening the View dialog.

### Fix
Added `e.stopPropagation()` to the `onClick` handlers of both Edit and Delete `IconButton` components.

### Files Modified
- `src/components/TaskTable.tsx`

### Verification
- Edit button opens only the Edit dialog
- Delete button triggers deletion without opening View dialog
- Row click (outside buttons) correctly opens View dialog
- No overlapping dialogs

---

## Bug 5: ROI Calculation Errors

### Description
ROI calculations produced invalid values (`Infinity`, `NaN`, or blank) when inputs were invalid (e.g., time = 0, missing revenue, non-finite numbers).

### Root Cause
The `computeROI` function did not validate inputs and allowed division by zero and non-finite calculations to pass through.

### Fix
1. **`computeROI` function**: Added comprehensive validation
   - Checks for finite numbers
   - Prevents division by zero (time ≤ 0)
   - Rejects negative revenue
   - Returns `null` for invalid cases

2. **`ChartsDashboard.tsx`**: Fixed ROI Distribution chart to properly categorize `null`/`NaN` values into the "N/A" bucket

3. **`TaskTable.tsx`**: Updated ROI display to handle all edge cases with `Number.isFinite()` check and 2 decimal formatting

### Files Modified
- `src/utils/logic.ts`
- `src/components/ChartsDashboard.tsx`
- `src/components/TaskTable.tsx`

### Verification
- No `Infinity`, `NaN`, or blank ROI values displayed
- Valid ROI values formatted with 2 decimal places
- ROI Distribution chart correctly categorizes tasks including N/A
- Form validation prevents invalid inputs at the source

---

# Build & Deployment Bugs

The following issues were discovered when running `npm run build` for production deployment.

| Bug # | Issue | Severity | Status |
|-------|-------|----------|--------|
| 6 | Type Signature Mismatch | High | ✅ Fixed |
| 7 | Node.js Types Missing | Medium | ✅ Fixed |

---

## Bug 6: Type Signature Mismatch

### Description
Production build (`npm run build`) failed with TypeScript error: "Property 'createdAt' is missing in type".

### Root Cause
The `Task` interface requires a `createdAt` property:
```typescript
interface Task {
  id: string;
  createdAt: string;  // Required!
  // ...other fields
}
```

The `addTask` function signature used `Omit<Task, 'id'>`, which removes only `id` but still requires `createdAt`. However, `createdAt` is generated internally in `addTask`, not provided by the form.

```typescript
// What the form provides:
{ title, revenue, timeTaken, priority, status, notes }

// What Omit<Task, 'id'> expects:
{ title, revenue, timeTaken, priority, status, notes, createdAt } // ❌ Missing!
```

### Fix
Updated the type signature from:
```typescript
Omit<Task, 'id'>
```
To:
```typescript
Omit<Task, 'id' | 'createdAt'>
```

This tells TypeScript that both `id` AND `createdAt` are generated internally and not required from the caller.

### Files Modified
- `src/hooks/useTasks.ts` (interface + implementation)
- `src/context/TasksContext.tsx` (interface)
- `src/components/TaskForm.tsx` (Props interface + handleSubmit)
- `src/components/TaskTable.tsx` (Props interface + handleSubmit)
- `src/App.tsx` (handleAdd callback)

### Verification
- `tsc -b` completes without errors
- All form submissions work correctly
- Tasks receive auto-generated `id` and `createdAt` values

---

## Bug 7: Node.js Types Missing

### Description
Production build failed with errors in `vite.config.ts`:
- "Cannot find module 'node:path'"
- "Cannot find name '__dirname'"

### Root Cause
The Vite configuration file uses Node.js built-in modules:
```typescript
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),  // __dirname is Node.js global
    },
  },
});
```

TypeScript doesn't know about Node.js APIs by default. It needs the `@types/node` package to understand:
- What `path.resolve()` returns
- That `__dirname` is a valid global string variable

### Why Did Development Mode Work?
- Development runs Vite directly (Node.js handles the config)
- Build mode runs TypeScript first, which strictly type-checks all files
- `tsconfig.node.json` didn't include Node.js type definitions

### Fix
1. **Installed type definitions**:
   ```bash
   npm install -D @types/node
   ```

2. **Updated `tsconfig.node.json`**:
   ```json
   {
     "compilerOptions": {
       "types": ["node"]
     }
   }
   ```

### Files Modified
- `package.json` (new dev dependency)
- `tsconfig.node.json` (added types array)

### Verification
- `tsc -b` completes without errors
- `vite build` bundles successfully
- `dist/` folder generated and ready for deployment

---
