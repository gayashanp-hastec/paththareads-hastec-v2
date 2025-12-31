import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: Request, context: { params: { id: string } }) {
  const { id } = context.params;
  const body = await req.json();

  let hashedPassword: string | undefined;
  if (body.password) {
    hashedPassword = await bcrypt.hash(body.password, 10);
  }

  const user = await prisma.users.update({
    where: { id },
    data: {
      full_name: body.fullName,
      username: body.username,
      email: body.email,
      phone: body.phone,
      role: body.role,
      is_active: body.isActive,
      is_verified: body.isVerified,
      ...(hashedPassword && { password_hash: hashedPassword }),
    },
  });

  return new Response(JSON.stringify(user), { status: 200 });
}

export async function DELETE(
  req: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  await prisma.users.delete({ where: { id } });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
