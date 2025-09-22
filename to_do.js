import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

const app = express();

app.use(cors());
app.use(bodyParser.json());


app.get('/todos', async (req, res) => {
  try {
    const todos = await sql`SELECT * FROM todos ORDER BY created_at DESC`;
    res.json(todos);
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

app.post('/todos', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const newTodo = await sql`
      INSERT INTO todos (text) VALUES (${text}) RETURNING *;
    `;
    res.status(201).json(newTodo[0]);
  } catch (err) {
    console.error('Error adding todo:', err);
    res.status(500).json({ error: 'Failed to add todo' });
  }
});

app.patch('/todos/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTodo = await sql`
      UPDATE todos
      SET completed = NOT completed
      WHERE id = ${id}
      RETURNING *;
    `;
    res.json(updatedTodo[0]);
  } catch (err) {
    console.error('Error toggling todo:', err);
    res.status(500).json({ error: 'Failed to toggle todo' });
  }
});

app.put('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const updatedTodo = await sql`
      UPDATE todos
      SET text = ${text}
      WHERE id = ${id}
      RETURNING *;
    `;
    res.json(updatedTodo[0]);
  } catch (err) {
    console.error('Error updating todo:', err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});


app.delete('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM todos WHERE id = ${id}`;
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting todo:', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

app.delete('/todos/completed', async (req, res) => {
  try {
    await sql`DELETE FROM todos WHERE completed = TRUE`;
    res.status(204).send();
  } catch (err) {
    console.error('Error clearing completed todos:', err);
    res.status(500).json({ error: 'Failed to clear completed todos' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
