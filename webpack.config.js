const path = require("path");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = function(env, argv) {
    const buildType = argv.buildType;
    const isProd = buildType === 'prod';
    let config = {
        entry: {
            index: "./src/index.js",
            store: "./test/store.js"
        },
        output: {
            path: path.resolve(__dirname, "build"),
            filename: "[name].js",
            library: "zMultiCache",
            libraryTarget: "umd",
            umdNamedDefine: true
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env"],
                            plugins: ["@babel/plugin-proposal-class-properties"]
                        }
                    }
                }
            ]
        },
        plugins: [
            new CleanWebpackPlugin(["build", "prod"]),
            new HtmlWebpackPlugin({
                title: 'Test',
                template: 'template.html',
                filename: '../html/store.html',
                bundle: 'store'
            })
        ],
        resolve: {
            extensions: [".", ".js"],
            alias: {
                "@src": path.resolve(__dirname, "src"),
                "@storages": path.resolve(__dirname, "src/storages")
            }
        },
        devtool: "source-map",
        mode: "development"
    };

    if (isProd) {
        config.optimization = {
            minimize: true
        };
        config.output.path = path.resolve(__dirname, "lib");
    }
    return config;
};
