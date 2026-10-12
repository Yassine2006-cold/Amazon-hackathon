import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler, McpServer } from '@modelcontextprotocol/server';
import express from 'express';
import * as z from 'zod/v4';

const projectDirectory = dirname(fileURLToPath(import.meta.url));
const tasksFile = join(projectDirectory, 'tasks.json');
const examplesFile = join(projectDirectory, 'tasks.example.json');
const port = Number(process.env.PORT ?? 3000);
const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  course: z.string().trim().min(1).max(80),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  estimateMinutes: z.number().int().min(5).max(1000),
});

function readTasks() {
  if (!existsSync(tasksFile)) {
    const examples = JSON.parse(readFileSync(examplesFile, 'utf8'));
    writeFileSync(tasksFile, `${JSON.stringify(examples, null, 2)}\n`, 'utf8');
  }
  return JSON.parse(readFileSync(tasksFile, 'utf8'));
}

function saveTasks(tasks) {
  writeFileSync(tasksFile, `${JSON.stringify(tasks, null, 2)}\n`, 'utf8');
}

function addAssignment(input) {
  const task = { id: randomUUID(), ...input, completed: false };
  const tasks = readTasks();
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

function completeAssignment(id) {
  const tasks = readTasks();
  const task = tasks.find((item) => item.id === id);
  if (!task) return null;
  task.completed = true;
  saveTasks(tasks);
  return task;
}

function makeStudyPlan(availableMinutes) {
  const tasks = readTasks()
    .filter((task) => !task.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || priorityScore(b.priority) - priorityScore(a.priority));

  let remaining = availableMinutes;
  const plannedTasks = [];
  for (const task of tasks) {
    if (task.estimateMinutes <= remaining) {
      plannedTasks.push({ ...task, plannedMinutes: task.estimateMinutes });
      remaining -= task.estimateMinutes;
    }
  }
  return {
    availableMinutes,
    scheduledMinutes: availableMinutes - remaining,
    remainingMinutes: remaining,
    tasks: plannedTasks,
  };
}

function result(message, data) {
  return {
    content: [{ type: 'text', text: `${message}\n${JSON.stringify(data, null, 2)}` }],
    structuredContent: data,
  };
}

function priorityScore(priority) {
  return { high: 3, normal: 2, low: 1 }[priority] ?? 0;
}

const handler = createMcpHandler(() => {
  const server = new McpServer({ name: 'studyflow', version: '1.0.0' });

  server.registerTool(
    'list_tasks',
    {
      description: 'Show StudyFlow assignments, optionally filtering for open or completed tasks.',
      inputSchema: z.object({
        status: z.enum(['all', 'open', 'completed']).default('all'),
      }),
    },
    async ({ status }) => {
      const tasks = readTasks();
      const selected = tasks.filter((task) => {
        if (status === 'open') return !task.completed;
        if (status === 'completed') return task.completed;
        return true;
      });
      return result(`Found ${selected.length} ${status} task(s).`, selected);
    },
  );

  server.registerTool(
    'add_assignment',
    {
      description: 'Add an assignment to the StudyFlow task list.',
      inputSchema: taskInputSchema,
    },
    async (input) => result('Assignment added.', addAssignment(input)),
  );

  server.registerTool(
    'complete_assignment',
    {
      description: 'Mark one assignment as completed using its task ID.',
      inputSchema: z.object({ id: z.string().min(1) }),
    },
    async ({ id }) => {
      const task = completeAssignment(id);
      if (!task) return result('No task has that ID.', { found: false, id });
      return result('Assignment marked completed.', task);
    },
  );

  server.registerTool(
    'plan_study_session',
    {
      description: 'Build a study plan that fits the available time, prioritizing earlier deadlines and higher priority.',
      inputSchema: z.object({ availableMinutes: z.number().int().min(5).max(1440) }),
    },
    async ({ availableMinutes }) => {
      const plan = makeStudyPlan(availableMinutes);
      return result(`Study plan: ${plan.scheduledMinutes} of ${availableMinutes} minutes scheduled; ${plan.remainingMinutes} minutes remain.`, plan);
    },
  );

  return server;
});

const app = createMcpExpressApp();
const nodeHandler = toNodeHandler(handler);
app.all('/mcp', (request, response) => void nodeHandler(request, response, request.body));

// The browser demo calls these small same-origin routes. They use the same
// task functions as the MCP tools, so both experiences share one task list.
app.get('/api/tasks', (_request, response) => response.json(readTasks()));
app.post('/api/tasks', (request, response) => {
  const parsed = taskInputSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid assignment.' });
  return response.status(201).json(addAssignment(parsed.data));
});
app.post('/api/tasks/:id/complete', (request, response) => {
  const task = completeAssignment(request.params.id);
  if (!task) return response.status(404).json({ error: 'Assignment not found.' });
  return response.json(task);
});
app.post('/api/plan', (request, response) => {
  const parsed = z.object({ availableMinutes: z.number().int().min(5).max(1440) }).safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid study time.' });
  return response.json(makeStudyPlan(parsed.data.availableMinutes));
});
app.use(express.static(join(projectDirectory, 'web')));
app.get('/healthz', (_request, response) => response.json({ status: 'ok', name: 'StudyFlow MCP server' }));

app.listen(port, '127.0.0.1', () => {
  console.log(`StudyFlow MCP server ready at http://127.0.0.1:${port}/mcp`);
  console.log('This server is available only from this computer. Keep this window open while using it.');
});
