import { NextRequest } from 'next/server';
import { realtimeEmitter } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection confirmation event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ event: 'connected', timestamp: new Date().toISOString() })}\n\n`)
      );

      // Listen for updates from the global realtime emitter
      const onUpdate = (payload: any) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );
        } catch (err) {
          console.error('SSE enqueue error:', err);
        }
      };

      realtimeEmitter.on('update', onUpdate);

      // Heartbeat interval to keep connection alive
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch (err) {
          // Stream might be closed, clean up interval
          clearInterval(keepAliveInterval);
        }
      }, 15000);

      // Handle connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
        realtimeEmitter.off('update', onUpdate);
      });
    },
    cancel() {
      // Stream cancelled from the client side
      console.log('SSE Stream cancelled');
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
