# Verification notes

Tested on Windows with application version **26.1007.21434**, Store package **26.1007.2314.0 x64**, on **2026-10-10**.

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

These checks describe the experiment used to develop the authored modules. Publication packaging verifies a fresh locally built archive. Private chats, profiles, raw diagnostics, and application bundles are not published.

## Automated checks

- Preferences: migration, validation, per-mod reset, persistence across remounts, and recovery when local storage is blocked or corrupt.
- Localization: native app locale detection, explicit overrides, live locale changes, matching translation keys/placeholders, number formatting, storage migration, translated errors, and preservation of custom bookmark titles and stable shortcut values.
- Context bar: last-report token math, thresholds, unknown data, per-chat selection, and disabled states.
- Bookmarks: add/remove/rename, conversation isolation, duplicate protection, atomic storage failure, migration, shortcut matching, and disabled states.
- Builder: refusing overlapping or unrelated output folders; preserving synthetic archive payload and unchanged entry metadata while updating modified entries and hashes. Symlink checks may be skipped on Windows when symlink privileges are unavailable.
- Optional native integration: settings navigation/search/deep links, composer insertion, native message keys, local/ChatGPT older-history adapters, and launch profile guard.
- Full local copy verification: only eight original archive entries modified and six modules added; remaining metadata and the complete original payload preserved; executable changed only to refresh the archive header hash; original source archive unchanged.

The rail helper is appended to an existing bundle. The sixth added module contains localization. Native integration also checks that the host's memoized Settings navigation and search refresh when the mod language changes. Full verification does not inspect chats or authentication storage.

## Remaining coverage

Live ChatGPT history navigation has not been verified. Reported context usage is not a guarantee of the application's exact compaction threshold. Other app builds and platforms remain unsupported. Automated component adapters are not a replacement for live UI checks after porting to a new version.
