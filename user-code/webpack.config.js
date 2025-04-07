const path = require("path");
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = (env) => {
  const entryFile = env.user_code_file;
  const federationName = env.federation_name;
  return {
    entry: path.join(__dirname, entryFile),
    output: {
      filename: env.bundle_name,
      path: path.join(__dirname, "..", "public"),
      publicPath: "auto",
    },
    plugins: [
      new ModuleFederationPlugin({
        name: federationName,
        remotes: {
          main: "var main",
        },
        exposes: {
          "./App": path.join(__dirname, entryFile),
          ".": path.join(__dirname, entryFile),
        },
        filename: `${federationName}_remote.js`,
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
