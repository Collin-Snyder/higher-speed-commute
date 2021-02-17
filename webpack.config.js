const path = require("path");
// import path from "path";
const CopyWebpackPlugin = require("copy-webpack-plugin");
// import CopyWebpackPlugin from "copy-webpack-plugin";

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    main: "./ts/src/main.ts",
    reactApp: "./ts/src/react/index.tsx"
  },
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "[name]-bundle.js",
  },
  resolve: {
    // Add ".ts" and ".tsx" as resolvable extensions.
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loader: "ts-loader", options: { allowTsInNodeModules: true }},
    ],
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: "./html",
      },
      {
        from: "./css",
      },
      { from: "./assets" },
    ]),
  ],
};

