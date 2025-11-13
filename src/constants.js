// Peer messages
export const KEY_EXCHANGE_MESSAGE_TYPE = 'hinter-core/share-drive-key';
export const HEARTBEAT_MESSAGE_TYPE = 'hinter-core/heartbeat';

// Heartbeats
export const HEARTBEAT_INTERVAL_IN_SECONDS = 60 * 60;

// Stale detection
export const STALENESS_CHECK_INTERVAL_IN_SECONDS = 30 * 60;
export const GRACE_PERIOD_IN_SECONDS_TO_MIRROR_OUTGOING_DRIVE = 30;
export const GRACE_PERIOD_IN_SECONDS_TO_RECEIVE_NEW_HEARTBEAT = 45;
export const GRACE_PERIOD_IN_SECONDS_TO_MIRROR_INCOMING_DRIVE = 60;
export const PERIODIC_MIRROR_INTERVAL_IN_SECONDS = 5 * 60;
