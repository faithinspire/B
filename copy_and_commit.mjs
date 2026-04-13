import fs from 'fs';
import path from 'path';

const usersContent = fs.readFileSync('_users_page_new.tsx', 'utf-8');

const usersPath = path.join('app', '(admin)', 'admin', 'users', 'page.tsx');

fs.writeFileSync(usersPath, usersContent);

console.log('Files written successfully');
