export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.is_superuser || user.role_name === 'ADMIN') return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}

export function hasAnyPermission(user, permissions = []) {
  if (!user) return false;
  if (user.is_superuser || user.role_name === 'ADMIN') return true;
  return permissions.some((p) => hasPermission(user, p));
}
