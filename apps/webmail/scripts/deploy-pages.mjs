import { spawnSync } from 'node:child_process';

const projectName = (process.env.WEBMAIL_PAGES_PROJECT_NAME || 'loven7-mail-webmail').trim();
const branch = (process.env.CF_PAGES_BRANCH || process.env.GITHUB_REF_NAME || 'main').trim();

if (!projectName) {
  console.error('WEBMAIL_PAGES_PROJECT_NAME is empty. Set it or use the default loven7-mail-webmail project.');
  process.exit(1);
}

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = ['wrangler', 'pages', 'deploy', 'dist', '--project-name', projectName, '--branch', branch];
const result = spawnSync(command, args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
