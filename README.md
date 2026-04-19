# Salao Da Lu

Setup local sem Docker:

1. Inicie o `MySQL` no XAMPP.
2. Crie o banco `salao_dev`.
3. No backend:

```powershell
cd backend
npx prisma db push
npm run prisma:seed
npm run start:dev
```

4. No web:

```powershell
cd web
npm run dev
```

5. No mobile Flutter:

```powershell
cd mobile
flutter run -d windows
```

Endpoints locais:

- backend: `http://localhost:3100/api`
- web: `http://localhost:3001`

Deploy de produção:

- [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
