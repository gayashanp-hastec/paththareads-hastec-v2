// app/admin/users/page.tsx
import RoleCheck from "../components/RoleCheck";
import NoAccessClient from "../components/NoAccessClient";
import AdminUsers from "./AdminUsers";

export default function UsersPage() {
  return (
    <RoleCheck
      allowedRoles={["SUPER_ADMIN", "ADMIN"]}
      fallback={<NoAccessClient />}
    >
      <AdminUsers />
    </RoleCheck>
  );
}
