// Server-Sent Events emitter — maintains all connected browser clients
// and broadcasts events to all of them.

const clients = new Set();

/**
 * Register a new SSE response object.
 * @param {import('express').Response} res
 */
function addClient(res) {
  clients.add(res);
}

/**
 * Unregister a disconnected client.
 * @param {import('express').Response} res
 */
function removeClient(res) {
  clients.delete(res);
}

/**
 * Broadcast a named event with JSON data to all connected clients.
 * @param {string} eventName
 * @param {object} data
 */
function broadcast(eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch (_) {
      clients.delete(res);
    }
  }
}

module.exports = { addClient, removeClient, broadcast };
