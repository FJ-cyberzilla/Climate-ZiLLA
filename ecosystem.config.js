module.exports = {
  apps: [{
    name: 'climate-zilla-api',
    script: './server/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      NODE_OPTIONS: '--max-old-space-size=4096'
    },
    // Resource management
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=4096',
    
    // Logging
    log_file: './logs/api-combined.log',
    out_file: './logs/api-out.log',
    error_file: './logs/api-error.log',
    time: true,
    
    // Monitoring
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    
    // Health check
    health_check_url: 'http://localhost:3001/health',
    health_check_grace_period: 3000,
    
    // Restart strategies
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Additions for enterprise
    kill_timeout: 5000,
    listen_timeout: 3000,
    wait_ready: true
  }, {
    name: 'climate-zilla-frontend',
    script: 'node_modules/vite/bin/vite.js',
    args: 'preview --port 3000 --host',
    instances: 1,
    env: {
      NODE_ENV: 'production'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    // Resource management
    max_memory_restart: '512M',
    
    // Logging
    log_file: './logs/frontend-combined.log',
    out_file: './logs/frontend-out.log',
    error_file: './logs/frontend-error.log',
    time: true
  }],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'https://github.com/FJ-cyberzilla/climate-zilla.git',
      path: '/var/www/climate-zilla',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get install git',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
}
