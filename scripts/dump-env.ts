import dotenv from 'dotenv';
import fs from 'fs';

// Load envs in the same order as Next.js
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const envStr = JSON.stringify(process.env, null, 2);
fs.writeFileSync('env_dump.json', envStr);
console.log('Environment dumped to env_dump.json');
