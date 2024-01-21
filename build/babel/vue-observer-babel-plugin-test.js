const fs = require('fs');
const babel = require('@babel/core');
const path = require('path');

// 读取源文件
const filename = 'test.js';
const source = fs.readFileSync(path.resolve(__dirname, filename), 'utf8');

// Babel 转换选项
const options = {
    plugins: [path.resolve(__dirname, 'vue-observer-babel-plugin.js')],
    // 可以在这里添加其他选项和插件
};

// 使用 Babel 进行代码转换
babel.transform(source, options, function(err, result) {
    if (err) {
        // 如果有错误发生，打印到控制台并退出
        console.error(err);
        return;
    }

    // 将结果写入新文件
    const outputFilename = 'output.js';
    fs.writeFileSync(path.resolve(__dirname, outputFilename), result.code, 'utf8');

    console.log(`文件 ${filename} 已被成功转换并保存为 ${outputFilename}`);
});
