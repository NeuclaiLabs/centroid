import { type FullConfig } from '@playwright/test'
const {
  DockerComposeEnvironment,
  StartedTestContainer
} = require('testcontainers')

let composeEnvironment: typeof DockerComposeEnvironment | null = null

async function globalSetup(config: FullConfig) {
  composeEnvironment = await new DockerComposeEnvironment(
    '../',
    'docker-compose.staging.yml'
  ).up()

  // const { baseURL, storageState } = config.projects[0].use
  // const browser = await chromium.launch()
  // const page = await browser.newPage()
  // await page.goto(baseURL!)
  // await page.getByLabel('User Name').fill('user')
  // await page.getByLabel('Password').fill('password')
  // await page.getByText('Sign in').click()
  // await page.context().storageState({ path: storageState as string })
  // await browser.close()
}

export default globalSetup
