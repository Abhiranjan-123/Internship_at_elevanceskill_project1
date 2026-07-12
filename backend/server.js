const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Production CORS Configuration: Restricts access to your frontend environments
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://internship-at-elevanceskill-project1.vercel.app'
    ],
    credentials: true
}));

app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Health Check Route to prevent spin-up latency and confirm operational status
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// Fetch Stream Elements
app.get('/api/comments', async (req, res) => {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Submit Structured Record (Authentication Removed)
app.post('/api/comments', async (req, res) => {
    const { content, detected_language, username } = req.body;

    const dangerousPattern = /[<>{}\[\]\\\/]/;
    if (dangerousPattern.test(content)) {
        return res.status(400).json({ error: "Comment blocked: Safe alphanumeric strings only." });
    }

    const mockCities = ["San Francisco", "London", "Tokyo", "Berlin", "Paris", "New Delhi"];
    const randomCity = mockCities[Math.floor(Math.random() * mockCities.length)];

    // Fallback username if none is passed from the frontend
    const finalUsername = username || "anonymous";

    const { data, error } = await supabase
        .from('comments')
        .insert([{
            username: finalUsername,
            content,
            detected_language,
            city_name: randomCity
        }])
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data[0]);
});

// High-Speed Interaction Vote Execution Engine (Authentication Removed)
app.post('/api/comments/:id/vote', async (req, res) => {
    const commentId = req.params.id;
    const { type, ip_address } = req.body; // 'like' or 'dislike'
    const columnTarget = type === 'like' ? 'likes' : 'dislikes';

    try {
        // Fallback tracking identifier since user_id is no longer present
        const voteTracker = ip_address || `anon-${Math.random().toString(36).substr(2, 9)}`;

        // 1. Log unique vote log instantly. Fails immediately if they already voted.
        const { error: voteError } = await supabase
            .from('comment_votes')
            .insert([{ user_id: voteTracker, comment_id: commentId, vote_type: type }]);

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
