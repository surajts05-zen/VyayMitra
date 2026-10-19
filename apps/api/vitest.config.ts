import { defineConfig } from 'vitest/config';
import ts from 'typescript';

const decoratorMetadataTransform = {
  name: 'typescript-decorator-metadata',
  enforce: 'pre' as const,
  transform(code: string, id: string) {
    if (!/\.(?:ts|tsx)$/.test(id) || id.includes('/node_modules/')) return null;
    const output = ts.transpileModule(code, {
      fileName: id,
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        sourceMap: true,
        inlineSources: true,
      },
    });
    return { code: output.outputText, map: output.sourceMapText || null };
  },
};

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts'],
  },
  plugins: [decoratorMetadataTransform],
});
