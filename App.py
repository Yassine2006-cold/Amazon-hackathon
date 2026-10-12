"""Start the StudyFlow Node.js server and open its browser interface."""

from pathlib import Path
import shutil
import subprocess
import time
from urllib.error import URLError
from urllib.request import urlopen
from webbrowser import open as open_browser


PROJECT = Path(__file__).parent
URL = "http://127.0.0.1:3000"


def main():
    if not server_is_running():
        node = shutil.which("node")
        if not node:
            raise SystemExit("Node.js was not found. Install Node.js, reopen the terminal, and try again.")

        creation_flags = getattr(subprocess, "CREATE_NEW_CONSOLE", 0)
        subprocess.Popen([node, "mcp-server.mjs"], cwd=PROJECT, creationflags=creation_flags)

    for _ in range(30):
        if server_is_running():
            open_browser(URL)
            print("StudyFlow is open in your browser. Keep the server window open while using it.")
            return
        time.sleep(1)

    raise SystemExit("StudyFlow did not start. Check the Node server window for an error.")


def server_is_running():
    try:
        with urlopen(f"{URL}/healthz", timeout=1) as response:
            return response.status == 200
    except (URLError, TimeoutError):
        return False


if __name__ == "__main__":
    main()
