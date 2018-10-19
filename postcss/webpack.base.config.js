const CurrentProjectName = "assessment"; //指定当前的项目名称
const CurrentProjectConfig = require(`../src/projects/${CurrentProjectName}/webpack.project.config.js`);
process.env.CurrentProjectName = CurrentProjectName;

const path = require('path');
const os = require('os');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin'); //css分离
const HappyPack = require('happypack');
var happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });
const CopyWebpackPlugin = require('copy-webpack-plugin'); //复制文件
function resolve (dir) {
    return path.join(__dirname, dir);
}

// 环境判断选择什么样的打包方式
console.log("\033[32m 当前 NODE_ENV => \033[0m" + process.env.NODE_ENV);
console.log("\033[32m 当前 project => \033[0m" + process.env.CurrentProjectName);
let outPutHash = process.env.NODE_ENV == "development" ? CurrentProjectName +"/js/[name].[hash].js" : CurrentProjectName + "/js/[name].[chunkhash].js";

let baseOptions = {
    entry: CurrentProjectConfig.entry,
    output: {
        publicPath: '/',
        path: path.resolve(__dirname, '../dist'),
        filename: outPutHash,
        chunkFilename: outPutHash,
    },
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: {
                    loaders: {
                        css: 'vue-style-loader!css-loader!postcss-loader',
                        less: 'vue-style-loader!css-loader!postcss-loader!less-loader'
                    },
                    postLoaders: {
                        html: 'babel-loader'
                    }
                }
            },
            {
                test: /\.js$/,
                loader: 'happypack/loader?id=happybabel',
                exclude: /node_modules/
            },
            {
                test: /\.js[x]?$/,
                include: [resolve('src')],
                exclude: /node_modules/,
                loader: 'happypack/loader?id=happybabel'
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    use: ['css-loader?minimize','postcss-loader'],
                    fallback: 'style-loader'
                })
            },
            {
                test: /\.less$/,
                use: ExtractTextPlugin.extract({
                    use: ['css-loader?minimize','postcss-loader','less-loader'],
                    fallback: 'style-loader'
                }),
            },
            {
                test: /\.(png|jpg|jpeg|gif)$/i,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 1024,
                            name: CurrentProjectName + "/images/[name].[hash:8].[ext]",
                        }
                    },
                /*    {
                        loader: 'image-webpack-loader',
                        options: {
                            bypassOnDebug: true,
                        },
                    },*/
                ],
            },
            {
                test: /\.(svg|eot|ttf|woff|woff2)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            limit: 8192,
                            name: CurrentProjectName + "/images/[name].[hash:8].[ext]",
                        }
                    },
               /*     {
                        loader: 'image-webpack-loader',
                        options: {
                            bypassOnDebug: true,
                        },
                    },*/
                ],
            },
            {
                test: /\.(html|tpl)$/,
                loader: 'html-loader'
            },
     /*       {
                loader: 'postcss-loader',
                exclude: /node_modules/,
                options: {
                    config: {
                        path: './build/postcss.config.js'
                    }
                }
            }*/
        ]
    },
    plugins: [
        new HappyPack({
            id: 'happybabel',
            loaders: ['babel-loader'],
            threadPool: happyThreadPool,
            verbose: true
        })
    ],
    resolve: {
        extensions: [".js", ".jsx", '.vue', ".css", '.scss', '.less', ".json"],  // 使用的扩展名
        alias: {
            'vue': 'vue/dist/vue.esm.js',
            '@': resolve('../src'),
        }
    }
};

function setCopyWebpackPlugin() {
    //libs目录必须拷贝
    let copyFiles = [
        {
            from:"./src/base/libs",
            to:`./${CurrentProjectName}/libs`
        }
    ]
    let projectFiles = CurrentProjectConfig.copy;
    if(projectFiles){
        for(let i =0; i< projectFiles.length; i++){
            copyFiles.push(projectFiles[i]);
        }
    }
    let copyPlugin = new CopyWebpackPlugin(copyFiles);
        baseOptions.plugins.push(copyPlugin);
}

function setCommonsChunkPlugin() {
    /*是否生成Common.js/common.css（入口模块2个以上时才提取公共模块）*/
    var toggle = true; //默认提取公共模块
    if(typeof CurrentProjectConfig.common === "boolean"){
        toggle = CurrentProjectConfig.common;
    }
    if(!toggle) return;
    var _chunks = [];
    for (let key in CurrentProjectConfig.entry) {
        _chunks.push(key);
    }
    if (_chunks.length > 1) {
        let commonChunk = new webpack.optimize.CommonsChunkPlugin({
            name: "common",
            chunks: _chunks,
            minChunks: _chunks.length
        });
        baseOptions.plugins = baseOptions.plugins.concat(commonChunk);
    }
};

function setHtmlWebpackPlugin() {
    let len = CurrentProjectConfig.pages.length;
    for (let i = 0; i < len; i++) {
        let page = CurrentProjectConfig.pages[i];
        if (len > 1) {
            page.chunks.push("common");
        }
        let htmlPluginsCommon = new HtmlWebpackPlugin({
            /*favicon: './src/img/favicon.ico', //favicon路径，通过webpack引入同时可以生成hash值*/
            projectName: CurrentProjectName,
            template: page.template,
            /*html来源*/
            filename: page.filename,
            /*生成的html存放路径，相对于path*/
            chunks: page.chunks,
            /*需要引入的chunk，不配置就会引入所有页面的资源*/
            inject: 'body',
            /*js插入的位置，true/'head'/'body'/false*/
            hash: false,
            /*为静态资源生成hash值*/
            minify: {
                /*压缩HTML文件*/
                removeComments: false,
                /*移除HTML中的注释*/
                collapseWhitespace: false
                /*删除空白符与换行符*/
            }
        });
        baseOptions.plugins.push(htmlPluginsCommon);
    }
};

function initOptions() {
    setCopyWebpackPlugin();
    setCommonsChunkPlugin();
    setHtmlWebpackPlugin();
}
initOptions();

module.exports = baseOptions;