const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();

const allowedOrigins = [
  'https://internship-at-elevanceskill-project.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy alignment settings.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Fetch Stream Elements
app.get('/api/comments', async (req, res) => {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Submit Structured Record
app.post('/api/comments', async (req, res) => {
    const { content, detected_language, username } = req.body;

    const dangerousPattern = /[<>{}\[\]\\\/]/;
    if (dangerousPattern.test(content)) {
        return res.status(400).json({ error: "Comment blocked: Safe alphanumeric strings only." });
    }

    const mockCities = ["San Francisco", "London", "Tokyo", "Berlin", "Paris", "New Delhi"];
    const randomCity = mockCities[Math.floor(Math.random() * mockCities.length)];

    const { data, error } = await supabase
        .from('comments')
        .insert([{
            username: username || "Guest",
            content,
            detected_language,
            city_name: randomCity
        }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

// High-Speed Interaction Vote Execution Engine
app.post('/api/comments/:id/vote', async (req, res) => {
    const commentId = req.params.id;
    const { type } = req.body; 
    const columnTarget = type === 'like' ? 'likes' : 'dislikes';

    try {
        const { error: rpcError } = await supabase.rpc('handle_atomic_vote', {
            target_id: commentId,
            vote_column: columnTarget
        });

        if (rpcError) return res.status(400).json({ error: rpcError.message });

        const { data: updatedComment } = await supabase
            .from('comments')
            .select('*')
            .eq('id', commentId)
            .single();

        if (type === 'dislike' && updatedComment && updatedComment.dislikes >= 2) {
            await supabase.from('comments').delete().eq('id', commentId);
            return res.json({ status: "moderated", message: "Removed due to community flags." });
        }

        res.json(updatedComment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend pipeline live on port ${PORT}`));
