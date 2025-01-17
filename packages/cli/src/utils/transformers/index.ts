import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { Project, ScriptKind, type SourceFile } from 'ts-morph'
import type * as z from 'zod'
import type { Config } from '@/src/utils/get-config'
import type { registryBaseColorSchema } from '@/src/utils/registry/schema'
import { transformCssVars } from '@/src/utils/transformers/transform-css-vars'

export interface TransformOpts {
  filename: string
  raw: string
  config: Config
  baseColor?: z.infer<typeof registryBaseColorSchema>
}

export type Transformer<Output = SourceFile> = (
  opts: TransformOpts & {
    sourceFile: SourceFile
  }
) => Promise<Output>

const transformers: Transformer[] = [
  transformCssVars,
]

const project = new Project({
  compilerOptions: {},
})

async function createTempSourceFile(filename: string) {
  const dir = await fs.mkdtemp(path.join(tmpdir(), 'shadcn-'))
  return path.join(dir, filename)
}

export async function transform(opts: TransformOpts) {
  const tempFile = await createTempSourceFile(opts.filename)
  const sourceFile = project.createSourceFile(tempFile, opts.raw, {
    scriptKind: ScriptKind.TSX,
  })

  for (const transformer of transformers)
    transformer({ sourceFile, ...opts })

  // return await transformJsx({
  //   sourceFile,
  //   ...opts,
  // })
}
