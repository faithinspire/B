import fs from 'fs';
import path from 'path';

const usersContent = fs.readFileSync('_tmp_users_page.tsx', 'utf-8');
const verificationContent = fs.readFileSync('_tmp_verification_page.tsx', 'utf-8');

const usersPath = path.join('app', '(admin)', 'admin', 'users', 'page.tsx');
const verificationPath = path.join('app', '(admin)', 'admin', 'verification', 'page.tsx');

fs.writeFileSync(usersPath, usersContent);
fs.writeFileSync(verificationPath, verificationContent);

console.log('Files written successfully');
