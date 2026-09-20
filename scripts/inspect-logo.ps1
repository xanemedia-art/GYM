Add-Type -AssemblyName System.Drawing
$filePath = "c:\Users\94591\.gemini\antigravity-ide\scratch\gym-management-saas\public\bff-logo.jpg"
$img = [System.Drawing.Image]::FromFile($filePath)
Write-Host "Width: $($img.Width), Height: $($img.Height)"
$img.Dispose()
