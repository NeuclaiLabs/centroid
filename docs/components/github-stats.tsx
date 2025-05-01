import useSWR from 'swr'
import { Star, GitFork, Users } from 'lucide-react'

interface GitHubStats {
  stargazers_count: number
  forks_count: number
  subscribers_count: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatNumber(num: number): string {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`
  }
  return num.toString()
}

export function GitHubStats() {
  const { data, error, isLoading } = useSWR<GitHubStats>(
    'https://api.github.com/repos/NeuclaiLabs/centroid',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  return (
    <div className="flex flex-wrap justify-center gap-8 text-center">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-500" />
        <div>
          <p className="text-2xl font-bold">
            {isLoading ? '...' : error ? '0' : formatNumber(data?.stargazers_count || 0)}
          </p>
          <p className="text-sm text-muted-foreground">GitHub Stars</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <GitFork className="h-5 w-5 text-primary" />
        <div>
          <p className="text-2xl font-bold">
            {isLoading ? '...' : error ? '0' : formatNumber(data?.forks_count || 0)}
          </p>
          <p className="text-sm text-muted-foreground">Forks</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-green-500" />
        <div>
          <p className="text-2xl font-bold">
            {isLoading ? '...' : error ? '0' : formatNumber(data?.subscribers_count || 0)}
          </p>
          <p className="text-sm text-muted-foreground">Watchers</p>
        </div>
      </div>
    </div>
  )
}
