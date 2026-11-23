// ============================================================================
// BANKING INFO API SERVICE
// ============================================================================

import { apiClient } from "@nordi/shared/core/api";

const apiService = {
  saveBankingInfo: async (values: any) => {
    return apiClient.post("/accounts/banking-info", values);
  },
};

export default apiService;

