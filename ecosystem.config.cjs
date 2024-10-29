module.exports = {
  apps: [
    {
      name: "store-hub-api",
      script: "yarn",
      args: "start",
      cwd: "./", 
      instances: 1,
      exec_mode: "fork", 
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};