const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    main: "./ts/src/main.ts",
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
      { test: /\.tsx?$/, loader: "ts-loader" },
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
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
    new VueLoaderPlugin(),
  ],
};

