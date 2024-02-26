import path from 'path'
import { exec } from 'child_process'

test('parse text file', async () => {
  let result = await cli(
    [
      'test/fixtures/quota_20210618-1616.txt'
    ], '.')
  expect(result.code).toBe(0)
  expect(result.error).toBeNull()
  expect(result.stdout).toBeDefined()

  const emails = result.stdout.split('\n')
  expect(emails.length).toBe(9)
  expect(emails[0]).toBe('mailer-daemon@livre-rare-book.com')
  expect(emails[7]).toBe('deslivressuper@icilesmail.com')
  expect(emails[8]).toHaveLength(0) // because of last \n and the split call
})

test('parse text file with blacklist file', async () => {
  let result = await cli(
    [
      'test/fixtures/quota_20210618-1616.txt',
      '--blacklist',
      './test/fixtures/email-blacklist.txt'
    ], '.')
  expect(result.code).toBe(0)
  expect(result.error).toBeNull()
  expect(result.stdout).toBeDefined()

  const emails = result.stdout.split('\n')
  expect(emails.length).toBe(6)
  expect(emails[0]).toBe('welala.jose@testmail.com')
  expect(emails[4]).toBe('deslivressuper@icilesmail.com')
  expect(emails[5]).toHaveLength(0) // because of last \n and the split call
})

test('parse text file with invalid blacklist file', async () => {
  let result = await cli(
    [
      'test/fixtures/quota_20210618-1616.txt',
      '--blacklist',
      './not-existing-file.txt'
    ], '.')
  expect(result.code).toBe(10)
  expect(result.stderr.trim()).toBe('blacklist file not found : ./not-existing-file.txt')
})

function cli (args, cwd) {
  return new Promise(resolve => {
    exec(`node ${path.resolve('./src/text-email-extractor')} ${args.join(' ')}`,
      { cwd },
      (error, stdout, stderr) => {
        resolve({
          code: error && error.code ? error.code : 0,
          error,
          stdout,
          stderr
        })
      })
  })
}
