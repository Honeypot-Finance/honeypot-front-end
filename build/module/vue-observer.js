import path from 'path'
import fg from 'fast-glob'
import webpack from 'webpack'
const vueObserver = function (moduleOptions) {
  this.nuxt.hook('build:before', () => {
    //  this.options.alias['vuetify/lib/compoents'] = path.resolve(__dirname, './generate/vuetify/lib/components')
     const vueFiles = fg.sync(['**/*.vue'], {
      cwd: path.resolve(__dirname, '../../'),
      ignore: ['**/node_modules/**', '**/dist/**'],
      absolute: true,
      })
    //  const vuetifyVueComponentFiles = fg.sync(['V**/*.js'], {
    //   cwd: path.resolve(__dirname, '../../node_modules/vuetify/lib/components'),
    //   absolute: true,
    //   ignore: ['**/index.js', '**/index.js']
    //  })
     this.extendBuild((config ) => {
      config.plugins.push(new webpack.ProvidePlugin({
        'mobxVue': 'mobx-vue',
      }))
      config.module.rules.push({
       // enforce: "post",
       test: /\.js$/,
       loader: 'babel-loader',
       include: [...vueFiles],
       options: {
          plugins: [path.resolve(__dirname, '../babel/vue-observer-babel-plugin.js')],
       }
     })
    })
  })
}


export default vueObserver
