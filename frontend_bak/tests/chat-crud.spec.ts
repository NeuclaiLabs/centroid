import { test, expect, type Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000/')
})

const MESSAGES = ['hi', 'what is 20 plus 30']
test('create a new chat', async ({ page }) => {
  let regex = new RegExp(`^${MESSAGES[0]}$`)
  // Send first message
  await page.getByPlaceholder('Send a message.').fill(MESSAGES[0])
  await page.getByRole('button', { name: 'Send message' }).click()

  // Checking first user message
  await expect(
    page.locator('div').filter({ hasText: regex }).first()
  ).toBeVisible()

  // Check that send message input field is empty
  await expect(page.getByPlaceholder('Send a message.')).toBeEmpty()

  // Checking first bot reply message
  await expect(
    page
      .getByRole('main')
      .getByRole('img', { name: 'OpenAstra' })
      .locator('path')
      .nth(1)
  ).toBeVisible()
  await expect(
    page
      .locator('div')
      .filter({ hasText: /^.*assist.*$/ })
      .first()
  ).toBeVisible()
})

test('add more messages to the chat', async ({ page }) => {
  let regex = new RegExp(`^${MESSAGES[1]}$`)

  await createDefaultChat(page)
  await page.waitForURL('**/chat/**')

  // Send second message
  await page.getByPlaceholder('Send a message.').fill(MESSAGES[1])
  await page.getByRole('button', { name: 'Send message' }).click()

  // Checking second user message
  await expect(
    page.locator('div').filter({ hasText: regex }).first()
  ).toBeVisible()

  // Checking second bot reply
  await expect(
    page
      .getByRole('main')
      .getByRole('img', { name: 'OpenAstra' })
      .locator('path')
      .nth(2)
  ).toBeVisible()
  await expect(
    page
      .locator('div')
      .filter({ hasText: /^.*20.*30.*50.*$/ })
      .first()
  ).toBeVisible()
})

test('delete a chat', async ({ page }) => {
  await createDefaultChat(page)
  await page.waitForURL('**/chat/**')
  await page.getByRole('button', { name: 'Delete' }).click()
  page.on('dialog', dialog => dialog.accept())
  await page.getByRole('button', {name: "Delete"}).click()
  await expect(
    page.getByText(
      'Welcome to Next.js AI Chatbot!This is an open source AI chatbot app template'
    )
  ).toBeVisible()
})
async function createDefaultChat(page: Page) {
  // create a new todo locator
  await page.getByPlaceholder('Send a message.').fill(MESSAGES[0])
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(
    page
      .getByRole('main')
      .getByRole('img', { name: 'OpenAstra' })
      .locator('path')
      .nth(1)
  ).toBeVisible()
  await expect(
    page
      .locator('div')
      .filter({ hasText: /^.*assist.*$/ })
      .first()
  ).toBeVisible()
}
