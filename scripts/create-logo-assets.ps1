Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\94591\.gemini\antigravity-ide\scratch\gym-management-saas\public\bff-logo.jpg"
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $bmp.Width
$height = $bmp.Height

# Find precise bounding box of content (R < 238 or G < 238 or B < 238)
$minX = $width; $maxX = 0
$minY = $height; $maxY = 0

$emblemMinX = $width; $emblemMaxX = 0
$emblemMinY = $height; $emblemMaxY = 0

for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -lt 238 -or $p.G -lt 238 -or $p.B -lt 238) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }

            # Emblem is strictly on the left up to x <= 236
            if ($x -le 236) {
                if ($x -lt $emblemMinX) { $emblemMinX = $x }
                if ($x -gt $emblemMaxX) { $emblemMaxX = $x }
                if ($y -lt $emblemMinY) { $emblemMinY = $y }
                if ($y -gt $emblemMaxY) { $emblemMaxY = $y }
            }
        }
    }
}

Write-Host "True Logo bounds: X: $minX..$maxX, Y: $minY..$maxY"
Write-Host "True Emblem bounds: X: $emblemMinX..$emblemMaxX, Y: $emblemMinY..$emblemMaxY"

# Create clean transparent version
$transparentBmp = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $pixel = $bmp.GetPixel($x, $y)
        $avg = ($pixel.R + $pixel.G + $pixel.B) / 3.0
        
        if ($avg -ge 248) {
            $transparentBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } elseif ($avg -ge 232) {
            $alpha = [int](255 * (248 - $avg) / 16.0)
            if ($alpha -lt 0) { $alpha = 0 }
            if ($alpha -gt 255) { $alpha = 255 }
            $transparentBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $pixel.R, $pixel.G, $pixel.B))
        } else {
            $transparentBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $pixel.R, $pixel.G, $pixel.B))
        }
    }
}

# 1. Save full cropped logo with neat padding
$pad = 12
$cropX = [Math]::Max(0, $minX - $pad)
$cropY = [Math]::Max(0, $minY - $pad)
$cropW = [Math]::Min($width - $cropX, ($maxX - $minX) + ($pad * 2))
$cropH = [Math]::Min($height - $cropY, ($maxY - $minY) + ($pad * 2))

$cropRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $cropW, $cropH
$croppedLogo = $transparentBmp.Clone($cropRect, $transparentBmp.PixelFormat)
$croppedLogo.Save("c:\Users\94591\.gemini\antigravity-ide\scratch\gym-management-saas\public\bff-logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$croppedLogo.Dispose()

# 2. Save emblem bitmap, clearing any pixels with x >= 237
$emblemCleanBmp = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        if ($x -le 236) {
            $emblemCleanBmp.SetPixel($x, $y, $transparentBmp.GetPixel($x, $y))
        } else {
            $emblemCleanBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
    }
}

$padEmblem = 10
$eWidth = ($emblemMaxX - $emblemMinX) + ($padEmblem * 2)
$eHeight = ($emblemMaxY - $emblemMinY) + ($padEmblem * 2)
$size = [Math]::Max($eWidth, $eHeight)

$centerX = ($emblemMinX + $emblemMaxX) / 2.0
$centerY = ($emblemMinY + $emblemMaxY) / 2.0

$sqX = [Math]::Max(0, [int]($centerX - ($size / 2.0)))
$sqY = [Math]::Max(0, [int]($centerY - ($size / 2.0)))
$sqW = [Math]::Min($width - $sqX, $size)
$sqH = [Math]::Min($height - $sqY, $size)

$emblemRect = New-Object System.Drawing.Rectangle $sqX, $sqY, $sqW, $sqH
$croppedEmblem = $emblemCleanBmp.Clone($emblemRect, $transparentBmp.PixelFormat)
$croppedEmblem.Save("c:\Users\94591\.gemini\antigravity-ide\scratch\gym-management-saas\public\bff-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$croppedEmblem.Save("c:\Users\94591\.gemini\antigravity-ide\scratch\gym-management-saas\public\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$croppedEmblem.Save("c:\Users\94591\.gemini\antigravity-ide\scratch\gym-management-saas\public\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)

$croppedEmblem.Dispose()
$emblemCleanBmp.Dispose()
$transparentBmp.Dispose()
$bmp.Dispose()
Write-Host "Success: Generated pristine bff-logo.png and bff-icon.png!"
