const path = require("path");
const { ModuleFederationPlugin } = require("webpack").container;

module.exports = async (env) => {
  console.log("Webpack env", env);
  const userLibMainFile = env.user_lib_main;
  const indexPath =
    userLibMainFile !== "null"
      ? path.join(env.user_lib_path, userLibMainFile)
      : null;
  const tenantName = env.tenant_name || "public";
  const timestamp = env.timestamp;
  return {
    entry: path.join(__dirname, "./index.js"),
    output: {
      path: path.join(__dirname, "..", "public", tenantName),
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
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: "asset/resource",
        },
      ],
    },
    plugins: [
      new ModuleFederationPlugin({
        name: "main",
        filename: `main_bundle_${timestamp}.js`,
        exposes: indexPath
          ? {
              "./index": indexPath,
              ".": indexPath,
            }
          : {
              "./index": path.join(__dirname, "./user-lib-mock.js"),
            },
        shared: {
          react: {
            singleton: true,
            requiredVersion: "^19.0.0",
            eager: true,
          },
          "react-dom": {
            singleton: true,
            requiredVersion: "^19.0.0",
            eager: true,
          },
          "@saltcorn/react-lib": {
            singleton: true,
            requiredVersion: "0.0.1-beta.7",
            eager: true,
          },
        },
      }),
    ],

    resolve: {
      alias: {
        "@user-lib":
          userLibMainFile !== "null"
            ? path.join(env.user_lib_path, userLibMainFile)
            : path.join(__dirname, "user-lib-mock.js"),
        react: path.resolve(__dirname, "../node_modules/react"),
        "react-dom": path.resolve(__dirname, "../node_modules/react-dom"),
        "@saltcorn/react-lib": path.resolve(
          __dirname,
          "../node_modules/@saltcorn/react-lib/dist/",
        ),
        "@saltcorn/react-lib/hooks": path.resolve(
          __dirname,
          "../node_modules/@saltcorn/react-lib/dist/hooks",
        ),
        "@saltcorn/react-lib/components": path.resolve(
          __dirname,
          "../node_modules/@saltcorn/react-lib/dist/components",
        ),
      },
      extensions: [".js", ".jsx"],
    },
  };
};
