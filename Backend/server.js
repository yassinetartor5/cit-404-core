const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const db = require('./db_config');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// WebSocket for real-time Operator synchronization
io.on('connection', (socket) => {
    socket.on('join_team', (teamId) => {
        socket.join(`team_${teamId}`);
        console.log(`Operator joined communication channel for Team ${teamId}`);
    });
});

// Phase I: Challenge Submission Engine
app.post('/api/submit-flag', async (req, res) => {
    const { teamId, category, flag } = req.body;
    
    try {
        // Verify flag against the database
        const challenge = await db.query(
            'SELECT reward FROM challenges WHERE flag_answer = $1 AND category = $2', 
            [flag, category]
        );
        
        if (challenge.rows.length > 0) {
            const reward = challenge.rows[0].reward;
            
            // The three Operators share one wallet and CIT$ balance[cite: 2].
            const result = await db.query(
                'UPDATE teams SET cit_balance = cit_balance + $1 WHERE id = $2 RETURNING cit_balance',
                [reward, teamId]
            );
            
            const newBalance = result.rows[0].cit_balance;
            
            // Broadcast the exact new balance to all Operators sharing this account[cite: 2].
            io.to(`team_${teamId}`).emit('wallet_update', { balance: newBalance });
            
            res.json({ success: true, reward, newBalance });
        } else {
            res.status(400).json({ success: false, message: 'INVALID FLAG OR CORRUPTED DATA.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'SYSTEM FAILURE DETECTED.' });
    }
});

// Phase II: Mission Acquisition Engine
app.post('/api/purchase-mission', async (req, res) => {
    const { teamId, missionId, cost, hasInsurance } = req.body;

    try {
        // 1. Check if the team has enough CIT$
        const teamCheck = await db.query('SELECT cit_balance FROM teams WHERE id = $1', [teamId]);
        
        if (teamCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'TEAM NOT FOUND.' });
        }

        const currentBalance = teamCheck.rows[0].cit_balance;

        if (currentBalance >= cost) {
            // 2. Deduct the CIT$ immediately[cite: 2]
            const updateResult = await db.query(
                'UPDATE teams SET cit_balance = cit_balance - $1 WHERE id = $2 RETURNING cit_balance',
                [cost, teamId]
            );
            
            const newBalance = updateResult.rows[0].cit_balance;

            // 3. Record the mission deployment (including insurance status)[cite: 2]
            // Note: Assuming 'missionId' from frontend maps to a string identifier right now, 
            // you may want to map this to the actual missions.id in a production database.
            await db.query(
                'INSERT INTO team_missions (team_id, status, has_insurance) VALUES ($1, $2, $3)',
                [teamId, 'PURCHASED', hasInsurance]
            );

            // 4. Broadcast the deducted balance to all Operators sharing this wallet[cite: 2]
            io.to(`team_${teamId}`).emit('wallet_update', { balance: newBalance });

            res.json({ success: true, newBalance: newBalance });
        } else {
            // Insufficient funds
            res.status(400).json({ success: false, message: 'INSUFFICIENT FUNDS.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'SYSTEM FAILURE DETECTED.' });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`THE CORE IS LISTENING ON PORT ${PORT}`);
});