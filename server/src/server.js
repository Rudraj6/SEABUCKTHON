import 'dotenv/config';
import mongoose from 'mongoose';
import { open, readFile, unlink } from 'node:fs/promises';
import { readFileSync, unlinkSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import express from 'express';
import { createServer } from 'node:http';
import { createServer as createTcpServer } from 'node:net';
import app from './app.js';

const preferredPort = Number(process.env.PORT || 3001);
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../'
);
const clientRoot = path.join(root, 'client');
const dist = path.join(clientRoot, 'dist');
const production = process.env.NODE_ENV === 'production';
const devLockPath = path.join(root, 'server', '.dev-server.lock');

async function claimDevLock(port) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const lock = await open(devLockPath, 'wx');
      await lock.writeFile(JSON.stringify({ pid: process.pid, port }));
      await lock.close();
      return;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let current;
      try {
        current = JSON.parse(await readFile(devLockPath, 'utf8'));
      } catch {
        /* The owner may still be writing the lock. */
      }
      if (Number.isInteger(current?.pid) && current.pid !== process.pid) {
        try {
          process.kill(current.pid, 0);
          console.log(
            `SEABUCKTHORN BHARAT is already running at http://localhost:${current.port}`
          );
          process.exit(0);
        } catch (processError) {
          if (processError.code === 'EPERM') {
            console.log(
              `SEABUCKTHORN BHARAT is already running at http://localhost:${current.port}`
            );
            process.exit(0);
          }
        }
      }
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 100));
      try {
        await unlink(devLockPath);
      } catch {
        /* Another startup may have already removed a stale lock. */
      }
    }
  }
  throw new Error('Could not acquire the local storefront startup lock.');
}

async function findAvailablePort(preferredPort) {
  const candidates = [
    preferredPort,
    ...Array.from({ length: 20 }, (_, i) => preferredPort + i + 1),
  ];
  for (const candidate of candidates) {
    const available = await new Promise((resolve) => {
      const probe = createTcpServer();
      probe.once('error', () => resolve(false));
      probe.listen(candidate, '127.0.0.1', () =>
        probe.close(() => resolve(true))
      );
    });
    if (available) return candidate;
    try {
      const response = await fetch(`http://127.0.0.1:${candidate}/api/health`, {
        signal: AbortSignal.timeout(350),
      });
      const health = await response.json();
      if (response.ok && health.ok) {
        console.log(
          `SEABUCKTHORN BHARAT is already running at http://localhost:${candidate}`
        );
        process.exit(0);
      }
    } catch {
      /* A reserved port or unrelated service: try the next local port. */
    }
  }
  throw new Error(
    `No available local port found from ${preferredPort} to ${preferredPort + 20}. Set PORT in server/.env to an available port.`
  );
}

const port = production
  ? preferredPort
  : await findAvailablePort(preferredPort);
if (!production) {
  await claimDevLock(port);
  process.once('exit', () => {
    try {
      const lock = JSON.parse(readFileSync(devLockPath, 'utf8'));
      if (lock.pid === process.pid) unlinkSync(devLockPath);
    } catch {
      /* The lock may already have been cleared. */
    }
  });
}

if (process.env.MONGO_URI) {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('MongoDB connected');
  } catch (error) {
    if (production) throw error;
    console.error(
      'MongoDB unavailable; using local demonstration storage:',
      error.message
    );
  }
} else {
  console.warn('MONGO_URI is not set; using local demonstration storage.');
}

const server = createServer(app);
let vite;
if (production) {
  app.use(express.static(dist));
  app.get('/{*path}', (req, res) => {
    if (req.path.startsWith('/api/'))
      return res.status(404).json({ message: 'API route not found.' });
    res.sendFile(path.join(dist, 'index.html'));
  });
} else {
  const vitePath = pathToFileURL(
    path.join(clientRoot, 'node_modules/vite/dist/node/index.js')
  ).href;
  const { createServer: createViteServer } = await import(vitePath);
  vite = await createViteServer({
    root: clientRoot,
    configFile: path.join(clientRoot, 'vite.config.js'),
    appType: 'spa',
    server: { middlewareMode: true, hmr: { server } },
  });
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/'))
      return res.status(404).json({ message: 'API route not found.' });
    next();
  });
  app.use(vite.middlewares);
  server.on('close', () => vite.close());
}

const host = production ? '0.0.0.0' : '127.0.0.1';
server.on('error', async (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${port} became occupied during startup. Restart npm run dev to select another available port.`
    );
  } else {
    console.error('Storefront server failed to start:', error.message);
  }
  await vite?.close().catch(() => {});
  if (mongoose.connection.readyState)
    await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
server.listen(port, host, () => {
  console.log(`SEABUCKTHORN BHARAT is available at http://localhost:${port}`);
  if (!production) console.log('Storefront and API share this one address.');
});
