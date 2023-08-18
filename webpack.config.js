const path = require("path");
// import path from "path";
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CircularDependencyPlugin = require("circular-dependency-plugin");
// import CopyWebpackPlugin from "copy-webpack-plugin";

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    // main: "./ts/src/main.ts",
    main: "./ts/src/react/index.tsx",
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
      // { test: /\.tsx?$/, loader: "ts-loader", options: { allowTsInNodeModules: true }, exclude: ["/node_modules/**/*.ts"]},
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: { allowTsInNodeModules: true },
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "./html",
        },
        {
          from: "./css",
        },
        { from: "./assets" },
      ],
    }),
    new CircularDependencyPlugin({
      // exclude detection of files based on a RegExp
      exclude: /a\.js|node_modules/,
      // add errors to webpack instead of warnings
      failOnError: true,
      // allow import cycles that include an asyncronous import,
      // e.g. via import(/* webpackMode: "weak" */ './file.js')
      allowAsyncCycles: false,
      // set the current working directory for displaying module paths
      cwd: process.cwd(),
    }),
  ],
};
