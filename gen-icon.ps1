Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap(512, 512)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'HighQuality'

$rect = New-Object System.Drawing.RectangleF(0, 0, 512, 512)
$brush1 = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(255,14,165,233), [System.Drawing.Color]::FromArgb(255,124,58,237), 45)

$gp = New-Object System.Drawing.Drawing2D.GraphicsPath
$gp.AddArc(0, 0, 511, 511, 180, 90)
$gp.AddArc(0, 0, 511, 511, 270, 90)
$gp.AddArc(0, 0, 511, 511, 0, 90)
$gp.AddArc(0, 0, 511, 511, 90, 90)
$gp.CloseFigure()
$g.FillPath($brush1, $gp)

$font = New-Object System.Drawing.Font('Arial', 210, [System.Drawing.FontStyle]::Bold)
$fmt = [System.Drawing.StringFormat]::GenericTypographic
$fmt.Alignment = 'Center'
$fmt.LineAlignment = 'Center'
$g.DrawString('CS', $font, [System.Drawing.Brush]::new([System.Drawing.SolidBrush], [System.Drawing.Color]::White), 256, 230, $fmt)

$barBrush = new-object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(160, 255, 255, 255))
$g.FillRectangle($barBrush, 100, 380, 312, 8)

$bmp.Save('src-tauri\icons\new\icon-512.png', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Output 'Icon generated'
