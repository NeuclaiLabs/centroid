import { type FullConfig } from '@playwright/test'
const { DockerComposeEnvironment } = require('testcontainers')

let composeEnvironment: typeof DockerComposeEnvironment | null = null

async function globalTeardown(config: FullConfig) {
  if (composeEnvironment) {
    await composeEnvironment.down({ timeout: 20000, removeVolumes: false  })
  }
}

export default globalTeardown
