module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        }
      }
    ],
    '@babel/preset-typescript'
  ],
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@middlewares': './src/middlewares',
          '@models': './src/models',
          '@providers': './src/providers',
          '@useCases': './src/useCases'
        }
      }
    ]
  ],
  ignore: ['**/*.spec.ts']
};
