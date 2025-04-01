const path = require("path");
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = (env) => {
  const entryFile = env.user_code_file;
  return {
    entry: path.join(__dirname, entryFile),
    output: {
      filename: env.bundle_name,
      path: path.join(__dirname, "..", "public"),
      publicPath: "auto",
    },
    plugins: [
      new ModuleFederationPlugin({
        name: "consumer",
        remotes: {
          main: "var main",
        },
      }),
    ],
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: { presets: ["@babel/preset-react"] },
          },
        },
      ],
    },

    resolve: {
      extensions: [".js", ".jsx"],
    },
    externals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react-dom/client": "ReactDOMClient",
    },
  };
};
