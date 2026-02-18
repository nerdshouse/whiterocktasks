import { UserRole } from '../types';

export const DEMO_USERS = [
  {
    name: 'Owner User',
    email: 'owner@whiterock.co.in',
    password: 'password123',
    role: UserRole.OWNER,
    city: 'Mumbai',
    phone: '+919876543210',
  },
  {
    name: 'Manager User',
    email: 'manager@whiterock.co.in',
    password: 'password123',
    role: UserRole.MANAGER,
    city: 'Delhi',
    phone: '+919876543211',
  },
  {
    name: 'Doer User',
    email: 'doer@whiterock.co.in',
    password: 'password123',
    role: UserRole.DOER,
    city: 'Bangalore',
    phone: '+919876543212',
  },
  {
    name: 'Auditor User',
    email: 'auditor@whiterock.co.in',
    password: 'password123',
    role: UserRole.AUDITOR,
    city: 'Chennai',
    phone: '+919876543213',
  },
];
