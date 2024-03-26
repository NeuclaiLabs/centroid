from ai.tools.duckduckgo_search_tool import DuckDuckGoSearchTool


def test_ddg_basic():
    results = DuckDuckGoSearchTool.run("python")
    assert len(results) > 0
