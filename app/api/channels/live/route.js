import { getChannelsLiveSnapshot } from '@/actions/channels';
import { channelsHub } from '@/lib/realtime/channelsHub';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || '';

  const encoder = new TextEncoder();
  let closed = false;
  let keepAlive;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event, data) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const sendSnapshot = async () => {
        const snapshot = await getChannelsLiveSnapshot(userId);
        send('channels', snapshot);
      };

      await sendSnapshot();

      const onUpdate = async () => {
        await sendSnapshot();
      };

      channelsHub.on('channels:update', onUpdate);

      keepAlive = setInterval(() => {
        send('ping', { ts: Date.now() });
      }, 20000);

      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(keepAlive);
        channelsHub.off('channels:update', onUpdate);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
