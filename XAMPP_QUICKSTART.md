# Setup Rápido Com XAMPP

## Preparar o banco

1. Abra o XAMPP Control Panel.
2. Inicie `MySQL`.
3. Abra `http://localhost/phpmyadmin`.
4. Crie o banco `barbearia_dev` com `utf8mb4`.

## Backend

```powershell
cd backend
npx prisma db push
npm run prisma:seed
npm run start:dev
```

Esperado:

- API em `http://localhost:3000/api`
- Swagger em `http://localhost:3000/api/docs`

## Web

```powershell
cd web
npm run dev
```

Esperado:

- painel em `http://localhost:3001`

## Variáveis de ambiente

Backend em `backend/.env`:

```env
DATABASE_URL=mysql://root:@127.0.0.1:3306/barbearia_dev
JWT_SECRET=sua_chave_muito_secreta_2024
REFRESH_TOKEN_SECRET=outra_chave_para_refresh
BACKEND_PORT=3000
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

Web em `web/.env.local`:

```env
NEXT_PUBLIC_API_URL=/api
API_URL=http://127.0.0.1:3000/api
API_PROXY_TARGET=http://127.0.0.1:3000
```

## Troubleshooting

Se o backend não conectar:

- confirme que o `MySQL` do XAMPP está rodando
- confirme que o banco `barbearia_dev` existe
- rode `npx prisma db push` de novo

Se a porta `3000` estiver ocupada:

```powershell
npx kill-port 3000
```
