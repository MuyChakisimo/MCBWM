# Draws a 64x64 inventory icon (side view, diagonal like the TACZ icons: stock bottom-left, muzzle top-right) from a
# gun geometry + its texture. Each cube is filled with the average colour of its side (east) face texture.
# powershell -ExecutionPolicy Bypass -File tools\make_gun_icon.ps1 <geo.json> <texture.png> <out.png> [bone,bone...]
param([string]$Geo, [string]$Texture, [string]$Out, [string]$Bones = "")
Add-Type -AssemblyName System.Drawing
$g = (Get-Content $Geo -Raw | ConvertFrom-Json).'minecraft:geometry'[0]
$tex = [System.Drawing.Bitmap]::FromFile($Texture)
$tw = $g.description.texture_width; $th = $g.description.texture_height
$sx = $tex.Width / $tw; $sy = $tex.Height / $th
$want = if ($Bones) { $Bones.Split(',') } else { @() }
$cubes = @()
foreach ($b in $g.bones) {
  if ($want.Count -and -not ($want -contains $b.name)) { continue }
  foreach ($c in $b.cubes) { $cubes += $c }
}
function AvgColor($c) {
  $f = $c.uv.east; if (-not $f) { return [System.Drawing.Color]::Gray }
  $u = [math]::Min($f.uv[0], $f.uv[0] + $f.uv_size[0]); $v = [math]::Min($f.uv[1], $f.uv[1] + $f.uv_size[1])
  $w = [math]::Max(1, [math]::Abs($f.uv_size[0])); $h = [math]::Max(1, [math]::Abs($f.uv_size[1]))
  $r = 0; $gg = 0; $bb = 0; $n = 0
  for ($x = [int]($u * $sx); $x -lt [int](($u + $w) * $sx); $x++) { for ($y = [int]($v * $sy); $y -lt [int](($v + $h) * $sy); $y++) {
    if ($x -ge $tex.Width -or $y -ge $tex.Height) { continue }
    $p = $tex.GetPixel($x, $y); if ($p.A -lt 20) { continue }; $r += $p.R; $gg += $p.G; $bb += $p.B; $n++ } }
  if ($n -eq 0) { return [System.Drawing.Color]::Gray }
  return [System.Drawing.Color]::FromArgb(255, [int]($r / $n), [int]($gg / $n), [int]($bb / $n))
}
# extent in z (length) and y (height)
$zmin = ($cubes | ForEach-Object { $_.origin[2] } | Measure-Object -Minimum).Minimum
$zmax = ($cubes | ForEach-Object { $_.origin[2] + $_.size[2] } | Measure-Object -Maximum).Maximum
$ymin = ($cubes | ForEach-Object { $_.origin[1] } | Measure-Object -Minimum).Minimum
$ymax = ($cubes | ForEach-Object { $_.origin[1] + $_.size[1] } | Measure-Object -Maximum).Maximum
$len = $zmax - $zmin; $scale = 62 / $len
$bmp = New-Object System.Drawing.Bitmap 64, 64, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gr = [System.Drawing.Graphics]::FromImage($bmp)
$gr.Clear([System.Drawing.Color]::Transparent)
$gr.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
$gr.TranslateTransform(32, 32); $gr.RotateTransform(-38); $gr.TranslateTransform(-31, -(($ymax - $ymin) * $scale) / 2)
# draw far side first (low x max), so the near (+x) side ends on top
foreach ($c in ($cubes | Sort-Object { $_.origin[0] + $_.size[0] })) {
  $x = ($zmax - ($c.origin[2] + $c.size[2])) * $scale      # muzzle (-z) on the right
  $y = ($ymax - ($c.origin[1] + $c.size[1])) * $scale
  $w = [math]::Max(1, $c.size[2] * $scale); $h = [math]::Max(1, $c.size[1] * $scale)
  $brush = New-Object System.Drawing.SolidBrush (AvgColor $c)
  $gr.FillRectangle($brush, [float]$x, [float]$y, [float]$w, [float]$h); $brush.Dispose()
}
$gr.Dispose(); $tex.Dispose()
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
"saved $Out"
