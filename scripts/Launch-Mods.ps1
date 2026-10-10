param([switch]$VerifyOnly, [switch]$SafeMode)
$ErrorActionPreference = 'Stop'
$modsRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$modsExecutable = Join-Path $modsRoot 'app/ChatGPT.exe'
$modsUserData = Join-Path $modsRoot 'app-data'
$modsCodexHome = Join-Path $modsRoot 'codex-home'
$modsManifestPath = Join-Path $modsRoot 'copy-manifest.json'
if (-not (Test-Path -LiteralPath $modsExecutable) -or -not (Test-Path -LiteralPath $modsManifestPath)) {
    throw 'The Mods Lab app copy is incomplete. Rebuild it with scripts/build_copy.py.'
}
foreach ($modsDirectory in @($modsUserData, $modsCodexHome, (Join-Path $modsRoot 'logs'))) {
    if (-not (Test-Path -LiteralPath $modsDirectory)) { New-Item -ItemType Directory -Path $modsDirectory | Out-Null }
}
if ($VerifyOnly) {
    [PSCustomObject]@{ Executable = $modsExecutable; UserData = $modsUserData; CodexHome = $modsCodexHome; OriginalProfileUsed = $false; SafeMode = [bool]$SafeMode }
    return
}
$modsExisting = @(Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -eq $modsExecutable -and $_.CommandLine -notmatch '--type=' })
if ($modsExisting.Count -gt 1) { throw 'Multiple Mods Lab instances detected. Close them before launching.' }
if ($modsExisting.Count -eq 1) {
    $modsExistingSafe = $modsExisting[0].CommandLine -match '(?:^|\s)--mods-lab-safe-mode(?:\s|$)'
    if ($modsExistingSafe -ne [bool]$SafeMode) { throw 'Close the current Mods Lab windows before switching between normal launch and Safe Mode.' }
}
$modsStart = New-Object System.Diagnostics.ProcessStartInfo
$modsStart.FileName = $modsExecutable
$modsStart.WorkingDirectory = Join-Path $modsRoot 'app'
$modsStart.UseShellExecute = $false
$modsStart.Arguments = '--user-data-dir="' + $modsUserData + '" --enable-logging --log-file="' + (Join-Path $modsRoot 'logs/native-startup.log') + '" codex://settings/mods'
if ($SafeMode) { $modsStart.Arguments += ' --mods-lab-safe-mode' }
# Set variables only in the new child process; the current app keeps its own environment.
$modsStart.EnvironmentVariables['KLIMENT_MODS_LAB_ROOT'] = $modsRoot
$modsStart.EnvironmentVariables['CODEX_ELECTRON_USER_DATA_PATH'] = $modsUserData
$modsStart.EnvironmentVariables['CODEX_HOME'] = $modsCodexHome
$modsStart.EnvironmentVariables['KLIMENT_MODS_LAB_SAFE_MODE'] = $(if ($SafeMode) { '1' } else { '0' })
$modsProcess = [System.Diagnostics.Process]::Start($modsStart)
if ($modsProcess.WaitForExit(1500)) {
    if ($modsProcess.ExitCode -eq 0) { Write-Output 'Request sent to the existing Mods Lab instance.'; return }
    throw ('Mods Lab exited during startup. Code: ' + $modsProcess.ExitCode + '. See logs/native-startup.log.')
}
Write-Output ('Mods Lab started. PID: ' + $modsProcess.Id)
