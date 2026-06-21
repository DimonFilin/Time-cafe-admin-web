/** PM2 on VPS: run from ~/timecafe with `pm2 start deploy/ecosystem.config.cjs` */
module.exports = {
  apps: [
    {
      name: 'timecafe-api',
      cwd: './Time-cafe-backend',
      script: 'dist/src/main.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '450M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'timecafe-admin',
      cwd: './Time-cafe-admin-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      instances: 1,
      autorestart: true,
      max_memory_restart: '450M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
