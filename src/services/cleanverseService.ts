export interface CleanverseResult {
  status: 'pass' | 'fail' | 'uncertain';
  confidenceScore: number; // 0 to 100
  extractedName?: string;
  documentNumber?: string;
  taxIdVerified?: boolean;
  failureReason?: string;
  recommendedRiskScore: number;
}

const CLEANVERSE_API_URL = import.meta.env.VITE_CLEANVERSE_ENDPOINT || 'https://api.cleanverse.io/v1/identity';
const CLEANVERSE_API_KEY = import.meta.env.VITE_CLEANVERSE_API_KEY || 'cv_live_984102948102';

export const cleanverseService = {
  // Tier 1 Government ID checking
  verifyTier1GovernmentId: async (
    documentUrl: string,
    sellerName: string,
    simulatedOutcome?: 'pass' | 'fail' | 'uncertain'
  ): Promise<CleanverseResult> => {
    // Simulate real network request to Cleanverse API
    await new Promise((res) => setTimeout(res, 1200));

    // If explicit simulation specified, honor it
    if (simulatedOutcome === 'fail') {
      return {
        status: 'fail',
        confidenceScore: 32,
        extractedName: sellerName,
        failureReason: 'Cleanverse AI detected low photo resolution or dark shadows on government ID. Corners were cropped.',
        recommendedRiskScore: 45,
      };
    }

    if (simulatedOutcome === 'uncertain') {
      return {
        status: 'uncertain',
        confidenceScore: 68,
        extractedName: sellerName,
        failureReason: 'Borderline name alignment (minor spelling variation detected). Sent to Admin Queue for human review.',
        recommendedRiskScore: 78,
      };
    }

    // Default clear pass
    return {
      status: 'pass',
      confidenceScore: 96,
      extractedName: sellerName,
      documentNumber: 'KEN-849201948',
      recommendedRiskScore: 94,
    };
  },

  // Tier 2 Business Registration / Tax PIN / Shop Video checking
  verifyTier2BusinessDocument: async (
    documentUrl: string,
    businessName: string,
    videoUrl?: string,
    simulatedOutcome?: 'pass' | 'fail' | 'uncertain'
  ): Promise<CleanverseResult> => {
    await new Promise((res) => setTimeout(res, 1500));

    if (simulatedOutcome === 'fail') {
      return {
        status: 'fail',
        confidenceScore: 28,
        taxIdVerified: false,
        failureReason: 'Cleanverse couldn\'t verify the Business Tax PIN against the jurisdiction registry. PIN appears inactive.',
        recommendedRiskScore: 40,
      };
    }

    if (simulatedOutcome === 'uncertain') {
      return {
        status: 'uncertain',
        confidenceScore: 72,
        taxIdVerified: true,
        failureReason: 'Shop/Farm location video GPS metadata pending manual verification by Risk Admin.',
        recommendedRiskScore: 80,
      };
    }

    return {
      status: 'pass',
      confidenceScore: 98,
      extractedName: businessName,
      taxIdVerified: true,
      documentNumber: 'P051928401Z',
      recommendedRiskScore: 96,
    };
  },
};
