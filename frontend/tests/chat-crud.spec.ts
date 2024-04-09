import { test, expect } from '@playwright/test'

test('chat-create', async ({ page }) => {
  let chatText = 'hi'
  await page.goto('http://localhost:3000/')
  await page.getByPlaceholder('Send a message.').fill('hi\n')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(
    page
      .getByRole('main')
      .getByRole('img', { name: 'OpenAstra' })
      .locator('path')
      .first()
  ).toBeVisible()
  await expect(
    page.getByRole('main').getByRole('img', { name: 'OpenAstra' })
  ).toBeVisible()
  // await expect(
  //   page.getByRole('main').getByRole('img', { name: 'UserAvatar' })
  // ).toContainText('hi')
  // await page.getByRole('button', { name: 'Delete' }).click();
  // await page.getByRole('button', { name: 'Delete' }).click();
  // await expect(page.getByRole('main')).toContainText('Welcome to Next.js AI Chatbot!This is an open source AI chatbot app template built with Next.js, the Vercel AI SDK, and Vercel KV.It uses React Server Components to combine text with generative UI as output of the LLM. The UI state is synced through the SDK so the model is aware of your interactions as they happen.');
  // await expect(page.getByText('What are thetrending')).toBeVisible();
})
