#!/usr/bin/env node
const { spawnSync } = require('child_process');

const script = process.argv[2];
const args = process.argv.slice(3);

switch (script) {
case 'build':
  var result = spawnSync(
    'node',
    [require.resolve(`../scripts/${script}`)].concat(args),
    {
      stdio: 'inherit',
      shell: true, // Work on Unix or Windows (hopefully)
    }
  );
  process.exitCode = result.status;
  break;
case 'eject': // TODO
case 'start': // TODO
case 'test': // TODO
  console.log(`Script "${script}" is not yet ready. It is still under development.`);
  console.log('Check the repo for updates');
  break;
default:
  console.log(`Unknown script "${script}".`);
  console.log('Perhaps you need to update app-time?');
  break;
}
