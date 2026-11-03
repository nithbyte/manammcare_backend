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
  runGit('manammcare', 'git commit -m "feat: add PP11, PP12, PP13 plus size kurta and palazzo sets at Rs 650 with isolated white background packshots"');
  runGit('manammcare', 'git push');

  console.log('--- Committing in manamm_app ---');
  runGit('manamm_app', 'git add src/data/products/products.json assets/products/');
  runGit('manamm_app', 'git commit -m "feat: add PP11, PP12, PP13 plus size kurta and palazzo sets at Rs 650 with white background packshots"');
  runGit('manamm_app', 'git push');

  console.log('--- Committing in manammcare_backend ---');
  runGit('manammcare_backend', 'git add data/products/products.json scripts/uploaded_dresses_manifest.json scripts/final_packshots/ scripts/git_commit_and_push.js');
  runGit('manammcare_backend', 'git commit -m "feat: catalog PP11, PP12, PP13 plus size kurta sets at Rs 650 with Cloudinary white background packshots"');
  runGit('manammcare_backend', 'git push');
  
  console.log('=== ALL REPOSITORIES COMMITTED AND PUSHED SUCCESSFULLY ===');
} catch (e) {
  console.error('Git error:', e.message);
  if (e.stdout) console.log('Stdout:', e.stdout.toString());
  if (e.stderr) console.error('Stderr:', e.stderr.toString());
  process.exit(1);
}
