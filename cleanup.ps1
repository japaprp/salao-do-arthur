# Script de Limpeza Automática de Espaço em Disco
# Execute como Administrador: powershell -ExecutionPolicy Bypass -File cleanup.ps1

Write-Host "🧹 LIMPEZA DE ESPAÇO EM DISCO INICIADA" -ForegroundColor Green
Write-Host "=====================================`n"

# Função para exibir espaço
function Show-DiskSpace {
    $volume = Get-Volume C: -ErrorAction SilentlyContinue
    if ($volume) {
        $free = [math]::Round($volume.SizeRemaining / 1GB, 2)
        $total = [math]::Round($volume.Size / 1GB, 2)
        Write-Host "Espaço C: $free GB / $total GB"`n
    }
}

Write-Host "📊 ANTES:" -ForegroundColor Cyan
Show-DiskSpace

# 1. Limpar arquivos temporários
Write-Host "🔄 1. Limpando arquivos temporários..." -ForegroundColor Yellow
Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue -Verbose
Remove-Item -Path "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue -Verbose
Write-Host "✅ Temp limpo`n"

# 2. Limpar npm cache
Write-Host "🔄 2. Limpando npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>&1 | Select-Object -Last 3
Write-Host "✅ npm cache limpo`n"

# 3. Limpar Lixeira
Write-Host "🔄 3. Esvaziando Lixeira..." -ForegroundColor Yellow
Clear-RecycleBin -Force -ErrorAction SilentlyContinue
Write-Host "✅ Lixeira esvaziada`n"

# 4. Remover logs antigos
Write-Host "🔄 4. Removendo logs antigos..." -ForegroundColor Yellow
Remove-Item -Path "C:\Users\$env:USERNAME\AppData\Local\npm-cache\_logs\*" -Force -ErrorAction SilentlyContinue
Write-Host "✅ Logs removidos`n"

# 5. Mostrar espaço final
Write-Host "📊 DEPOIS:" -ForegroundColor Cyan
Show-DiskSpace

Write-Host "✨ LIMPEZA CONCLUÍDA!" -ForegroundColor Green
Write-Host "=====================================`n"

Write-Host "🚀 Próxima etapa:" -ForegroundColor Cyan
Write-Host 'cd "C:\Users\Yago Fellipe Amorim\Desktop\salao\web"' -ForegroundColor Magenta
Write-Host "npm install --legacy-peer-deps`n" -ForegroundColor Magenta

Read-Host "Pressione ENTER para continuar"
