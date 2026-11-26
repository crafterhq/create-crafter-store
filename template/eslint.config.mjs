import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Product images are hosted wherever the store owner uploaded them, so plain <img> is used
      // instead of next/image (which needs every remote host listed in next.config.ts).
      '@next/next/no-img-element': 'off',
    },
  },
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
];

export default config;
