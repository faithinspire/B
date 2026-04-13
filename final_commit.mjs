import fs from 'fs';
import path from 'path';

const usersContent = fs.readFileSync('_users_page_new.tsx', 'utf-8');
const verificationContent = fs.readFileSync('_verification_page_complete.tsx', 'utf-8');

const usersPath = path.join('app', '(admin)', 'admin', 'users', 'page.tsx');
const verificationPath = path.join('app', '(admin)', 'admin', 'verification', 'page.tsx');

fs.writeFileSync(usersPath, usersContent);
fs.writeFileSync(verificationPath, verificationContent);

console.log('✅ Files written successfully');
console.log('Users page:', usersPath);
console.log('Verification page:', verificationPath);
