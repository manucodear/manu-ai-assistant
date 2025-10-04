import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const plugins: any[] = [react()]
  const server: any = { port: 3001 }
  // Allow skipping HTTPS in dev by setting the SKIP_HTTPS env var (useful in local dev)
  const skipHttps = (process.env.SKIP_HTTPS || '').toString().toLowerCase() === '1' || (process.env.SKIP_HTTPS || '').toString().toLowerCase() === 'true'

  // Only attempt to load local cert files when running the dev server.
  // Vite loads the config for build too, so reading cert files unconditionally
  // will cause ENOENT in CI/build environments where certs aren't present.
  if (command === 'serve') {
    const certDir = path.resolve(__dirname, 'certs')
    const keyPath = path.join(certDir, 'localhost.key')
    const crtPath = path.join(certDir, 'localhost.crt')

    if (fs.existsSync(keyPath) && fs.existsSync(crtPath)) {
      server.https = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(crtPath),
      }
    } else {
      // If SKIP_HTTPS is set, skip adding basic-ssl and run a plain HTTP dev server.
      if (!skipHttps) {
        // Fallback for local development when cert files aren't present:
        // use the basic-ssl plugin which generates a temporary certificate.
        // This avoids failing in CI where certs are not checked in.
        const ssl = basicSsl()
        if (Array.isArray(ssl)) plugins.push(...ssl)
        else plugins.push(ssl)
      }
    }
  }

  return {
    plugins,
    server,
  }
})
