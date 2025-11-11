import { logInfo } from './utils.js';
import { getHeartbeatIntervalId, setHeartbeatIntervalId } from './peer-state.js';

export const HEARTBEAT_INTERVAL_IN_SECONDS = 60 * 60;
export const HEARTBEAT_MESSAGE_TYPE = 'hinter-core/heartbeat';

export function runHeartbeatForPeerOverConnection(conn, peer, outgoingHyperdrive) {
  let heartbeatIntervalId = getHeartbeatIntervalId(peer);
  if (heartbeatIntervalId) {
    // Make this function idempotent by clearing an existing interval
    clearInterval(heartbeatIntervalId);
  }

  const sendHeartbeat = () => {
    const heartbeatMessage = {
      type: HEARTBEAT_MESSAGE_TYPE,
      outgoingHyperdriveVersion: outgoingHyperdrive.db.version,
    };
    conn.write(JSON.stringify(heartbeatMessage), 'utf8');
    logInfo(`[${peer.alias}] Sent heartbeat (${outgoingHyperdrive.db.version}) to ${peer.alias}`);
  };

  heartbeatIntervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_IN_SECONDS * 1000);
  setHeartbeatIntervalId(peer, heartbeatIntervalId);
  sendHeartbeat();
}

export function pauseHeartbeatForPeer(peer) {
  const heartbeatIntervalId = getHeartbeatIntervalId(peer);
  if (heartbeatIntervalId) {
    clearInterval(heartbeatIntervalId);
    setHeartbeatIntervalId(peer, null);
    logInfo(`[${peer.alias}] Paused heartbeat`);
  }
}

export function isRunningHeartbeatForPeer(peer) {
  return !!getHeartbeatIntervalId(peer);
}
