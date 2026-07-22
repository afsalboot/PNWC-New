param(
    [string]$Source = "public\Logo.jpeg",
    [string]$AndroidRes = "android\app\src\main\res"
)

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path "."
$sourcePath = Resolve-Path $Source
$resPath = Resolve-Path $AndroidRes

function New-LauncherIcon {
    param(
        [string]$OutputPath,
        [int]$Size,
        [int]$PaddingPercent
    )

    $sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
    try {
        $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            try {
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $graphics.Clear([System.Drawing.Color]::White)

                $maxSide = [int]($Size * (100 - ($PaddingPercent * 2)) / 100)
                $scale = [Math]::Min($maxSide / $sourceImage.Width, $maxSide / $sourceImage.Height)
                $drawWidth = [int]($sourceImage.Width * $scale)
                $drawHeight = [int]($sourceImage.Height * $scale)
                $left = [int](($Size - $drawWidth) / 2)
                $top = [int](($Size - $drawHeight) / 2)
                $graphics.DrawImage($sourceImage, $left, $top, $drawWidth, $drawHeight)
            } finally {
                $graphics.Dispose()
            }

            $directory = Split-Path -Parent $OutputPath
            New-Item -ItemType Directory -Force -Path $directory | Out-Null
            $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $bitmap.Dispose()
        }
    } finally {
        $sourceImage.Dispose()
    }
}

$densitySizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($density in $densitySizes.Keys) {
    $size = $densitySizes[$density]
    $directory = Join-Path $resPath $density
    New-LauncherIcon -OutputPath (Join-Path $directory "ic_launcher.png") -Size $size -PaddingPercent 6
    New-LauncherIcon -OutputPath (Join-Path $directory "ic_launcher_round.png") -Size $size -PaddingPercent 6
    New-LauncherIcon -OutputPath (Join-Path $directory "ic_launcher_foreground.png") -Size ([int]($size * 2.25)) -PaddingPercent 18
}

Write-Host "Generated Android launcher icons from $($sourcePath.Path)"
