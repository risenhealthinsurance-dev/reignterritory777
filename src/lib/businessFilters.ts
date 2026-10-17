import type { Account } from "../data/accounts";

export interface BusinessFilters {
  openOnly: boolean;
  userPinsOnly: boolean;
}

export function filterBusinesses(accounts: Account[], filters: BusinessFilters): Account[] {
  return accounts.filter((account) => {
    if (filters.userPinsOnly && account.source !== "user") return false;
    if (filters.openOnly && account.isOpen !== true) return false;
    return true;
  });
}
