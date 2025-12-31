import { cookies } from "next/headers";
import NoAccessFallback from "./NoAccessFallBack";

interface RoleCheckProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default async function RoleCheck({
  allowedRoles,
  children,
}: RoleCheckProps) {
  const cookieStore = cookies();
  const rolesCookie = (await cookieStore).get("admin_roles")?.value;

  if (!rolesCookie) {
    return <NoAccessFallback />;
  }

  let roles: string[] = [];

  try {
    roles = JSON.parse(rolesCookie);
  } catch {
    return <NoAccessFallback />;
  }

  const hasAccess = roles.some((r) => allowedRoles.includes(r));

  if (!hasAccess) {
    return <NoAccessFallback />;
  }

  return <>{children}</>;
}
