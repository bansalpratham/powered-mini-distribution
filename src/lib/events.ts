import { EventEmitter } from 'events';

class RealtimeEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  emitUpdate(event: string, data: any) {
    // 1. Emit to local EventEmitter (for Server-Sent Events)
    this.emit('update', { event, data });

    // 2. Emit to globally cached Socket.IO server if active
    if (global.socketIOInstance) {
      console.log(`[Realtime Emitter] Emitting '${event}' to Socket.IO clients.`);
      global.socketIOInstance.emit(event, data);
    } else {
      console.log(`[Realtime Emitter] SSE emitted. Socket.IO is not yet initialized by client.`);
    }
  }
}

// Ensure the emitter is cached globally so it's a singleton even with Next.js HMR
interface GlobalRealtime {
  emitter: RealtimeEmitter | null;
}

declare global {
  // eslint-disable-next-line no-var
  var realtimeCached: GlobalRealtime;
  // eslint-disable-next-line no-var
  var socketIOInstance: any;
}

let cached = global.realtimeCached;

if (!cached) {
  cached = global.realtimeCached = { emitter: null };
}

if (!cached.emitter) {
  cached.emitter = new RealtimeEmitter();
}

export const realtimeEmitter = cached.emitter;
