import * as fs from 'fs';
import * as path from 'path';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, contents) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents, 'utf8');
}

/**
 * Writes Allure metadata consumed by the HTML report:
 * - environment.properties -> Environment widget
 * - executor.json -> Executors widget + richer context in UI
 *
 * Expected to run with cwd=api-tests so paths match Playwright Allure output (`./allure-results`).
 */
function main() {
  const resultsDir = path.resolve(process.cwd(), 'allure-results');

  const sha = process.env.GITHUB_SHA ?? '';
  const ref = process.env.GITHUB_REF ?? '';
  const repo = process.env.GITHUB_REPOSITORY ?? '';
  const runId = process.env.GITHUB_RUN_ID ?? '';
  const runAttempt = process.env.GITHUB_RUN_ATTEMPT ?? '';
  const workflow = process.env.GITHUB_WORKFLOW ?? '';
  const job = process.env.GITHUB_JOB ?? '';
  const actor = process.env.GITHUB_ACTOR ?? '';

  const authUrl = process.env.AUTH_BASE_URL ?? '';
  const airlinesUrl = process.env.AIRLINES_BASE_URL ?? '';
  const cruisesUrl = process.env.CRUISES_BASE_URL ?? '';

  const envProps = [
    ['GITHUB_REPOSITORY', repo],
    ['GITHUB_REF', ref],
    ['GITHUB_SHA', sha],
    ['GITHUB_RUN_ID', runId],
    ['GITHUB_RUN_ATTEMPT', runAttempt],
    ['GITHUB_WORKFLOW', workflow],
    ['GITHUB_JOB', job],
    ['GITHUB_ACTOR', actor],
    ['AUTH_BASE_URL', authUrl],
    ['AIRLINES_BASE_URL', airlinesUrl],
    ['CRUISES_BASE_URL', cruisesUrl],
    ['NODE_VERSION', process.version],
  ]
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  writeFile(path.join(resultsDir, 'environment.properties'), `${envProps}\n`);

  const executor = {
    name: 'GitHub Actions',
    type: 'github_actions',
    url: runId && repo ? `https://github.com/${repo}/actions/runs/${runId}` : '',
    buildOrder: Number(runAttempt || '1') || 1,
    buildName: workflow ? `${workflow}#${runId || 'local'}` : `github-actions#${runId || 'local'}`,
    reportName: 'LUXE API Tests (Playwright)',
    buildUrl: runId && repo ? `https://github.com/${repo}/actions/runs/${runId}` : '',
  };

  writeFile(path.join(resultsDir, 'executor.json'), `${JSON.stringify(executor, null, 2)}\n`);
}

main();
