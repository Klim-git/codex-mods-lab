# Local visual mods

This foundation runs inside the isolated Windows test copy. Open **Settings → Mods**.

The same library also accepts [functional mods](FUNCTIONAL-MODS.md). This document describes the existing visual format, which stays compatible. One visual mod and several functional packages can be enabled together; their saved libraries are separate.

- **Installed** contains the built-in context bar and bookmarks, plus your visual mods. Import packages prepared by an AI assistant, then edit, enable, disable, export, share or remove a custom mod from its card. Removal offers an Undo button until you leave the page. Only one visual mod is active at a time; selecting another keeps all packages installed.
- **Edit** on a custom card opens appearance settings with a live preview: message backgrounds, an accent on user messages and the context meter, text size, corner radius, and maximum message width. Emerald, Ocean, Violet and Paper presets are included. The sample conversation updates immediately. **Save** stores the package; **Save and apply** also selects it. **Cancel** discards the draft. The master switch must be on for a selected mod to affect chats. There is no separate Create button or editor tab.
- **Import mod** accepts a local `.codexmod.json` file or pasted package JSON. Review the name, author and preview, then install. Imports start disabled. If the ID is already installed, **Install a copy** assigns a new ID and retains the original.
- **Export mod** downloads a JSON file or copies the portable package to your clipboard. In the tested copy, file downloads go to the Windows Downloads folder.

The library and active selection are stored locally in the isolated profile under `kliment.mods.lab.visual-library.v1`. Existing context and bookmark preferences retain their separate storage. Rebuilding the same test directory preserves the profile. Local imports need no account; shared packages are available through the separate [community library](COMMUNITY.md).

## Package format

The package contains metadata and validated appearance values. It excludes chat content, bookmarks, authentication and host-app code. Version 1 does not accept JavaScript, raw CSS, URLs, external assets or extra properties. Packages are limited to 64 KiB; up to 50 custom mods can be installed.

```json
{
  "format": "codex-mods-lab/visual",
  "formatVersion": 1,
  "mod": {
    "id": "my-ocean",
    "version": "1.0.0",
    "name": "My Ocean",
    "description": "A quiet blue chat theme",
    "author": "",
    "appearance": {
      "accent": "#79b8ff",
      "surface": "#202935",
      "fontSize": 15,
      "cornerRadius": 16,
      "contentWidth": 800
    }
  }
}
```

Colors use six-digit hexadecimal notation. Integer ranges: font size 12–22 px, corners 0–28 px, maximum width 600–1200 px. The editor offers common values; the loader accepts every integer in these ranges. Text color is chosen automatically for the message background. Width contracts to the available space in narrow windows.

The host's native token-warning colors are retained. Styling applies to user/assistant message wrappers and the mod controls; other app pages retain their native layout. This format supports visual mods only. Executable mods and a shared online library require a separate design.

## По-русски

В тестовой копии откройте **Настройки → Моды**. В разделе **«Установленные»** находятся встроенные и свои моды. Нейросеть готовит пакет, который добавляется через **«Импорт мода»**. В карточке пользовательского мода доступны редактирование оформления с предпросмотром, экспорт, публикация и удаление с отменой. Отдельной кнопки создания и вкладки редактора нет. Можно менять фон сообщений, акцент, размер текста, скругления и ширину. **«Сохранить и применить»** выбирает оформление для чатов; **«Отмена»** оставляет сохранённую библиотеку прежней. Общий переключатель должен быть включён.

Через **«Экспорт мода»** сохраните файл или скопируйте пакет. **«Импорт мода»** принимает файл `.codexmod.json` либо вставленный JSON, показывает предпросмотр и устанавливает мод выключенным. Для уже установленного ID предлагается копия. Одновременно работает один визуальный мод, остальные сохраняются в библиотеке. Переписка, закладки и данные аккаунта в пакет не попадают.

Это локальная основа библиотеки: обмен пакетами уже работает, общий сетевой каталог пока не подключён.
