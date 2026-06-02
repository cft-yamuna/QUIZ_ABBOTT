import { spawn } from 'node:child_process';
import process from 'node:process';

const isWindows = process.platform === 'win32';
const backendPort = process.env.QUIZ_BACKEND_PORT || process.env.PORT || '3002';
const npmExecPath = process.env.npm_execpath;
const frontendCommand = npmExecPath
  ? {
      command: process.execPath,
      args: [npmExecPath, 'run', 'dev:frontend'],
    }
  : {
      command: isWindows ? process.env.ComSpec || 'cmd.exe' : 'npm',
      args: isWindows ? ['/d', '/s', '/c', 'npm run dev:frontend'] : ['run', 'dev:frontend'],
    };

const children = [
  spawn(process.execPath, ['server.js'], {
    env: {
      ...process.env,
      PORT: backendPort,
    },
    stdio: 'inherit',
  }),
  spawn(frontendCommand.command, frontendCommand.args, {
    env: {
      ...process.env,
      QUIZ_BACKEND_PORT: backendPort,
    },
    stdio: 'inherit',
    shell: false,
  }),
];

function stopChildren(signal) {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopChildren(signal);
    process.exit(0);
  });
}

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (code && code !== 0) {
      stopChildren(signal || 'SIGTERM');
      process.exit(code);
    }
  });
}
