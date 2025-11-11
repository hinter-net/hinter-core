import { getIncomingHeartbeat, getLastRecordedIncomingMirror, getLastRecordedOutgoingMirror } from './peer-state.js';
import { getUnixTimestamp, logInfo, sleep } from './utils.js';
import { HEARTBEAT_INTERVAL_IN_SECONDS, isRunningHeartbeatForPeer } from './heartbeats.js';

const STALENESS_CHECK_INTERVAL_IN_SECONDS = HEARTBEAT_INTERVAL_IN_SECONDS / 2;
const GRACE_PERIOD_IN_SECONDS_TO_MIRROR_OUTGOING_DRIVE = 30;
const GRACE_PERIOD_IN_SECONDS_TO_RECEIVE_NEW_HEARTBEAT = 30;
const GRACE_PERIOD_IN_SECONDS_TO_MIRROR_INCOMING_DRIVE = 60;

export async function detectOutgoingStaleness(peer, { mirrorOutgoing, onStaleDriveDetected }) {
  let detected = false;
  while (!detected) {
    await sleep(STALENESS_CHECK_INTERVAL_IN_SECONDS * 1000);
    if (!isRunningHeartbeatForPeer(peer)) {
      continue;
    }

    if (getLastRecordedOutgoingMirror(peer).unixTimestamp + HEARTBEAT_INTERVAL_IN_SECONDS < getUnixTimestamp()) {
      logInfo(`[${peer.alias}] Checking if the outgoing drive version is stale...`);
      // We get the latest outgoing drive version by mirroring, but we don't want to record this
      // mirror action, because we want to know what drive version was last mirrored by the usual
      // change detection mechanism after sleeping for a bit.
      const latestDriveVersion = await mirrorOutgoing({ recordAction: false });
      // We sleep to avoid a potential race condition with the change detection mechanism.
      // E.g. This periodic staleness check could run just after an update is made to the local
      // outgoing directory, but before the outgoing drive has had a chance to mirror. So to avoid
      // a false positive, we first get the latest drive version, and then sleep for a reasonable
      // amount of time that would allow the outgoing drive to have been mirrored.
      await sleep(GRACE_PERIOD_IN_SECONDS_TO_MIRROR_OUTGOING_DRIVE * 1000);
      // If the latest drive version is still greater than the version that was last mirrored by the
      // change detection mechanism, then we know the drive was stale when this periodic staleness
      // check ran.
      if (latestDriveVersion > getLastRecordedOutgoingMirror(peer).version) {
        detected = true;
        onStaleDriveDetected();
        continue;
      }
      logInfo(`[${peer.alias}] Outgoing drive is up to date`);
    }
  }
}

export async function detectIncomingStaleness(peer, { onStaleHeartbeatDetected, onStaleDriveDetected }) {
  let detected = false;
  while (!detected) {
    await sleep(STALENESS_CHECK_INTERVAL_IN_SECONDS * 1000);
    if (!isRunningHeartbeatForPeer(peer)) {
      continue;
    }

    const incomingHeartbeat = getIncomingHeartbeat(peer);
    const nowUnixTimestamp = getUnixTimestamp();
    if (
      incomingHeartbeat.unixTimestamp +
        HEARTBEAT_INTERVAL_IN_SECONDS +
        GRACE_PERIOD_IN_SECONDS_TO_RECEIVE_NEW_HEARTBEAT <
      nowUnixTimestamp
    ) {
      detected = true;
      onStaleHeartbeatDetected();
      continue;
    }

    // If the incoming heartbeat value (i.e. the peer in question's latest drive version) is ahead of
    // the last mirrored drive version, and a reasonable amount of time has passed since we've received
    // the heartbeat (to allow the change detection mechanism to finish mirroring), then we know the
    // drive was stale when this periodic staleness check ran.
    if (
      incomingHeartbeat.value > getLastRecordedIncomingMirror(peer).version &&
      incomingHeartbeat.unixTimestamp + GRACE_PERIOD_IN_SECONDS_TO_MIRROR_INCOMING_DRIVE < nowUnixTimestamp
    ) {
      detected = true;
      onStaleDriveDetected();
      continue;
    }
    logInfo(`[${peer.alias}] Incoming drive is up to date`);
  }
}
