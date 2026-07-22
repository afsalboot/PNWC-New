param(
    [switch]$AllowUnsigned
)

$ErrorActionPreference = "Stop"

if (-not $env:CAP_SERVER_URL -or -not $env:CAP_SERVER_URL.Trim()) {
    throw "Set CAP_SERVER_URL to the live PNWC web app URL before building the mobile release."
}

$keystorePath = "C:\Users\User\release-key.jks"
if (-not (Test-Path -LiteralPath $keystorePath)) {
    throw "Release keystore was not found at $keystorePath."
}

$keystorePropertiesPath = Join-Path "android" "keystore.properties"
$keystoreValues = @{}
if (Test-Path -LiteralPath $keystorePropertiesPath) {
    foreach ($line in Get-Content -LiteralPath $keystorePropertiesPath) {
        if ($line -match "^\s*([^#][^=]+?)\s*=\s*(.*)$") {
            $keystoreValues[$matches[1].Trim()] = $matches[2].Trim()
        }
    }
}

$hasSigning =
    (($keystoreValues["storePassword"]) -or $env:PNWC_RELEASE_STORE_PASSWORD) -and
    (($keystoreValues["keyAlias"]) -or $env:PNWC_RELEASE_KEY_ALIAS) -and
    (($keystoreValues["keyPassword"]) -or $env:PNWC_RELEASE_KEY_PASSWORD)

if (-not $hasSigning -and -not $AllowUnsigned) {
    throw "Add storePassword, keyAlias, and keyPassword to android\keystore.properties or set PNWC_RELEASE_* environment variables."
}

& powershell.exe -ExecutionPolicy Bypass -File ".\scripts\generate-android-icons.ps1"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& npx.cmd cap sync android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Push-Location "android"
try {
    & .\gradlew.bat assembleRelease --no-daemon --max-workers=2
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}
