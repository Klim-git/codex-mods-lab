# Build adapters / Адаптеры сборок

## English

The builder now separates copy/archive handling from native app bindings. One adapter is registered: **codex-windows-26.1007.21434**, API version **1**, for the exact archive hash listed in the README. This extraction does not add support for another build.

| Layer | Responsibility |
| --- | --- |
| `scripts/build_copy.py` | Validate paths, select the adapter, preserve archive payload, create the isolated copy and manifest. |
| `scripts/adapters/__init__.py` | Register adapters and select exactly one matching app version and original archive SHA-256. Unknown or ambiguous matches fail before output is written. |
| `scripts/adapters/codex_26_1007_21434.py` | Native bundle paths, replacement anchors, Settings/composer/message hooks and CSP changes for this build. |
| `scripts/adapters/codex_26_1007_21434_rail.js` | Map this build's native rail/router controls to the generic Mods shortcut. |
| `src/jarvis-host-adapter.js` | Map this build's bundled React, components, hooks, token statistics and host dispatcher to descriptive exports. The Python adapter supplies this paired bridge. |
| `src/jarvis-mods-core.js` | Choose normal loading or recovery before importing mod runtimes; preserve native content if a mod component fails. |

Generic mod modules import the host bridge instead of a hashed native bundle. Safe Mode uses a minimal recovery manager. A trusted preload exposes only a frozen session flag through `contextBridge`; it does not expose Node, filesystem or terminal APIs. The core latches the flag for the renderer session, independently of saved preferences.

To port another build, add a separate Python adapter and its paired host/rail bridges, with the verified version/hash and all exact anchors. Register it, run the archive and native integration checks, then verify normal and Safe Mode in a fresh isolated copy. Keep package/UI modules independent of native export names. Do not loosen the hash check or reuse an adapter on a similar-looking bundle. An existing output belongs to its source build; use a new output directory when changing builds.

The bridge is an internal contract, not a stable public SDK. Lifecycle, event subscriptions, permission brokers and isolated executable extensions remain future work. The current host bindings and one adapter have live verification; future adapters need their own live checks.

## Русский

Копирование приложения и работа с архивом отделены от привязок к конкретной сборке. Зарегистрирован один адаптер: **codex-windows-26.1007.21434**, версия API **1**, с точным хешем исходного архива из README. Поддержка других версий пока не добавлена.

Общий сборщик выбирает адаптер по версии и SHA-256. Неизвестная или неоднозначная сборка отклоняется до записи результата. Пути бандлов, точки замены и встраивание в настройки, поле ввода и сообщения находятся в `scripts/adapters/`. Парный `src/jarvis-host-adapter.js` переводит внутренние имена экспортов в понятный контракт. Остальные модули модов используют этот мост.

`jarvis-mods-core.js` решает, загружать моды или открыть восстановление. В Safe Mode минимальный preload передаёт только неизменяемый флаг сеанса через `contextBridge`; доступа к Node, файлам или терминалу он не добавляет. Флаг фиксируется на весь сеанс и не меняет сохранённые предпочтения.

Для новой версии нужен отдельный адаптер с проверенными хешем, версией и точками замены, а также парные мосты к компонентам и панели навигации. После автоматических проверок необходимо проверить обычный запуск и Safe Mode в новой отдельной копии. Ослаблять проверку хеша или выбирать адаптер по сходству бандлов не следует. При переходе на другую сборку используйте новую папку вывода.

Это внутренний контракт проекта. Публичный SDK, управление разрешениями и изоляция исполняемых расширений ещё не реализованы.
