import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Invoice, VerificationRequest, SellerProfile, LenderProfile } from '../types';

export interface AdminNote {
  id: string;
  entityType: 'invoice' | 'verification' | 'seller' | 'lender';
  entityId: string;
  adminName: string;
  note: string;
  createdAt: string;
}

export const supabaseService = {
  // 1. Storage Document Upload
  uploadDocument: async (file: File | { name: string; type: string }, userId: string, docType: string) => {
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    let fileUrl = `https://storage.supabase.co/documents/${fileName}`;

    if (isSupabaseConfigured && 'size' in file) {
      try {
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(fileName, file as File);

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);
          fileUrl = publicUrlData.publicUrl;
        }
      } catch (err) {
        console.warn('Supabase storage fallback:', err);
      }
    }

    // Persist document metadata off-chain
    const docRecord = {
      id: `doc_${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: userId,
      document_type: docType,
      file_name: file.name,
      file_url: fileUrl,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      await supabase.from('documents').insert([docRecord]);
    }

    return docRecord;
  },

  // 2. Off-Chain Invoice Persistence
  saveInvoiceOffchain: async (invoice: Invoice, description?: string) => {
    const record = {
      id: invoice.id,
      seller_id: invoice.sellerId,
      seller_business_name: invoice.sellerBusinessName,
      seller_category: invoice.sellerCategory,
      buyer_name: invoice.buyerName,
      buyer_tax_id: invoice.buyerTaxId,
      buyer_country: invoice.buyerCountry,
      amount: invoice.amount,
      advance_rate_pct: invoice.advanceRatePct,
      advance_amount: invoice.advanceAmount,
      fee_pct: invoice.feePct,
      fee_amount: invoice.feeAmount,
      expected_yield_pct: invoice.expectedYieldPct,
      due_date: invoice.dueDate,
      term_days: invoice.termDays,
      risk_tier: invoice.riskTier,
      risk_score: invoice.riskScore,
      status: invoice.status,
      description: description || 'Commercial crop export bill of lading',
      doc_name: invoice.docName,
      created_at: invoice.createdAt,
    };

    if (isSupabaseConfigured) {
      await supabase.from('invoices').upsert([record]);
    }
    return record;
  },

  // 3. Off-Chain Verification Request & KYC
  saveVerificationOffchain: async (verification: VerificationRequest) => {
    const record = {
      id: verification.id,
      seller_id: verification.sellerId,
      seller_name: verification.sellerName,
      business_name: verification.businessName,
      tier: verification.tier,
      document_type: verification.documentType,
      document_url: verification.documentUrl,
      submitted_at: verification.submittedAt,
      status: verification.status,
      risk_score_suggested: verification.riskScoreSuggested,
      admin_notes: verification.notes || '',
    };

    if (isSupabaseConfigured) {
      await supabase.from('verifications').upsert([record]);
    }
    return record;
  },

  // 4. Admin Audit Notes
  addAdminNote: async (entityType: 'invoice' | 'verification' | 'seller' | 'lender', entityId: string, note: string) => {
    const noteRecord: AdminNote = {
      id: `note_${Math.floor(1000 + Math.random() * 9000)}`,
      entityType,
      entityId,
      adminName: 'Institutional Risk Admin',
      note,
      createdAt: new Date().toLocaleString(),
    };

    if (isSupabaseConfigured) {
      await supabase.from('admin_notes').insert([
        {
          id: noteRecord.id,
          entity_type: entityType,
          entity_id: entityId,
          admin_name: noteRecord.adminName,
          note,
          created_at: new Date().toISOString(),
        },
      ]);
    }
    return noteRecord;
  },

  // 5. Update Seller Credit Limit & Tier Off-Chain
  updateSellerTierOffchain: async (sellerId: string, tier: 1 | 2, limit: number) => {
    if (isSupabaseConfigured) {
      await supabase
        .from('profiles')
        .update({
          verification_tier: tier,
          credit_limit: limit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sellerId);
    }
  },
};
