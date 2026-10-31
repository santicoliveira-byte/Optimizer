$WshShell = New-Object -ComObject WScript.Shell
$ProgramsPath = [Environment]::GetFolderPath('Programs')
$ShortcutPath = Join-Path $ProgramsPath "Optimizer.lnk"
$TargetBat = "d:\Optimzer\start-optimizer.bat"

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetBat
$Shortcut.WorkingDirectory = "d:\Optimzer"
$Shortcut.Description = "Optimizer - Windows 10/11 Performance, Latency & Network"
$Shortcut.WindowStyle = 1 # Normal window
$Shortcut.IconLocation = "$env:WINDIR\System32\imageres.dll,109" # Performance / speed icon
$Shortcut.Save()

Write-Host "Sucesso: Atalho criado em $ShortcutPath"
