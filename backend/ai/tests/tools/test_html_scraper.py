from ai.tools.html_scraper_tool import HTMLScraperTool


def test_ddg_basic():
    results = HTMLScraperTool.run({"urls": ["http://www.bing.com"]})
    assert len(results) > 0
