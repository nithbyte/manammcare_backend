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
  runGit('manammcare', 'git commit -m "feat(catalog): provide authentic MANAMM pillow pouch images for all 40 manufactured products"');
  runGit('manammcare', 'git push');

  console.log('--- Committing in manamm_app ---');
  runGit('manamm_app', 'git add src/data/products/products.json assets/products/');
  runGit('manamm_app', 'git commit -m "feat(catalog): sync authentic MANAMM pillow pouch packaging assets for all 40 manufactured staples"');
  runGit('manamm_app', 'git push');

  console.log('--- Committing in manammcare_backend ---');
  runGit('manammcare_backend', 'git add data/products/products.json scripts/generate_missing_pouches.js scripts/generated_pouches/ scripts/group_a_uploaded.json scripts/group_b_uploaded.json scripts/git_commit_and_push.js');
  runGit('manammcare_backend', 'git commit -m "feat(catalog): sync Cloudinary pillow pouch packaging URLs for all 40 MANAMM manufactured staples"');
  runGit('manammcare_backend', 'git push');
  
  console.log('=== ALL REPOSITORIES COMMITTED AND PUSHED SUCCESSFULLY ===');
} catch (e) {
  console.error('Git error:', e.message);
  if (e.stdout) console.log('Stdout:', e.stdout.toString());
  if (e.stderr) console.error('Stderr:', e.stderr.toString());
  process.exit(1);
}
