# 🔴 AVISO: SEM ESPAÇO EM DISCO

**Status:** `npm install` falhou - `ENOSPC: no space left on device`

**Espaço Disponível:** ~720 MB  
**Espaço Necessário:** ~2-3 GB (para node_modules)  
**Ação Requerida:** Liberar espaço

---

## 🚨 Soluções Rápidas

### Opção 1: Limpeza do Windows (RECOMENDADO)
```powershell
# Limpar cache Windows
Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue

# Limpar Recycle Bin
Clear-RecycleBin -Force -ErrorAction SilentlyContinue

# Limpeza de disco (Disk Cleanup)
cleanmgr.exe  # Abre ferramenta visual
```

### Opção 2: Limpar Caches de Desenvolvimento
```powershell
# Limpar cache npm
npm cache clean --force

# Limpar cache pip (se houver Python)
pip cache purge

# Limpar .git (se houve commits grandes)
# git gc --aggressive
```

### Opção 3: Deletar Arquivos Grandes
```powershell
# Encontrar pastas maiores que 100MB
Get-ChildItem C:\ -Recurse -ErrorAction SilentlyContinue | 
  Where-Object {$_.Length -gt 100MB} | 
  Sort-Object Length -Descending | 
  Select-Object -First 20 FullName, @{n='SizeMB';e={[math]::Round($_.Length/1MB,2)}}
```

### Opção 4: Montar em Drive Externo (se houver)
```powershell
# Mover node_modules para drive com mais espaço
# ou usar symlink para D:\
mklink /D "node_modules" "D:\node_modules"
```

---

## ✅ Após Liberar Espaço

Retorne e execute:

```bash
# Backend
cd backend
npm install
npm run build

# Web  
cd ../web
npm install
npm run build
```

---

**Libere pelo menos 2-3 GB antes de continuar.**
