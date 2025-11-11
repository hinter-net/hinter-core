import { getUnixTimestamp } from './utils.js';

const peerStateMap = new Map();

function getPeerState(peer) {
  return (
    peerStateMap.get(peer.alias) ?? {
      incomingHyperdriveKeyHex: null,
      heartbeatIntervalId: null,
      incomingHeartbeat: {
        value: null,
        unixTimestamp: null,
      },
      lastRecordedOutgoingMirror: {
        version: null,
        unixTimestamp: null,
      },
      lastRecordedIncomingMirror: {
        version: null,
        unixTimestamp: null,
      },
    }
  );
}

function setPeerState(peer, produceFn) {
  peerStateMap.set(peer.alias, produceFn(getPeerState(peer)));
}

export const getIncomingHyperdriveKeyHex = (peer) => getPeerState(peer).incomingHyperdriveKeyHex;
export const getHeartbeatIntervalId = (peer) => getPeerState(peer).heartbeatIntervalId;
export const getIncomingHeartbeat = (peer) => getPeerState(peer).incomingHeartbeat;
export const getLastRecordedOutgoingMirror = (peer) => getPeerState(peer).lastRecordedOutgoingMirror;
export const getLastRecordedIncomingMirror = (peer) => getPeerState(peer).lastRecordedIncomingMirror;

export function setIncomingHyperdriveKeyHex(peer, incomingHyperdriveKeyHex) {
  setPeerState(peer, (state) => ({ ...state, incomingHyperdriveKeyHex }));
}

export function setHeartbeatIntervalId(peer, heartbeatIntervalId) {
  setPeerState(peer, (state) => ({ ...state, heartbeatIntervalId }));
}

export function setIncomingHeartbeat(peer, value) {
  setPeerState(peer, (state) => ({
    ...state,
    incomingHeartbeat: { value, unixTimestamp: getUnixTimestamp() },
  }));
}

export function recordOutgoingMirrorSuccess(peer, version) {
  setPeerState(peer, (state) => ({
    ...state,
    lastRecordedOutgoingMirror: { version, unixTimestamp: getUnixTimestamp() },
  }));
}

export function recordIncomingMirrorSuccess(peer, version) {
  setPeerState(peer, (state) => ({
    ...state,
    lastRecordedIncomingMirror: { version, unixTimestamp: getUnixTimestamp() },
  }));
}
