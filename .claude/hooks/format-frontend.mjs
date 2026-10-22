// PostToolUse hook: formatea con Prettier los archivos editados bajo frontend/src.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const input = JSON.parse(readFileSync(0, 'utf8'))
const file = input.tool_response?.filePath ?? input.tool_input?.file_path
if (!file) process.exit(0)

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
const frontendDir = path.join(projectDir, 'frontend')
const rel = path.relative(path.join(frontendDir, 'src'), path.resolve(file))
if (rel.startsWith('..') || path.isAbsolute(rel)) process.exit(0)

const prettier = path.join(frontendDir, 'node_modules', 'prettier', 'bin', 'prettier.cjs')
execFileSync(process.execPath, [prettier, '--write', '--ignore-unknown', path.resolve(file)], {
  cwd: frontendDir,
  stdio: 'inherit',
})
