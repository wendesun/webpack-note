module.exports = {
    plugins: [
        require('postcss-import'),
        require('autoprefixer')({
            "browsers": [
                "defaults",
                "not ie < 11",
                "last 2 versions",
                "> 1%",
                'Android >= 4.0',
                'iOS >= 6.0'
            ]
        }),
        require('cssnano'),
    ]
};