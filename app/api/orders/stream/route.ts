import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// Only send the fields the UI actually needs — not the entire document
const SSE_PROJECTION = {
  _id: 1,
  orderNumber: 1,
  customerName: 1,
  status: 1,
  totalAmount: 1,
  subtotal: 1,
  items: 1,
  placedAt: 1,
  orderDiscount: 1,
  cancellationReason: 1,
  placedBy: 1,
  deliveredAt: 1,
};

export async function GET(req: NextRequest) {
  // Auth check — only authenticated users can subscribe to order stream
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  let changeStream: any = null;
  let heartbeat: any = null;
  let controller: ReadableStreamDefaultController | null = null;

  const encoder = new TextEncoder();

  const send = (data: string) => {
    try {
      controller?.enqueue(encoder.encode(`data: ${data}\n\n`));
    } catch {
      // Controller already closed
    }
  };

  const cleanup = () => {
    if (heartbeat) { clearInterval(heartbeat); heartbeat = null; }
    if (changeStream) { changeStream.close().catch(() => {}); changeStream = null; }
  };

  const stream = new ReadableStream({
    async start(ctrl) {
      controller = ctrl;

      try {
        await dbConnect();

        // Watch without $project pipeline because it breaks the change event structure
        changeStream = Order.watch(
          [],
          { fullDocument: 'updateLookup', fullDocumentBeforeChange: 'off' }
        );

        changeStream.on('change', (change: any) => {
          try {
            // Strip MongoDB internal fields that bloat the payload
            const payload: any = {
              operationType: change.operationType,
              documentKey: change.documentKey,
            };

            if (change.fullDocument) {
              const strippedDoc: any = {};
              for (const key of Object.keys(SSE_PROJECTION)) {
                if (change.fullDocument[key] !== undefined) {
                  strippedDoc[key] = change.fullDocument[key];
                }
              }
              payload.fullDocument = strippedDoc;
            }
            if (change.updateDescription) {
              payload.updateDescription = change.updateDescription;
            }

            send(JSON.stringify(payload));
          } catch (err) {
            console.error('SSE change event error:', err);
          }
        });

        changeStream.on('error', (err: any) => {
          console.error('Change stream error:', err);
          cleanup();
          // Send a reconnect hint to the client
          send(JSON.stringify({ operationType: 'reconnect' }));
        });

        // Heartbeat every 20s to keep connection alive through proxies/load balancers
        heartbeat = setInterval(() => {
          try {
            controller?.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch {
            cleanup();
          }
        }, 20000);

      } catch (err: any) {
        console.error('SSE stream start error:', err);
        cleanup();
        ctrl.error(err);
      }
    },

    cancel() {
      cleanup();
    },
  });

  req.signal.addEventListener('abort', cleanup);

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
