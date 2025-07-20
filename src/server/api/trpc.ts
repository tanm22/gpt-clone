import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { createClient } from '@/lib/supabase/server';

//create context for App Router
export const createTRPCContext = async (opts: { req: Request }) => {
  const { req } = opts;
  
  // get authorization header
  const authorization = req.headers.get('authorization');
  
  if (authorization?.startsWith('Bearer ')) {
    //for client requests with auth header
    const { supabase } = await createClient();
    const { data: { user } } = await supabase.auth.getUser(authorization.split(' ')[1]);
    return { req, supabase, user };
  } else {

    const { supabase } = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return { req, supabase, user };
  }
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
