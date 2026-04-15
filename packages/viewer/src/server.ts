import express, { type Express } from 'express';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PlanWorkspace, WorkspaceNotFoundError } from '@plan/store';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_PORT = 3847;

function resolvePlanCwd(overrideCwd?: string): string {
  if (overrideCwd !== undefined && overrideCwd.trim().length > 0) {
    return path.resolve(overrideCwd.trim());
  }
  const fromEnv = process.env.PLAN_CWD;
  if (fromEnv !== undefined && fromEnv.trim().length > 0) {
    return path.resolve(fromEnv.trim());
  }
  return process.cwd();
}

function buildSnapshot(ws: PlanWorkspace) {
  const epics = ws.listEpics();
  const activeEpicId = ws.getActiveEpicId();
  return {
    planRoot: ws.root,
    cwd: path.dirname(ws.root),
    activeEpicId,
    epics: epics.map((epic) => {
      const stories = ws.listStories({ epicId: epic.id });
      return {
        ...epic,
        progress: ws.getEpicProgress(epic.id),
        stories: stories.map((story) => ({
          ...story,
          progress: ws.getStoryProgress(story.id),
          tasks: ws.listTasks({ storyId: story.id }),
        })),
      };
    }),
  };
}

export interface ViewerOptions {
  port?: number;
  cwd?: string;
}

export function createViewerApp(opts?: ViewerOptions): Express {
  const planCwd = resolvePlanCwd(opts?.cwd);

  const app = express();
  const publicDir = path.join(__dirname, '..', 'public');
  app.use(express.static(publicDir));

  app.get('/api/health', (_req, res) => {
    try {
      const ws = PlanWorkspace.load(planCwd);
      res.json({ ok: true, initialized: true, cwd: planCwd, planRoot: ws.root });
    } catch (e: unknown) {
      if (e instanceof WorkspaceNotFoundError) {
        res.json({
          ok: true,
          initialized: false,
          cwd: planCwd,
          message: e.message,
        });
        return;
      }
      const message = e instanceof Error ? e.message : String(e);
      res.status(500).json({ ok: false, initialized: false, cwd: planCwd, error: message });
    }
  });

  app.get('/api/snapshot', (_req, res) => {
    try {
      const ws = PlanWorkspace.load(planCwd);
      res.json(buildSnapshot(ws));
    } catch (e: unknown) {
      if (e instanceof WorkspaceNotFoundError) {
        res.status(404).json({
          error: 'plan_not_found',
          message: e.message,
          cwd: planCwd,
        });
        return;
      }
      const message = e instanceof Error ? e.message : String(e);
      res.status(500).json({ error: 'internal_error', message });
    }
  });

  app.post('/api/init', (_req, res) => {
    const cwd = planCwd;
    try {
      const existing = PlanWorkspace.load(planCwd);
      res.status(409).json({
        ok: false,
        error: 'already_initialized',
        message: 'A plan workspace already exists for this cwd.',
        cwd,
        planRoot: existing.root,
      });
      return;
    } catch (e: unknown) {
      if (!(e instanceof WorkspaceNotFoundError)) {
        const message = e instanceof Error ? e.message : String(e);
        res.status(500).json({ ok: false, initialized: false, cwd, error: message });
        return;
      }
    }
    try {
      const ws = PlanWorkspace.init(planCwd, { directory: '.plan' });
      res.json({
        ok: true,
        initialized: true,
        planRoot: ws.root,
        cwd,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      res.status(500).json({ ok: false, initialized: false, cwd, error: message });
    }
  });

  return app;
}

export function startViewer(
  opts?: ViewerOptions,
): Promise<{ url: string; close: () => void }> {
  const port = opts?.port ?? DEFAULT_PORT;
  if (!Number.isFinite(port) || port <= 0) {
    throw new TypeError(`Invalid port: ${port}`);
  }

  const app = createViewerApp(opts);

  return new Promise((resolve, reject) => {
    const server = app
      .listen(port, () => {
        const url = `http://127.0.0.1:${port}`;
        const cwd = resolvePlanCwd(opts?.cwd);
        console.info(`Plan viewer at ${url} (cwd=${cwd})`);
        resolve({ url, close: () => server.close() });
      })
      .on('error', reject);
  });
}

/* Auto-start when run directly (e.g. `node dist/server.js`, `tsx src/server.ts`) */
const runningAsMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (runningAsMain) {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  startViewer({ port });
}
