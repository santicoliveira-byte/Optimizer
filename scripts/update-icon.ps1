$iconSource = "d:\Optimzer\node_modules\electron\dist\electron.exe,0"

# 1. Start Menu shortcut
$startMenuShortcut = [System.IO.Path]::Combine($env:APPDATA, "Microsoft\Windows\Start Menu\Programs\Optimizer.lnk")
if (Test-Path $startMenuShortcut) {
    $sh = New-Object -ComObject WScript.Shell
    $sc = $sh.CreateShortcut($startMenuShortcut)
    $sc.IconLocation = $iconSource
    $sc.Save()
    Write-Output "Updated Start Menu shortcut icon: $startMenuShortcut"
}

# 2. Desktop shortcut
$desktopShortcut = [System.IO.Path]::Combine([Environment]::GetFolderPath("Desktop"), "Optimizer.lnk")
if (Test-Path $desktopShortcut) {
    $sh = New-Object -ComObject WScript.Shell
    $sc = $sh.CreateShortcut($desktopShortcut)
    $sc.IconLocation = $iconSource
    $sc.Save()
    Write-Output "Updated Desktop shortcut icon: $desktopShortcut"
}

# 3. Flush icon cache
try {
    ie4uinit.exe -show
} catch {}

Write-Output "Done"
