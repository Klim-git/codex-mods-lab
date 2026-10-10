# Verification notes

Tested on Windows with application version **26.1007.21434**, Store package **26.1007.2314.0 x64**, on **2026-10-10**.

## Live UI checks on the original experiment copy

- The Mods tab opens from Settings and the left navigation rail; the navigation item shows its active state.
- Each of the two mods has a compact card. Individual settings are hidden initially and expand without changing saved preferences.
- Context usage is read from native local-chat statistics; the warning and master/individual switches work.
- Local-chat bookmarks can be added, renamed, removed, opened with Ctrl+Alt+K, and used to navigate to a message.
- Hiding message icons retains access to the bookmark list.
- Preferences and bookmarks persisted after closing and restarting the test copy.
- The original installation archive hash and executable signature remained unchanged.

These checks describe the experiment used to develop the authored modules. Publication packaging also compares the generated patch entries with that experiment and verifies a fresh locally built archive. Personal screenshots, profiles, raw diagnostics, and application bundles are not published.

## Automated checks

- Preferences: migration, validation, per-mod reset, persistence across remounts, and recovery when local storage is blocked or corrupt.
- Context bar: last-report token math, thresholds, unknown data, per-chat selection, and disabled states.
- Bookmarks: add/remove/rename, conversation isolation, duplicate protection, atomic storage failure, migration, shortcut matching, and disabled states.
- Builder: refusing overlapping or unrelated output folders; preserving synthetic archive payload and unchanged entry metadata while updating modified entries and hashes. Symlink checks may be skipped on Windows when symlink privileges are unavailable.
- Optional native integration: settings navigation/search/deep links, composer insertion, native message keys, local/ChatGPT older-history adapters, and launch profile guard.
- Full local copy verification: only eight original archive entries modified and five modules added; remaining metadata and the complete original payload preserved; executable changed only to refresh the archive header hash; original source archive unchanged.

The rail helper is appended to an existing bundle, rather than added as a sixth archive module. Full verification does not inspect chats or authentication storage.

## Remaining coverage

Live ChatGPT history navigation has not been verified. Reported context usage is not a guarantee of the application's exact compaction threshold. Other app builds and platforms remain unsupported. Automated component adapters are not a replacement for live UI checks after porting to a new version.
