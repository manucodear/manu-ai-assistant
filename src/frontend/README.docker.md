# Docker instructions

This project uses Vite + React + TypeScript. The Docker setup builds the app and serves the production `dist` with nginx.

Build the image:

```powershell
docker build -t manu-vite-frontend:latest .
```

Run the container:

```powershell
docker run --rm -p 3000:80 manu-vite-frontend:latest
```

Or with docker-compose:

```powershell
docker compose up --build
```

Notes:
- This repository uses Yarn. The Dockerfile activates Corepack and runs `yarn install --frozen-lockfile`.
- Make sure you have a `yarn.lock` at the project root; otherwise change the Dockerfile to use `yarn install` (no `--frozen-lockfile`).
- Local development (hot-reload) should still be done with `yarn dev` outside the container.
- If you need HTTPS locally, the project includes scripts to generate certs; serving HTTPS from nginx in the container requires mapping certs and updating `nginx.conf`.

Local development (no container)
--------------------------------

You can run the dev server directly on your machine without Docker. By default the dev server will attempt to use HTTPS if certs are present or will generate a temporary cert via Vite's basic-ssl plugin.

Run (PowerShell):

```powershell
yarn dev
```

If you prefer the dev server to run over plain HTTP (skip HTTPS), set the `SKIP_HTTPS` environment variable to `1` or `true`:

```powershell
$env:SKIP_HTTPS = '1'
yarn dev
```

Trusting the self-signed certificate (Windows)
---------------------------------------------

If you already have `certs/localhost.crt` and `certs/localhost.key` and want your browser to trust the dev server's HTTPS locally, import the certificate into your CurrentUser Trusted Root store.

Run in PowerShell (from the project root):

```powershell
Import-Certificate -FilePath .\certs\localhost.crt -CertStoreLocation Cert:\CurrentUser\Root
```

Then restart your browser. After this, running `yarn dev` will serve HTTPS using the existing certificate and your browser should not show certificate warnings for https://localhost:3001.


