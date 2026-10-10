# Verification notes

Tested on Windows with application version **26.1007.21434**, Store package **26.1007.2314.0 x64**, on **2026-10-10–11**.

## Live UI checks on the original experiment copy

- The Mods tab opens from Settings and the left navigation rail; the navigation item shows its active state.
- Each of the two mods has a compact card. Individual settings are hidden initially and expand without changing saved preferences.
- Context usage is read from native local-chat statistics; the warning and master/individual switches work.
- Local-chat bookmarks can be added, renamed, removed, opened with Ctrl+Alt+K, and used to navigate to a message.
- Hiding message icons retains access to the bookmark list.
- Preferences and bookmarks persisted after closing and restarting the test copy.
- English and Russian labels switch immediately in the Mods page, navigation rail, native Settings item, context bar, and bookmark controls. English selection persisted after restarting the copy; Automatic restored Russian with the host app's Russian locale.
- Expanded context and bookmark settings, the English Ctrl+Alt+K dialog, and bookmark renaming/navigation were checked in the separate test copy. Public screenshots use a neutral demo conversation.
- The original installation archive hash and executable signature remained unchanged.

## Live visual-library checks

- Installed lists both built-in mods and custom visual cards; the selected inner tab is marked visibly.
- Created an Ocean package in the editor; changing a preset updated the sample conversation before saving. Save and apply added a card and changed actual chat messages.
- Export downloaded a `.codexmod.json` file to Downloads. Its metadata and appearance were inspected; it contains no transcript, bookmarks, profile or account data.
- Imported that exact downloaded file through the Windows file picker, reviewed the package, and installed a copy. The original ID/name and active selection were preserved; the copy started disabled.
- The complete library, selected visual mod and English language override survived rebuilding/restarting the same isolated copy. Automatic restored Russian labels, retaining custom names.
- Edited the imported copy into Paper. Its light message background, dark text and native response buttons were checked in the actual local demo chat, alongside the existing context bar and bookmark count.
- Checked the editor in English and Russian. Context and bookmark settings still start collapsed. The test profile was retained; the original app archive and executable signature were unchanged.

Live checks used a neutral local conversation. Rich attachments and live ChatGPT conversation styling have not been exhaustively checked. The native selectors for both local and ChatGPT messages are covered by integration checks.

## Live community-library checks

- The current page has only Installed and Community library. The Create mod button and separate editor tab were removed; AI-authored packages enter through Import. Appearance editing remains available on each custom card.
- The isolated copy fetched the public GitHub catalog and displayed Ocean, Paper and Violet. Searching for Violet filtered the cards; its preview showed the package before installation.
- Installed Violet from that catalog, initially disabled. The active local Paper package and existing built-in preferences were preserved. Violet and the active selection survived rebuilding and restarting the copy.
- Removed Violet from its card and restored it with Undo removal. The installed count changed from five to four and back to five; the active Paper package stayed selected.
- Opened Share from the installed card. Checked metadata, preview and publication consent; the GitHub route is disabled until consent is selected. After consent, the system browser opened a new GitHub issue form with the exact Violet title and JSON package prefilled. Browser links use the host application's native open-in-browser message to open the system browser explicitly; ordinary anchors may open the isolated built-in browser without an existing GitHub session. The test form was closed without publishing a duplicate issue.
- Live tests did not submit a real personal access token or create a duplicate public issue. Direct submission responses and maintainer approval are covered by the automated checks; a live approval workflow run remains outstanding.

These checks describe the experiment used to develop the authored modules. Publication packaging verifies a fresh locally built archive. Private chats, profiles, raw diagnostics, and application bundles are not published.

## Live functional-library checks

- The isolated copy fetched the public version-2 catalog with six packages. The Functional filter showed Reply tools, Prompt templates and Chat navigation. The legacy visual-only catalog remains available to older copies.
- Preview listed derived access descriptions, action labels, shortcut values and exact template text. Installed Reply tools and Prompt templates from GitHub; both started disabled. Enabling both retained the active Paper theme, context meter and existing bookmark.
- In the neutral local demo chat, Focus input placed the caret in the native editor; Copy reply reported successful clipboard writing. Summarize appended the template after an existing test draft and updated the native input without sending a message.
- Ctrl+Alt+Shift+E appended the Explain template without replacing the draft. Windows injected input can omit `KeyboardEvent.code`; a tested Latin/Russian letter fallback handles that case, while an available physical code takes priority.
- Opened the functional settings from the card, changed Summarize to Summary and saved. Reopening the editor after the final rebuild retained Summary, both installed packages and their enabled states. Turning the master switch off removed the functional toolbar, context meter, bookmarks and visual styling in the chat; turning it back on restored the enabled selections.

All live functional checks used authored starter packages and a neutral test draft. Live ChatGPT conversation actions and rich-message copy fidelity remain unverified. No generated template was sent to the assistant during these checks.

## Automated checks

- Preferences: migration, validation, per-mod reset, persistence across remounts, and recovery when local storage is blocked or corrupt.
- Localization: native app locale detection, explicit overrides, live locale changes, matching translation keys/placeholders, number formatting, storage migration, translated errors, and preservation of custom bookmark titles and stable shortcut values.
- Context bar: last-report token math, thresholds, unknown data, per-chat selection, and disabled states.
- Bookmarks: add/remove/rename, conversation isolation, duplicate protection, atomic storage failure, migration, shortcut matching, and disabled states.
- Builder: refusing overlapping or unrelated output folders; preserving synthetic archive payload and unchanged entry metadata while updating modified entries and hashes. Symlink checks may be skipped on Windows when symlink privileges are unavailable.
- Optional native integration: settings navigation/search/deep links, composer insertion, native message keys, local/ChatGPT older-history adapters, and launch profile guard.
- Visual mods: strict portable package validation, bounds and injection rejection, imports disabled by default, duplicate protection, atomic save failures, separate storage, editor preview/cancel/save, export round-trip, importing copies, and runtime pause/corrupt-library fallback.
- Community library: strict catalog and package validation, bounded downloads, fixed HTTPS destinations, offline cache retention, search, preview/install, duplicates without overwriting active mods, public submission parsing/approval, ID ownership collisions, token rejection/no persistence, and no automatic retries after an uncertain public write.
- Functional mods: strict declarative action schemas and text limits, rejecting code/shell/URL hooks, compact export near the package limit, mixed and legacy catalogs, separate storage, combined 50-package limit before writes, concurrent enable, rollback/undo, cross-kind ID collisions, reviewed publication, editor cancel/save/export, scoped response copy/navigation, draft preservation, shortcut matching and conflicts, and paused/corrupt-library fallback.
- Full local copy verification: only nine original archive entries modified and fourteen modules added; remaining metadata and the complete original payload preserved; executable changed only to refresh the archive header hash; original source archive unchanged. The additional original entry is the HTML CSP, allowing only the two GitHub connection origins needed by the community library.

The rail helper is appended to an existing bundle. Added modules include localization, the visual and community libraries, functional storage/runtime and the shared package adapter. Native integration checks that both the context meter and functional toolbar mount alongside the original composer content, and that the host's memoized Settings navigation and search refresh when the mod language changes. Full verification does not inspect chats or authentication storage.

## Remaining coverage

Live ChatGPT history navigation has not been verified. Reported context usage is not a guarantee of the application's exact compaction threshold. Other app builds and platforms remain unsupported. Automated component adapters are not a replacement for live UI checks after porting to a new version.
