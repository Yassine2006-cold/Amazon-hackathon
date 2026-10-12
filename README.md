# StudyFlow

**An Alexa+ inspired study companion that turns a student's assignments into a focused plan.**

StudyFlow is a small Alexa+ hackathon prototype. A student can review assignments, add a deadline, mark work complete, and ask for a study plan that fits the time they have. The web demo and MCP tools share one local task list, so an action taken in either place appears in the other.

The chat is a scripted simulation of an Alexa+ experience; it does not call a live Alexa+ service or an external AI model. The project also includes a real Model Context Protocol (MCP) server with Streamable HTTP transport.

## Run the project

Requirements: Node.js 20 or later. On Windows, use PowerShell or the VS Code integrated terminal.

1. Open a terminal in this project folder.
2. Install the project dependencies once:

   ```powershell
   npm.cmd install
   ```

3. Start the local app and MCP server:

   ```powershell
   npm.cmd run start
   ```

4. Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in a browser.

Keep the terminal open while using the app. Press **Ctrl+C** there to stop it. The server only listens on this computer (`127.0.0.1`); it is a local hackathon demo, not a public deployment.

After `npm.cmd install`, `python App.py` is an optional shortcut that starts the same Node.js server in a separate window and opens the browser for you.

## Demo flow

1. Choose **Show my tasks** to view the assignments stored by the server.
2. Ask **Plan a 45-minute study session** to see a plan based on deadlines and priority.
3. Add a real assignment from the panel and confirm that it appears in the list.
4. Mark a task complete. The list and the next plan update from the same server data.

The task data lives in `tasks.json`. On first start, the server copies sample assignments from `tasks.example.json`. `tasks.json` is excluded from Git so personal tasks are not uploaded.

## MCP tools

The MCP endpoint is `http://127.0.0.1:3000/mcp` (Streamable HTTP). Its tools are:

- `list_tasks` — list all, open, or completed assignments.
- `add_assignment` — save a task with a course, due date, priority, and time estimate.
- `complete_assignment` — mark an assignment complete by its ID.
- `plan_study_session` — select assignments that fit the available study time.

To inspect the tools from another terminal, while the project is running, use:

```powershell
npx.cmd -y @modelcontextprotocol/inspector --cli --transport http --server-url http://127.0.0.1:3000/mcp --method tools/list
```

The server uses the official MCP JavaScript SDK. It does not use the Python MCP package or change Windows security settings.

## How it works

- `mcp-server.mjs` hosts the web page, the same-origin web API, and the MCP endpoint.
- `web/` contains the Alexa+ style chat and assignment interface.
- The web API and MCP tools call the same task functions and save to the same `tasks.json` file.
- `package.json` lists the JavaScript dependencies and start command; `package-lock.json` records the resolved versions.
- `tasks.example.json` provides non-personal example data for a fresh run.

## Hackathon submission checklist

- Enter the **Alexa+** track. This project demonstrates the simulated Alexa+ experience and includes an MCP server.
- Upload the source repository and provide clear setup instructions (the steps above).
- Record a public **English demo video under three minutes**. Show the web experience, then show one MCP tool call working.
- Include a short project description and honest product feedback about the tools used, what worked, and what was difficult.
- Explain what was built or changed during the hackathon period.
- If the repository is public, add an open-source license. If it is private, share it with the reviewers named in the official rules when submitting.

## Project status and limits

This is an educational prototype, not a finished commercial assistant. The local endpoint is not reachable by Alexa+ over the internet, and the chat does not use a live generative AI model. These limits are stated so the demo accurately represents what the code does.
