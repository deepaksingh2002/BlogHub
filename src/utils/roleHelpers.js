const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

const canonicalizeRole = (role) => {
  const normalized = normalizeRole(role);
  if (!normalized) return "";

  if (normalized.includes("superadmin") || normalized.includes("super_admin")) {
    return "superadmin";
  }
  if (normalized.includes("admin")) {
    return "admin";
  }
  if (normalized.includes("author")) {
    return "author";
  }
  if (normalized.includes("user")) {
    return "user";
  }

  return normalized;
};

const collectRoleSignals = (value, depth = 0) => {
  if (!value || depth > 3) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectRoleSignals(item, depth + 1));
  }

  if (typeof value !== "object") {
    return [value];
  }

  const signals = [];
  for (const [key, nestedValue] of Object.entries(value)) {
    if (/(role|permission|scope|type|group)/i.test(String(key))) {
      signals.push(nestedValue);
    }

    if (nestedValue && (typeof nestedValue === "object" || Array.isArray(nestedValue))) {
      signals.push(...collectRoleSignals(nestedValue, depth + 1));
    }
  }

  return signals;
};

const roleFromValue = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => roleFromValue(item));
  }

  if (typeof value === "object") {
    const nested =
      value.role ||
      value.userRole ||
      value.accountType ||
      value.slug ||
      value.code ||
      value.label ||
      value.title ||
      value.name ||
      value.value ||
      "";
    return roleFromValue(nested);
  }

  const normalized = canonicalizeRole(value);
  return normalized ? [normalized] : [];
};

export const getUserRoles = (user) => {
  if (!user) return [];

  const inferredFlags = [
    user?.isSuperAdmin || user?.is_super_admin ? "superadmin" : "",
    user?.isAdmin || user?.is_admin ? "admin" : "",
    user?.isOwner || user?.is_owner ? "admin" : "",
    user?.isAuthor || user?.is_author ? "author" : "",
  ].filter(Boolean);

  // List all possible role properties to check
  const roleCandidates = [
    // Direct properties
    user?.role,
    user?.roles,
    user?.userRole,
    user?.userRoles,
    user?.isOwner,
    user?.is_owner,
    user?.isAdmin,
    user?.is_admin,
    user?.isSuperAdmin,
    user?.is_super_admin,
    user?.accountType,
    user?.type,
    user?.roleId,
    user?.userType,
    
    // Nested under common keys
    user?.loggedInUser?.role,
    user?.loggedInUser?.roles,
    user?.currentUser?.role,
    user?.currentUser?.roles,
    user?.admin?.role,
    user?.admin?.roles,
    user?.author?.role,
    user?.author?.roles,
    user?.user?.role,
    user?.user?.roles,
    user?.user?.userRole,
    
    // Under data property
    user?.data?.role,
    user?.data?.roles,
    user?.data?.userRole,
    user?.data?.userRoles,
    user?.data?.accountType,
    user?.data?.type,
    user?.data?.loggedInUser?.role,
    user?.data?.loggedInUser?.roles,
    user?.data?.currentUser?.role,
    user?.data?.currentUser?.roles,
    user?.data?.admin?.role,
    user?.data?.admin?.roles,
    user?.data?.author?.role,
    user?.data?.author?.roles,
    
    // Deep nested
    user?.data?.data?.role,
    user?.data?.data?.roles,
    user?.data?.data?.userRole,
    
    // Permission-based properties
    user?.permissions,
    user?.permission,
    user?.scopes,
    user?.scope,
    user?.data?.permissions,
    user?.data?.scopes,
    
    // Collect role signals from entire object
    ...collectRoleSignals(user),
    ...inferredFlags,
  ];

  const roles = roleCandidates.flatMap((value) => roleFromValue(value));
  return Array.from(new Set(roles));
};

export const hasRole = (user, roles = []) => {
  const userRoles = getUserRoles(user);
  return roles.some((role) => userRoles.includes(canonicalizeRole(role)));
};

export const getDashboardPathForUser = (user) => {
  if (hasRole(user, ["admin", "superadmin"])) {
    return "/admin/dashboard";
  }
  if (hasRole(user, ["author"])) {
    return "/author/dashboard";
  }
  return "/";
};

export const isRoleAllowed = (user, allowedRoles = []) => {
  if (!allowedRoles.length) return true;
  return hasRole(user, allowedRoles);
};
