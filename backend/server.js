const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: 'https://internship-at-elevanceskill-project.vercel.app', // Aapka frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Authentication Verification Middleware
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Authorization credentials absent." });

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return res.status(401).json({ error: "Session authentication expired." });
    
    req.user = user;
    next();
}

// Signup Proxy
app.post('/api/auth/signup', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ session: data.session, user: data.user });
});

// Signin Proxy
app.post('/api/auth/signin', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ session: data.session, user: data.user });
});

// Fetch Stream Elements (Faster due to index setup)
app.get('/api/comments', async (req, res) => {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Submit Structured Record
app.post('/api/comments', requireAuth, async (req, res) => {
    const { content, detected_language } = req.body;

    const dangerousPattern = /[<>{}\[\]\\\/]/;
    if (dangerousPattern.test(content)) {
        return res.status(400).json({ error: "Comment blocked: Safe alphanumeric strings only." });
    }

    const mockCities = ["San Francisco", "London", "Tokyo", "Berlin", "Paris", "New Delhi"];
    const randomCity = mockCities[Math.floor(Math.random() * mockCities.length)];

    const { data, error } = await supabase
        .from('comments')
        .insert([{
            user_id: req.user.id,
            username: req.user.email.split('@')[0],
            content,
            detected_language,
            city_name: randomCity
        }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

// UPGRADED: High-Speed Interaction Vote Execution Engine
app.post('/api/comments/:id/vote', requireAuth, async (req, res) => {
    const commentId = req.params.id;
    const { type } = req.body; // 'like' or 'dislike'
    const columnTarget = type === 'like' ? 'likes' : 'dislikes';

    try {
        // 1. Log unique vote log instantly. Fails immediately if they already voted.
        const { error: voteError } = await supabase
            .from('comment_votes')
            .insert([{ user_id: req.user.id, comment_id: commentId, vote_type: type }]);

        if (voteError) {
            return res.status(400).json({ error: "You have already voted on this comment." });
        }

        // 2. Execute the fast atomic increment function inside the database directly
        const { error: rpcError } = await supabase.rpc('handle_atomic_vote', {
            target_id: commentId,
            vote_column: columnTarget
        });

        if (rpcError) return res.status(400).json({ error: rpcError.message });

        // 3. Fetch the updated state of the comment
        const { data: updatedComment } = await supabase
            .from('comments')
            .select('*')
            .eq('id', commentId)
            .single();

        // 4. Moderate if the comment reaches 2 or more dislikes
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
