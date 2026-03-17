module.exports = {
  apps: [
    {
      name: "biteshare",
      script: "./dist/app.js",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
