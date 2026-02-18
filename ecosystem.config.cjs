module.exports = {
  apps: [
    {
      name: "hris-web-app",
      script: "serve",
      args: ["-s", "dist", "-l", "3007"],
      instances: 1, // WAJIB 1
      exec_mode: "fork", // jangan cluster
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
