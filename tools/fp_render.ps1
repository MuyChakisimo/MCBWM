# Draws the polygons written by tools/fp_preview.py into a PNG.
# powershell -ExecutionPolicy Bypass -File tools\fp_render.ps1 <in.json> <out.png>
param([string]$In, [string]$Out)
Add-Type -AssemblyName System.Drawing
$d = Get-Content $In -Raw | ConvertFrom-Json
$bmp = New-Object System.Drawing.Bitmap ([int]$d.w), ([int]$d.h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(255, 150, 190, 230))
$pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(160, 20, 20, 20)), 1
foreach ($poly in $d.polys) {
  $n = $poly.p.Count
  $pts = New-Object 'System.Drawing.PointF[]' $n
  for ($i = 0; $i -lt $n; $i++) { $pts[$i] = New-Object System.Drawing.PointF ([float]$poly.p[$i][0]), ([float]$poly.p[$i][1]) }
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($poly.c))
  $g.FillPolygon($brush, $pts); $g.DrawPolygon($pen, $pts); $brush.Dispose()
}
$g.DrawLine([System.Drawing.Pens]::Black, ($d.w / 2 - 8), ($d.h / 2), ($d.w / 2 + 8), ($d.h / 2))
$g.DrawLine([System.Drawing.Pens]::Black, ($d.w / 2), ($d.h / 2 - 8), ($d.w / 2), ($d.h / 2 + 8))
$g.DrawString($d.title, (New-Object System.Drawing.Font 'Arial', 14), [System.Drawing.Brushes]::Black, 8, 8)
$g.Dispose(); $bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
"saved $Out"
