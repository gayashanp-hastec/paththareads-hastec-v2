// app/admin/components/RoleCheck.tsx
import { cookies } from "next/headers";

interface RoleCheckProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback: React.ReactNode;
}

export default async function RoleCheck({
  allowedRoles,
  children,
  fallback,
}: RoleCheckProps) {
  const rolesCookie = (await cookies()).get("admin_roles")?.value;

  if (!rolesCookie) return fallback;

  let roles: string[];
  try {
    roles = JSON.parse(rolesCookie);
  } catch {
    return fallback;
  }

  const hasAccess = roles.some((r) => allowedRoles.includes(r));
  if (!hasAccess) return fallback;

  return <>{children}</>;
}
