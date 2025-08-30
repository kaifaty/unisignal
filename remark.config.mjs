/** @type {import('unified').PluggableList} */
export default [
  [import('remark-preset-lint-recommended')],
  [
    await import('remark-validate-links'),
    {
      repository: true,
    },
  ],
]
