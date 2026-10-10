"""An explicit registry of reviewed app adapters. Never select by resemblance."""
from . import codex_26_1007_21434 as current_adapter

ADAPTERS = (current_adapter,)


def select_adapter(app_version, archive_sha256):
    matches = [adapter for adapter in ADAPTERS
               if adapter.SUPPORTED_VERSION == app_version
               and adapter.SUPPORTED_ASAR_SHA256 == archive_sha256]
    if len(matches) != 1:
        raise RuntimeError('Unsupported app version/archive: no reviewed adapter. No files were changed.')
    return matches[0]
