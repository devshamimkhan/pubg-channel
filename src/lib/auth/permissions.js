export const rolePermissions = {
  admin: { 
    channels: ['read', 'write', 'delete'], 
    posts: ['read', 'write', 'delete'], 
    settings: ['read', 'write'], 
    users: ['read', 'write'] 
  },
  user: { 
    channels: ['read'], 
    posts: ['read'], 
    settings: [], 
    users: [] 
  }
};

export function can(role, resource, permission) { 
  return rolePermissions[role]?.[resource]?.includes(permission) ?? false; 
}

export function isAdmin(session) { 
  return session?.user?.role === 'admin'; 
}
