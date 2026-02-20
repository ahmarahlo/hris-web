module.exports = {
  apps: [
    {
      name: "hris-web-app",
      script: "./node_modules/serve/build/main.js",
      args: ["-s", "dist", "-l", "3007"],
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
