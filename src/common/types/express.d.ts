declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      role: 'MASTER_ADMIN' | 'SUPER_ADMIN' | 'ADMIN_USER';
      name: string;
      status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
      superAdminId: number | null;
      primaryLocationId: number | null;
    }
  }
}

export {};
