-- =============================================================================
-- Taman Seri Gedung Housing Revitalization Project (637 Landed Units)
-- Relational Database Schema (PostgreSQL 14+ / Supabase / Neon / RDS)
-- =============================================================================

-- Enable UUID extension for robust distributed keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. ENUMS & DOMAINS
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE site_condition_type AS ENUM ('Abandon', 'Occupied', 'Renovation', 'Unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tracing_status_type AS ENUM (
        'Pending Outreach',
        'Contact Established',
        'Follow-up Required',
        'Negotiating Transfer',
        'Untraceable',
        'Completed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE interaction_channel_type AS ENUM (
        'Phone Call',
        'WhatsApp',
        'Physical Visit',
        'Official Notice',
        'Legal Letter'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE interaction_outcome_type AS ENUM (
        'Follow-up Required',
        'Agreed to Borang 14A',
        'Wrong Number',
        'Refused',
        'Dispute',
        'Documents Collected',
        'No Answer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- 2. MASTER TABLE: properties (637 Units)
-- =============================================================================

CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    house_no VARCHAR(20) NOT NULL UNIQUE,                       -- Physical House Number (e.g. '376', '154')
    lot_no_dev VARCHAR(50),                                    -- 1988 Developer Plot / Master Plan Lot
    cadastral_lot_no VARCHAR(50) NOT NULL,                     -- Official Land Office Cadastral Lot (e.g. 'Lot 3865')
    geran_no VARCHAR(100),                                     -- Electronic Land Office Title (e.g. '020546GRN00185113')
    hsd_no VARCHAR(50),                                        -- Historical Temporary Title (e.g. '4465/88')
    pt_no VARCHAR(50),                                         -- Land Office PT identifier (e.g. '7849')
    street_name VARCHAR(100) NOT NULL,                         -- Street / Lorong (e.g. 'Jln Seri Gedung 12')
    
    -- 1988 SPA & Historical Purchaser Particulars
    buyer_primary VARCHAR(200) NOT NULL,                       -- 1988 Original SPA Buyer
    buyer_secondary VARCHAR(200),                              -- Joint Purchaser / Original Waris
    ic_new VARCHAR(20),                                        -- 12-digit Malaysian MyKad (e.g. '580315-02-5311')
    ic_old_police_army VARCHAR(50),                            -- Old IC, Police RF Badge, or Army T-Number
    tel_mobile VARCHAR(50),                                    -- Registered Mobile
    tel_fixed VARCHAR(50),                                     -- Historical Landline
    mailing_address TEXT,                                      -- 1988 Registered Correspondence Address
    loan_provider VARCHAR(50),                                 -- BPP, KYB, MBSB, LLN, GL, Cash
    historical_status TEXT,                                    -- Legal file archival remarks
    
    -- Modern Land Registry & Municipal Assessment
    current_registered_owner VARCHAR(200),                     -- Current proprietor if sub-sale / transfer occurred
    cukai_pintu_arrears NUMERIC(10, 2) NOT NULL DEFAULT 0.00,  -- Outstanding assessment tax balance
    case_admin_notes TEXT,                                     -- Estate administration, court probate, or dispute notes
    
    -- Physical Site Condition Audit
    site_condition VARCHAR(30) NOT NULL DEFAULT 'Unknown',     -- 'Abandon', 'Occupied', 'Renovation', 'Unknown'
    site_description TEXT,                                     -- Observation notes (TNB meter, structural status)
    site_photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],            -- Cloud storage photo URLs
    site_survey_date DATE,                                     -- Audit inspection date
    house_type_category VARCHAR(60),                           -- '1-S Terrace (Intermediate)', '1-S Terrace (Corner)'
    
    -- CRM Outreach & Tracing Status
    tracing_status VARCHAR(40) NOT NULL DEFAULT 'Pending Outreach', -- 'Pending Outreach', 'Contact Established', etc.
    
    -- Audit Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 3. AUDIT & CRM TABLE: interaction_logs (1-to-Many with properties)
-- =============================================================================

CREATE TABLE IF NOT EXISTS interaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    house_no VARCHAR(20) NOT NULL,                             -- Denormalized physical house number
    interaction_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    party_contacted VARCHAR(150) NOT NULL,                     -- Person reached (e.g. 'Usha', 'Azman')
    relationship VARCHAR(60) NOT NULL,                         -- 'Original Buyer', 'Waris (Child)', 'Pentadbir', etc.
    phone_dialed VARCHAR(50),                                  -- Number contacted
    channel VARCHAR(40) NOT NULL,                              -- 'Phone Call', 'WhatsApp', 'Physical Visit', etc.
    outcome VARCHAR(50) NOT NULL,                              -- 'Follow-up Required', 'Agreed to Borang 14A', etc.
    detailed_notes TEXT NOT NULL,                              -- Verbatim log notes and action points
    next_follow_up_date DATE,                                  -- Scheduled next action date
    docs_collected_urls TEXT[] DEFAULT ARRAY[]::TEXT[],        -- Death cert, IC copy, Borang 14A links
    recorded_by VARCHAR(100) NOT NULL,                         -- Field officer (e.g. 'Mirra Lakeside')
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. PERFORMANCE INDEXES
-- =============================================================================

-- Master table indexes for instant multi-criteria search
CREATE INDEX IF NOT EXISTS idx_properties_house_no ON properties(house_no);
CREATE INDEX IF NOT EXISTS idx_properties_cadastral_lot ON properties(cadastral_lot_no);
CREATE INDEX IF NOT EXISTS idx_properties_geran_no ON properties(geran_no);
CREATE INDEX IF NOT EXISTS idx_properties_pt_no ON properties(pt_no);
CREATE INDEX IF NOT EXISTS idx_properties_street_name ON properties(street_name);
CREATE INDEX IF NOT EXISTS idx_properties_buyer_primary ON properties(buyer_primary);
CREATE INDEX IF NOT EXISTS idx_properties_ic_new ON properties(ic_new);
CREATE INDEX IF NOT EXISTS idx_properties_tracing_status ON properties(tracing_status);
CREATE INDEX IF NOT EXISTS idx_properties_site_condition ON properties(site_condition);
CREATE INDEX IF NOT EXISTS idx_properties_arrears ON properties(cukai_pintu_arrears);

-- Interaction logs indexes for rapid timeline loading
CREATE INDEX IF NOT EXISTS idx_interaction_property_id ON interaction_logs(property_id);
CREATE INDEX IF NOT EXISTS idx_interaction_house_no ON interaction_logs(house_no);
CREATE INDEX IF NOT EXISTS idx_interaction_timestamp ON interaction_logs(interaction_timestamp DESC);

-- =============================================================================
-- 5. AUTOMATIC TIMESTAMP TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_property_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_properties_updated_at ON properties;
CREATE TRIGGER trg_properties_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION update_property_timestamp();

-- Automatically bump parent property updated_at and tracing_status if an interaction is logged
CREATE OR REPLACE FUNCTION on_interaction_logged()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE properties
    SET updated_at = NOW()
    WHERE id = NEW.property_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_on_interaction_logged ON interaction_logs;
CREATE TRIGGER trg_on_interaction_logged
AFTER INSERT OR UPDATE ON interaction_logs
FOR EACH ROW
EXECUTE FUNCTION on_interaction_logged();
