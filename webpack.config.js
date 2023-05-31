import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import {resolve} from 'path'

const config = (env, argv)=>{
    let obj = {
        entry: './src/main.js',
        output: {
            path: resolve('./public'),
            publicPath: '',
            filename: "bundle.js"
        },
        mode: argv.mode,
        target: ['web', 'es6'],
        plugins: [],
        optimization: {
            usedExports: true
        },
        devServer: {
            client: {logging: 'warn'},
        },
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    exclude: /(node_modules)/,
                    use: {
                         loader: "ifdef-loader",
                         options: {
                            GUI: !!env.gui
                         }
                    }
                }
            ]
        }
    };
    if(argv.mode === 'production'){
        obj.optimization.minimize = true;
        obj.optimization.minimizer = [new TerserPlugin({
        extractComments: false,
        terserOptions: {format: {comments: false}},
    })];
    }else{
        obj.devtool = "eval-cheap-source-map";
    }
    return obj;
};

export default config;