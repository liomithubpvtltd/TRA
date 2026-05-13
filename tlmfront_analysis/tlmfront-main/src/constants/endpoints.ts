export const Endpoints = {
  AUTH: {
    LOGIN: `/api/auth/login/`,
    LOGOUT: `/api/auth/logout/`,
    REFRESH: `/api/auth/refresh/`,
    ME: `/api/auth/me/`,
    DAILY_MESSAGE: `/api/daily-message/`,
  },
  MARKET: {
    INDICES: `/api/market/indices/`, // assuming this is the endpoint for ws or polling
    RECOMMENDATIONS: `/api/market/recommendations/`,
  },
  TRADING: {
    EXECUTE: `/api/trading/execute/`,
    PORTFOLIO: `/api/portfolio/`,
    ORDERS: `/api/trading/orders/`,
    UPDATE_HOLDING_AUTOMATION: (id: number) => `/api/holding/${id}/automation/`,
  },
  SUBSCRIPTION: {
    PLANS: `/api/subscriptions/plandetails/`,
    VALIDATE: `/api/subscriptions/validateplan/`,
    UPGRADE: `/api/subscriptions/upgrade/plandetails/`,
  },
  REPORTS: {
    RECOMMENDATIONS: `/api/reports/recommendations/`,
    PERSONAL: `/api/reports/personal/`,
  }
};
