import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await dbConnect();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // MongoDB Change Stream
      const changeStream = Order.watch([], { fullDocument: 'updateLookup' });

      changeStream.on('change', (change) => {
        const data = JSON.stringify(change);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 30000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        changeStream.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
