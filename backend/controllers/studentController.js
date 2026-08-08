const pool = require('../config/db');

// 1. Get active and completed elections for students (Auto-completes and syncs with Admin status)
exports.getStudentElections = async (req, res) => {
  const studentId = req.user?.student_id;
  const client = await pool.connect();

  try {
    // පළමුව කාලය ඉක්ම ගිය හෝ Admin විසින් Completed කළ සියලුම මැතිවරණ ඩේටාබේස් එකේ Completed ලෙස නිවැරදි කිරීම
    await client.query(`
      UPDATE elections 
      SET status = 'Completed' 
      WHERE (status ILIKE 'ongoing' AND end_date <= NOW()) OR status ILIKE 'completed';
    `);

    // ඊට පසු සිසුන්ගේ ඩෑෂ්බෝඩ් එකට Ongoing සහ Completed මැතිවරණ ලබා දීම
    const query = `
      SELECT e.election_id, 
             e.title, 
             e.status, 
             e.start_date, 
             e.end_date,
             (SELECT COUNT(*) FROM candidates c WHERE c.election_id = e.election_id) AS total_candidates,
             EXISTS (
               SELECT 1 FROM votes v 
               WHERE v.student_id = $1 AND v.election_id = e.election_id
             ) AS has_voted
      FROM elections e
      WHERE LOWER(e.status) IN ('ongoing', 'completed')
      ORDER BY e.election_id DESC;
    `;
    const result = await client.query(query, [studentId || 0]);
    return res.status(200).json({ success: true, elections: result.rows });
  } catch (err) {
    console.error('Get Student Elections Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch elections.', error: err.message });
  } finally {
    client.release();
  }
};

// 2. Get ballot details and candidates for a specific election (Strict Security Check: Block if completed)
exports.getBallotDetails = async (req, res) => {
  const { electionId } = req.params;
  const studentId = req.user?.student_id;

  try {
    const electionRes = await pool.query('SELECT * FROM elections WHERE election_id = $1', [electionId]);
    if (electionRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Election not found.' });
    }

    const election = electionRes.rows[0];
    const isExpired = new Date(election.end_date) <= new Date();

    // මැතිවරණය Completed වී ඇත්නම් හෝ කාලය ඉවර නම් බැලට් එක ලබා දීම සම්පූර්ණයෙන්ම අවහිර කිරීම
    if (election.status?.toLowerCase() === 'completed' || isExpired) {
      return res.status(400).json({ 
        success: false, 
        message: 'Voting is closed. This election has already completed.' 
      });
    }

    // Candidate List Query
    const candidatesRes = await pool.query(`
      SELECT c.candidate_id, c.election_id, c.post_name, c.party_name,
             COALESCE(sp.name, '') AS candidate_name, sp.student_reg_no
      FROM candidates c
      JOIN student_profiles sp ON c.student_id = sp.student_id
      WHERE c.election_id = $1
      ORDER BY c.post_name, sp.name;
    `, [electionId]);

    let isEligible = true;
    let hasVoted = false;

    if (studentId) {
      const eligibilityRes = await pool.query(
        'SELECT check_voter_eligibility($1, $2) AS is_eligible',
        [studentId, electionId]
      );
      isEligible = eligibilityRes.rows[0]?.is_eligible ?? false;

      const voteCheck = await pool.query(
        'SELECT 1 FROM votes WHERE student_id = $1 AND election_id = $2 LIMIT 1',
        [studentId, electionId]
      );
      if (voteCheck.rows.length > 0) hasVoted = true;
    }

    return res.status(200).json({
      success: true,
      election: election,
      candidates: candidatesRes.rows,
      has_voted: hasVoted,
      is_eligible: isEligible
    });

  } catch (err) {
    console.error('Get Ballot Details Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve ballot data.', error: err.message });
  }
};

// 3. Cast Atomic Vote (Double Protection against Completed Elections)
exports.castVote = async (req, res) => {
  const { election_id, candidate_id, votes } = req.body;
  const studentId = req.user?.student_id;
  const userId = req.user?.user_id;
  const ipAddress = req.ip || '127.0.0.1';

  if (!election_id || (!candidate_id && (!votes || votes.length === 0))) {
    return res.status(400).json({ success: false, message: 'Missing election or candidate selection.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. මැතිවරණයේ තත්ත්වය සහ කාලය දැඩි ලෙස පරීක්ෂා කිරීම (Completed වී ඇත්නම් ඡන්දය දීම සම්පූර්ණයෙන්ම අවහිර කිරීම)
    const electionRes = await client.query(
      `SELECT status, end_date FROM elections WHERE election_id = $1`,
      [election_id]
    );

    if (electionRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Election not found.' });
    }

    const election = electionRes.rows[0];
    const isExpired = new Date(election.end_date) <= new Date();

    if (election.status?.toLowerCase() === 'completed' || isExpired) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Security Exception: Voting is closed. This election has already completed.' 
      });
    }

    // 2. Eligibility Check
    const eligibilityRes = await client.query(
      'SELECT check_voter_eligibility($1, $2) AS is_eligible', 
      [studentId, election_id]
    );
    if (!eligibilityRes.rows[0]?.is_eligible) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Security Breach: Student is not eligible or has already voted.' });
    }

    // 3. Insert Vote(s)
    if (votes && Array.isArray(votes) && votes.length > 0) {
      for (const item of votes) {
        await client.query(
          `INSERT INTO votes (student_id, candidate_id, election_id, voted_at) VALUES ($1, $2, $3, NOW())`,
          [studentId, item.candidate_id, election_id]
        );
      }
    } else {
      await client.query(
        `INSERT INTO votes (student_id, candidate_id, election_id, voted_at) VALUES ($1, $2, $3, NOW())`,
        [studentId, candidate_id, election_id]
      );
    }

    // 4. Update Student Profile Status Flag
    await client.query('UPDATE student_profiles SET has_voted = TRUE WHERE student_id = $1', [studentId]);

    // 5. Audit Trail Insertion
    await client.query(
      'INSERT INTO audit_logs (user_id, action, ip_address) VALUES ($1, $2, $3)',
      [userId, `VOTE_CAST - Vote cast in election ID ${election_id}`, ipAddress]
    );

    await client.query('COMMIT');
    return res.status(200).json({ success: true, message: 'Vote successfully recorded in immutable ledger!' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cast Vote Error:', err);
    return res.status(400).json({ success: false, message: err.message || 'Server error while casting vote.' });
  } finally {
    client.release();
  }
};

// 4. Department Turnout UDF Call: calculate_election_turnout(p_election_id, p_dept_id)
exports.getDepartmentTurnout = async (req, res) => {
  const { departmentId } = req.params;
  const targetDept = parseInt(departmentId || 1, 10);

  try {
    // 1. නවතම / Ongoing මැතිවරණයේ Election ID එක Dynamically ලබා ගැනීම
    const electRes = await pool.query(
      `SELECT election_id FROM elections ORDER BY election_id DESC LIMIT 1`
    );
    const latestElectionId = electRes.rows[0]?.election_id || 1;

    // 2. UDF එකට Real Election ID එක සහ Department ID එක Pass කිරීම
    const resUdf = await pool.query(
      'SELECT calculate_election_turnout($1, $2) AS turnout', 
      [latestElectionId, targetDept]
    );
    
    const turnout = parseFloat(resUdf.rows[0]?.turnout || 0);

    return res.status(200).json({ success: true, department_turnout: turnout });
  } catch (err) {
    console.error('Turnout UDF Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Get Live Election Results / Tally for Students & Admins
exports.getElectionResults = async (req, res) => {
  const { electionId } = req.params;

  try {
    const resultQuery = `
      SELECT 
        c.candidate_id,
        c.post_name,
        c.party_name,
        COALESCE(sp.name, 'Candidate #' || c.candidate_id) AS candidate_name,
        COUNT(v.vote_id) AS vote_count,
        ROUND(
          (COUNT(v.vote_id)::NUMERIC / NULLIF((SELECT COUNT(*) FROM votes WHERE election_id = $1), 0)) * 100, 2
        ) AS percentage
      FROM candidates c
      JOIN student_profiles sp ON c.student_id = sp.student_id
      LEFT JOIN votes v ON c.candidate_id = v.candidate_id AND v.election_id = $1
      WHERE c.election_id = $1
      GROUP BY c.candidate_id, c.post_name, c.party_name, sp.name
      ORDER BY vote_count DESC;
    `;

    const resultsRes = await pool.query(resultQuery, [electionId]);
    const totalVotesRes = await pool.query('SELECT COUNT(*) FROM votes WHERE election_id = $1', [electionId]);

    return res.status(200).json({
      success: true,
      total_votes: parseInt(totalVotesRes.rows[0].count, 10) || 0,
      results: resultsRes.rows
    });
  } catch (err) {
    console.error('Get Election Results Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch election results.', error: err.message });
  }
};