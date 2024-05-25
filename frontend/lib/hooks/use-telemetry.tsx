import { nanoid } from 'nanoid'

interface TelemetryEvent {
  eventType: string
  [key: string]: any // Additional properties can be added here
}
import { camelToSnakeObj, fetcher } from '@/lib/utils'

export const useTelemetry = () => {
  const isDisabled = process.env.NEXT_PUBLIC_DISABLE_TELEMETRY === 'true'
  const deviceId = nanoid()

  const trackEvent = async (event: TelemetryEvent) => {
    if (isDisabled) {
      return
    }

    try {
      const result = await fetcher('https://api2.amplitude.com/2/httpapi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*'
        },
        body: JSON.stringify({
          api_key: 'ef5489b99fbbb64c53c7dc722ddc1d4e',
          events: [camelToSnakeObj({ ...event, deviceId })]
        })
      })
    } catch (err) {
      console.error(err)
    }
  }

  return { trackEvent }
}
