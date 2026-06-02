# Vercel and Local Environment Setup

## Local Development

The local frontend must use the local Django API:

```env
VITE_API_URL=http://localhost:8000/api
```

This is already configured in `.env`. Keep this value for local work so the app does not accidentally use the production Heroku backend.

Run locally:

```powershell
cd C:\Users\lulu\Documents\Projects\library\Su-library
.\.venv\Scripts\python.exe manage.py runserver
```

```powershell
cd C:\Users\lulu\Documents\Projects\library\e-library-front
npm run dev
```

Open:

```text
http://localhost:5173
```

## Vercel Production

In Vercel Dashboard, set:

```env
VITE_API_URL=https://su-library-back-d2d8d21af2e4.herokuapp.com/api
```

Apply it to Production, Preview, and Development environments as needed, then redeploy.

## SPA Routing

`vercel.json` rewrites client routes to `index.html`, so direct opens and refreshes should work for:

```text
/
/catalog
/read/:bookId
/profile
```

## Production Backend Env

On Heroku, production values must be explicit:

```env
LOCAL_DEV=False
DEBUG=False
ALLOWED_HOSTS=su-library-back-d2d8d21af2e4.herokuapp.com
CORS_ALLOWED_ORIGINS=https://su-e-library.vercel.app,https://su-library.com
DATABASE_URL=<Heroku Postgres URL>
```

Do not set `LOCAL_DEV=True` in production.
