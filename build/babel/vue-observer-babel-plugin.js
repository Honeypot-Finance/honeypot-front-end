const { declare } = require('@babel/helper-plugin-utils')
const t = require('@babel/types')

module.exports = declare((api, options) => {
  api.assertVersion(7)

  return {
    visitor: {
      Program(path) {
        const importDeclaration = t.importDeclaration(
          [
            t.importSpecifier(
              t.identifier('observer'),
              t.identifier('observer')
            ),
          ],
          t.stringLiteral('mobx-vue')
        )

        // 添加 Observer 的导入声明在程序的顶部
        path.node.body.unshift(importDeclaration)
        // path.skip()
      },
      ExportDefaultDeclaration(path) {
        const observedComponent = t.callExpression(t.identifier('observer'), [
          path.node.declaration,
        ])

        // 替换默认导出
        path.replaceWith(t.exportDefaultDeclaration(observedComponent))
        path.skip()
      },
    },
  }
})
