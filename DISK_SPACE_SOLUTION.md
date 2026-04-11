# 🚨 SOLUÇÃO: Problema de Espaço em Disco Detectado

**Status Atual:**
- ✅ Backend: `npm install` **SUCESSO** (847 packages)
- ❌ Web: `npm install` **FALHOU** (ENOSPC - sem espaço)
- 📊 Espaço disponível: ~830 MB
- 📊 Espaço necessário: ~2+ GB mais

---

## ⚠️ O Problema

Seu disco C tem **apenas ~830 MB livres**, mas o web precisa de pelo menos **2 GB** para instalar todas as dependências (Next.js, React, MUI, Storybook, etc).

---

## ✅ SOLUÇÃO - Escolha Uma:

### OPÇÃO A: Liberar Espaço (RECOMENDADO) ⭐

Execute estes scripts PowerShell **como Administrador**:

```powershell
# 1. Limpar arquivos temporários do Windows
Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\Windows\Temp\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Temp limpo"

# 2. Esvazie a Lixeira
Clear-RecycleBin -Force -ErrorAction SilentlyContinue
Write-Host "✅ Lixeira esvaziada"

# 3. Limpeza Disk Cleanup
Invoke-Command -ScriptBlock {
  cleanmgr.exe
}
```

**Depois:**
```
cd "C:\Users\Yago Fellipe Amorim\Desktop\salao\web"
npm install --legacy-peer-deps
```

---

### OPÇÃO B: Usar Drive Externo

Se tem USB ou HD externo, mova o projeto:

```powershell
# Copiar projeto para D:\ (exemplo)
Copy-Item -Path "C:\Users\Yago Fellipe Amorim\Desktop\salao" -Destination "D:\salao" -Recurse

# Instalar de lá
cd "D:\salao\web"
npm install --legacy-peer-deps
```

---

### OPÇÃO C: CI/CD sem Local Install

Use GitHub Actions para build (sem instalar localmente):

1. Push código para GitHub
2. GitHub Actions roda `npm install` no servidor (espaço ilimitado)
3. Você só faz download da aplicação gerada

---

## 🔧 CHECKLIST Pós-Instalação

Após liberar espaço e instalar, execute:

```bash
# Backend
cd backend
npm run build        # Compilar
npm run lint:check   # Linting

# Web
cd ../web
npm run build        # Build Next.js
npm run type-check   # Type checking
```

---

## 📊 Espaço Necessário Estimado

| Projeto | Tamanho | Status |
|---------|---------|--------|
| backend/node_modules | ~800 MB | ✅ Instalado |
| web/node_modules | ~1.2 GB | ❌ Pendente |
| .git | ~500 MB | ✅ Existente |
| Dist/Build | ~300 MB | 🔄 Dinâmico |
| **TOTAL** | **~2.8 GB** | ⚠️ Falta espaço |

**Drive disponível atualmente:** 830 MB  
**Diferença:** -1.9 GB (PRECISA LIBERAR)

---

## 🆘 Próximos Passos

1. ✅ **Escolha uma opção acima** para liberar espaço
2. ⏳ **Aguarde o processo completar**
3. 🔄 **Retorne e roda:**

```bash
cd "C:\Users\Yago Fellipe Amorim\Desktop\salao\web"
npm install --legacy-peer-deps
```

4. ✨ **Após sucesso, continue com:**
   - `npm run build`
   - `npm run dev` (desenvolvimento)

---

## 💡 Dica: Monitorar Espaço

```powershell
# Verificar espaço em tempo real
(Get-Volume C:).SizeRemaining / 1GB | ForEach-Object { 
  Write-Host "Espaço disponível: $([math]::Round($_, 2)) GB"
}
```

---

**Libere espaço e tente novamente!** 🚀
