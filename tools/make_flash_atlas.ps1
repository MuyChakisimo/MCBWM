# Builds textures/particle/tacz_flash_model.png for the model muzzle flash (tools/gen_muzzle_flash.py) from the
# user's free flash pack (Textures/free_muzzle_flash.zip): FRAMES chosen frames, CELL px each, stacked vertically,
# colored by intensity: faint edge = orange, mid = yellow, strongest = white-hot.
# Run: powershell -ExecutionPolicy Bypass -File tools\make_flash_atlas.ps1
param(
  [string]$Zip = "$PSScriptRoot\..\Textures\free_muzzle_flash.zip",
  [string]$Out = "$PSScriptRoot\..\addons\TACZ-R\textures\particle\tacz_flash_model.png",
  [int[]]$Frames = @(2, 3, 5, 7, 9, 10, 11, 12),
  [int]$Cell = 128
)
Add-Type -AssemblyName System.Drawing
$tmp = Join-Path ([IO.Path]::GetTempPath()) ("flashpack_" + [guid]::NewGuid())
Expand-Archive -Path $Zip -DestinationPath $tmp -Force

$atlas = New-Object System.Drawing.Bitmap $Cell, ($Cell * $Frames.Count), ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($atlas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
for ($i = 0; $i -lt $Frames.Count; $i++) {
  $img = [System.Drawing.Image]::FromFile((Join-Path $tmp ("muzzle_flash_{0:D2}.png" -f $Frames[$i])))
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, ($i * $Cell), $Cell, $Cell))
  $img.Dispose()
}
$g.Dispose()

# Recolor (fast: raw bytes, BGRA).
$rect = New-Object System.Drawing.Rectangle 0, 0, $atlas.Width, $atlas.Height
$data = $atlas.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, $atlas.PixelFormat)
$bytes = New-Object byte[] ($data.Stride * $data.Height)
[Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
$half = $Cell / 2.0
for ($p = 0; $p -lt $bytes.Length; $p += 4) {
  $lum = ([int]$bytes[$p] + $bytes[$p + 1] + $bytes[$p + 2]) / 765.0
  $a0 = ($bytes[$p + 3] / 255.0) * $lum          # source intensity 0..1 (shape)
  if ($a0 -le 0.01) { $bytes[$p + 3] = 0; continue }
  # Heat falls off from the cell center: white-hot core, yellow body, orange tips.
  $px = ($p / 4) % $Cell; $py = [math]::Floor(($p / 4) / $Cell) % $Cell
  $r = [math]::Sqrt(($px - $half) * ($px - $half) + ($py - $half) * ($py - $half)) / $half   # 0 center .. 1 edge
  $heat = [math]::Pow([math]::Max(0.0, [math]::Min(1.0, 1.0 - 1.25 * $r)), 0.7)
  $t = $a0 * $heat
  $t = $t * $t * (3 - 2 * $t)   # smoothstep: soft transitions, no hard rings
  # orange (255,120,15) -> yellow (255,195,60) -> pale yellow (255,235,150) -> white-hot core (255,252,235)
  if ($t -lt 0.45) { $k = $t / 0.45; $gg = 120 + 75 * $k; $b = 15 + 45 * $k }
  elseif ($t -lt 0.85) { $k = ($t - 0.45) / 0.4; $gg = 195 + 40 * $k; $b = 60 + 90 * $k }
  else { $k = ($t - 0.85) / 0.15; $gg = 235 + 17 * $k; $b = 150 + 85 * $k }
  $bytes[$p] = [byte][math]::Min(255.0, $b); $bytes[$p + 1] = [byte][math]::Min(255.0, $gg); $bytes[$p + 2] = 255
  $bytes[$p + 3] = [byte][math]::Min(255.0, 255 * $a0 * (0.55 + 0.45 * $heat) * 1.3)
}
[Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
$atlas.UnlockBits($data)
$atlas.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$atlas.Dispose()
Remove-Item $tmp -Recurse -Force
"$($Frames.Count) frames ($Cell px) -> $Out"
