export const ROLES = {
  GUEST: 'GUEST',
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  AFFILIATE: 'AFFILIATE',
  ADMIN: 'ADMIN'
};

export function hasPermission(user, allowedRoles) {
  if (!user || !user.role) return false;
  const userRole = user.role.toUpperCase();
  return allowedRoles.map(r => r.toUpperCase()).includes(userRole);
}
