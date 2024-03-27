from ai.tools.duckduckgo_search_tool import DuckDuckGoSearchTool


def test_ddg_basic():
    results = DuckDuckGoSearchTool.run({"query": "zsh command not found"})
    assert len(results) > 0
