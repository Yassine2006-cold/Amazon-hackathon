# Devpost submission draft

## Project name

StudyFlow

## Tagline

Turn a student's assignments into a focused study plan.

## Track

Alexa+ — simulated Alexa+ experience. The app is a local web simulation with a separate MCP server; it is not connected to a live Alexa+ service.

## Project description

StudyFlow is a study companion that helps students decide what to work on next. Students can add assignments with a course, deadline, priority, and time estimate, review open work, mark assignments complete, and request a study plan that fits the time they have. The planner considers deadlines and priority.

The project pairs a browser-based Alexa+ style simulation with a self-hosted Model Context Protocol (MCP) server. The web interface and MCP tools use the same local task data, so an assignment added through either interface is available to the other. The four MCP tools list assignments, add an assignment, mark one complete, and plan a study session. The app runs locally and needs no AWS account or external AI service.

This entry uses the hackathon's simulated Alexa+ path. It does not claim to be a live Alexa+ integration or a production-ready AI assistant.

## What I built during the hackathon

- A browser demo for the StudyFlow student-assistant experience.
- A JavaScript MCP server using Streamable HTTP, with tools for listing, adding, completing, and planning assignments.
- A shared task store used by both the web interface and MCP tools.
- Windows-friendly setup instructions and sample data so reviewers can run the project locally.

## Testing instructions

1. Install Node.js 20 or later.
2. In the project folder, run `npm install` and then `npm start`.
3. Open `http://127.0.0.1:3000`.
4. Use **Show my assignments**, create an assignment, request a study plan, and mark an assignment complete.
5. To inspect the MCP tools, use the MCP Inspector command in the README while the server is running.

The server listens on `127.0.0.1` and is intended for local evaluation. The README contains the full setup instructions.

## Product feedback

### Tools used and what they did

- The official Model Context Protocol JavaScript SDK provides the server and Streamable HTTP endpoint.
- Node.js runs the server and serves the web demo.
- MCP Inspector was used to discover and call the server tools during development.
- A small browser interface demonstrates the simulated Alexa+ experience and shares data with the MCP tools.

### What worked well

The MCP tools give the project a clear interface for assignment management, and MCP Inspector makes it possible to discover and call those tools without a full Alexa+ integration. Keeping the web interface and MCP server on the same local task store made the demo easy to understand and kept the project small.

### What needs work

The Alexa+ add-on developer tools (Category SDK, MCP Toolkit, CLI, and Web Simulator) are not available to hackathon participants, according to the event FAQ. That prevents an independent developer from validating this project end to end inside Alexa+. A clearly labeled public sandbox or an accessible test path would make it easier to build and verify integrations. On Windows, setup guidance should make it especially clear that commands must be run from the project folder.

### Onboarding experience

I got from the project files to a running local demo by installing Node.js dependencies and starting the server. MCP Inspector then let me verify the available tools and try actions against the server. The main setup confusion was running commands from the correct project directory; clearer Windows-first instructions help avoid that.

### Would I build with these tools again?

Yes, for a small educational prototype. The MCP server and Inspector made it practical to build and inspect tool-based workflows. I would want access to a real Alexa+ test environment before claiming or shipping a live Alexa+ integration.

## Optional feature request

**Priority: Nice-to-have.** Provide hackathon participants with a public Alexa+ sandbox or an equivalent integration test path. It would let independent developers validate the customer experience end to end while building against MCP.

## Demo video checklist

Record an English video that is public on YouTube or Vimeo and shorter than three minutes. Show the running browser demo, add or complete an assignment, request a study plan, and show an MCP tool call working. State clearly that the Alexa+ conversation is simulated and that the server runs locally. Use no unlicensed music or third-party footage.

### Suggested 2-minute narration and shots

- **0:00–0:15 — Introduction.** “This is StudyFlow, a study companion that turns assignment deadlines and priorities into a focused plan. This is a simulated Alexa+ experience, running locally.” Show the app and assignment list.
- **0:15–0:40 — Add work.** Add a sample assignment with a course, deadline, priority, and estimate. Show it appear in the list.
- **0:40–1:10 — Make a plan.** Ask for a 45-minute study session. Show the plan and briefly explain that it fits tasks by deadline and priority.
- **1:10–1:25 — Complete a task.** Mark one task complete and show the updated list.
- **1:25–1:50 — Show MCP.** In a second terminal, use MCP Inspector to call `list_tasks` or `plan_study_session`. Show the result from the same task data.
- **1:50–2:00 — Close.** “The browser demo and MCP tools share one local task list. The project includes setup instructions and can be run from the public repository.”

## Submission fields to fill in on Devpost

- GitHub repository: https://github.com/Yassine2006-cold/Amazon-hackathon
- Demo video URL: add after uploading the recording.
- Demo link: the local address is for testing only; do not enter it as a public live demo URL.
- Track: Alexa+.
- Mini challenge: none.
