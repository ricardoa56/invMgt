export interface Customer {
  id?: number;
  name: string;
  email: string | null;
  messengerId: string | null;
  mobileNo: string | null;
  address?: string | null;
}