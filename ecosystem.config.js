module.exports = {
  apps: [{
    name: 'taskscheduler-api',
    script: './server/src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    // Restart app if memory usage exceeds 1GB
    max_memory_restart: '1G',
    // Wait 3 seconds before restarting
    restart_delay: 3000,
    // Number of consecutive unstable restarts before app is considered errored
    max_restarts: 10,
    // Time in ms to wait before restarting
    min_uptime: 5000,
    // Auto restart if file changes detected
    watch: false,
    // Ignore watch for these paths
    ignore_watch: ['node_modules', 'logs', '.git'],
    // Merge logs
    merge_logs: true,
    // CLI output format
    output: './logs/app.log',
    error: './logs/error.log',
    // Enable log rotation
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Graceful shutdown
    kill_timeout: 5000,
    // Listen for shutdown signal
    listen_timeout: 3000,
    // Environment variables
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001
    }
  }],

  deploy: {
    production: {
      user: 'taskscheduler',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/taskscheduler.git',
      path: '/var/www/taskscheduler',
      'pre-deploy-local': '',
      'post-deploy': 'npm run install-all && cd client && npm run build && cd .. && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}