Add-Type -AssemblyName System.Drawing
$files = @('Assets\img\Logo.jpeg','Assets\img\Logo.png','Assets\img\two.png','Assets\img\scene 1.png','Assets\img\last scene.png')
foreach ($f in $files) {
  $path = (Resolve-Path $f).Path
  $bmp = New-Object System.Drawing.Bitmap($path)
  $w = $bmp.Width; $h = $bmp.Height
  $pts = @(@(0,0),@(($w-1),0),@(0,($h-1)),@(($w-1),($h-1)),@([int]($w/2),[int]($h/2)))
  $cols = foreach ($p in $pts) {
    $c = $bmp.GetPixel($p[0], $p[1])
    '{0:X2}{1:X2}{2:X2}/a{3:X2}' -f $c.R, $c.G, $c.B, $c.A
  }
  Write-Output ("$f ($w x $h) : " + ($cols -join ' '))
  $bmp.Dispose()
}