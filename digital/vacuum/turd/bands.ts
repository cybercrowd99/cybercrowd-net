import { exec } from 'node:child_process';

export function deploy() {
  exec('pnpm install && pnpm build && pnpm deploy', (err, stdout, stderr) => {
    if (err) {
      console.error('DEPLOY ERROR:', err);
      return;
    }
    if (stderr) {
      console.error('DEPLOY STDERR:', stderr);
    }
    console.log('DEPLOY STDOUT:', stdout);
  });
}
