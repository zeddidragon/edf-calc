import path from "node:path";
import { fileURLToPath } from "node:url";

// In Node.js versions prior to native support for import.meta.dirname,
// derive __dirname from import.meta.url.
// (Node 20.11+ supports import.meta.dirname and import.meta.filename.)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: "./src/scripts/invaders.coffee",
  mode: 'development',
  resolve: {
    extensions: ['.coffee', '.js'],
  },
  module: {
    rules: [{
      test: /\.coffee$/,
      use: ['coffee-loader'],
    }, {
      test: /\.pug/,
      use: ['pug-loader'],
    }],
  },
  devServer: {
    client: {
      overlay: true,
    },
    port: 9000,
    static: {
      directory: path.join(__dirname, "public"),
    },
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "public"),
  },
  devtool: 'source-map',
};
