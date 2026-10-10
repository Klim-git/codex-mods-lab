# Codex Mods Lab

[Русский](README.ru.md)

An unofficial UI patch for the Windows Codex desktop app. Adds a **Моды** (Mods) tab directly to Settings, a shortcut on the left navigation rail, and compact cards with expandable settings for each mod.

The repository contains our patch sources and build tools. You supply your own installed application; the builder creates a separate local copy. No application binaries, bundled application sources, chats, credentials, or profiles are distributed here. The patch UI currently uses Russian labels.

## Included mods

| Mod | What it does |
| --- | --- |
| Context bar | Shows used and remaining context from the app's native token statistics. Optional warning at 70%, 80%, 90%, or 95%. |
| Message bookmarks | Save, rename, remove, and jump to messages in the current chat. Open the bookmark list with **Ctrl+Alt+K**; choose **Alt+B** or disable the shortcut in Settings. Message icons can be hidden independently. |

The master switch starts **off**. Open Settings → **Моды** and enable it; each card has its own controls and reset button. Preferences and bookmarks are saved locally in the test copy's profile. They do not synchronize between devices.

## Screenshots

Captured from the separate Windows test copy. The mod interface currently uses Russian labels; the descriptions below explain the controls in English.

### Mods in Settings

The **Моды** (Mods) tab and navigation shortcut open a page with a master switch and one card per mod. Select **Настроить** (Configure) to expand that mod's settings.

![Mods tab in Settings with separate cards for the context bar and message bookmarks](https://github.com/user-attachments/assets/c8194027-c9ba-4864-934e-3422dd2c1838)

### Context bar

The meter sits above the message input. This example shows **13% used and 87% remaining**, based on the conversation's last native token report. The warning threshold is configurable in the mod's card.

![Context bar above the message input showing 13 percent used and 87 percent remaining](https://github.com/user-attachments/assets/e1987867-c3dc-468f-85e2-4e55f15be0ec)

### Message bookmarks

Open the current chat's saved messages from its **Закладки** (Bookmarks) button or with **Ctrl+Alt+K**. Select a bookmark to jump to the message, or use **Переименовать** (Rename) and **Удалить** (Remove).

![Bookmark list with a saved assistant response, a custom title, and rename and remove controls](https://github.com/user-attachments/assets/33833b0b-abf1-4cf9-8dd9-b84d99d26857)

## Compatibility

This first release supports only the tested Windows build:

- Application version inside `app.asar`: **26.1007.21434**.
- Tested Microsoft Store package: **OpenAI.Codex 26.1007.2314.0 x64**.
- Original `resources/app.asar` SHA-256: `c5fdef328cfa2ad9095786f9c3a7aaa447e68834d31299d6ef2592da02029038`.

The builder checks the archive hash, application version, and every replacement anchor before writing output. It refuses other builds rather than guessing at changed internal bindings. Updating Codex may require a new version of this patch. macOS, Linux, and the web app are not supported.

## Install

Requirements: Windows, an installed compatible Codex app, **Python 3.10+**, and about **3 GB** of free space. No Python dependencies are needed. Node.js 20+ is needed only for development tests.

Download this repository using **Code → Download ZIP**, then extract it, or clone it:

```powershell
git clone https://github.com/Klim-git/codex-mods-lab.git
cd codex-mods-lab
python scripts/build_copy.py
python scripts/verify_copy.py
```

The builder detects your installed Store package and writes the copy into `.mods-lab`. If `python` is unavailable but the Windows Python launcher is installed, use `py -3` instead.

If auto-detection cannot find the installation, specify its **app** directory:

```powershell
python scripts/build_copy.py --source-app "C:\path\to\Codex\app"
```

Start the copy with `.mods-lab\Launch-Mods.cmd`, or from PowerShell:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .mods-lab/Launch-Mods.ps1
```

It opens the Mods tab. Use the launcher: starting the copied executable directly is rejected by the profile isolation guard. The test window has a **Моды (тест)** suffix. Close the test copy before rebuilding it.

Use `--output "D:\CodexModsLab"` for another new directory. Existing folders containing unrelated files and paths overlapping the original installation are rejected. To prepare local patch previews without copying the app, use `--patch-only`; generated application bundles stay in the ignored output directory.

## What isolation means

The original installation is read without being patched. The copied app receives its own `app-data`, `codex-home`, and `logs` directories. The builder does not copy the original user's chats, authentication files, or configuration, and the launcher sets profile environment variables only for its child process. Automatic updates are disabled in the copy.

Local profile separation does not create a separate online account. Signing into the same account can expose the same cloud data, and the application may reuse operating-system authentication. This is an experiment copy, not a security sandbox.

Patching the archive also requires changing its embedded checksum in the copied executable. Archive integrity validation stays enabled, but this change invalidates the copy's original Authenticode signature. The original executable stays unchanged. This project is independent of OpenAI and does not distribute a signed application or installer.

## Limitations

- The context bar reads the last native token-usage report for local Codex conversations, not a cumulative sum of every turn. It is an indication of reported usage, not an exact prediction of when compaction will occur. Other conversation types or missing statistics show an unknown state.
- Live testing covered local Codex chats. ChatGPT bookmark rendering and older-history navigation adapters have automated checks; a live ChatGPT history check remains outstanding.
- Bookmarks belong to a local conversation identity. If the message or conversation is removed, the saved bookmark may no longer be navigable.
- Internal application bindings are version specific. There is no general third-party mod API here.

## Development and verification

```powershell
python -m unittest discover -s tests -p test_builder.py
node tests/run.mjs
```

These checks use authored modules and synthetic archives. They do not need Codex or redistributed application fixtures. Native integration checks additionally need a local preview built with the supported application, using the default output directory:

```powershell
python scripts/build_copy.py --patch-only
$env:CODEX_MODS_INTEGRATION = '1'
node tests/run.mjs
Remove-Item Env:CODEX_MODS_INTEGRATION
```

See [verification notes](docs/TESTING.md) for what was checked. Keep generated copies, profiles, logs, and patched application bundles out of commits; they are covered by `.gitignore`. Before reporting a bug, remove chat content, local paths, and authentication information from any diagnostic material.

## Related work and license

[Codex++](https://github.com/b-nnett/codex-plusplus) has a similar idea of extending the desktop UI and Settings. This is an independent implementation of our Mods tab, context bar, and bookmark workflow; it is not a claim to have invented a mods section.

Our authored patch and tooling are available under the [MIT license](LICENSE). The license does not cover the original Codex application, its assets, or generated copies of its bundles.
