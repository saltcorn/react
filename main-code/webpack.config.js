const path = require("path");
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = async (env) => {
  const userLibMainFile = env.user_lib_main;
  const indexPath = path.join(env.user_lib_path, userLibMainFile);
  return {
    entry: path.join(__dirname, "./index.js"),
    output: {
      path: path.join(__dirname, "..", "public"),
      filename: "bundle.js",
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-react"],
            },
          },
        },
      ],
    },
    plugins: [
      new ModuleFederationPlugin({
        name: "main",
        filename: "main_bundle.js",
        exposes: {
          "./index": indexPath,
          ".": indexPath,
        },
      }),
    ],
    resolve: {
      extensions: [".js", ".jsx"],
    },
  };
};
