import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto('http://localhost:3000/')
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

  // End of authentication steps.

  await page.context().storageState({ path: authFile })
})
