$rootPages = @('index.html', 'about.html', 'Exploration.html', 'Story.html', 'Story1.html', 'Story2.html', 'Story3.html')
$subPages = @('stories/index.html', 'projects/halloween-helpers.html', 'projects/dream-guardians.html', 'projects/ghost-catchers.html')
$allPages = $rootPages + $subPages

foreach ($p in $allPages) {
    $prefix = if ($p -in $rootPages) { '' } else { '../' }
    $old = @(
        "      <img src=""${prefix}Assets/img/Logo.png"" alt=""ORBIT-X logo"" class=""brand-logo-img"" width=""40"" height=""40"" loading=""eager"" />",
        "      <svg class=""brand-planet"" viewBox=""0 0 76 58"" aria-hidden=""true"">",
        "        <ellipse cx=""36"" cy=""29"" rx=""30"" ry=""11"" transform=""rotate(-28 36 29)"" fill=""none"" stroke=""currentColor"" stroke-width=""4"" />",
        "        <circle cx=""34"" cy=""28"" r=""15"" fill=\"#bca0ef"" />",
        "        <path d=""M22 18c5-7 13-9 20-7"" fill=""none"" stroke=\"#fff8ff"" stroke-width=""4"" stroke-linecap=""round"" />",
        "        <path d=""M59 9l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"" fill=\"#f8d889"" />",
        "      </svg>",
        "      <span>ORBIT-X</span>"
    ) -join "`n"
    $new = "      <img src=""${prefix}Assets/img/Logo.png"" alt=""ORBIT-X official logo"" class=""brand-logo-img"" width=""160"" height=""160"" loading=""eager"" />"
    $content = Get-Content -Raw -Path $p
    if ($content -like "*brand-planet*") {
        $content = $content.Replace($old, $new)
        Set-Content -NoNewline -Path $p -Value $content
        Write-Host "OK: $p"
    } else {
        Write-Host "SKIP: $p"
    }
}