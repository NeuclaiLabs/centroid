import * as cheerio from "cheerio"

interface Source {
  title: string
  url: string
  description: string
}

export const parseSearchResults = async (
  searchQuery: string
): Promise<Source[]> => {
  const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(
    searchQuery
  )}`

  try {
    const response = await fetch(bingUrl)
    const html = await response.text()

    const $ = cheerio.load(html)
    const searchResults = $(".b_algo")
    const sources: Source[] = []

    searchResults.each((index, element) => {
      const $result = $(element)
      const title = $result.find("h2 a").text()
      const url = $result.find("h2 a").attr("href") || ""
      const description = $result.find(".b_caption p").text()

      sources.push({ title, url, description })
    })

    return sources
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}
