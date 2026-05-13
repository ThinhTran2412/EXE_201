import React from 'react';
import { UserRole } from '../../features/auth/AuthContext';
import CustomerTabs     from './CustomerTabs';
import PhotographerTabs from './PhotographerTabs';

export default function RoleNavigator({ role }: { role: UserRole }) {
  if (role === 'photographer') return <PhotographerTabs />;
  return <CustomerTabs />;
}
