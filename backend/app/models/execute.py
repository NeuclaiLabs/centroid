from pydantic import BaseModel


class HurlExecuteRequest(BaseModel):
    script: str


class HurlExecuteResponse(BaseModel):
    success: bool
    output: list[str]
    exit_code: int
