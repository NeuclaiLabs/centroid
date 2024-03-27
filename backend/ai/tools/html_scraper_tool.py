import logging
from typing import List  # noqa: UP035

from fake_useragent import UserAgent
from langchain.pydantic_v1 import BaseModel, Field, HttpUrl
from langchain.tools import StructuredTool
from langchain_community.document_loaders import AsyncHtmlLoader
from langchain_community.document_transformers import Html2TextTransformer

from ai.utils import handle_error

logger = logging.getLogger(__name__)


def scrape_html(urls: list[str]):
    html2text = Html2TextTransformer()

    # Generate a random User-Agent string
    random_ua = UserAgent().random

    # Update the header_template with the random User-Agent
    header_template = {
        "User-Agent": random_ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://www.google.com/",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }

    # Initialize the AsyncHtmlLoader with the updated header_template
    loader = AsyncHtmlLoader(
        web_path=urls,
        header_template=header_template,
    )

    # Load the web pages
    docs = loader.load()
    docs_transformed = html2text.transform_documents(docs)
    return docs_transformed


class HTMLScraperInput(BaseModel):
    urls: List[HttpUrl] = Field(description="The list of urls to be scraped")


HTMLScraperTool = StructuredTool.from_function(
    func=scrape_html,
    name="HTML Scraper Tool",
    description="Scrapes the HTML content from the given list of URLs and returns a structured output.",
    args_schema=HTMLScraperInput,
    return_direct=True,
    handle_tool_error=handle_error,
    # coroutine= ... <- you can specify an async method if desired as well
)
