# Community library / Общая библиотека

## English

The public catalog is `community/catalog-v2.json` in **Klim-git/codex-mods-lab**, fetched from the fixed HTTPS raw GitHub endpoint. No service or subscription is required. It accepts bounded [visual packages](VISUAL-MODS.md) and [declarative functional packages](FUNCTIONAL-MODS.md). The separate `community/catalog.json` remains a version-1 visual-only snapshot for older app copies. Maintainer review writes both snapshots together.

### Install and share

1. Open Settings → Mods → Community library, search by name or publisher, and choose Preview and install.
2. Filter by Visual or Functional if desired. Review the sample appearance or the action list, access description, shortcuts and exact template text, then install. The package is saved locally, initially disabled. Enable its switch in Installed. Exactly matching packages show Installed; a changed package with an existing ID is installed as a separate copy, without overwriting your work or changing enabled mods.
3. To share your own saved visual or functional mod, choose Share mod and review its metadata and preview. Confirm that you have permission to publish it.
4. Choose Continue on GitHub. A prepared issue opens in your browser. Sign in and submit it. Opening this form is not a completed publication; the app cannot inspect your browser session or report its submission status.
5. Alternatively, expand the temporary-token option to submit from the dialog. The app shows the actual issue receipt after a successful response. A classic personal access token with `public_repo` can create issues in an external public repository; this grants broad public-repository permissions. The browser form is preferable for most users. Repository maintainers may use a fine-grained token with **Issues: write** for this repository. Tokens stay only in dialog memory, go only to the fixed GitHub API endpoint, and are cleared on success/close. They are never written to preferences, the catalog cache, exports, logs or URLs.

Submission packages contain the mod's identity, name, description, author, version, and either appearance or actions, button labels, shortcuts and template text. Chat history and account settings are not collected. Check your own metadata and templates for private text or paths before sharing: their contents become public. GitHub publishes the submitting account's username on the issue. An uncertain POST response is never automatically retried; check the issues before resending.

### Maintainer review

Submissions are ordinary GitHub issues containing the marker `codex-mods-lab:submission:v1` and exactly one JSON code block. The marker accepts either package format. Review ownership, metadata, appearance or actions, and template contents before approving. Users cannot publish directly into the curated catalog.

On GitHub, open **Actions → Review community mod → Run workflow**. Choose **approve** and enter the reviewed issue number. The workflow validates the package using the same authored validators as the app, rejects script/CSS/URL fields and ID collisions, and commits a canonical snapshot of the package. **remove** removes a catalog entry by issue number. Runs are serialized; Git refuses a push if another change intervenes. Rerun from the latest branch after reviewing the failure. The workflow needs the normal `GITHUB_TOKEN` contents-write permission; branch protection may instead require a reviewed PR.

For a local review:

```text
node scripts/community_catalog.mjs --approve-issue 123
node scripts/community_catalog.mjs --validate
git diff -- community/catalog-v2.json community/catalog.json
```

This writes locally; commit and publish the reviewed change separately. `--remove-issue 123` removes that submission. No token is needed to read public issues; an optional `GITHUB_TOKEN` environment variable raises the API allowance. The script does not print it. Public issue edits never change the committed catalog automatically: approve a new snapshot to publish an update. Authors should increment the mod version. The app never auto-updates or overwrites installed mods.

### Limits and offline behavior

The catalog has at most 200 entries and 1 MiB of JSON; each package has a 64 KiB limit. Only strict metadata and appearance keys or allowlisted functional actions are accepted. Packages are included inline, so installation does not fetch user-controlled URLs. HTML is rendered as plain text, never executed. Functional actions run only on a button or shortcut: draft insertion, clipboard writing from this chat, focus or navigation. No remote screenshots, scripts, arbitrary CSS, shell commands or executable plugins are supported.

Opening the community tab refreshes the catalog with a 12-second timeout. Requests carry no account cookies or authentication. The last valid catalog is cached separately with its fetch time. Failed or invalid responses do not overwrite it; the interface marks the cached copy as offline and can still install its validated packages. A removed catalog entry may remain in an older offline cache until a successful refresh; installed packages remain local. HTTPS/GitHub repository access is the trust boundary; this version has no additional package signatures or automatic revocation.

Only the isolated app copy's CSP is extended, for `raw.githubusercontent.com` and `api.github.com` connections. Existing restrictions and archive integrity checks stay enabled.

GitHub documentation: [issue API](https://docs.github.com/en/rest/issues/issues), [token permissions and limitations](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

## Русский

Каталог хранится в `community/catalog-v2.json` нашего публичного репозитория GitHub. Отдельный сервер и подписка не нужны. Поддерживаются визуальные моды и функциональные пакеты с заданными действиями. `community/catalog.json` остаётся отдельной копией только с визуальными модами для прежних версий приложения. Проверка владельцем обновляет оба файла.

В **Настройки → Моды → Общая библиотека** найдите мод, откройте предпросмотр и установите его. В «Установленных» он появится выключенным; текущее оформление сохранится. Если ID занят изменённым модом, создаётся копия. Автоматического обновления и перезаписи ваших модов нет.

Чтобы отправить свой сохранённый мод, нажмите **«Поделиться»**, проверьте сведения и подтвердите право публикации. **«Продолжить на GitHub»** откроет готовую заявку: войдите и нажмите Submit new issue. Открытие формы само по себе ничего не публикует. Дополнительный вариант отправляет заявку прямо из окна с временным токеном; он показывает ссылку на созданную заявку после ответа GitHub. Токен хранится только в памяти открытого окна. Для чужого публичного репозитория нужен классический токен с широким правом `public_repo`; большинству пользователей удобнее форма GitHub. Владелец может использовать точный токен с Issues: write для этого репозитория.

В пакет входят сведения о моде, оформление либо действия, подписи, сочетания и тексты шаблонов. История чата и настройки аккаунта не собираются. Проверьте свои шаблоны и описание на личные данные и пути перед отправкой: их содержание станет публичным. На GitHub будет виден аккаунт автора заявки. При неопределённом результате отправка не повторяется автоматически: сначала проверьте список заявок.

Владелец проверяет права на публикацию, содержание пакета и предпросмотр. Для одобрения откройте **Actions → Review community mod → Run workflow**, выберите **approve** и номер заявки. **remove** убирает её из каталога. Валидатор отклоняет неподдерживаемые поля, скрипты, произвольный CSS и конфликты ID. В каталог записывается проверенная копия: последующее редактирование заявки не меняет её автоматически. Для обновления нужна новая проверка; автору следует увеличить версию.

Без сети доступна последняя корректная копия с датой проверки. Повреждённый ответ её не заменяет. После удаления мода владельцем старый пакет может оставаться в офлайн-копии до следующего успешного обновления. Установленные моды сохраняются локально. Ограничения: до 200 модов и 1 МиБ в каталоге, до 64 КиБ на пакет. Дополнительных цифровых подписей и автоматического отзыва пакетов пока нет.

Перед установкой функционального мода видны его действия, доступы и точный текст шаблонов. Несколько функциональных модов работают вместе с одной визуальной темой. Действия запускаются только кнопкой или сочетанием; произвольный код, команды оболочки и автоматическая отправка сообщений не поддерживаются.

Подробнее о форматах: [визуальные моды](VISUAL-MODS.md), [функциональные моды](FUNCTIONAL-MODS.md). Команды локальной проверки и условия работы GitHub Actions приведены выше.
