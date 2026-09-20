# OnlyWL rebrand and cleanup

## What will change
- Replace user-facing `onlyw` branding with `OnlyWL` in the app title, metadata, package details, documentation, and desktop build name.
- Replace the startup text logo with the supplied OnlyWL logo while preserving the existing centered layout and transitions.
- Create a small, optimized favicon from the supplied logo and reference it from the app.
- Create Windows icon resources from the supplied logo and configure the packaged `.exe` to use them instead of Electron's default icon.
- Remove nonessential Lovable-named comments, helper code, metadata, and generated traces where they do not affect operation.
- Keep the Lovable build configuration package because the current TanStack project depends on it to build and preview correctly.

## Validation
- Search the full source tree again for remaining Lovable and old-brand references, documenting anything retained because it is required.
- Verify the preview at desktop and mobile sizes, including startup, saved groups, browsing, and Pomodoro controls.
- Build a clean Windows ZIP, inspect its executable icon/resources, and test-launch the equivalent packaged app locally.

## Technical details
- Rename internal `onlyw` identifiers and folders only where safe; preserve existing stored group data and the `persist:onlyw` browser partition so users do not lose saved groups, cookies, or signed-in sessions.
- Keep required framework telemetry/error plumbing if removing it would break preview diagnostics or runtime behavior, but remove visible Lovable branding and optional references.
