import { auth } from "./auth";

type Role = 'admin' | 'counter_a' | 'counter_b';

export const withRole = (allowedRoles: Role[]) =>
  (handler: Function) =>
  async (req: Request, ...args: any[]) => {
    const session = await auth();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = (session.user as any)?.role as Role;
    if (!allowedRoles.includes(role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    return handler(req, session, ...args);
  };
