$rootPages = @('index.html', 'about.html', 'Exploration.html', 'Story.html', 'Story1.html', 'Story2.html', 'Story3.html')
$subPages = @('stories/index.html', 'projects/halloween-helpers.html', 'projects/dream-guardians.html', 'projects/ghost-catchers.html')

# 1. Fix footer logo in index.html (master) - use Logo.png not Logo.jpeg
$content = Get-Content -Raw -Path 'index.html'
$content = $content.Replace('Assets/img/Logo.jpeg', 'Assets/img/Logo.png')
Set-Content -NoNewline -Path 'index.html' -Value $content
Write-Host "Fixed footer logo in index.html"

# 2. Extract master footer block from index.html (the .orbit-footer one)
$masterContent = Get-Content -Raw -Path 'index.html'
$masterStart = $masterContent.IndexOf('<footer class="orbit-footer" id="site-footer"')
if ($masterStart -lt 0) {
    Write-Host "ERROR: master footer not found"
    exit 1
}
$closingTag = '</footer>'
$masterEnd = $masterContent.IndexOf($closingTag, $masterStart) + $closingTag.Length
$masterFooter = $masterContent.Substring($masterStart, $masterEnd - $masterStart)
Write-Host "Master footer length: $($masterFooter.Length)"

# 3. Replace ALL footer blocks in other pages
foreach ($p in $rootPages + $subPages) {
    if ($p -eq 'index.html') { continue }
    $prefix = if ($p -in $rootPages) { '' } else { '../' }
    
    $content = Get-Content -Raw -Path $p
    
    # Find the first <footer tag
    $start = $content.IndexOf('<footer')
    if ($start -lt 0) {
        Write-Host "NO FOOTER: $p"
        continue
    }
    
    # Find the LAST </footer> in the document (each page has exactly one footer)
    $end = $content.LastIndexOf('</footer>')
    if ($end -lt $start) {
        Write-Host "NO FOOTER END: $p"
        continue
    }
    $end += $closingTag.Length
    
    $oldFooter = $content.Substring($start, $end - $start)
    $newFooter = $masterFooter.Replace('Assets/img/', "${prefix}Assets/img/")
    
    $content = $content.Substring(0, $start) + $newFooter + $content.Substring($end)
    Set-Content -NoNewline -Path $p -Value $content
    Write-Host "FOOTER REPLACED: $p"
}