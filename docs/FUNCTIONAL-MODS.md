# Functional mods / Функциональные моды

## English

Functional packages add user-triggered buttons above the chat input. They declare actions implemented by the patch; package text is never executed as code. Several functional packages can run alongside one visual mod. The master switch pauses all of them.

### Workflow

Ask your AI assistant to prepare a `.codexmod.json` file using the format below. Open **Mods → Installed → Import**, review the exact actions and template text, then install. Community packages use the same preview and validator. Installation starts disabled; enable the card's switch explicitly.

Each installed card offers **Edit**, **Export**, **Share** and **Remove**, with Undo after removal. Edit opens that mod's settings: metadata, button labels, shortcut selection and template text. Save preserves its enabled state; Save and apply also enables it. Editing a public package creates local changes; publication still requires a reviewed GitHub submission. Author names, button labels and template text remain as written rather than being automatically translated.

### Package format

```json
{
  "format": "codex-mods-lab/functional",
  "formatVersion": 1,
  "mod": {
    "id": "my-explain-button",
    "version": "1.0.0",
    "name": "Explain button",
    "description": "Add an explanation request to the current draft.",
    "author": "Your public name",
    "actions": [
      {
        "id": "explain",
        "label": "Explain",
        "kind": "insert-text",
        "shortcut": "Ctrl+Alt+Shift+E",
        "text": "Explain the last answer step by step, using a concrete example."
      }
    ]
  }
}
```

Every key shown is required. No extra fields are accepted. Use `null` for an action without a keyboard shortcut.

| Action kind | Extra field | Behavior |
| --- | --- | --- |
| `insert-text` | `text` | Appends text to the existing draft, with a newline when needed. Never sends it. |
| `copy-last-response` | None | Copies plain text of the last loaded assistant response in this chat to the clipboard. |
| `focus-input` | None | Focuses this chat's input. |
| `scroll-chat` | `target`: `first` or `last` | Scrolls to the first or last loaded message in this chat. |

Limits: 64 KiB of UTF-8 JSON, 1–8 actions per package, up to 8,000 characters per template, name up to 80 characters, description up to 200, author up to 60 and button label up to 60. Package IDs contain 1–80 ASCII letters, digits, underscores or hyphens and start with a letter or digit; action IDs use the same rule with a 40-character limit. IDs and non-null shortcuts must be unique within the package. Versions have three numeric components, with at most four digits per component.

Available shortcuts are **Ctrl+Alt+Shift+A** through **Ctrl+Alt+Shift+Z**, matched by physical key code. If enabled packages assign the same shortcut, their buttons remain available and that conflicting keyboard binding is disabled. Tooltips explain the conflict. Shortcuts are scoped to the focused chat and paused while a modal is open. Your operating system can reserve or intercept a key combination.

### Access and boundaries

The preview derives an access description from the declared actions: current-chat response text and clipboard writing, draft insertion, or navigation/focus. Packages cannot read the clipboard, execute JavaScript or shell commands, fetch URLs, run on load, change account settings or send messages automatically. The implementation uses the current chat's visible editor and loaded message elements. It does not fetch earlier history or target another chat panel. Copying strips message control buttons and uses plain text; rich content fidelity is limited.

Export and publication include metadata, actions, labels, shortcuts and template text. They exclude chat history, account preferences, installed/enabled status and bookmarks. **Anything you put into a template is part of the shared package**: check for private text before sharing. The submitting GitHub account is public. See [community review](COMMUNITY.md) and [verification notes](TESTING.md).

Functional packages are fixed declarative actions. Arbitrary executable plugins and external integrations need a separate execution and permissions design and are outside this format.

## Русский

Функциональный пакет добавляет кнопки над полем ввода чата. Он описывает действия, которые выполняет сам патч; текст пакета не исполняется как код. Несколько таких модов работают одновременно с одной визуальной темой. Общий переключатель приостанавливает все моды.

Попросите нейросеть подготовить `.codexmod.json` по образцу выше. Откройте **Моды → Установленные → Импорт**, проверьте действия и точный текст шаблонов, затем установите пакет. В общей библиотеке используется та же проверка. После установки мод выключен; включите его переключателем в карточке.

В карточке доступны редактирование, экспорт, публикация и удаление с отменой. В настройках меняются сведения о моде, подписи кнопок, тексты шаблонов и сочетания. «Сохранить» сохраняет текущее состояние включения; «Сохранить и применить» также включает мод. Названия и шаблоны автора автоматически не переводятся. Изменения установленного пакета остаются локальными; для публикации нужна проверенная заявка GitHub.

Поддерживаются четыре действия:

- `insert-text`: добавить поле `text` к существующему черновику. Отправку выполняет пользователь.
- `copy-last-response`: скопировать последний загруженный ответ текущего чата в буфер обмена.
- `focus-input`: поставить курсор в поле ввода этого чата.
- `scroll-chat`: перейти к первому или последнему загруженному сообщению, указав `target`: `first` или `last`.

Формат и обязательные поля показаны выше. Лишние поля отклоняются. Сочетание можно отключить значением `null`. Ограничения: 64 КиБ UTF-8 JSON, 1–8 действий, до 8 000 символов в каждом шаблоне. Название — до 80, описание — до 200, автор и подпись кнопки — до 60 символов. ID пакета — до 80, действия — до 40 символов: латинские буквы, цифры, `_` и `-`, первый символ — буква или цифра. Версия состоит из трёх числовых частей до четырёх цифр каждая. ID действий и назначенные сочетания внутри пакета должны различаться.

Сочетания: **Ctrl+Alt+Shift+A…Z**, по физической клавише. При совпадении сочетаний у включённых модов кнопки работают, конфликтующее сочетание отключается; в подсказке указана причина. Горячие клавиши действуют в текущем чате с фокусом и приостанавливаются в модальных окнах. Некоторые сочетания может перехватывать операционная система.

Предпросмотр показывает необходимые действия и доступ: текст текущего ответа и запись в буфер обмена, добавление черновика или навигация. Пакеты не читают буфер обмена, не исполняют JavaScript и команды оболочки, не открывают произвольные URL, не запускаются при загрузке и не отправляют сообщения автоматически. Навигация использует только загруженные сообщения, без подгрузки старой истории. Копируется простой текст без кнопок сообщения; сложное форматирование может теряться.

В экспорт и заявку входят описание, действия, подписи, сочетания и тексты шаблонов. История чата, настройки аккаунта, состояние включения и закладки не входят. **Всё, что записано в шаблоне, будет частью опубликованного пакета** — проверьте его перед отправкой. Аккаунт автора заявки GitHub будет виден публично. Подробнее: [общая библиотека](COMMUNITY.md), [проверки](TESTING.md).
