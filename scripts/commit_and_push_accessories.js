const { execSync } = require('child_process');

function runGit(cwd, cmd) {
  console.log(`[${cwd}] $ ${cmd}`);
  const out = execSync(cmd, { cwd }).toString();
  console.log(out);
  return out;
}

try {
  console.log('--- Committing in manammcare ---');
  runGit('manammcare', 'git add src/data/products.json public/images/products/');
  runGit('manammcare', 'git commit -m "feat(catalog): add 49 accessories and luxury bangles at ₹199 each with HD white-background studio packshots"');
  runGit('manammcare', 'git push');

  console.log('--- Committing in manamm_app ---');
  runGit('manamm_app', 'git add src/data/products/products.json assets/products/');
  runGit('manamm_app', 'git commit -m "feat(catalog): add 49 accessories and luxury bangles at ₹199 each with HD studio packshots"');
  runGit('manamm_app', 'git push');

  console.log('--- Committing in manammcare_backend ---');
  runGit('manammcare_backend', 'git add data/products/products.json scripts/accessories_manifest.json scripts/process_all_49_accessories.js scripts/final_packshots/ scripts/commit_and_push_accessories.js');
  runGit('manammcare_backend', 'git commit -m "feat(catalog): catalog and Cloudinary sync for 49 accessories and luxury bangles at ₹199 each"');
  runGit('manammcare_backend', 'git push');
  
  console.log('=== ALL 3 REPOSITORIES COMMITTED AND PUSHED SUCCESSFULLY ===');
} catch (e) {
  console.error('Git error:', e.message);
  if (e.stdout) console.log('Stdout:', e.stdout.toString());
  if (e.stderr) console.error('Stderr:', e.stderr.toString());
  process.exit(1);
}
