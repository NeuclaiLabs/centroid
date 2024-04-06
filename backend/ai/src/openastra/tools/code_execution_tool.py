from enum import Enum

from langchain.pydantic_v1 import BaseModel, Field
from langchain.tools import StructuredTool
from openastra.utils import handle_error
from testcontainers.core.container import DockerContainer


class LanguageEnum(str, Enum):
    python = "python"
    javascript = "javascript"
    golang = "golang"
    java = "java"
    rust = "rust"
    ruby = "ruby"
    php = "php"

    @classmethod
    def _missing_(cls, value):
        for member in cls:
            if member.value.lower() == value.lower():
                return member
        raise ValueError(f"{value} is not a valid {cls.__name__}")


class CodeExecutorInput(BaseModel):
    code: str = Field(description="Code snippet that needs to be executed.")
    language: LanguageEnum = Field(description="The language of the code snippet")


def execute_code(code: str, language: str) -> str:
    output = None
    # Determine the Docker image based on the language
    if language.lower() == "python":
        image_name = "python:3.9-slim"
        command = ["python", "-c", code]
    elif language.lower() == "javascript":
        image_name = "node:16-slim"
        command = ["node", "-e", code]
    elif language.lower() == "golang":
        image_name = "golang:1.18-bullseye"
        command = ["/bin/bash", "-c", f'echo "{code}" > code.go && go run code.go']
    elif language.lower() == "java":
        image_name = "openjdk:17-slim"
        command = [
            "/bin/bash",
            "-c",
            f'echo "{code}" > code.java && javac code.java && java code',
        ]
    elif language.lower() == "rust":
        image_name = "rust:1.66-slim"
        command = [
            "/bin/bash",
            "-c",
            f'echo "{code}" > code.rs && rustc code.rs && ./code',
        ]
    elif language.lower() == "ruby":
        image_name = "ruby:3.1-slim"
        command = ["ruby", "-e", code]
    elif language.lower() == "php":
        image_name = "php:8.1-cli"
        command = ["php", "-r", code]
    else:
        raise ValueError(f"Unsupported language: {language}")

    # Run the code in a Docker container
    with DockerContainer(image_name).with_command(" ".join(command)) as container:
        output, stderr = container.get_logs()


CodeExecutionTool = StructuredTool.from_function(
    func=execute_code,
    name="Code Executor",
    description="Execute the code snippet",
    args_schema=CodeExecutorInput,
    return_direct=True,
    handle_tool_error=handle_error,
    # coroutine= ... <- you can specify an async method if desired as well
)
