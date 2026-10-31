$WshShell = New-Object -ComObject WScript.Shell

$TargetExe = "d:\Optimzer\Optimizer.exe"
$WorkingDir = "d:\Optimzer"
$IconLocation = "$env:WINDIR\System32\imageres.dll,109"

# 1. Start Menu (Current User)
$UserPrograms = [Environment]::GetFolderPath('Programs')
$ShortcutPath1 = Join-Path $UserPrograms "Optimizer.lnk"
$Shortcut1 = $WshShell.CreateShortcut($ShortcutPath1)
$Shortcut1.TargetPath = $TargetExe
$Shortcut1.WorkingDirectory = $WorkingDir
$Shortcut1.Description = "Optimizer - Windows 10/11 Performance, Latency & Network"
$Shortcut1.IconLocation = $IconLocation
$Shortcut1.Save()
Write-Host "Criado no Menu Iniciar (Utilizador): $ShortcutPath1"

# 2. Desktop (Ambiente de Trabalho)
$Desktop = [Environment]::GetFolderPath('Desktop')
$ShortcutPath2 = Join-Path $Desktop "Optimizer.lnk"
$Shortcut2 = $WshShell.CreateShortcut($ShortcutPath2)
$Shortcut2.TargetPath = $TargetExe
$Shortcut2.WorkingDirectory = $WorkingDir
$Shortcut2.Description = "Optimizer - Windows 10/11 Performance, Latency & Network"
$Shortcut2.IconLocation = $IconLocation
$Shortcut2.Save()
Write-Host "Criado no Ambiente de Trabalho: $ShortcutPath2"

# 3. Register in Windows App Paths (permite abrir pelo nome em qualquer pesquisa ou Executar)
$AppPathKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\Optimizer.exe"
New-Item -Path $AppPathKey -Force -ErrorAction SilentlyContinue | Out-Null
Set-ItemProperty -Path $AppPathKey -Name "(Default)" -Value $TargetExe -Force
Set-ItemProperty -Path $AppPathKey -Name "Path" -Value $WorkingDir -Force
Write-Host "Registado no App Paths do Windows"

# 4. Also register under Windows Search Index
$StartMenuRoot = [System.IO.Path]::Combine([Environment]::GetFolderPath('StartMenu'), 'Programs')
Write-Host "Concluído com sucesso!"
