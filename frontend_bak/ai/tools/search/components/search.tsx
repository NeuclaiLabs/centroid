import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import { truncateString } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

type Source = {
  title: string
  description: string
  source: string
  url: string
}

const sources: Source[] = [
  {
    title: "Elon Musk's xAI valued at $24 bln after fresh funding - Reuters",
    description:
      "May 26 (Reuters) - Elon Musk's AI startup xAI raised $6 billion in series B funding, reaching a post-money valuation of $24 billion as investors bet big on challengers to companies like OpenAI in the intensifying AI race.",
    source: 'reuters',
    url: '#'
  },
  {
    title: "Elon Musk's xAI raises $6B from Valor, a16z, and Sequoia",
    description:
      "Elon Musk's AI startup, xAI, has raised $6 billion in a new funding round, it said today, in one of the largest deals in the red-hot nascent space, as he shores up capital to aggressively compete with rivals including OpenAI.",
    source: 'finance.yahoo',
    url: '#'
  },
  {
    title:
      "Elon Musk's xAI raises $6 billion to fund its race against ... - The Verge",
    description:
      'Elon Musk founded xAI last summer, and today it announced raising $6 billion in funding, saying it will help bring the startup’s “first products to market, build advanced infrastructure, and accelerate the research and...',
    source: 'theverge',
    url: '#'
  },
  {
    title: 'Elon Musk raises $6 billion to challenge OpenAI - Axios',
    description:
      "Elon Musk's AI startup — xAI — announced that it has raised $6 billion in one of the largest venture capital funding rounds of all time. Why it matters: This could help Musk begin to catch up with ChatGPT maker OpenAI,...",
    source: 'axios',
    url: '#'
  }
]

interface Result {
  description: string
}

export function Search({ props: results }: { props: Result[] }) {
  const articles = [
    {
      title:
        'Who Won yester IPL Match, RCB Vs KKR? How many times does KKR win?',
      source: 'reuters',
      articles: 10
    },
    {
      title: 'Who Won yester IPL Match, RCB Vs KKR',
      source: 'yahoo',
      articles: 3
    },
    {
      title: 'KKR vs RCB Highlights: Kolkata Knight Riders',
      source: 'financialexpress',
      articles: 3
    }
  ]
  return (
    <div className="mb-4 flex flex-col gap-2 overflow-y-scroll pb-4 text-sm md:flex-row">
      {articles.map(article => (
        <HoverCard key={article.title}>
          <HoverCardTrigger asChild>
            <Card key={article.source} className="flex-col w-full md:w-1/4">
              <CardHeader className="p-3 pb-0">
                <CardTitle className="text-xs font-medium text-wrap">
                  {truncateString(article.title, 40)}
                </CardTitle>
              </CardHeader>
              <CardFooter className="p-3">
                <span className="text-xs text-muted-foreground">
                  {article.source}
                </span>
                <span className="mx-1">·</span>
                <span className="text-xs text-muted-foreground">
                  {article.articles}
                </span>
              </CardFooter>
            </Card>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="flex justify-col space-x-4">
              <div className="space-y-1">
                <h4 className="text-xs text-muted-foreground">
                  {article.source}
                </h4>
                <p className="text-sm font-bold">{article.title}.</p>
                <p className="text-sm ">{article.title}</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      ))}
      <Sheet>
        <SheetTrigger asChild>
          <Card key="rest" className="flex-col w-full md:w-1/4">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs font-medium">Sources</CardTitle>
            </CardHeader>
            <br />
            <CardFooter className="p-3">
              <span className="text-xs text-muted-foreground">View More</span>
            </CardFooter>
          </Card>
        </SheetTrigger>
        <SheetContent className="p-0 overflow-y-auto max-w-[400px] sm:max-w-[540px]">
          <SheetHeader className="p-2">
            <SheetTitle>5 sources</SheetTitle>
            <SheetDescription>Musks xAI raised $6b </SheetDescription>
          </SheetHeader>
          <Separator className="mb-4" />
          <div className="p-4 overflow-y-auto">
            <div className="space-y-4">
              {sources.map((source, index) => (
                <Card key={index} className="flex items-start space-x-4">
                  {/* <Checkbox className="mt-2" /> */}
                  <div>
                    <CardHeader>
                      <CardTitle>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {source.title}
                        </a>
                      </CardTitle>
                      <CardDescription className="text-gray-500">
                        {source.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs text-gray-400">
                      {source.source}
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild></SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
