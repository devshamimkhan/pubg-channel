import { EventEmitter } from 'events';

const KEY = '__PUBG_CHANNELS_HUB__';

function createHub() {
  const emitter = new EventEmitter();
  emitter.setMaxListeners(200);
  return emitter;
}

export const channelsHub = globalThis[KEY] || createHub();
if (!globalThis[KEY]) globalThis[KEY] = channelsHub;

export function publishChannelsUpdate(payload = {}) {
  channelsHub.emit('channels:update', {
    ts: Date.now(),
    ...payload,
  });
}
