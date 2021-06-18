import parseBlacklistFile from '../src/blacklist.js'

test('read blacklist file', async () => {
  const result = await parseBlacklistFile('./test/fixtures/email-blacklist.txt')
  expect(result).not.toBeNull()
  expect(result.length).toBe(6)
  expect(result[0]).toBe('*@*livre-rare-book.com*')
  expect(result[3]).toBe('*@localhost.localdomain')
})

test('reading folder instead of a file', async () => {
  let caughtError = false
  try {
    await parseBlacklistFile('./test/fixtures')
  } catch (e) {
    expect(e).toHaveProperty('message', 'path is not a file')
    caughtError = true
  }
  expect(caughtError).toBe(true)
})

test('read not existing blacklist file', async () => {
  let caughtError = false
  try {
    const result = await parseBlacklistFile('./fixtures/not-existing-file.txt')
    expect(result).toBe(undefined)
  } catch (e) {
    expect(e).toHaveProperty('message', 'file not found')
    caughtError = true
  }
  expect(caughtError).toBe(true)
})