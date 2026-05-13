import { API } from "./axios";
import { Endpoints } from "@/constants/endpoints";

export const tlmApis = {
  // Auth
  login: (data: any) => API.post(Endpoints.AUTH.LOGIN, data),
  logout: () => API.post(Endpoints.AUTH.LOGOUT),
  getMe: () => API.get(Endpoints.AUTH.ME),
  getDailyMessage: () => API.get(Endpoints.AUTH.DAILY_MESSAGE),

  // Market & Trading
  getRecommendations: (params?: any) => API.get(Endpoints.MARKET.RECOMMENDATIONS, params),
  getPortfolio: () => API.get(Endpoints.TRADING.PORTFOLIO),
  getOrders: (params?: any) => API.get(Endpoints.TRADING.ORDERS, { params }),
  executeTrade: (data: any) => API.post(Endpoints.TRADING.EXECUTE, data),
  updateHoldingAutomation: (id: number, data: any) => API.post(Endpoints.TRADING.UPDATE_HOLDING_AUTOMATION(id), data),

  // Subscriptions
  getSubscriptionPlans: () => API.get(Endpoints.SUBSCRIPTION.PLANS),
  validatePlan: (planId: string) => API.post(Endpoints.SUBSCRIPTION.VALIDATE, { plan_id: planId }),
  getUpgradeDetails: () => API.get(Endpoints.SUBSCRIPTION.UPGRADE),

  // Reports
  getRecommendationReports: (params?: any) => API.get(Endpoints.REPORTS.RECOMMENDATIONS, { params }),
  getPersonalReport: () => API.get(Endpoints.REPORTS.PERSONAL),
};

export default tlmApis;
