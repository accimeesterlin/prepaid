/** A single customer within a duplicate group */
export interface DuplicateCustomerInfo {
  _id: string;
  phoneNumber: string;
  additionalPhoneNumbers: string[];
  email?: string;
  name?: string;
  country?: string;
  isFavorite: boolean;
  groups: string[];
  metadata: {
    totalPurchases: number;
    totalSpent: number;
    currency: string;
  };
  createdAt: string;
}

/** A group of customers that share a common identifier */
export interface DuplicateGroup {
  matchType: "phone" | "email";
  matchValue: string;
  customers: DuplicateCustomerInfo[];
}

/** Response from POST /api/v1/customers/find-duplicates */
export interface FindDuplicatesResponse {
  groups: DuplicateGroup[];
  totalGroups: number;
  totalDuplicateCustomers: number;
}
