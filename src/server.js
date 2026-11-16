import express from 'express';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const dataDir = process.env.DATA_DIR ?? 'data';
const file = join(dataDir, 'deadlines.json');

mkdirSync(dataDir, { recursive: true });
let deadlines = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];

function save(items) {
  writeFileSync(`${file}.tmp`, JSON.stringify(items, null, 2));
  renameSync(`${file}.tmp`, file);
  deadlines = items;
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

app.disable('x-powered-by');
app.set('json spaces', 2);
app.use(express.json({ limit: '16kb' }));

app.get('/', (req, res) => {
  res.json({
    name: 'campus deadline api',
    routes: ['GET /deadlines', 'POST /deadlines', 'PATCH /deadlines/:id', 'DELETE /deadlines/:id', 'GET /health']
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/deadlines', (req, res) => {
  const { status } = req.query;
  if (status !== undefined && status !== 'open' && status !== 'done') {
    return res.status(400).json({ error: 'status must be open or done' });
  }

  const items = deadlines.filter(item => status === undefined || item.done === (status === 'done'));
  res.json(items.sort((a, b) => a.due.localeCompare(b.due)));
});

app.post('/deadlines', (req, res) => {
  const { title, course, due } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim() || title.length > 120 ||
      typeof course !== 'string' || !course.trim() || course.length > 80 || !validDate(due)) {
    return res.status(400).json({ error: 'enter a title up to 120 characters a course up to 80 characters and a due date as yyyy-mm-dd' });
  }

  const item = { id: randomUUID(), title: title.trim(), course: course.trim(), due, done: false };
  save([...deadlines, item]);
  res.status(201).json(item);
});

app.patch('/deadlines/:id', (req, res) => {
  const item = deadlines.find(deadline => deadline.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'deadline not found' });
  if (typeof req.body?.done !== 'boolean') return res.status(400).json({ error: 'done must be true or false' });

  const updated = { ...item, done: req.body.done };
  save(deadlines.map(deadline => deadline.id === item.id ? updated : deadline));
  res.json(updated);
});

app.delete('/deadlines/:id', (req, res) => {
  const items = deadlines.filter(item => item.id !== req.params.id);
  if (items.length === deadlines.length) return res.status(404).json({ error: 'deadline not found' });

  save(items);
  res.sendStatus(204);
});

app.use((req, res) => res.status(404).json({ error: 'route not found' }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'invalid json' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'request is too large' });
  console.error(err);
  res.status(500).json({ error: 'something went wrong' });
});

const server = app.listen(port, '0.0.0.0', () => console.log(`campus deadline api is listening on port ${port}`));
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
