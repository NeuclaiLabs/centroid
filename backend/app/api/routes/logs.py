import asyncio
import os
import subprocess
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.api.deps import CurrentUser
from app.core.logger import get_logger, get_logger_config

router = APIRouter()

logger_config = get_logger_config()
LOG_DIR = Path(logger_config["log_dir"])
logger = get_logger(__name__)


async def build_log_command(
    file_path: str,
    max_lines: int | None = None,
    since: datetime | None = None,
    follow: bool = False,
) -> list[str]:
    """
    Build command for filtering logs based on criteria.
    If a timestamp is provided, finds the appropriate line number to start from.

    Args:
        file_path: Path to the log file
        max_lines: Maximum number of lines to return
        since: Timestamp to start reading from
        follow: Whether to follow the log file

    Returns:
        List representing the command to execute
    """
    cmd = ["tail"]
    line_number = None

    # If a timestamp is provided, find the corresponding line number
    if since is not None:
        try:
            # Run grep to find the line number
            grep_cmd = ["grep", "-a", "-n", since, file_path]
            process = await asyncio.create_subprocess_exec(
                *grep_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await process.communicate()

            # Parse the output to get the line number
            if stdout:
                # Format is "line_num:content"
                line = stdout.decode().split("\n")[0]
                line_number = int(line.split(":", 1)[0])
            else:
                line_number = None  # Default to beginning of file if not found
        except Exception as e:
            logger.error(f"Error finding timestamp line: {e}")
            line_number = None  # Default to beginning of file on error

    # Build the tail command based on line number or max_lines
    if line_number and line_number > 1:
        # Use "+" to start from specific line number
        cmd.extend(["-n", f"+{line_number + 1}"])
    elif max_lines is not None:
        # Only use max_lines if not starting from a specific line
        cmd.extend(["-n", str(max_lines)])

    if follow:
        cmd.append("-f")

    cmd.append(file_path)
    return cmd


async def async_tail_file(file_path, max_lines=None, since=None):
    """
    Asynchronously stream the content of a file using command line tools.
    """
    file_path_str = str(file_path)
    process = None

    if not os.path.exists(file_path_str):
        yield f"Log file not found: {file_path_str}\n".encode()
        return

    try:
        # Build command using the timestamp if provided
        cmd = await build_log_command(file_path_str, max_lines, since, follow=True)

        # Create a subprocess that we can communicate with asynchronously
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        # Store pid early for reliable logging
        pid = process.pid

        # Using asyncio to read lines asynchronously
        while True:
            # Read a line from stdout asynchronously
            line = await process.stdout.readline()
            if not line:  # EOF reached
                break

            # Make sure we're yielding proper bytes
            if isinstance(line, str):
                line = line.encode("utf-8")

            # Yield the line to the client immediately
            yield line

            # Ensure proper flushing by yielding a small delay
            await asyncio.sleep(0.01)

        # Check if there are any errors from stderr after stdout closes
        if process.stderr:
            async for err_line in process.stderr:
                if isinstance(err_line, str):
                    err_line = err_line.encode("utf-8")
                yield err_line
    except asyncio.CancelledError:
        # Handle cancellation (e.g., client disconnects)
        log_pid = pid if "pid" in locals() else (process.pid if process else "N/A")
        print(
            f"Stream cancelled for {file_path_str}, PID {log_pid}. Terminating process."
        )
        if process and process.returncode is None:
            try:
                process.terminate()
                # Wait for a short period for graceful termination
                await asyncio.wait_for(process.wait(), timeout=2.0)
                print(f"Process {log_pid} terminated after cancellation.")
            except ProcessLookupError:
                print(f"Process {log_pid} already exited (on cancel).")
            except asyncio.TimeoutError:
                print(f"Timeout terminating process {log_pid} on cancel, killing.")
                if process.returncode is None:  # Check if kill is still needed
                    process.kill()
                    await process.wait()  # Wait for kill to complete
                    print(f"Process {log_pid} killed after timeout on cancel.")
            except Exception as e:
                print(f"Error during process termination for {log_pid} on cancel: {e}")
        raise
    finally:
        # Make sure the process is cleaned up if it was started and is still running
        if process and process.returncode is None:
            log_pid_final = (
                pid if "pid" in locals() else (process.pid if process else "N/A")
            )
            print(
                f"Final cleanup: Terminating process {log_pid_final} for {file_path_str}."
            )
            try:
                process.terminate()
                await process.wait()  # Wait for termination
                print(f"Process {log_pid_final} terminated in finally block.")
            except ProcessLookupError:
                print(f"Process {log_pid_final} already exited (in finally).")
            except Exception as e:
                print(f"Error during final termination of process {log_pid_final}: {e}")
                # Fallback kill if terminate failed and process might still be running
                if process.returncode is None:
                    try:
                        print(
                            f"Final cleanup: Attempting kill for process {log_pid_final}."
                        )
                        process.kill()
                        await process.wait()
                        print(f"Process {log_pid_final} killed in finally block.")
                    except Exception as e_kill:
                        print(
                            f"Final cleanup: Error during kill attempt for {log_pid_final}: {e_kill}"
                        )


def tail_file_sync(file_path, max_lines=None):
    """
    Synchronous version for non-follow mode.
    """
    file_path_str = str(file_path)

    if not os.path.exists(file_path_str):
        yield f"Log file not found: {file_path_str}\n".encode()
        return

    try:
        # Build the tail command
        cmd = ["tail"]
        if max_lines is not None:
            cmd.extend(["-n", str(max_lines)])
        cmd.append(file_path_str)

        # Run the command and capture output
        result = subprocess.run(cmd, capture_output=True, check=True)

        # Return the output
        yield result.stdout

        # Yield stderr if any
        if result.stderr:
            yield result.stderr
    except Exception as e:
        yield f"Error reading log file: {e}\n".encode()


@router.get("/stream")
async def stream_logs(
    current_user: CurrentUser,  # noqa: ARG001
    log_file: str = Query(
        "app.log", description="Name of the log file to stream (will use JSON format)"
    ),
    max_lines: int | None = Query(
        100, description="Number of initial lines to return (0 for all)"
    ),
    follow: bool = Query(
        True, description="Whether to follow the log file as it grows"
    ),
    since: str | None = Query(
        None,
        description="Only return logs newer than this ISO timestamp (e.g. '2023-04-01T12:00:00Z')",
    ),
) -> StreamingResponse:
    """
    Stream JSON logs from a file in real-time.

    - max_lines: number of initial lines to return
    - follow: whether to follow the log file as it grows
    - since: only return logs newer than this ISO timestamp (e.g. '2023-04-01T12:00:00Z')

    ```bash
    # View the last 10 lines and follow new content
    curl -N "http://localhost:8000/api/v1/logs/stream?log_file=app.log&max_lines=10&follow=true"

    # View logs since a specific timestamp
    curl -N "http://localhost:8000/api/v1/logs/stream?log_file=app.log&since=2023-04-01T12:00:00Z"

    # View the entire log file without following
    curl "http://localhost:8000/api/v1/logs/stream?log_file=app.log&max_lines=1000&follow=false"
    ```
    """
    # Ensure the log file has .json extension
    if not log_file.endswith(".json"):
        log_file = f"{log_file}.json"

    log_path = LOG_DIR / log_file
    # logger.info(f"Streaming JSON log from: {log_path} (since: {since})")

    # Choose the appropriate streaming method based on follow mode
    generator = (
        async_tail_file(log_path, max_lines, since)
        if follow
        else tail_file_sync(log_path, max_lines, since)
    )

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/files")
async def list_log_files():
    """
    Get a list of available log files.

    Returns:
        list: List of log file names
    """
    try:
        # Get all files in the log directory
        files = [f.name for f in LOG_DIR.glob("*.json")]

        # If there are no JSON files, check for regular log files as well
        if not files:
            files = [f.name for f in LOG_DIR.glob("*.log")]

        # Add any other common log files that might be present
        for ext in ["log", "txt"]:
            for common_name in ["app", "error", "access", "debug", "system"]:
                potential_file = f"{common_name}.{ext}"
                if (LOG_DIR / potential_file).exists() and potential_file not in files:
                    files.append(potential_file)

        # Sort files alphabetically
        files.sort()

        return files
    except Exception as e:
        print(f"Error listing log files: {e}")
        return []
