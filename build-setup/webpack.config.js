const path = require("path");
module.exports = {
  entry: path.join(__dirname, "./index.js"),
  output: {
    path: path.join(__dirname, "..", "public"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        include: [__dirname, path.join(__dirname, "..", "app-code")],
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
  resolve: {
    alias: {
      react: require.resolve("react"),
    },
  },
};
