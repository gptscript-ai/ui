import { app } from 'electron';
import { getPort } from 'get-port-please';
import { join, dirname, parse } from 'path';
import log from 'electron-log/main.js';
import util from 'util';
import { renameSync } from 'fs';

// App config
const dev = !app.isPackaged;
const appName = 'Acorn';
const appDir = app.getAppPath();
const logsDir = app.getPath('logs');
const resourcesDir = dirname(appDir);
const dataDir = join(app.getPath('userData'), appName);
const threadsDir = process.env.THREADS_DIR || join(dataDir, 'threads');
const workspaceDir = process.env.WORKSPACE_DIR || join(dataDir, 'workspace');
const port =
  process.env.PORT ||
  (!dev ? await getPort({ portRange: [30000, 40000] }) : 3000);
const gptscriptBin =
  process.env.GPTSCRIPT_BIN ||
  join(
    dev ? join(resourcesDir, 'app.asar.unpacked') : '',
    'node_modules',
    '@gptscript-ai',
    'gptscript',
    'bin',
    `gptscript${process.platform === 'win32' ? '.exe' : ''}`
  );
const gatewayUrl =
  process.env.GPTSCRIPT_GATEWAY_URL || 'https://gateway-api.gptscript.ai';

// Logging config
const logFormat = ({ data, level, message }) => [
  message.date.toISOString(),
  `[${message.variables.processType === 'main' ? 'server' : 'client'}]`,
  `[${level.toUpperCase()}]`,
  util.format(...data),
];

log.transports.console.format = logFormat;

Object.assign(log.transports.file, {
  format: logFormat,
  resolvePathFn: (variables) => {
    return join(logsDir, `${variables.appName}.log`);
  },
  archiveLogFn: (file) => {
    // Get the current Unix timestamp
    const info = parse(file.toString());
    const timestamp = Math.floor(Date.now() / 1000);

    try {
      renameSync(file, join(info.dir, `${info.name}.${timestamp}.${info.ext}`));
    } catch (e) {
      console.warn('failed to rotate log file', e);
    }
  },
});

log.initialize({
  // Include logs gathered from clients via IPC
  spyRendererConsole: true,
  includeFutureSessions: true,
});

// Forward default console logging to electron-log
Object.assign(console, log.functions);

export const config = {
  dev,
  appName,
  logsDir,
  appDir,
  resourcesDir,
  dataDir,
  threadsDir,
  workspaceDir,
  port,
  gptscriptBin,
  gatewayUrl,
};