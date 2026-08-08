const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// 1. Get All Elections (Auto-completes expired elections based on end_date)
exports.getAllElections = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query(`
      UPDATE elections 
      SET status = 'Completed' 
      WHERE status ILIKE 'ongoing' AND end_date <= NOW();
    `);

    const query = `
      SELECT e.election_id, e.title, e.status, 
             e.start_date AS start_time, 
             e.end_date AS end_time,
             (SELECT COUNT(*) FROM candidates c WHERE c.election_id = e.election_id) AS total_candidates,
             (SELECT COUNT(DISTINCT student_id) FROM votes v WHERE v.election_id = e.election_id) AS total_voters
      FROM elections e
      ORDER BY e.election_id DESC;
    `;
    const result = await client.query(query);
    return res.status(200).json({ success: true, elections: result.rows });
  } catch (err) {
    console.error('Get All Elections Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve elections.', error: err.message });
  } finally {
    client.release();
  }
};

// 2. Create Election Cycle (Admin Action)
exports.createElection = async (req, res) => {
  const { title, status, start_date, end_date } = req.body;
  const adminUserId = req.user?.user_id || 1;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Election title is required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = end_date ? new Date(end_date) : new Date(Date.now() + 3 * 60 * 1000);
    const electionStatus = status || 'Upcoming';

    const insertQuery = `
      INSERT INTO elections (title, start_date, end_date, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await client.query(insertQuery, [title, startDate, endDate, electionStatus]);
    const newElection = result.rows[0];

    await client.query(
      `INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, $2, $3);`,
      [adminUserId, `Election '${title}' (ID: ${newElection.election_id}) created with status '${electionStatus}'.`, req.ip || '127.0.0.1']
    );

    await client.query('COMMIT');
    return res.status(201).json({ success: true, message: 'Election created successfully!', election: newElection });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create Election Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create election.', error: err.message });
  } finally {
    client.release();
  }
};

// 3. Delete Election
exports.deleteElection = async (req, res) => {
  const { id } = req.params;
  const adminUserId = req.user?.user_id || 1;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const checkRes = await client.query('SELECT title FROM elections WHERE election_id = $1', [id]);
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Election not found.' });
    }
    const electionTitle = checkRes.rows[0].title;
    await client.query('DELETE FROM elections WHERE election_id = $1', [id]);
    await client.query(
      `INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, $2, $3);`,
      [adminUserId, `Election ID ${id} ('${electionTitle}') was deleted.`, req.ip || '127.0.0.1']
    );
    await client.query('COMMIT');
    return res.status(200).json({ success: true, message: 'Election deleted successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(400).json({ success: false, message: 'Failed to delete election.', error: err.message });
  } finally {
    client.release();
  }
};

// 4. Start Election Cycle (Executes Procedure: initialize_election_cycle)
exports.startElectionCycle = async (req, res) => {
  const { electionId } = req.params;
  const adminUserId = req.user?.user_id || 1;

  try {
    await pool.query('CALL initialize_election_cycle($1, $2)', [parseInt(electionId, 10), adminUserId]);
    return res.status(200).json({
      success: true,
      message: `Procedure 'initialize_election_cycle' executed! Election ID ${electionId} status set to 'Ongoing'.`
    });
  } catch (err) {
    console.error('Start Election Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to initialize election cycle.', error: err.message });
  }
};

// 5. Extend Voting Time (Executes Procedure: bulk_extend_voting_time for Minutes)
exports.extendVotingTime = async (req, res) => {
  const { electionId } = req.params;
  const { extend_minutes, minutes, extend_hours, hours } = req.body;
  const extensionMinutes = parseInt(extend_minutes || minutes || extend_hours || hours || 3, 10);

  try {
    await pool.query('CALL bulk_extend_voting_time($1, $2)', [parseInt(electionId, 10), extensionMinutes]);
    return res.status(200).json({
      success: true,
      message: `Procedure 'bulk_extend_voting_time' executed! Extended by +${extensionMinutes} minutes.`
    });
  } catch (err) {
    console.error('Extend Time Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to extend voting time.', error: err.message });
  }
};

// 6. Complete Election (Manual override by Admin)
exports.completeElection = async (req, res) => {
  const { electionId } = req.params;
  const adminUserId = req.user?.user_id || 1;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      `UPDATE elections SET status = 'Completed' WHERE election_id = $1`,
      [electionId]
    );

    await client.query(
      `INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, $2, $3);`,
      [adminUserId, `Election ID ${electionId} marked as Completed.`, req.ip || '127.0.0.1']
    );

    await client.query('COMMIT');
    return res.status(200).json({ success: true, message: 'Election successfully marked as Completed.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Complete Election Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to complete election.', error: err.message });
  } finally {
    client.release();
  }
};

// 7. Register Candidate
exports.registerCandidate = async (req, res) => {
  const { student_id, election_id, post_name, party_name } = req.body;
  
  if (!student_id || !election_id || !post_name) {
    return res.status(400).json({ success: false, message: 'Missing required candidate details.' });
  }

  try {
    await pool.query(
      `INSERT INTO candidates (student_id, election_id, post_name, party_name) VALUES ($1, $2, $3, $4)`,
      [student_id, election_id, post_name, party_name || 'Independent']
    );
    return res.status(201).json({ success: true, message: 'Candidate registered successfully!' });
  } catch (err) {
    console.error('Register Candidate Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to register candidate.', error: err.message });
  }
};

// 8. Get Leaderboard Data (Executes UDF: get_candidate_vote_count & Calculates Accurate Percentages)
exports.getLeaderboardData = async (req, res) => {
  const { electionId } = req.params;
  try {
    const electionRes = await pool.query(
      'SELECT title, status, end_date FROM elections WHERE election_id = $1', 
      [electionId]
    );
    const election = electionRes.rows[0];

    const query = `
      SELECT c.candidate_id, c.election_id, c.party_name, c.post_name,
             COALESCE(sp.name, '') AS candidate_name, sp.student_reg_no, sp.department_id
      FROM candidates c
      JOIN student_profiles sp ON c.student_id = sp.student_id
      WHERE c.election_id = $1;
    `;
    const result = await pool.query(query, [electionId]);
    const candidates = result.rows;

    // 1. Get Candidate Vote Counts via UDF
    const candidatesWithVotes = await Promise.all(
      candidates.map(async (cand) => {
        let count = 0;
        try {
          const countRes = await pool.query('SELECT get_candidate_vote_count($1) AS vote_count', [cand.candidate_id]);
          count = parseInt(countRes.rows[0]?.vote_count || 0, 10);
        } catch (e) {
          const fallbackCount = await pool.query('SELECT COUNT(*) FROM votes WHERE candidate_id = $1', [cand.candidate_id]);
          count = parseInt(fallbackCount.rows[0]?.count || 0, 10);
        }
        return { ...cand, vote_count: count };
      })
    );

    // 2. Calculate Actual Total Votes Cast in this election
    const realTotalVotes = candidatesWithVotes.reduce((sum, c) => sum + c.vote_count, 0);

    // 3. Compute Percentage for each candidate based on total votes
    const leaderboard = candidatesWithVotes.map((cand) => {
      const pct = realTotalVotes > 0 ? ((cand.vote_count / realTotalVotes) * 100).toFixed(1) : '0.0';
      return { ...cand, percentage: parseFloat(pct) };
    });

    // Sort Leaderboard by Highest Vote Count
    leaderboard.sort((a, b) => b.vote_count - a.vote_count);

    return res.status(200).json({ 
      success: true, 
      election_title: election?.title || `Election ID #${electionId}`,
      election_status: election?.status || 'Unknown',
      total_votes: realTotalVotes,
      leaderboard 
    });
  } catch (err) {
    console.error('Leaderboard Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch leaderboard.', error: err.message });
  }
};

// 9. Get Audit Logs
exports.getAuditLogs = async (req, res) => {
  try {
    const query = `
      SELECT al.log_id, al.user_id, al.action AS action_description, al.ip_address AS client_ip, al.created_at AS timestamp
      FROM audit_logs al
      ORDER BY al.log_id DESC;
    `;
    const result = await pool.query(query);
    return res.status(200).json({ success: true, logs: result.rows });
  } catch (err) {
    console.error('Get Audit Logs Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs.', error: err.message });
  }
};

// 10. Get Verified Voters
exports.getVerifiedVoters = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM student_profiles ORDER BY student_id ASC;`);
    return res.status(200).json({ success: true, voters: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch voters.', error: err.message });
  }
};

// 11. Get Form Data (Student list for modal dropdowns)
exports.getFormData = async (req, res) => {
  try {
    const result = await pool.query(`SELECT student_id, name, student_reg_no FROM student_profiles ORDER BY name ASC;`);
    return res.status(200).json({ success: true, students: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch form data.', error: err.message });
  }
};

// 12. Create Admin Profile
exports.createAdmin = async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const uRes = await pool.query(
      `INSERT INTO users (email, password, user_type) VALUES ($1, $2, 'Admin') RETURNING user_id;`,
      [email.trim().toLowerCase(), hashedPassword]
    );
    const newUserId = uRes.rows[0].user_id;
    await pool.query(
      `INSERT INTO admin_profiles (user_id, username, role) VALUES ($1, $2, $3);`,
      [newUserId, username.trim(), role]
    );
    return res.status(201).json({ success: true, message: `Admin ${username} created successfully!` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create admin.', error: err.message });
  }
};