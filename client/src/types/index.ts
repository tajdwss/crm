export interface Receipt {
  id: number;
  receiptNumber: string;
  customerName: string;
  mobile: string;
  isCompanyItem?: boolean;
  companyName?: string;
  companyMobile?: string;
  rgpNumber?: string;
  rgpDate?: string;
  product: string;
  model: string;
  problemDescription: string;
  additionalAccessories?: string;
  estimatedAmount: number;
  estimatedDeliveryDate: string;
  status: string;
  technicianNotes?: string;
  createdAt: string | Date;
  deliveredAt?: string | Date;
}

export interface FormData {
  customerName: string;
  mobile: string;
  isCompanyItem: boolean;
  companyName: string;
  companyMobile: string;
  rgpNumber: string;
  rgpDate: string;
  product: string;
  model: string;
  problemDescription: string;
  additionalAccessories: string;
  estimatedAmount: string;
  estimatedDeliveryDate: string;
  status: string;
}

export interface ServiceComplaint {
  id: number;
  complaintNumber: string;
  customerName: string;
  mobile: string;
  address: string;
  product: string;
  model: string;
  issueDescription: string;
  status: string;
  engineerId?: number;
  createdAt: string;
}

export interface ServiceVisit {
  id: number;
  complaintId: number;
  engineerId: number;
  checkInTime: string | null;
  checkOutTime: string | null;
  partsIssued?: string;
  workDescription?: string;
  visitNotes?: string;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
  name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  isActive?: boolean;
  createdAt?: string;
}