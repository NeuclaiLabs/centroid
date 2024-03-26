from ai.tools.code_execution_tool import CodeExecutionTool


def test_hello_world():
    assert (
        CodeExecutionTool.run(
            {
                "code": 'package main; import "fmt"; func main() { fmt.Println("Hello, World!") }',
                "language": "golang",
            }
        )
        is None
    )
    assert (
        CodeExecutionTool.run(
            {"code": 'fn main() { println!("Hello, World!"); }', "language": "rust"}
        )
        is None
    )
    assert (
        CodeExecutionTool.run({"code": "puts 'Hello, World!'", "language": "ruby"})
        is None
    )
    assert (
        CodeExecutionTool.run(
            {"code": "<?php echo 'Hello, World!'; ?>", "language": "php"}
        )
        is None
    )
    assert (
        CodeExecutionTool.run({"code": "print('hello world')", "language": "Python"})
        is None
    )

    # Additional tests for case-insensitive language handling
    assert (
        CodeExecutionTool.run(
            {"code": 'console.log("Hello, World!")', "language": "JavaScript"}
        )
        is None
    )

    assert (
        CodeExecutionTool.run(
            {
                "code": 'class HelloWorld { static void main(String[] args) { System.out.println("Hello, World!"); } }',
                "language": "JAVA",
            }
        )
        is None
    )


test_hello_world()
