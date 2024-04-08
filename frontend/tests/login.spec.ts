import { test, expect } from '@playwright/test'

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/')
  await page.goto('http://localhost:3000/login')
  await page.getByPlaceholder('Enter your email address').click()
  await page
    .getByPlaceholder('Enter your email address')
    .fill('admin@openastra.com')
  await page.getByPlaceholder('Enter your email address').press('Tab')
  await page.getByPlaceholder('Enter password').fill('openastra123')
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(
    page.getByText(
      'Welcome to Next.js AI Chatbot!This is an open source AI chatbot app template'
    )
  ).toBeVisible()
  await page.getByText('What are thetrending').click()
  await expect(page.getByRole('main')).toContainText(
    'What are the trending memecoins today?'
  )
})
