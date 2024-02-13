import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'


// DELETE /api/user/:id
export default async function handle(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.query.id;

  if (req.method === "DELETE") {
    const user = await prisma.user.delete({
      where: { id: String(userId) },
    });
    res.json(user);
  } else {
    throw new Error(
      `The HTTP ${req.method} method is not supported at this route.`
    );
  }
}
