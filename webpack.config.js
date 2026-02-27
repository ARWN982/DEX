const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = {
  entry: "./src/public/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist/public"),
    filename: "[name].bundle.js",
    chunkFilename: "[name].chunk.js",
    publicPath: "/",
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
            transpileOnly: false,
          },
        },
        exclude: [
          /node_modules/,
          /simple-esql/,
          /src\/public\/pages\/simple-esql/,
        ],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  plugins: [
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
      ],
    }),
    new MonacoWebpackPlugin({
      languages: ["esql"],
      features: ["!gotoSymbol"],
    }),
  ],
  devServer: {
    static: [
      {
        directory: path.join(__dirname, "dist/public"),
      },
      {
        directory: path.join(__dirname, "public"),
      },
    ],
    port: 3002,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
    historyApiFallback: true,
    hot: true,
    liveReload: true,
    watchFiles: {
      paths: ['src/**/*.ts', 'src/**/*.tsx', 'src/**/*.css'],
      options: {
        ignored: /node_modules/,
      },
    },
  },
  watchOptions: {
    ignored: /node_modules/,
  },
  mode: "development",
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
