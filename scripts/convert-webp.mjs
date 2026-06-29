import sharp from 'sharp'
import { readdirSync } from 'fs'
import { join, extname, basename } from 'path'

const INPUT_DIR = 'public/emotionsGabi'

const files = readdirSync(INPUT_DIR).filter(f =>
  ['.png', '.jpg', '.jpeg'].includes(extname(f).toLowerCase())
)

for (const file of files) {
  const input = join(INPUT_DIR, file)
  const output = join(INPUT_DIR, basename(file, extname(file)) + '.webp')
  await sharp(input)
    .webp({ quality: 90, lossless: false })
    .toFile(output)
  console.log(`✓ ${file} → ${basename(output)}`)
}

console.log(`\nDone — ${files.length} images converted.`)
