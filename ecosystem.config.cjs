module.exports = {
  apps: [
    {
      name: "hris-web-app",
      script: "serve",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
