const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./src/public/index.publish.tsx",
  output: {
    path: path.resolve(__dirname, "publish", process.env.PUBLISH_PROJECT || "output"),
    filename: "[name].bundle.js",
    chunkFilename: "[name].chunk.js",
    publicPath: "./",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    fallback: {
      path: false,
      fs: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
        exclude: [/node_modules/, /simple-esql/],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.VIBE_PUBLISH_MODE": JSON.stringify("true"),
      "process.env.VIBE_DEPLOY_MODE": JSON.stringify("published"),
      "process.env.PUBLISH_PROJECT": JSON.stringify(process.env.PUBLISH_PROJECT || ""),
      "process.env.PUBLISH_VERSIONS": JSON.stringify(process.env.PUBLISH_VERSIONS || "[]"),
      "process.env.PUBLISH_DISPLAY_NAME": JSON.stringify(process.env.PUBLISH_DISPLAY_NAME || ""),
    }),
    new HtmlWebpackPlugin({
      template: "./src/public/index.html",
      filename: "index.html",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "public/css",
          to: "css",
          noErrorOnMissing: true,
        },
        {
          from: "public/assets",
          to: "assets",
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
  mode: "production",
  performance: {
    hints: false,
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        default: {
          minChunks: 1,
          reuseExistingChunk: true,
        },
      },
    },
  },
  ignoreWarnings: [
    /Critical dependency: the request of a dependency is an expression/,
  ],
};
