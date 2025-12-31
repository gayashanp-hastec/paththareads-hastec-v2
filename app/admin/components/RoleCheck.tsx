import { cookies } from "next/headers";

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
    return (
      <div className="flex justify-center items-center min-h-[300px] text-red-600 font-semibold text-lg">
        You do not have access to this page.
      </div>
    );
  }

  let roles: string[] = [];

  try {
    roles = JSON.parse(rolesCookie);
  } catch {
    return (
      <div className="flex justify-center items-center min-h-[300px] text-red-600 font-semibold text-lg">
        You do not have access to this page.
      </div>
    );
  }

  const hasAccess = roles.some((r) => allowedRoles.includes(r));

  if (!hasAccess) {
    return (
      <div className="flex justify-center items-center min-h-[300px] text-red-600 font-semibold text-lg">
        You do not have access to this page.
      </div>
    );
  }

  return <>{children}</>;
}
