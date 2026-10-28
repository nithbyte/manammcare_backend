import * as bcrypt from 'bcryptjs';

const hash = '$2a$10$bF8BYCDNA.5ABVuIRfw4ZeLKa0vt.YPjBcEap6nwMwGmoOnVRutNW';
const candidates = [
  'Admin@1234', 'Admin@123', 'admin123', 'admin', 'password', '123456', '12345678',
  'Admin', 'admin@123', 'admin@1234', 'Admin123', 'Admin1234', 'manamm', 'manamm123',
  'Manamm@123', 'Manamm@1234', 'Customer@123', 'root', 'superadmin', 'Admin@2024',
  'Admin@2025', 'Admin@2026', 'admin2026', 'admin@manammcare.com', '9888877777',
  'Nithish@123', 'Nithish@1234'
];

async function check() {
  for (const c of candidates) {
    if (await bcrypt.compare(c, hash)) {
      console.log('MATCH FOUND:', c);
      return;
    }
  }
  console.log('NO MATCH in candidates');
}

check();
