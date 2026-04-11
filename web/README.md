# Salão da Lu - Painel Web Administrativo

Painel administrativo web para o sistema Salão da Lu, desenvolvido com Next.js, TypeScript e Material-UI.

## 🚀 Tecnologias Utilizadas

- **Next.js 13** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Material-UI (MUI)** - Biblioteca de componentes
- **React Query** - Gerenciamento de estado e cache
- **React Hook Form** - Gerenciamento de formulários
- **Yup** - Validação de formulários
- **Axios** - Cliente HTTP
- **date-fns** - Manipulação de datas

## 🎨 Design System

O projeto utiliza um design system premium com paleta roxa/lilás:

- **Cores principais**: Roxo (#7C3AED) e Lilás (#A855F7)
- **Componentes atômicos**: Button, Card, Input, Loading
- **Layout responsivo** com sidebar de navegação
- **Tema customizado** do Material-UI

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── layout/          # Layout principal e navegação
│   └── ui/             # Componentes atômicos
├── lib/
│   └── api/            # Cliente HTTP e configurações
├── pages/              # Páginas Next.js
│   ├── api/           # APIs Next.js (se necessário)
│   ├── auth/          # Páginas de autenticação
│   └── dashboard.tsx  # Dashboard principal
├── styles/            # Tema e estilos globais
└── types/             # Definições TypeScript
```

## 🛠️ Instalação e Configuração

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env.local
   ```

   Edite o arquivo `.env.local` com suas configurações:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

3. **Executar em modo desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acessar a aplicação:**
   - Abra [http://localhost:3001](http://localhost:3001) no navegador

## 📜 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
- `npm run type-check` - Verifica tipos TypeScript

## 🔧 Desenvolvimento

### Componentes

Os componentes seguem o padrão de design atômico:

- **Button**: Botão customizado com variantes (primary, secondary, outlined)
- **Card**: Cartão com título, subtítulo e ações
- **Input**: Campo de entrada com validação
- **Loading**: Componente de carregamento

### API Client

O cliente HTTP está configurado em `src/lib/api/client.ts` com:

- Interceptadores para JWT
- Tratamento de erros
- Configuração de base URL

### Tema

O tema Material-UI está definido em `src/styles/theme.ts` com:

- Paleta de cores personalizada
- Tipografia customizada
- Overrides de componentes

## 🚀 Deploy

O projeto está configurado para deploy no Vercel:

1. Conecte seu repositório no Vercel
2. Configure as variáveis de ambiente
3. Deploy automático será executado

## 📝 Licença

Este projeto é parte do sistema Salão da Lu.
