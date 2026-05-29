const path = require('path');
const { execSync } = require('child_process');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env.test') });

module.exports = async function () {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
    cwd: process.cwd(),
  });
};
