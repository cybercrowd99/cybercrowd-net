export const CAPABILITY_MATRIX = {
  free: {
    canCreateDrafts: false,
    canPublish: false,
    canAccessAnalytics: false,
    canUseCreatorAPI: false
  },

  creator: {
    canCreateDrafts: true,
    canPublish: true,
    canAccessAnalytics: true,
    canUseCreatorAPI: false
  },

  pro: {
    canCreateDrafts: true,
    canPublish: true,
    canAccessAnalytics: true,
    canUseCreatorAPI: true
  }
};

export function getCapabilities(tier) {
  return CAPABILITY_MATRIX[tier] || CAPABILITY_MATRIX.free;
}
