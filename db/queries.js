const pool = require('./pool');

const createMessagesTable = `CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    message VARCHAR(280) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    parent_message_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);`

const createUsersTable = `CREATE TABLE IF NOT EXISTS users (
   id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
   username VARCHAR(50) UNIQUE, 
   password VARCHAR ( 255 ),
   isMember BOOLEAN,
   isAdmin BOOLEAN,
   CONSTRAINT admin_must_be_member CHECK (NOT isAdmin OR isMember)
);`
//TODO:get a joined table 
async function getMessageWithAuthor() {
    const result = await pool.query(`
    SELECT 
        messages.id, 
        messages.message, 
        messages.created_at,
        messages.edited_at,
        messages.edit_count,
        messages.user_id,
        users.username
    FROM messages
    LEFT JOIN users 
    ON messages.user_id = users.id
    ORDER BY messages.created_at ASC 
    `);
    return result.rows;
}
async function getMessageWithId(id) {
    const result = await pool.query(`
        SELECT id, message, user_id,created_at,parent_message_id
        FROM messages
        WHERE id = $1
        `, [id]);
    return result.rows[0];
}
async function getMessagesWithUserId(user_id) {
    const result = await pool.query(`
        SELECT id, message,created_at, user_id,created_at,parent_message_id
        FROM messages
        WHERE user_id = $1
        ORDER BY messages.created_at ASC
        `, [user_id]);
    return result.rows[0];
}
async function getAllUsersWithStats() {
    const result = await pool.query(`
        SELECT 
            users.id,
            users.username,
            users.ismember,
            users.isadmin,
            COUNT(messages.id) as message_count
        FROM users
        LEFT JOIN messages ON users.id = messages.user_id
        GROUP BY users.id
        ORDER BY users.username
    `);
    return result.rows;
}
async function getUserWithUsername(username) {
    const result = await pool.query(`
        SELECT id, username, password,ismember,isadmin
        FROM users
        WHERE id = $1
        `, [username]);
    return result.rows[0];
}
async function getUserWithId(id) {
    const result = await pool.query(`
        SELECT id, username, password,ismember,isadmin
        FROM users
        WHERE id = $1
        `, [id]);
    return result.rows[0];
}
async function getUserWithUsername(username) {
    const result = await pool.query(`
        SELECT id, username, password,ismember,isadmin
        FROM users
        WHERE username = $1
        `, [username]);
    return result.rows[0];
}

async function promoteToMember(id) {
    const result = await pool.query(`
        UPDATE users
        SET ismember=true
        WHERE id = $1
        `, [id]);
    return result.rows[0];
}
async function demoteFromMember(id) {
    const result = await pool.query(`
        UPDATE users
        SET ismember=false
        WHERE id = $1
        RETURNING *
        `, [id]);
    return result.rows[0];
}
async function insertUserWithUsername(username, password) {
    const result = await pool.query(`
        INSERT INTO users (username, password)
        VALUES ($1, $2)
        RETURNING *
        `, [username, password]);
    return result.rows[0];
}
async function insertMessage(message, user_id) {
    const result = await pool.query(`
        INSERT INTO messages (message,user_id)
        VALUES ($1, $2)
        RETURNING *
        `, [message, user_id]);
    return result.rows[0];
}
async function updateMessageWithId(id, editedMessage) {
    const result = await pool.query(`
        UPDATE messages 
        SET 
            message = $2,
            edited_at = CURRENT_TIMESTAMP,
            edit_count = COALESCE(edit_count, 0) + 1
        WHERE id = $1
        RETURNING *
        `, [id, editedMessage]);
    return result.rows[0];
}
async function deleteMessage(id) {
    const result = await pool.query(`
        DELETE FROM messages 
        WHERE id = $1
        RETURNING *
        `, [id]);
    return result.rows[0];

}
async function getLastMessageByUser(userId) {
    const result = await pool.query(`
        SELECT id 
        FROM messages 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
    `, [userId]);
    return result.rows[0];
}
async function deleteUser(userId) {
    // Delete user (messages will have user_id set to NULL due to ON DELETE SET NULL)
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

async function deleteUserSessions(userId) {
    // Delete all sessions for this user
    await pool.query(`
        DELETE FROM session 
        WHERE sess::jsonb -> 'passport' ->> 'user' = $1
    `, [userId.toString()]);
}
async function promoteToMember(userId) {
    await pool.query(`
        UPDATE users 
        SET ismember = true 
        WHERE id = $1
    `, [userId]);
}
module.exports = {
    promoteToMember,
    deleteUserSessions,
    deleteUser,
    getMessageWithAuthor,
    getLastMessageByUser,
    getMessageWithId,
    getUserWithUsername,
    insertUserWithUsername,
    updateMessageWithId,
    getAllUsersWithStats,
    getUserWithId,
    getUserWithUsername,
    insertMessage,
    deleteMessage,
    promoteToMember,
    demoteFromMember
}
