-- DGT production schema baseline, captured 2026-09-14 (PostgreSQL 17).
-- Shared reference catalogs only; no stores, users, credentials or transactions.
-- Existing databases require reviewed, explicit baseline at version 1.

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.11 (Debian 17.11-1.pgdg13+2)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET LOCAL statement_timeout = 0;
SET LOCAL lock_timeout = 0;
SET LOCAL idle_in_transaction_session_timeout = 0;
SET LOCAL transaction_timeout = 0;
SET LOCAL client_encoding = 'UTF8';
SET LOCAL standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', 'public', true);
SET LOCAL check_function_bodies = false;
SET LOCAL xmloption = content;
SET LOCAL client_min_messages = warning;
SET LOCAL row_security = off;

--
-- Name: generate_dgt_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_dgt_id() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    next_number integer;
BEGIN
    LOCK TABLE public.stores IN EXCLUSIVE MODE;

    SELECT COALESCE(
        MAX(
            CAST(REPLACE(dgt_id, 'DGT-', '') AS integer)
        ),
        1000
    ) + 1
    INTO next_number
    FROM public.stores;

    RETURN 'DGT-' || next_number;
END;
$$;


--
-- Name: validate_credit_card_batch_store(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_credit_card_batch_store() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM credit_card_batches b JOIN sale_payments p ON p.sale_payment_id=NEW.sale_payment_id JOIN sales s ON s.sale_id=p.sale_id WHERE b.batch_id=NEW.batch_id AND b.dgt_id=s.store_id) THEN
  RAISE EXCEPTION 'Payment must belong to the batch store';
 END IF;
 RETURN NEW;
END $$;


--
-- Name: validate_ebt_batch_payment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_ebt_batch_payment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM ebt_batches b
   JOIN sale_payments p ON p.sale_payment_id=NEW.sale_payment_id
   JOIN sales s ON s.sale_id=p.sale_id
   JOIN tender_types t ON t.tender_type_id=p.tender_type_id
   WHERE b.batch_id=NEW.batch_id AND b.dgt_id=s.store_id
     AND ((NEW.benefit_type='SNAP' AND t.tender_code='EBT_SNAP')
       OR (NEW.benefit_type='CASH' AND t.tender_code='EBT_CASH'))
 ) THEN
   RAISE EXCEPTION 'EBT payment must match the batch store and benefit type';
 END IF;
 RETURN NEW;
END $$;


--
-- Name: validate_fleet_batch_payment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_fleet_batch_payment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM fleet_batches b
   JOIN sale_payments p ON p.sale_payment_id=NEW.sale_payment_id
   JOIN sales s ON s.sale_id=p.sale_id
   JOIN tender_types t ON t.tender_type_id=p.tender_type_id
   WHERE b.batch_id=NEW.batch_id AND b.dgt_id=s.store_id
     AND upper(t.tender_code) IN ('FLEET','FLEET_CARD')
 ) THEN
   RAISE EXCEPTION 'Fleet payment must belong to the batch store and use a Fleet tender';
 END IF;
 RETURN NEW;
END $$;


--
-- Name: validate_store_timezone(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.validate_store_timezone() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.timezone IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_timezone_names WHERE name=NEW.timezone
      AND (name='UTC' OR name LIKE '%/%') AND name NOT LIKE 'posix/%' AND name NOT LIKE 'right/%'
  ) THEN
    RAISE EXCEPTION 'Invalid IANA store timezone' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;


SET LOCAL default_tablespace = '';

SET LOCAL default_table_access_method = heap;

--
-- Name: access_audit_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.access_audit_events (
    event_id bigint NOT NULL,
    company_id bigint NOT NULL,
    dgt_id character varying(50),
    actor_user_id bigint NOT NULL,
    event_type character varying(100) NOT NULL,
    target_type character varying(100) NOT NULL,
    target_id character varying(100),
    changes jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: access_audit_events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.access_audit_events ALTER COLUMN event_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.access_audit_events_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: approval_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approval_requests (
    request_id bigint NOT NULL,
    company_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    module_id bigint NOT NULL,
    requested_by bigint NOT NULL,
    requester_role_id bigint NOT NULL,
    required_approver character varying(20) NOT NULL,
    operation_code character varying(100) NOT NULL,
    target_id character varying(100),
    expected_versions jsonb DEFAULT '{}'::jsonb NOT NULL,
    proposed_values jsonb NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    reviewed_by bigint,
    review_note text,
    idempotency_key uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_at timestamp with time zone,
    CONSTRAINT approval_requests_check CHECK (((reviewed_by IS NULL) OR (reviewed_by <> requested_by))),
    CONSTRAINT approval_requests_check1 CHECK ((((status)::text <> ALL ((ARRAY['APPROVED'::character varying, 'REJECTED'::character varying])::text[])) OR ((reviewed_by IS NOT NULL) AND (reviewed_at IS NOT NULL)))),
    CONSTRAINT approval_requests_expected_versions_check CHECK ((jsonb_typeof(expected_versions) = 'object'::text)),
    CONSTRAINT approval_requests_proposed_values_check CHECK ((jsonb_typeof(proposed_values) = 'object'::text)),
    CONSTRAINT approval_requests_required_approver_check CHECK (((required_approver)::text = ANY ((ARRAY['MANAGER_OR_ADMIN'::character varying, 'ADMIN'::character varying])::text[]))),
    CONSTRAINT approval_requests_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'CANCELLED'::character varying, 'STALE'::character varying])::text[])))
);


--
-- Name: approval_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.approval_requests ALTER COLUMN request_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.approval_requests_request_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: billing_addons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_addons (
    addon_id bigint NOT NULL,
    code character varying(40) NOT NULL,
    name character varying(80) NOT NULL,
    description text NOT NULL,
    monthly_price numeric(10,2) NOT NULL,
    CONSTRAINT billing_addons_monthly_price_check CHECK ((monthly_price >= (0)::numeric))
);


--
-- Name: billing_addons_addon_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.billing_addons ALTER COLUMN addon_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.billing_addons_addon_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: billing_change_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_change_requests (
    user_id bigint NOT NULL,
    request_key uuid NOT NULL,
    dgt_id character varying(50) NOT NULL,
    action character varying(20) NOT NULL,
    plan_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: billing_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_invoices (
    invoice_id bigint NOT NULL,
    store_id character varying(50) NOT NULL,
    subscription_plan_id bigint NOT NULL,
    invoice_number character varying(100) NOT NULL,
    invoice_date date NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    dgt_invoice_status character varying(50) NOT NULL,
    paid_at timestamp with time zone,
    invoice_document_url character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    subscription_id bigint,
    invoice_kind character varying(20),
    plan_name_snapshot character varying(50),
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    CONSTRAINT billing_invoices_currency_check CHECK (((currency)::text = 'USD'::text)),
    CONSTRAINT billing_invoices_invoice_kind_check CHECK (((invoice_kind)::text = ANY ((ARRAY['INITIAL'::character varying, 'UPGRADE'::character varying, 'RENEWAL'::character varying, 'ADDON'::character varying])::text[])))
);


--
-- Name: billing_invoices_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.billing_invoices ALTER COLUMN invoice_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.billing_invoices_invoice_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    brand_id bigint NOT NULL,
    brand_name character varying(150) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description character varying(500)
);


--
-- Name: brands_brand_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.brands_brand_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: brands_brand_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.brands_brand_id_seq OWNED BY public.brands.brand_id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    company_id bigint NOT NULL,
    company_name character varying(200) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    primary_store_dgt_id character varying(50),
    CONSTRAINT companies_company_name_check CHECK ((btrim((company_name)::text) <> ''::text))
);


--
-- Name: companies_company_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.companies ALTER COLUMN company_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.companies_company_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: company_admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_admins (
    company_id bigint NOT NULL,
    user_id bigint NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: credit_card_batch_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_card_batch_payments (
    batch_id bigint NOT NULL,
    sale_payment_id bigint NOT NULL,
    payment_amount_snapshot numeric(14,2) NOT NULL
);


--
-- Name: credit_card_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_card_batches (
    batch_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    processor_id bigint NOT NULL,
    batch_reference character varying(100) NOT NULL,
    business_date date NOT NULL,
    status character varying(12) DEFAULT 'OPEN'::character varying NOT NULL,
    source_kind character varying(20) DEFAULT 'MANUAL_GROUP'::character varying NOT NULL,
    pos_sales numeric(14,2) NOT NULL,
    transaction_count integer NOT NULL,
    fee_base numeric(14,2) NOT NULL,
    configured_fee_percent numeric(7,4) NOT NULL,
    per_transaction_fee numeric(12,2) NOT NULL,
    expected_fee numeric(14,2) NOT NULL,
    actual_fee numeric(14,2),
    processor_sales numeric(14,2),
    chargebacks numeric(14,2) DEFAULT 0 NOT NULL,
    chargeback_reason character varying(1000),
    fee_reason character varying(1000),
    notes character varying(2000),
    settlement_destination character varying(10) NOT NULL,
    destination_label character varying(160) NOT NULL,
    received_amount numeric(14,2),
    settlement_date date,
    settlement_reference character varying(160),
    variance_review_note character varying(1000),
    variance_reviewed_by bigint,
    fee_reviewed_by bigint,
    created_by bigint NOT NULL,
    settled_by bigint,
    reconciled_by bigint,
    request_key uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT credit_card_batches_actual_fee_check CHECK ((actual_fee >= (0)::numeric)),
    CONSTRAINT credit_card_batches_batch_reference_check CHECK ((length(TRIM(BOTH FROM batch_reference)) > 0)),
    CONSTRAINT credit_card_batches_chargebacks_check CHECK ((chargebacks >= (0)::numeric)),
    CONSTRAINT credit_card_batches_check CHECK ((((status)::text <> ALL ((ARRAY['SUBMITTED'::character varying, 'SETTLED'::character varying, 'RECONCILED'::character varying])::text[])) OR (processor_sales IS NOT NULL))),
    CONSTRAINT credit_card_batches_check1 CHECK ((((status)::text <> ALL ((ARRAY['SETTLED'::character varying, 'RECONCILED'::character varying])::text[])) OR ((received_amount IS NOT NULL) AND (actual_fee IS NOT NULL) AND (settlement_date IS NOT NULL) AND (length(TRIM(BOTH FROM settlement_reference)) > 0) AND (settled_by IS NOT NULL)))),
    CONSTRAINT credit_card_batches_check2 CHECK ((((status)::text <> 'RECONCILED'::text) OR (reconciled_by IS NOT NULL))),
    CONSTRAINT credit_card_batches_configured_fee_percent_check CHECK (((configured_fee_percent >= (0)::numeric) AND (configured_fee_percent <= (100)::numeric))),
    CONSTRAINT credit_card_batches_expected_fee_check CHECK ((expected_fee >= (0)::numeric)),
    CONSTRAINT credit_card_batches_fee_base_check CHECK ((fee_base >= (0)::numeric)),
    CONSTRAINT credit_card_batches_per_transaction_fee_check CHECK ((per_transaction_fee >= (0)::numeric)),
    CONSTRAINT credit_card_batches_settlement_destination_check CHECK (((settlement_destination)::text = ANY ((ARRAY['BANK'::character varying, 'JOBBER'::character varying])::text[]))),
    CONSTRAINT credit_card_batches_source_kind_check CHECK (((source_kind)::text = ANY ((ARRAY['MANUAL_GROUP'::character varying, 'POS_BATCH'::character varying])::text[]))),
    CONSTRAINT credit_card_batches_status_check CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'SUBMITTED'::character varying, 'SETTLED'::character varying, 'RECONCILED'::character varying])::text[]))),
    CONSTRAINT credit_card_batches_transaction_count_check CHECK ((transaction_count >= 0))
);


--
-- Name: credit_card_batches_batch_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.credit_card_batches ALTER COLUMN batch_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.credit_card_batches_batch_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: credit_card_processors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_card_processors (
    processor_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    processor_name character varying(120) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    settlement_frequency character varying(10) DEFAULT 'DAILY'::character varying NOT NULL,
    deposit_delay_days integer DEFAULT 1 NOT NULL,
    settlement_destination character varying(10) NOT NULL,
    destination_label character varying(160) NOT NULL,
    created_by bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT credit_card_processors_deposit_delay_days_check CHECK (((deposit_delay_days >= 0) AND (deposit_delay_days <= 90))),
    CONSTRAINT credit_card_processors_processor_name_check CHECK ((length(TRIM(BOTH FROM processor_name)) > 0)),
    CONSTRAINT credit_card_processors_settlement_destination_check CHECK (((settlement_destination)::text = ANY ((ARRAY['BANK'::character varying, 'JOBBER'::character varying])::text[]))),
    CONSTRAINT credit_card_processors_settlement_frequency_check CHECK (((settlement_frequency)::text = ANY ((ARRAY['DAILY'::character varying, 'WEEKLY'::character varying, 'MONTHLY'::character varying])::text[])))
);


--
-- Name: credit_card_processors_processor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.credit_card_processors ALTER COLUMN processor_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.credit_card_processors_processor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: credit_card_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_card_settings (
    dgt_id character varying(50) NOT NULL,
    default_fee_percent numeric(7,4) DEFAULT 0 NOT NULL,
    per_transaction_fee numeric(12,2) DEFAULT 0 NOT NULL,
    fee_difference_percent numeric(7,4) DEFAULT 0.2 NOT NULL,
    deposit_tolerance numeric(12,2) DEFAULT 5 NOT NULL,
    require_fee_review boolean DEFAULT true NOT NULL,
    require_variance_review boolean DEFAULT true NOT NULL,
    enable_chargebacks boolean DEFAULT true NOT NULL,
    require_chargeback_reason boolean DEFAULT true NOT NULL,
    lock_settings_after_settlement boolean DEFAULT false NOT NULL,
    updated_by bigint NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT credit_card_settings_default_fee_percent_check CHECK (((default_fee_percent >= (0)::numeric) AND (default_fee_percent <= (100)::numeric))),
    CONSTRAINT credit_card_settings_deposit_tolerance_check CHECK ((deposit_tolerance >= (0)::numeric)),
    CONSTRAINT credit_card_settings_fee_difference_percent_check CHECK (((fee_difference_percent >= (0)::numeric) AND (fee_difference_percent <= (100)::numeric))),
    CONSTRAINT credit_card_settings_per_transaction_fee_check CHECK ((per_transaction_fee >= (0)::numeric))
);


--
-- Name: daily_closing_deposits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_closing_deposits (
    deposit_id bigint NOT NULL,
    everyday_closing_id bigint NOT NULL,
    deposit_date date NOT NULL,
    bank_account_id bigint,
    amount numeric(12,2) NOT NULL,
    receipt_url text,
    deposited_by bigint NOT NULL,
    status character varying(30) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closing_entry boolean DEFAULT false NOT NULL,
    cash_amount numeric(12,2),
    checks_amount numeric(12,2),
    CONSTRAINT daily_closing_deposits_check CHECK (((cash_amount >= (0)::numeric) AND (cash_amount <= amount))),
    CONSTRAINT daily_closing_deposits_check1 CHECK (((checks_amount >= (0)::numeric) AND (checks_amount <= amount)))
);


--
-- Name: daily_closing_deposits_deposit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_closing_deposits_deposit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_closing_deposits_deposit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_closing_deposits_deposit_id_seq OWNED BY public.daily_closing_deposits.deposit_id;


--
-- Name: daily_closing_tenders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_closing_tenders (
    tender_id bigint NOT NULL,
    everyday_closing_id bigint NOT NULL,
    tender_type character varying(50) NOT NULL,
    expected_amount numeric(12,2) NOT NULL,
    actual_amount numeric(12,2) NOT NULL,
    amount_difference numeric(12,2) NOT NULL,
    transaction_count integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: daily_closing_tenders_tender_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_closing_tenders_tender_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_closing_tenders_tender_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_closing_tenders_tender_id_seq OWNED BY public.daily_closing_tenders.tender_id;


--
-- Name: daily_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_expenses (
    expenses_id bigint NOT NULL,
    everyday_closing_id bigint NOT NULL,
    expenses_date date NOT NULL,
    expenses_type character varying(100) NOT NULL,
    description character varying(500),
    amount numeric(12,2) NOT NULL,
    paid_by bigint NOT NULL,
    receipt_number character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: daily_expenses_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_expenses_expenses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_expenses_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_expenses_expenses_id_seq OWNED BY public.daily_expenses.expenses_id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    department_id bigint NOT NULL,
    department_name character varying(150) NOT NULL,
    is_default boolean DEFAULT true NOT NULL
);


--
-- Name: departments_department_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.departments_department_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: departments_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.departments_department_id_seq OWNED BY public.departments.department_id;


--
-- Name: discount_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_type (
    discount_type_id bigint NOT NULL,
    code character varying(40) NOT NULL,
    name character varying(100) NOT NULL,
    promotion_value character varying(100),
    contract_value character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: discount_type_discount_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.discount_type ALTER COLUMN discount_type_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.discount_type_discount_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ebt_batch_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ebt_batch_payments (
    batch_id bigint NOT NULL,
    sale_payment_id bigint NOT NULL,
    benefit_type character varying(10) NOT NULL,
    payment_amount_snapshot numeric(14,2) NOT NULL,
    CONSTRAINT ebt_batch_payments_benefit_type_check CHECK (((benefit_type)::text = ANY ((ARRAY['SNAP'::character varying, 'CASH'::character varying])::text[])))
);


--
-- Name: ebt_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ebt_batches (
    batch_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    batch_reference character varying(100) NOT NULL,
    business_date date NOT NULL,
    source_kind character varying(20) DEFAULT 'MANUAL_GROUP'::character varying NOT NULL,
    status character varying(12) DEFAULT 'OPEN'::character varying NOT NULL,
    snap_amount numeric(14,2) NOT NULL,
    cash_amount numeric(14,2) NOT NULL,
    refund_amount numeric(14,2) DEFAULT 0 NOT NULL,
    transaction_count integer NOT NULL,
    fees numeric(14,2),
    adjustment_amount numeric(14,2) DEFAULT 0 NOT NULL,
    adjustment_reason character varying(1000),
    actual_deposit numeric(14,2),
    settlement_date date,
    settlement_reference character varying(160),
    variance_review_note character varying(1000),
    notes character varying(2000),
    created_by bigint NOT NULL,
    settled_by bigint,
    reconciled_by bigint,
    request_key uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ebt_batches_batch_reference_check CHECK ((length(TRIM(BOTH FROM batch_reference)) > 0)),
    CONSTRAINT ebt_batches_check CHECK (((adjustment_amount = (0)::numeric) OR (COALESCE(length(TRIM(BOTH FROM adjustment_reason)), 0) > 0))),
    CONSTRAINT ebt_batches_check1 CHECK (((settlement_date IS NULL) OR (settlement_date >= business_date))),
    CONSTRAINT ebt_batches_check2 CHECK ((((status)::text = 'OPEN'::text) OR ((fees IS NOT NULL) AND (actual_deposit IS NOT NULL) AND (settlement_date IS NOT NULL) AND (COALESCE(length(TRIM(BOTH FROM settlement_reference)), 0) > 0) AND (settled_by IS NOT NULL)))),
    CONSTRAINT ebt_batches_check3 CHECK ((((status)::text <> 'RECONCILED'::text) OR ((reconciled_by IS NOT NULL) AND ((actual_deposit = (((snap_amount + cash_amount) + adjustment_amount) - fees)) OR (COALESCE(length(TRIM(BOTH FROM variance_review_note)), 0) > 0))))),
    CONSTRAINT ebt_batches_fees_check CHECK ((fees >= (0)::numeric)),
    CONSTRAINT ebt_batches_refund_amount_check CHECK ((refund_amount >= (0)::numeric)),
    CONSTRAINT ebt_batches_source_kind_check CHECK (((source_kind)::text = ANY ((ARRAY['MANUAL_GROUP'::character varying, 'POS_BATCH'::character varying])::text[]))),
    CONSTRAINT ebt_batches_status_check CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'SETTLED'::character varying, 'RECONCILED'::character varying])::text[]))),
    CONSTRAINT ebt_batches_transaction_count_check CHECK ((transaction_count >= 0))
);


--
-- Name: ebt_batches_batch_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.ebt_batches ALTER COLUMN batch_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ebt_batches_batch_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: employee_compensation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_compensation (
    compensation_id bigint NOT NULL,
    employee_id bigint NOT NULL,
    pay_type character varying(30) NOT NULL,
    hourly_rate numeric(12,2),
    annual_salary numeric(12,2),
    effective_from date NOT NULL,
    effective_to date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_employee_compensation_dates CHECK (((effective_to IS NULL) OR (effective_to >= effective_from)))
);


--
-- Name: employee_compensation_compensation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_compensation_compensation_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_compensation_compensation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_compensation_compensation_id_seq OWNED BY public.employee_compensation.compensation_id;


--
-- Name: employee_deductions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_deductions (
    employee_id bigint NOT NULL,
    deduction_type character varying(40) NOT NULL,
    calculation_type character varying(20) NOT NULL,
    amount numeric(12,2) NOT NULL,
    frequency character varying(30) NOT NULL,
    effective_from date NOT NULL,
    effective_to date,
    active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT employee_deductions_calculation_type_check CHECK (((calculation_type)::text = ANY ((ARRAY['FIXED'::character varying, 'PERCENT'::character varying])::text[]))),
    CONSTRAINT employee_deductions_check CHECK (((amount >= (0)::numeric) AND (((calculation_type)::text <> 'PERCENT'::text) OR (amount <= (100)::numeric)))),
    CONSTRAINT employee_deductions_check1 CHECK (((effective_to IS NULL) OR (effective_to >= effective_from))),
    CONSTRAINT employee_deductions_frequency_check CHECK (((frequency)::text = 'PER_PAY_PERIOD'::text))
);


--
-- Name: employee_deposit_instructions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_deposit_instructions (
    employee_id bigint NOT NULL,
    bank_name character varying(100) NOT NULL,
    account_holder character varying(200) NOT NULL,
    account_type character varying(20) NOT NULL,
    account_last_four character varying(4) NOT NULL,
    routing_number character varying(9) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    is_test boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT employee_deposit_instructions_account_last_four_check CHECK (((account_last_four)::text ~ '^[0-9]{4}$'::text)),
    CONSTRAINT employee_deposit_instructions_account_type_check CHECK (((account_type)::text = ANY ((ARRAY['Checking'::character varying, 'Savings'::character varying])::text[]))),
    CONSTRAINT employee_deposit_instructions_is_test_check CHECK (is_test),
    CONSTRAINT employee_deposit_instructions_routing_number_check CHECK (((routing_number)::text ~ '^[0-9]{9}$'::text))
);


--
-- Name: employee_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_documents (
    employee_document_id bigint NOT NULL,
    employee_id bigint NOT NULL,
    document_type character varying(100) NOT NULL,
    document_name character varying(255) NOT NULL,
    document_url text NOT NULL,
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: employee_documents_employee_document_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_documents_employee_document_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_documents_employee_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_documents_employee_document_id_seq OWNED BY public.employee_documents.employee_document_id;


--
-- Name: employee_emergency_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_emergency_contacts (
    emergency_contact_id bigint NOT NULL,
    employee_id bigint NOT NULL,
    contact_name character varying(150) NOT NULL,
    relationship character varying(50) NOT NULL,
    phone character varying(30) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: employee_emergency_contacts_emergency_contact_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_emergency_contacts_emergency_contact_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_emergency_contacts_emergency_contact_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_emergency_contacts_emergency_contact_id_seq OWNED BY public.employee_emergency_contacts.emergency_contact_id;


--
-- Name: employee_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_schedules (
    schedule_id bigint NOT NULL,
    employee_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    work_date date NOT NULL,
    schedule_start timestamp with time zone NOT NULL,
    schedule_end timestamp with time zone NOT NULL,
    status character varying(30) NOT NULL,
    notes character varying(500),
    created_by bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    job_title character varying(100),
    override_reason character varying(500),
    published_at timestamp with time zone
);


--
-- Name: employee_schedules_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_schedules_schedule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_schedules_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_schedules_schedule_id_seq OWNED BY public.employee_schedules.schedule_id;


--
-- Name: employee_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_status_history (
    status_history_id bigint NOT NULL,
    employee_id bigint NOT NULL,
    status character varying(50) NOT NULL,
    status_type_id bigint NOT NULL
);


--
-- Name: employee_status_history_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_status_history_status_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_status_history_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_status_history_status_history_id_seq OWNED BY public.employee_status_history.status_history_id;


--
-- Name: employee_store_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_store_assignments (
    employee_store_assignment_id bigint NOT NULL,
    employee_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    effective_from date NOT NULL,
    effective_to date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role_type_id bigint,
    job_title character varying(100),
    department_id bigint,
    store_department_id bigint,
    CONSTRAINT chk_employee_store_assignment_dates CHECK (((effective_to IS NULL) OR (effective_to >= effective_from))),
    CONSTRAINT employee_department_one CHECK (((department_id IS NULL) OR (store_department_id IS NULL)))
);


--
-- Name: employee_store_assignments_employee_store_assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_store_assignments_employee_store_assignment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_store_assignments_employee_store_assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_store_assignments_employee_store_assignment_id_seq OWNED BY public.employee_store_assignments.employee_store_assignment_id;


--
-- Name: employee_time_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_time_entries (
    time_entry_id bigint NOT NULL,
    employee_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    clock_in timestamp with time zone NOT NULL,
    clock_out timestamp with time zone,
    regular_hours numeric(8,2) DEFAULT 0 NOT NULL,
    overtime_hours numeric(8,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    event_type character varying(50) NOT NULL
);


--
-- Name: employee_time_entries_time_entry_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_time_entries_time_entry_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_time_entries_time_entry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_time_entries_time_entry_id_seq OWNED BY public.employee_time_entries.time_entry_id;


--
-- Name: employee_time_off_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_time_off_requests (
    time_off_request_id bigint NOT NULL,
    employee_id bigint NOT NULL,
    request_type jsonb NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    hours_requested numeric(8,2),
    reason character varying(500) NOT NULL,
    status_type_id bigint NOT NULL,
    requested_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_by bigint,
    reviewed_at timestamp with time zone,
    rejected_reason character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dgt_id character varying(50),
    submitted_by bigint,
    CONSTRAINT chk_employee_time_off_hours CHECK (((hours_requested IS NULL) OR (hours_requested > (0)::numeric))),
    CONSTRAINT chk_employee_time_off_request_dates CHECK ((end_date >= start_date))
);


--
-- Name: employee_time_off_requests_time_off_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_time_off_requests_time_off_request_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_time_off_requests_time_off_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_time_off_requests_time_off_request_id_seq OWNED BY public.employee_time_off_requests.time_off_request_id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    employee_id bigint NOT NULL,
    hire_date date NOT NULL,
    termination_date date,
    employee_type character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    user_id bigint,
    first_name character varying(100),
    last_name character varying(100),
    CONSTRAINT chk_employee_dates CHECK (((termination_date IS NULL) OR (termination_date >= hire_date))),
    CONSTRAINT employee_identity_required CHECK (((user_id IS NOT NULL) OR ((first_name IS NOT NULL) AND (length(TRIM(BOTH FROM first_name)) > 0) AND (last_name IS NOT NULL) AND (length(TRIM(BOTH FROM last_name)) > 0))))
);


--
-- Name: employees_employee_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_employee_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_employee_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_employee_id_seq OWNED BY public.employees.employee_id;


--
-- Name: everyday_closing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.everyday_closing (
    everyday_closing_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    opening_datetime timestamp with time zone NOT NULL,
    closing_datetime timestamp with time zone NOT NULL,
    total_gross_sales numeric(12,2) DEFAULT 0 NOT NULL,
    total_discounts numeric(12,2) DEFAULT 0 NOT NULL,
    total_tax numeric(12,2) DEFAULT 0 NOT NULL,
    total_net_sales numeric(12,2) DEFAULT 0 NOT NULL,
    total_refunds numeric(12,2) DEFAULT 0 NOT NULL,
    expected_cash numeric(12,2) DEFAULT 0 NOT NULL,
    actual_cash numeric(12,2) DEFAULT 0 NOT NULL,
    cash_variance numeric(12,2) DEFAULT 0 NOT NULL,
    total_deposits numeric(12,2) DEFAULT 0 NOT NULL,
    closed_by bigint NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    business_date date NOT NULL,
    closing_status character varying(16) DEFAULT 'CLOSED'::character varying NOT NULL,
    opening_cash numeric(14,2) DEFAULT 0 NOT NULL,
    cash_added numeric(14,2) DEFAULT 0 NOT NULL,
    cash_drops numeric(14,2) DEFAULT 0 NOT NULL,
    notes text DEFAULT ''::text NOT NULL,
    is_sample boolean DEFAULT false NOT NULL,
    sales_snapshot jsonb,
    opening_checks numeric(12,2),
    closing_checks numeric(12,2),
    card_jobber_settlement numeric(12,2),
    card_bank_settlement numeric(12,2),
    lottery_online_sales numeric(12,2),
    lottery_online_cash numeric(12,2),
    lottery_scratch_cash numeric(12,2),
    lottery_settlement numeric(12,2),
    lottery_adjustment numeric(12,2),
    lottery_online_credit numeric(12,2),
    lottery_scratch_credit numeric(12,2),
    lottery_commission numeric(12,2),
    lottery_balance numeric(12,2),
    CONSTRAINT everyday_closing_cash_added_check CHECK ((cash_added >= (0)::numeric)),
    CONSTRAINT everyday_closing_cash_drops_check CHECK ((cash_drops >= (0)::numeric)),
    CONSTRAINT everyday_closing_closing_checks_check CHECK ((closing_checks >= (0)::numeric)),
    CONSTRAINT everyday_closing_closing_status_check CHECK (((closing_status)::text = ANY ((ARRAY['DRAFT'::character varying, 'CLOSED'::character varying])::text[]))),
    CONSTRAINT everyday_closing_opening_cash_check CHECK ((opening_cash >= (0)::numeric)),
    CONSTRAINT everyday_closing_opening_checks_check CHECK ((opening_checks >= (0)::numeric))
);


--
-- Name: everyday_closing_everyday_closing_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.everyday_closing_everyday_closing_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: everyday_closing_everyday_closing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.everyday_closing_everyday_closing_id_seq OWNED BY public.everyday_closing.everyday_closing_id;


--
-- Name: fleet_batch_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fleet_batch_payments (
    batch_id bigint NOT NULL,
    sale_payment_id bigint NOT NULL,
    payment_amount_snapshot numeric(14,2) NOT NULL
);


--
-- Name: fleet_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fleet_batches (
    batch_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    provider_name character varying(120) NOT NULL,
    batch_reference character varying(100) NOT NULL,
    business_date date NOT NULL,
    source_kind character varying(20) DEFAULT 'MANUAL_GROUP'::character varying NOT NULL,
    status character varying(12) DEFAULT 'OPEN'::character varying NOT NULL,
    fleet_sales numeric(14,2) NOT NULL,
    gallons_sold numeric(16,3),
    fuel_sales numeric(14,2),
    volume_note character varying(1000),
    transaction_count integer NOT NULL,
    statement_discount numeric(14,2),
    processor_fee numeric(14,2),
    actual_deposit numeric(14,2),
    settlement_date date,
    settlement_reference character varying(160),
    variance_review_note character varying(1000),
    notes character varying(2000),
    created_by bigint NOT NULL,
    settled_by bigint,
    reconciled_by bigint,
    request_key uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fleet_batches_batch_reference_check CHECK ((length(TRIM(BOTH FROM batch_reference)) > 0)),
    CONSTRAINT fleet_batches_check CHECK (((gallons_sold IS NULL) = (fuel_sales IS NULL))),
    CONSTRAINT fleet_batches_check1 CHECK (((gallons_sold IS NOT NULL) OR (COALESCE(length(TRIM(BOTH FROM volume_note)), 0) > 0))),
    CONSTRAINT fleet_batches_check2 CHECK (((settlement_date IS NULL) OR (settlement_date >= business_date))),
    CONSTRAINT fleet_batches_check3 CHECK ((((status)::text = 'OPEN'::text) OR ((statement_discount IS NOT NULL) AND (processor_fee IS NOT NULL) AND (actual_deposit IS NOT NULL) AND (settlement_date IS NOT NULL) AND (COALESCE(length(TRIM(BOTH FROM settlement_reference)), 0) > 0) AND (settled_by IS NOT NULL)))),
    CONSTRAINT fleet_batches_check4 CHECK ((((status)::text <> 'RECONCILED'::text) OR ((reconciled_by IS NOT NULL) AND ((actual_deposit = ((fleet_sales - statement_discount) - processor_fee)) OR (COALESCE(length(TRIM(BOTH FROM variance_review_note)), 0) > 0))))),
    CONSTRAINT fleet_batches_processor_fee_check CHECK ((processor_fee >= (0)::numeric)),
    CONSTRAINT fleet_batches_provider_name_check CHECK ((length(TRIM(BOTH FROM provider_name)) > 0)),
    CONSTRAINT fleet_batches_source_kind_check CHECK (((source_kind)::text = ANY ((ARRAY['MANUAL_GROUP'::character varying, 'POS_BATCH'::character varying])::text[]))),
    CONSTRAINT fleet_batches_statement_discount_check CHECK ((statement_discount >= (0)::numeric)),
    CONSTRAINT fleet_batches_status_check CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'SETTLED'::character varying, 'RECONCILED'::character varying])::text[]))),
    CONSTRAINT fleet_batches_transaction_count_check CHECK ((transaction_count >= 0))
);


--
-- Name: fleet_batches_batch_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fleet_batches ALTER COLUMN batch_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fleet_batches_batch_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fuel_adjustment_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_adjustment_lines (
    adjustment_line_id bigint NOT NULL,
    adjustment_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    tank_id bigint NOT NULL,
    fuel_grade_id bigint NOT NULL,
    system_gallons numeric(12,3) NOT NULL,
    actual_gallons numeric(12,3) NOT NULL,
    difference_gallons numeric(12,3) GENERATED ALWAYS AS ((actual_gallons - system_gallons)) STORED,
    baseline_reading_id bigint NOT NULL,
    baseline_movement_id bigint,
    reason character varying(30) NOT NULL,
    CONSTRAINT fuel_adjustment_lines_actual_gallons_check CHECK ((actual_gallons >= (0)::numeric)),
    CONSTRAINT fuel_adjustment_lines_reason_check CHECK (((reason)::text = ANY ((ARRAY['meter_variance'::character varying, 'evaporation'::character varying, 'leak'::character varying, 'theft'::character varying, 'calibration'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT fuel_adjustment_lines_system_gallons_check CHECK ((system_gallons >= (0)::numeric))
);


--
-- Name: fuel_adjustment_lines_adjustment_line_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fuel_adjustment_lines ALTER COLUMN adjustment_line_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fuel_adjustment_lines_adjustment_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fuel_adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_adjustments (
    adjustment_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    client_request_id uuid NOT NULL,
    request_hash character varying(64) NOT NULL,
    adjustment_date date NOT NULL,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    notes text,
    created_by bigint NOT NULL,
    reviewed_by bigint,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fuel_adjustments_check CHECK (((((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'PENDING'::character varying])::text[])) AND (reviewed_by IS NULL) AND (reviewed_at IS NULL)) OR (((status)::text = ANY ((ARRAY['POSTED'::character varying, 'REJECTED'::character varying])::text[])) AND (reviewed_by IS NOT NULL) AND (reviewed_at IS NOT NULL)))),
    CONSTRAINT fuel_adjustments_check1 CHECK ((((status)::text <> 'REJECTED'::text) OR (length(TRIM(BOTH FROM rejection_reason)) > 0))),
    CONSTRAINT fuel_adjustments_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'PENDING'::character varying, 'POSTED'::character varying, 'REJECTED'::character varying])::text[])))
);


--
-- Name: fuel_adjustments_adjustment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fuel_adjustments ALTER COLUMN adjustment_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fuel_adjustments_adjustment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fuel_deliveries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_deliveries (
    delivery_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    vendor_id bigint NOT NULL,
    client_request_id uuid NOT NULL,
    request_hash character varying(64) NOT NULL,
    bol_number character varying(100) NOT NULL,
    folio character varying(100),
    load_date date NOT NULL,
    load_time time without time zone,
    terminal character varying(250),
    customer_account character varying(250),
    destination character varying(500),
    carrier_name character varying(200),
    driver_name character varying(200),
    tractor_number character varying(100),
    trailer_number character varying(100),
    notes text,
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    created_by bigint NOT NULL,
    received_by bigint,
    received_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fuel_deliveries_bol_number_check CHECK ((length(TRIM(BOTH FROM bol_number)) > 0)),
    CONSTRAINT fuel_deliveries_check CHECK (((((status)::text = 'DRAFT'::text) AND (received_by IS NULL) AND (received_at IS NULL)) OR (((status)::text = 'RECEIVED'::text) AND (received_by IS NOT NULL) AND (received_at IS NOT NULL)))),
    CONSTRAINT fuel_deliveries_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'RECEIVED'::character varying])::text[])))
);


--
-- Name: fuel_deliveries_delivery_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fuel_deliveries ALTER COLUMN delivery_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fuel_deliveries_delivery_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fuel_delivery_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_delivery_lines (
    delivery_line_id bigint NOT NULL,
    delivery_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    line_number integer NOT NULL,
    tank_id bigint NOT NULL,
    fuel_grade_id bigint NOT NULL,
    product_code character varying(100),
    description character varying(300),
    octane numeric(5,2),
    gross_gallons numeric(14,3) NOT NULL,
    net_gallons numeric(14,3) NOT NULL,
    temperature numeric(7,3),
    gravity numeric(7,3),
    meter character varying(100),
    compartment character varying(100),
    CONSTRAINT fuel_delivery_lines_gross_gallons_check CHECK ((gross_gallons > (0)::numeric)),
    CONSTRAINT fuel_delivery_lines_line_number_check CHECK ((line_number > 0)),
    CONSTRAINT fuel_delivery_lines_net_gallons_check CHECK ((net_gallons > (0)::numeric)),
    CONSTRAINT fuel_delivery_lines_octane_check CHECK ((octane >= (0)::numeric))
);


--
-- Name: fuel_delivery_lines_delivery_line_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fuel_delivery_lines ALTER COLUMN delivery_line_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fuel_delivery_lines_delivery_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fuel_grades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_grades (
    fuel_grade_id bigint NOT NULL,
    fuel_type character varying(50) NOT NULL,
    grade_name character varying(100) NOT NULL,
    octane_rating numeric(5,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: fuel_grades_fuel_grade_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fuel_grades_fuel_grade_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fuel_grades_fuel_grade_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fuel_grades_fuel_grade_id_seq OWNED BY public.fuel_grades.fuel_grade_id;


--
-- Name: fuel_invoice_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_invoice_details (
    fuel_invoice_details_id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    delivery_number character varying(100),
    bill_of_lading_number character varying(100),
    carrier_name character varying(150),
    delivery_date date NOT NULL,
    total_gallons numeric(12,3) NOT NULL,
    fuel_subtotal numeric(12,2) NOT NULL,
    freight_amount numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: fuel_invoice_details_fuel_invoice_details_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fuel_invoice_details_fuel_invoice_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fuel_invoice_details_fuel_invoice_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fuel_invoice_details_fuel_invoice_details_id_seq OWNED BY public.fuel_invoice_details.fuel_invoice_details_id;


--
-- Name: fuel_invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_invoice_items (
    fuel_invoice_item_id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    fuel_grade_id bigint NOT NULL,
    gross_gallons numeric(12,3) NOT NULL,
    net_gallons numeric(12,3) NOT NULL,
    price_per_gallon numeric(12,4) NOT NULL,
    fuel_line_total numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: fuel_invoice_items_fuel_invoice_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fuel_invoice_items_fuel_invoice_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fuel_invoice_items_fuel_invoice_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fuel_invoice_items_fuel_invoice_item_id_seq OWNED BY public.fuel_invoice_items.fuel_invoice_item_id;


--
-- Name: fuel_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_prices (
    fuel_price_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    fuel_grade_id bigint NOT NULL,
    cash_price numeric(10,3) NOT NULL,
    credit_price numeric(10,3) NOT NULL,
    effective_from timestamp with time zone NOT NULL,
    effective_to timestamp with time zone,
    changed_by bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: fuel_prices_fuel_price_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fuel_prices_fuel_price_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fuel_prices_fuel_price_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fuel_prices_fuel_price_id_seq OWNED BY public.fuel_prices.fuel_price_id;


--
-- Name: fuel_pumps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_pumps (
    pump_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    pump_number character varying(50) NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    serial_number character varying(100) NOT NULL
);


--
-- Name: fuel_pumps_pump_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fuel_pumps_pump_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fuel_pumps_pump_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fuel_pumps_pump_id_seq OWNED BY public.fuel_pumps.pump_id;


--
-- Name: fuel_tank_grade_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_tank_grade_assignments (
    assignment_id bigint NOT NULL,
    tank_id bigint NOT NULL,
    fuel_grade_id bigint NOT NULL,
    effective_from date NOT NULL,
    effective_to date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: fuel_tank_grade_assignments_assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fuel_tank_grade_assignments_assignment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fuel_tank_grade_assignments_assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fuel_tank_grade_assignments_assignment_id_seq OWNED BY public.fuel_tank_grade_assignments.assignment_id;


--
-- Name: fuel_tank_readings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_tank_readings (
    tank_reading_id bigint NOT NULL,
    tank_id bigint NOT NULL,
    reading_datetime timestamp with time zone NOT NULL,
    volume_gallons numeric(12,2) NOT NULL,
    temperature numeric(8,2),
    ullage numeric(12,2),
    created_by bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    image_url text
);


--
-- Name: fuel_tank_readings_tank_reading_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fuel_tank_readings_tank_reading_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fuel_tank_readings_tank_reading_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fuel_tank_readings_tank_reading_id_seq OWNED BY public.fuel_tank_readings.tank_reading_id;


--
-- Name: fuel_tanks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_tanks (
    tank_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    tank_number character varying(50) NOT NULL,
    tank_name character varying(100),
    capacity_gallons numeric(12,2) NOT NULL,
    safe_fill_capacity numeric(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    capacity_locked boolean DEFAULT true NOT NULL,
    low_level_percentage numeric(5,2),
    prepaid_tax_per_gallon numeric(12,4),
    tax_rate_per_gallon numeric(12,4),
    ust_fee_per_gallon numeric(12,4),
    pos_mapping character varying(100),
    CONSTRAINT fuel_tanks_low_level_percentage_check CHECK (((low_level_percentage >= (0)::numeric) AND (low_level_percentage <= (100)::numeric))),
    CONSTRAINT fuel_tanks_prepaid_tax_per_gallon_check CHECK ((prepaid_tax_per_gallon >= (0)::numeric)),
    CONSTRAINT fuel_tanks_tax_rate_per_gallon_check CHECK ((tax_rate_per_gallon >= (0)::numeric)),
    CONSTRAINT fuel_tanks_ust_fee_per_gallon_check CHECK ((ust_fee_per_gallon >= (0)::numeric))
);


--
-- Name: fuel_tanks_tank_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fuel_tanks_tank_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fuel_tanks_tank_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fuel_tanks_tank_id_seq OWNED BY public.fuel_tanks.tank_id;


--
-- Name: gas_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gas_settings (
    dgt_id character varying(50) NOT NULL,
    plus_tank_type character varying(20),
    blend_regular_percentage numeric(5,2),
    sells_diesel boolean NOT NULL,
    two_blended_grades boolean NOT NULL,
    federal_multiplier numeric(12,6),
    federal_tolerance_gallons numeric(12,3),
    state_multiplier numeric(12,6),
    state_tolerance_gallons numeric(12,3),
    report_state character varying(100),
    supplier_payment_method character varying(20),
    gas_brand_type character varying(20),
    card_settlement_method character varying(20),
    allowed_variance_percentage numeric(5,2),
    daily_loss_threshold_gallons numeric(12,3),
    auto_flag_variance boolean NOT NULL,
    variance_approval_required boolean NOT NULL,
    low_tank_dashboard boolean NOT NULL,
    low_tank_email boolean NOT NULL,
    high_variance_dashboard boolean NOT NULL,
    high_variance_email boolean NOT NULL,
    repeated_loss_dashboard boolean NOT NULL,
    repeated_loss_email boolean NOT NULL,
    missing_reading_dashboard boolean NOT NULL,
    missing_reading_email boolean NOT NULL,
    lock_critical_after_delivery boolean NOT NULL,
    updated_by bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT gas_settings_allowed_variance_percentage_check CHECK (((allowed_variance_percentage >= (0)::numeric) AND (allowed_variance_percentage <= (100)::numeric))),
    CONSTRAINT gas_settings_blend_regular_percentage_check CHECK (((blend_regular_percentage >= (0)::numeric) AND (blend_regular_percentage <= (100)::numeric))),
    CONSTRAINT gas_settings_card_settlement_method_check CHECK (((card_settlement_method)::text = ANY ((ARRAY['direct'::character varying, 'jobber'::character varying])::text[]))),
    CONSTRAINT gas_settings_daily_loss_threshold_gallons_check CHECK ((daily_loss_threshold_gallons >= (0)::numeric)),
    CONSTRAINT gas_settings_federal_multiplier_check CHECK ((federal_multiplier >= (0)::numeric)),
    CONSTRAINT gas_settings_federal_tolerance_gallons_check CHECK ((federal_tolerance_gallons >= (0)::numeric)),
    CONSTRAINT gas_settings_gas_brand_type_check CHECK (((gas_brand_type)::text = ANY ((ARRAY['branded'::character varying, 'unbranded'::character varying])::text[]))),
    CONSTRAINT gas_settings_plus_tank_type_check CHECK (((plus_tank_type)::text = ANY ((ARRAY['blended'::character varying, 'separate'::character varying])::text[]))),
    CONSTRAINT gas_settings_state_multiplier_check CHECK ((state_multiplier >= (0)::numeric)),
    CONSTRAINT gas_settings_state_tolerance_gallons_check CHECK ((state_tolerance_gallons >= (0)::numeric)),
    CONSTRAINT gas_settings_supplier_payment_method_check CHECK (((supplier_payment_method)::text = ANY ((ARRAY['ach'::character varying, 'check'::character varying, 'wire'::character varying, 'auto-debit'::character varying])::text[])))
);


--
-- Name: grocery_invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grocery_invoice_items (
    grocery_invoice_item_id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    product_id bigint NOT NULL,
    vendor_item_code character varying(100),
    quantity numeric(12,3) NOT NULL,
    unit_type character varying(50) NOT NULL,
    case_pack_quantity numeric(12,3),
    unit_cost numeric(12,2) NOT NULL,
    item_line_discount numeric(12,2) DEFAULT 0 NOT NULL,
    item_line_total numeric(12,2) NOT NULL,
    is_product_new boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    msrp numeric(12,2),
    received_quantity numeric(12,3),
    line_tax numeric(12,2) DEFAULT 0 NOT NULL,
    CONSTRAINT grocery_invoice_items_line_tax_check CHECK ((line_tax >= (0)::numeric)),
    CONSTRAINT grocery_invoice_items_msrp_check CHECK ((msrp >= (0)::numeric)),
    CONSTRAINT grocery_invoice_items_received_quantity_check CHECK ((received_quantity >= (0)::numeric))
);


--
-- Name: COLUMN grocery_invoice_items.msrp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.grocery_invoice_items.msrp IS 'Invoice manufacturer suggested retail price per individual unit; null when not supplied.';


--
-- Name: grocery_invoice_items_grocery_invoice_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grocery_invoice_items_grocery_invoice_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grocery_invoice_items_grocery_invoice_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.grocery_invoice_items_grocery_invoice_item_id_seq OWNED BY public.grocery_invoice_items.grocery_invoice_item_id;


--
-- Name: grocery_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grocery_settings (
    dgt_id character varying(50) NOT NULL,
    default_tax_type character varying(20) NOT NULL,
    allow_subdepartment_tax_override boolean NOT NULL,
    allow_item_tax_override boolean NOT NULL,
    tax_rounding character varying(20) NOT NULL,
    ebt_tax_exempt boolean NOT NULL,
    wic_tax_exempt boolean NOT NULL,
    expiry_tracking boolean NOT NULL,
    expiry_alert_days integer NOT NULL,
    expired_item_handling character varying(20) NOT NULL,
    expiry_dashboard_notification boolean NOT NULL,
    expiry_email_notification boolean NOT NULL,
    expiry_in_app_notification boolean NOT NULL,
    reorder_rule character varying(20) NOT NULL,
    default_lead_time_days integer NOT NULL,
    safety_stock_percentage numeric(7,2) NOT NULL,
    allow_item_reorder_override boolean NOT NULL,
    updated_by bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT grocery_settings_default_lead_time_days_check CHECK (((default_lead_time_days >= 0) AND (default_lead_time_days <= 3650))),
    CONSTRAINT grocery_settings_default_tax_type_check CHECK (((default_tax_type)::text = ANY ((ARRAY['taxable'::character varying, 'non_taxable'::character varying])::text[]))),
    CONSTRAINT grocery_settings_expired_item_handling_check CHECK (((expired_item_handling)::text = ANY ((ARRAY['block'::character varying, 'warning'::character varying])::text[]))),
    CONSTRAINT grocery_settings_expiry_alert_days_check CHECK (((expiry_alert_days >= 0) AND (expiry_alert_days <= 3650))),
    CONSTRAINT grocery_settings_reorder_rule_check CHECK (((reorder_rule)::text = ANY ((ARRAY['fixed'::character varying, 'days_of_stock'::character varying])::text[]))),
    CONSTRAINT grocery_settings_safety_stock_percentage_check CHECK (((safety_stock_percentage >= (0)::numeric) AND (safety_stock_percentage <= (1000)::numeric))),
    CONSTRAINT grocery_settings_tax_rounding_check CHECK (((tax_rounding)::text = ANY ((ARRAY['standard'::character varying, 'round_up'::character varying, 'round_down'::character varying, 'banker'::character varying])::text[])))
);


--
-- Name: inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory (
    inventory_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    product_id bigint NOT NULL,
    available_quantity numeric(12,3) DEFAULT 0 NOT NULL,
    cost numeric(12,2) DEFAULT 0 NOT NULL,
    return_cost numeric(12,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_inventory_available_quantity CHECK ((available_quantity >= (0)::numeric)),
    CONSTRAINT chk_inventory_cost CHECK ((cost >= (0)::numeric)),
    CONSTRAINT chk_inventory_return_cost CHECK ((return_cost >= (0)::numeric))
);


--
-- Name: inventory_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_inventory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_inventory_id_seq OWNED BY public.inventory.inventory_id;


--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_movements (
    movement_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    product_id bigint,
    movement_type character varying(30) NOT NULL,
    qty_changed numeric(12,3) NOT NULL,
    unit_cost numeric(12,2) DEFAULT 0,
    reference_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tank_id bigint,
    fuel_grade_id bigint,
    fuel_delivery_line_id bigint,
    net_gallons numeric(14,3),
    fuel_adjustment_line_id bigint,
    CONSTRAINT chk_inventory_movements_unit_cost CHECK ((unit_cost >= (0)::numeric)),
    CONSTRAINT inventory_movement_subject_check CHECK ((((product_id IS NOT NULL) AND (unit_cost IS NOT NULL) AND (tank_id IS NULL) AND (fuel_grade_id IS NULL) AND (fuel_delivery_line_id IS NULL) AND (fuel_adjustment_line_id IS NULL) AND (net_gallons IS NULL)) OR ((product_id IS NULL) AND (tank_id IS NOT NULL) AND (fuel_grade_id IS NOT NULL) AND (fuel_delivery_line_id IS NOT NULL) AND (fuel_adjustment_line_id IS NULL) AND ((movement_type)::text = 'FUEL_DELIVERY'::text) AND (qty_changed > (0)::numeric) AND (net_gallons IS NOT NULL) AND (net_gallons > (0)::numeric)) OR ((product_id IS NULL) AND (tank_id IS NOT NULL) AND (fuel_grade_id IS NOT NULL) AND (fuel_delivery_line_id IS NULL) AND (fuel_adjustment_line_id IS NOT NULL) AND ((movement_type)::text = 'FUEL_ADJUSTMENT'::text) AND (qty_changed <> (0)::numeric) AND (unit_cost IS NULL) AND (net_gallons IS NULL))))
);


--
-- Name: inventory_movements_movement_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_movements_movement_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_movements_movement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_movements_movement_id_seq OWNED BY public.inventory_movements.movement_id;


--
-- Name: inventory_reduction_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_reduction_requests (
    reduction_request_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    product_id bigint NOT NULL,
    request_type character varying(30) NOT NULL,
    quantity numeric(12,3) NOT NULL,
    reason character varying(255) NOT NULL,
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    notes text,
    destination character varying(150),
    requested_by bigint NOT NULL,
    rejection_reason character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_inventory_reduction_requests_quantity CHECK ((quantity > (0)::numeric))
);


--
-- Name: inventory_reduction_requests_reduction_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_reduction_requests_reduction_request_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_reduction_requests_reduction_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_reduction_requests_reduction_request_id_seq OWNED BY public.inventory_reduction_requests.reduction_request_id;


--
-- Name: inventory_return_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_return_items (
    return_item_id bigint NOT NULL,
    return_id bigint NOT NULL,
    product_id bigint NOT NULL,
    qty numeric(12,3) NOT NULL,
    unit_cost numeric(12,2) NOT NULL,
    reason character varying(255),
    CONSTRAINT chk_inventory_return_items_qty CHECK ((qty > (0)::numeric)),
    CONSTRAINT chk_inventory_return_items_unit_cost CHECK ((unit_cost >= (0)::numeric))
);


--
-- Name: inventory_return_items_return_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_return_items_return_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_return_items_return_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_return_items_return_item_id_seq OWNED BY public.inventory_return_items.return_item_id;


--
-- Name: inventory_returns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_returns (
    return_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    vendor_id bigint NOT NULL,
    return_type character varying(30) NOT NULL,
    reference_number character varying(100),
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reduction_request_id bigint,
    settled_at timestamp with time zone,
    settled_by bigint
);


--
-- Name: inventory_returns_return_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_returns_return_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_returns_return_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_returns_return_id_seq OWNED BY public.inventory_returns.return_id;


--
-- Name: inventory_shrinkage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_shrinkage (
    shrinkage_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    shrinkage_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reason_type character varying(50) NOT NULL,
    created_by bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: inventory_shrinkage_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_shrinkage_items (
    shrinkage_item_id bigint NOT NULL,
    shrinkage_id bigint NOT NULL,
    product_id bigint NOT NULL,
    qty numeric(12,3) NOT NULL,
    unit_cost numeric(12,2) NOT NULL,
    loss_amount numeric(12,2) NOT NULL,
    reason character varying(255),
    CONSTRAINT chk_shrinkage_items_loss_amount CHECK ((loss_amount >= (0)::numeric)),
    CONSTRAINT chk_shrinkage_items_qty CHECK ((qty > (0)::numeric)),
    CONSTRAINT chk_shrinkage_items_unit_cost CHECK ((unit_cost >= (0)::numeric))
);


--
-- Name: inventory_shrinkage_items_shrinkage_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_shrinkage_items_shrinkage_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_shrinkage_items_shrinkage_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_shrinkage_items_shrinkage_item_id_seq OWNED BY public.inventory_shrinkage_items.shrinkage_item_id;


--
-- Name: inventory_shrinkage_shrinkage_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_shrinkage_shrinkage_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_shrinkage_shrinkage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_shrinkage_shrinkage_id_seq OWNED BY public.inventory_shrinkage.shrinkage_id;


--
-- Name: inventory_transfer_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_transfer_items (
    transfer_item_id bigint NOT NULL,
    transfer_id bigint NOT NULL,
    product_id bigint NOT NULL,
    qty_sent numeric(12,3) NOT NULL,
    qty_received numeric(12,3) DEFAULT 0 NOT NULL,
    unit_cost numeric(12,2) NOT NULL,
    destination_product_id bigint,
    CONSTRAINT chk_inventory_transfer_items_qty_received CHECK ((qty_received >= (0)::numeric)),
    CONSTRAINT chk_inventory_transfer_items_qty_sent CHECK ((qty_sent > (0)::numeric)),
    CONSTRAINT chk_inventory_transfer_items_unit_cost CHECK ((unit_cost >= (0)::numeric))
);


--
-- Name: inventory_transfer_items_transfer_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_transfer_items_transfer_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_transfer_items_transfer_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_transfer_items_transfer_item_id_seq OWNED BY public.inventory_transfer_items.transfer_item_id;


--
-- Name: inventory_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_transfers (
    transfer_id bigint NOT NULL,
    from_dgt_id character varying(50) NOT NULL,
    to_dgt_id character varying(50) NOT NULL,
    transfer_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    created_by bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reduction_request_id bigint,
    CONSTRAINT chk_inventory_transfers_different_stores CHECK (((from_dgt_id)::text <> (to_dgt_id)::text))
);


--
-- Name: inventory_transfers_transfer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inventory_transfers_transfer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inventory_transfers_transfer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inventory_transfers_transfer_id_seq OWNED BY public.inventory_transfers.transfer_id;


--
-- Name: invoice_adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_adjustments (
    invoice_adjustment_id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    adjustment_type character varying(50) NOT NULL,
    adjusted_amount numeric(12,2) NOT NULL,
    reason character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: invoice_adjustments_invoice_adjustment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_adjustments_invoice_adjustment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_adjustments_invoice_adjustment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_adjustments_invoice_adjustment_id_seq OWNED BY public.invoice_adjustments.invoice_adjustment_id;


--
-- Name: invoice_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_audit_log (
    invoice_audit_log_id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    action_type character varying(50) NOT NULL,
    action_by bigint NOT NULL,
    old_value text,
    new_value text
);


--
-- Name: invoice_audit_log_invoice_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_audit_log_invoice_audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_audit_log_invoice_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_audit_log_invoice_audit_log_id_seq OWNED BY public.invoice_audit_log.invoice_audit_log_id;


--
-- Name: invoice_charges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_charges (
    invoice_charge_id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    charge_type character varying(50) NOT NULL,
    sub_total numeric(12,2) NOT NULL,
    discounted_amount numeric(12,2) DEFAULT 0 NOT NULL,
    other_charges numeric(12,2) DEFAULT 0 NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    status_id bigint NOT NULL,
    payment_status character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    freight_amount numeric(12,2) DEFAULT 0 NOT NULL,
    fuel_surcharge numeric(12,2) DEFAULT 0 NOT NULL,
    handling_fee numeric(12,2) DEFAULT 0 NOT NULL,
    CONSTRAINT invoice_charges_freight_amount_check CHECK ((freight_amount >= (0)::numeric)),
    CONSTRAINT invoice_charges_fuel_surcharge_check CHECK ((fuel_surcharge >= (0)::numeric)),
    CONSTRAINT invoice_charges_handling_fee_check CHECK ((handling_fee >= (0)::numeric))
);


--
-- Name: invoice_charges_invoice_charge_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_charges_invoice_charge_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_charges_invoice_charge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_charges_invoice_charge_id_seq OWNED BY public.invoice_charges.invoice_charge_id;


--
-- Name: invoice_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_documents (
    invoice_document_id bigint NOT NULL,
    invoice_id bigint NOT NULL,
    document_type character varying(50) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_url text NOT NULL,
    uploaded_by bigint NOT NULL,
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: invoice_documents_invoice_document_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_documents_invoice_document_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_documents_invoice_document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_documents_invoice_document_id_seq OWNED BY public.invoice_documents.invoice_document_id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    invoice_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    vendor_id bigint NOT NULL,
    invoice_number character varying(100) NOT NULL,
    invoice_type character varying(50) NOT NULL,
    invoice_date date NOT NULL,
    received_date date,
    due_date date,
    received_by bigint NOT NULL,
    approved_by bigint,
    approved_at timestamp with time zone,
    purchase_order_id bigint,
    delivery_time time without time zone,
    driver_name character varying(200),
    driver_number character varying(100),
    route_id character varying(100),
    payment_terms character varying(200),
    notes character varying(4000)
);


--
-- Name: invoices_invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoices_invoice_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices_invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoices_invoice_id_seq OWNED BY public.invoices.invoice_id;


--
-- Name: lottery_games; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lottery_games (
    lottery_game_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    game_code character varying(50) NOT NULL,
    game_name character varying(150) NOT NULL,
    ticket_price numeric(10,2) NOT NULL,
    tickets_per_pack integer NOT NULL,
    pack_value numeric(12,2) NOT NULL,
    commission_percent numeric(5,2) NOT NULL,
    status character varying(30) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    pack_number character varying(50),
    barcode character varying(100)
);


--
-- Name: lottery_games_lottery_game_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lottery_games_lottery_game_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lottery_games_lottery_game_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lottery_games_lottery_game_id_seq OWNED BY public.lottery_games.lottery_game_id;


--
-- Name: lottery_pack_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lottery_pack_inventory (
    lottery_pack_inventory_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    shift_opened_by bigint NOT NULL,
    shift_opened_at timestamp with time zone NOT NULL,
    shift_closed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: lottery_pack_inventory_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lottery_pack_inventory_items (
    lottery_pack_inventory_item_id bigint NOT NULL,
    lottery_pack_inventory_id bigint NOT NULL,
    open_ticket_number integer NOT NULL,
    last_sold_ticket_number integer,
    physical_quantity integer NOT NULL,
    pack_id bigint NOT NULL,
    commission_amount numeric(12,2),
    expected_cash numeric(12,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: lottery_pack_inventory_items_lottery_pack_inventory_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lottery_pack_inventory_items_lottery_pack_inventory_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lottery_pack_inventory_items_lottery_pack_inventory_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lottery_pack_inventory_items_lottery_pack_inventory_item_id_seq OWNED BY public.lottery_pack_inventory_items.lottery_pack_inventory_item_id;


--
-- Name: lottery_pack_inventory_lottery_pack_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lottery_pack_inventory_lottery_pack_inventory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lottery_pack_inventory_lottery_pack_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lottery_pack_inventory_lottery_pack_inventory_id_seq OWNED BY public.lottery_pack_inventory.lottery_pack_inventory_id;


--
-- Name: lottery_packs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lottery_packs (
    lottery_pack_id bigint NOT NULL,
    invoice_id bigint,
    dgt_id character varying(50) NOT NULL,
    vendor_id bigint NOT NULL,
    start_ticket_number integer NOT NULL,
    end_ticket_number integer NOT NULL,
    total_tickets integer NOT NULL,
    status_id bigint NOT NULL,
    return_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    performed_by bigint NOT NULL
);


--
-- Name: lottery_packs_lottery_pack_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lottery_packs_lottery_pack_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lottery_packs_lottery_pack_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lottery_packs_lottery_pack_id_seq OWNED BY public.lottery_packs.lottery_pack_id;


--
-- Name: lottery_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lottery_settings (
    lottery_setting_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    max_open_packs_per_game integer NOT NULL,
    allow_partial_returns boolean NOT NULL,
    default_commission_per_pack numeric(12,2) NOT NULL,
    settlement_frequency jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: lottery_settings_lottery_setting_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lottery_settings_lottery_setting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lottery_settings_lottery_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lottery_settings_lottery_setting_id_seq OWNED BY public.lottery_settings.lottery_setting_id;


--
-- Name: lottery_settlements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lottery_settlements (
    lottery_settlement_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    vendor_id bigint NOT NULL,
    settlement_reference character varying(100) NOT NULL,
    period_type jsonb NOT NULL,
    period_start_date date NOT NULL,
    period_end_date date NOT NULL,
    total_sales numeric(12,2) NOT NULL,
    total_commission numeric(12,2) NOT NULL,
    status_type_id bigint NOT NULL,
    created_by bigint NOT NULL,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: lottery_settlements_lottery_settlement_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lottery_settlements_lottery_settlement_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lottery_settlements_lottery_settlement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lottery_settlements_lottery_settlement_id_seq OWNED BY public.lottery_settlements.lottery_settlement_id;


--
-- Name: module_approval_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.module_approval_policies (
    company_id bigint NOT NULL,
    module_id bigint NOT NULL,
    manager_requires_admin boolean DEFAULT false NOT NULL,
    updated_by bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modules (
    module_id bigint NOT NULL,
    module_name character varying(100) NOT NULL,
    submodule_name character varying(100),
    description character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: modules_module_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.modules ALTER COLUMN module_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.modules_module_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: new_arrivals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.new_arrivals (
    new_arrivals_id bigint NOT NULL,
    invoice_item_id bigint NOT NULL,
    product_name character varying(200) NOT NULL,
    department_id bigint NOT NULL,
    store_sub_department_id bigint NOT NULL,
    suggested_retail_price numeric(12,2),
    status_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: new_arrivals_new_arrivals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.new_arrivals_new_arrivals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: new_arrivals_new_arrivals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.new_arrivals_new_arrivals_id_seq OWNED BY public.new_arrivals.new_arrivals_id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    permission_id bigint NOT NULL,
    module_id bigint NOT NULL,
    user_role_id bigint NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    can_view boolean DEFAULT false NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    CONSTRAINT permissions_edit_requires_view CHECK (((NOT can_edit) OR can_view))
);


--
-- Name: permissions_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.permissions ALTER COLUMN permission_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.permissions_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: pos_terminals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pos_terminals (
    terminal_id bigint NOT NULL,
    store_id character varying NOT NULL,
    terminal_code character varying(50) NOT NULL,
    terminal_name character varying(100),
    terminal_status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_pos_terminal_status CHECK (((terminal_status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'INACTIVE'::character varying, 'MAINTENANCE'::character varying])::text[])))
);


--
-- Name: pos_terminals_terminal_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.pos_terminals ALTER COLUMN terminal_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.pos_terminals_terminal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: price_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_groups (
    price_group_id bigint NOT NULL,
    price_group_name character varying(150) NOT NULL,
    description character varying(500),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    group_price numeric(12,2) NOT NULL,
    dgt_id character varying(50) NOT NULL,
    creation_key uuid,
    creation_payload jsonb,
    CONSTRAINT chk_price_groups_group_price CHECK ((group_price >= (0)::numeric))
);


--
-- Name: price_groups_price_group_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.price_groups_price_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: price_groups_price_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.price_groups_price_group_id_seq OWNED BY public.price_groups.price_group_id;


--
-- Name: product_barcodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_barcodes (
    product_barcode_id bigint NOT NULL,
    product_id bigint NOT NULL,
    product_barcode_type character varying(20) NOT NULL,
    product_barcode_value character varying(50) NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dgt_id character varying(50) NOT NULL
);


--
-- Name: product_barcodes_product_barcode_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_barcodes_product_barcode_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_barcodes_product_barcode_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_barcodes_product_barcode_id_seq OWNED BY public.product_barcodes.product_barcode_id;


--
-- Name: product_price_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_price_groups (
    product_price_group_id bigint NOT NULL,
    price_group_id bigint NOT NULL,
    product_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dgt_id character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: product_price_groups_product_price_group_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_price_groups_product_price_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_price_groups_product_price_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_price_groups_product_price_group_id_seq OWNED BY public.product_price_groups.product_price_group_id;


--
-- Name: product_store_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_store_prices (
    store_price_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    product_id bigint NOT NULL,
    retail_price numeric(12,2) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    rebate_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_product_store_prices_retail_price CHECK ((retail_price >= (0)::numeric))
);


--
-- Name: product_store_prices_store_price_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_store_prices_store_price_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_store_prices_store_price_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_store_prices_store_price_id_seq OWNED BY public.product_store_prices.store_price_id;


--
-- Name: product_vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_vendors (
    product_vendor_id bigint NOT NULL,
    product_id bigint NOT NULL,
    vendor_id bigint NOT NULL,
    vendor_sku character varying(100),
    unit_type character varying(50),
    unit_of_measure character varying(50),
    unit_cost numeric(12,2) NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dgt_id character varying(50) NOT NULL,
    case_pack_quantity integer,
    minimum_order_quantity numeric(12,3),
    CONSTRAINT chk_product_vendors_unit_cost CHECK ((unit_cost >= (0)::numeric)),
    CONSTRAINT product_vendors_case_pack_quantity_check CHECK ((case_pack_quantity > 0)),
    CONSTRAINT product_vendors_minimum_order_quantity_check CHECK ((minimum_order_quantity > (0)::numeric))
);


--
-- Name: product_vendors_product_vendor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_vendors_product_vendor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_vendors_product_vendor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_vendors_product_vendor_id_seq OWNED BY public.product_vendors.product_vendor_id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    product_id bigint NOT NULL,
    store_sub_department_id bigint NOT NULL,
    product_name character varying(200) NOT NULL,
    product_sku character varying(100) NOT NULL,
    is_returnable boolean DEFAULT false NOT NULL,
    brand_id bigint,
    unit_of_measure character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_taxable boolean DEFAULT true NOT NULL,
    is_ebt boolean DEFAULT false NOT NULL,
    dgt_id character varying(50) NOT NULL,
    is_age_restricted boolean,
    reorder_level numeric(12,3),
    purchase_unit character varying(10),
    units_per_case integer,
    purchase_gross_cost numeric(12,2),
    purchase_discount numeric(12,2),
    CONSTRAINT pricebook_case_quantity CHECK (((units_per_case IS NULL) OR (units_per_case > 0))),
    CONSTRAINT pricebook_purchase_basis CHECK ((((purchase_gross_cost IS NULL) OR (purchase_unit IS NOT NULL)) AND (((purchase_unit)::text IS DISTINCT FROM 'CASE'::text) OR (units_per_case IS NOT NULL)))),
    CONSTRAINT pricebook_purchase_cost CHECK ((((purchase_gross_cost IS NULL) AND (purchase_discount IS NULL)) OR ((purchase_gross_cost IS NOT NULL) AND (purchase_discount IS NOT NULL) AND (purchase_gross_cost >= (0)::numeric) AND (purchase_discount >= (0)::numeric) AND (purchase_discount <= purchase_gross_cost)))),
    CONSTRAINT pricebook_purchase_unit CHECK (((purchase_unit IS NULL) OR ((purchase_unit)::text = ANY ((ARRAY['ITEM'::character varying, 'CASE'::character varying])::text[])))),
    CONSTRAINT pricebook_reorder_nonnegative CHECK (((reorder_level IS NULL) OR (reorder_level >= (0)::numeric)))
);


--
-- Name: products_product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_product_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_product_id_seq OWNED BY public.products.product_id;


--
-- Name: promotion_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotion_products (
    promotion_product_id bigint NOT NULL,
    promotion_id bigint NOT NULL,
    product_id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dgt_id character varying(50) NOT NULL,
    required_quantity integer DEFAULT 1 NOT NULL,
    CONSTRAINT promotion_products_required_quantity_check CHECK ((required_quantity > 0))
);


--
-- Name: promotion_products_promotion_product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.promotion_products_promotion_product_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: promotion_products_promotion_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.promotion_products_promotion_product_id_seq OWNED BY public.promotion_products.promotion_product_id;


--
-- Name: promotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotions (
    promotion_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    promotion_name character varying(150) NOT NULL,
    promotion_type character varying(50) NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    status character varying(30) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    discount_value numeric(12,2),
    buy_quantity integer,
    free_quantity integer,
    is_active boolean DEFAULT true NOT NULL,
    creation_key uuid,
    creation_payload jsonb,
    CONSTRAINT chk_promotions_dates CHECK ((end_date >= start_date)),
    CONSTRAINT chk_promotions_discount_value CHECK (((discount_value IS NULL) OR (discount_value >= (0)::numeric))),
    CONSTRAINT promotions_buy_quantity_check CHECK ((buy_quantity > 0)),
    CONSTRAINT promotions_free_quantity_check CHECK ((free_quantity > 0))
);


--
-- Name: promotions_promotion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.promotions_promotion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: promotions_promotion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.promotions_promotion_id_seq OWNED BY public.promotions.promotion_id;


--
-- Name: purchase_order_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_order_lines (
    purchase_order_line_id bigint NOT NULL,
    purchase_order_id bigint NOT NULL,
    product_id bigint NOT NULL,
    sku character varying(100) NOT NULL,
    barcode character varying(100),
    item_name character varying(200) NOT NULL,
    department character varying(200),
    ordered_quantity numeric(12,3) NOT NULL,
    received_quantity numeric(12,3) DEFAULT 0 NOT NULL,
    case_pack_size integer NOT NULL,
    unit_cost numeric(12,2) NOT NULL,
    CONSTRAINT purchase_order_lines_case_pack_size_check CHECK ((case_pack_size > 0)),
    CONSTRAINT purchase_order_lines_check CHECK (((received_quantity >= (0)::numeric) AND (received_quantity <= ordered_quantity))),
    CONSTRAINT purchase_order_lines_ordered_quantity_check CHECK ((ordered_quantity > (0)::numeric)),
    CONSTRAINT purchase_order_lines_unit_cost_check CHECK ((unit_cost >= (0)::numeric))
);


--
-- Name: purchase_order_lines_purchase_order_line_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.purchase_order_lines ALTER COLUMN purchase_order_line_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.purchase_order_lines_purchase_order_line_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.purchase_orders (
    purchase_order_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    vendor_id bigint NOT NULL,
    po_number character varying(100) NOT NULL,
    order_date date NOT NULL,
    expected_delivery_date date,
    status character varying(30) DEFAULT 'Draft'::character varying NOT NULL,
    source character varying(40) NOT NULL,
    notes text,
    created_by bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    request_key uuid NOT NULL,
    approved_by bigint,
    approved_at timestamp with time zone,
    CONSTRAINT purchase_orders_source_check CHECK (((source)::text = ANY ((ARRAY['Suggested Order Guide'::character varying, 'Vendor Order Guide'::character varying])::text[]))),
    CONSTRAINT purchase_orders_status_check CHECK (((status)::text = ANY ((ARRAY['Draft'::character varying, 'Pending Approval'::character varying, 'Approved'::character varying, 'Cancelled'::character varying, 'Partially Received'::character varying, 'Received'::character varying])::text[])))
);


--
-- Name: purchase_orders_purchase_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.purchase_orders ALTER COLUMN purchase_order_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.purchase_orders_purchase_order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rebate_claim_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rebate_claim_payments (
    payment_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    claim_id bigint NOT NULL,
    request_key uuid NOT NULL,
    amount numeric(14,2) NOT NULL,
    payment_method character varying(30) NOT NULL,
    payment_date date NOT NULL,
    reference character varying(150) NOT NULL,
    notes character varying(2000) DEFAULT ''::character varying NOT NULL,
    recorded_by bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rebate_claim_payments_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT rebate_claim_payments_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['ACH Transfer'::character varying, 'Check'::character varying, 'Vendor Credit'::character varying, 'Invoice Deduction'::character varying, 'Wire Transfer'::character varying])::text[]))),
    CONSTRAINT rebate_claim_payments_reference_check CHECK ((length(TRIM(BOTH FROM reference)) > 0))
);


--
-- Name: rebate_claim_payments_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.rebate_claim_payments ALTER COLUMN payment_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rebate_claim_payments_payment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rebate_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rebate_claims (
    claim_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    program_id bigint NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    reference character varying(150),
    status character varying(20) DEFAULT 'DRAFT'::character varying NOT NULL,
    claimed_amount numeric(14,2),
    approved_amount numeric(14,2),
    submitted_date date,
    decision_date date,
    decision_reason character varying(2000) DEFAULT ''::character varying NOT NULL,
    notes character varying(4000) DEFAULT ''::character varying NOT NULL,
    program_snapshot jsonb,
    created_by bigint NOT NULL,
    submitted_by bigint,
    decision_recorded_by bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rebate_claims_approved_amount_check CHECK ((approved_amount >= (0)::numeric)),
    CONSTRAINT rebate_claims_check CHECK ((period_end >= period_start)),
    CONSTRAINT rebate_claims_check1 CHECK (((approved_amount IS NULL) OR (approved_amount <= claimed_amount))),
    CONSTRAINT rebate_claims_check2 CHECK ((((status)::text = 'DRAFT'::text) OR ((claimed_amount IS NOT NULL) AND (submitted_date IS NOT NULL) AND (submitted_by IS NOT NULL) AND (program_snapshot IS NOT NULL)))),
    CONSTRAINT rebate_claims_check3 CHECK ((((status)::text <> ALL ((ARRAY['APPROVED'::character varying, 'REJECTED'::character varying])::text[])) OR ((approved_amount IS NOT NULL) AND (decision_date IS NOT NULL) AND (decision_recorded_by IS NOT NULL)))),
    CONSTRAINT rebate_claims_check4 CHECK ((((status)::text <> 'APPROVED'::text) OR (approved_amount > (0)::numeric))),
    CONSTRAINT rebate_claims_check5 CHECK ((((status)::text <> 'REJECTED'::text) OR ((approved_amount = (0)::numeric) AND (length(TRIM(BOTH FROM decision_reason)) > 0)))),
    CONSTRAINT rebate_claims_check6 CHECK (((decision_date IS NULL) OR (decision_date >= submitted_date))),
    CONSTRAINT rebate_claims_claimed_amount_check CHECK ((claimed_amount > (0)::numeric)),
    CONSTRAINT rebate_claims_program_snapshot_check CHECK ((jsonb_typeof(program_snapshot) = 'object'::text)),
    CONSTRAINT rebate_claims_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'SUBMITTED'::character varying, 'UNDER_REVIEW'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
);


--
-- Name: rebate_claims_claim_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.rebate_claims ALTER COLUMN claim_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rebate_claims_claim_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rebate_program_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rebate_program_items (
    link_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    program_id bigint NOT NULL,
    product_id bigint NOT NULL,
    start_date date,
    end_date date,
    rebate_terms character varying(1000) DEFAULT ''::character varying NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rebate_program_items_check CHECK (((end_date IS NULL) OR (start_date IS NULL) OR (end_date >= start_date)))
);


--
-- Name: rebate_program_items_link_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.rebate_program_items ALTER COLUMN link_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rebate_program_items_link_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: rebate_programs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rebate_programs (
    program_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    vendor_id bigint,
    name character varying(150) NOT NULL,
    provider_name character varying(200) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying(20) NOT NULL,
    settings jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rebate_programs_check CHECK ((end_date >= start_date)),
    CONSTRAINT rebate_programs_settings_check CHECK ((jsonb_typeof(settings) = 'object'::text)),
    CONSTRAINT rebate_programs_status_check CHECK (((status)::text = ANY ((ARRAY['Draft'::character varying, 'Active'::character varying, 'Inactive'::character varying])::text[])))
);


--
-- Name: rebate_programs_program_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.rebate_programs ALTER COLUMN program_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.rebate_programs_program_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: role_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_types (
    role_type_id bigint NOT NULL,
    role_type_name character varying(100) NOT NULL,
    description character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: role_types_role_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.role_types ALTER COLUMN role_type_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.role_types_role_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sale_discount_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_discount_applications (
    application_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    discount_id bigint NOT NULL,
    sale_id bigint NOT NULL,
    reason_name character varying(150) NOT NULL,
    cashier_name character varying(200) NOT NULL,
    approved_by_name character varying(200),
    ticket_total numeric(12,2) NOT NULL,
    discount_amount numeric(12,2) NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(20) DEFAULT 'APPLIED'::character varying NOT NULL,
    request_key uuid,
    request_payload jsonb,
    calculation jsonb,
    confirmed_by bigint,
    confirmed_at timestamp with time zone,
    employee_id bigint,
    approved_by bigint,
    reviewed_at timestamp with time zone,
    eligibility_type character varying(20),
    business_date date,
    CONSTRAINT sale_discount_applications_discount_amount_check CHECK ((discount_amount > (0)::numeric)),
    CONSTRAINT sale_discount_applications_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPLIED'::character varying, 'REJECTED'::character varying])::text[])))
);


--
-- Name: sale_discount_applications_application_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sale_discount_applications ALTER COLUMN application_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sale_discount_applications_application_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sale_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_payments (
    sale_payment_id bigint NOT NULL,
    sale_id bigint NOT NULL,
    tender_type_id bigint NOT NULL,
    payment_amount numeric(14,2) NOT NULL,
    payment_status character varying(20) NOT NULL,
    card_brand character varying(50),
    card_last4 character varying(4),
    processor_reference character varying(255),
    authorization_code character varying(100),
    payment_datetime timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_sale_payment_card_last4 CHECK (((card_last4 IS NULL) OR ((card_last4)::text ~ '^[0-9]{4}$'::text))),
    CONSTRAINT chk_sale_payment_status CHECK (((payment_status)::text = ANY ((ARRAY['PENDING'::character varying, 'COMPLETED'::character varying, 'FAILED'::character varying, 'VOIDED'::character varying, 'REFUNDED'::character varying])::text[])))
);


--
-- Name: sale_payments_sale_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sale_payments ALTER COLUMN sale_payment_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sale_payments_sale_payment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    sale_id bigint NOT NULL,
    store_id character varying NOT NULL,
    cashier_id bigint NOT NULL,
    terminal_id bigint NOT NULL,
    receipt_no character varying(100) NOT NULL,
    transaction_id character varying(100) NOT NULL,
    transaction_type character varying(20) NOT NULL,
    sale_status character varying(20) NOT NULL,
    sale_datetime timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    subtotal numeric(14,2) DEFAULT 0 NOT NULL,
    taxable_amount numeric(14,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(14,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(14,2) DEFAULT 0 NOT NULL,
    total_amount numeric(14,2) DEFAULT 0 NOT NULL,
    total_items integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_sales_status CHECK (((sale_status)::text = ANY ((ARRAY['OPEN'::character varying, 'COMPLETED'::character varying, 'VOIDED'::character varying, 'REFUNDED'::character varying])::text[]))),
    CONSTRAINT chk_sales_transaction_type CHECK (((transaction_type)::text = ANY ((ARRAY['SALE'::character varying, 'RETURN'::character varying, 'VOID'::character varying, 'REFUND'::character varying])::text[])))
);


--
-- Name: sales_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_items (
    sales_item_id bigint NOT NULL,
    sale_id bigint NOT NULL,
    product_id bigint NOT NULL,
    quantity numeric(12,3) NOT NULL,
    catalog_price numeric(14,2) DEFAULT 0 NOT NULL,
    unit_price numeric(14,2) DEFAULT 0 NOT NULL,
    gross_amount numeric(14,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(14,2) DEFAULT 0 NOT NULL,
    taxable_amount numeric(14,2) DEFAULT 0 NOT NULL,
    tax_amount numeric(14,2) DEFAULT 0 NOT NULL,
    line_total numeric(14,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_sales_items_quantity CHECK ((quantity <> (0)::numeric))
);


--
-- Name: sales_items_sales_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sales_items ALTER COLUMN sales_item_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sales_items_sales_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sales_sale_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sales ALTER COLUMN sale_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sales_sale_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: status_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.status_types (
    status_type_id bigint NOT NULL,
    status_name character varying(50) NOT NULL
);


--
-- Name: status_types_status_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.status_types_status_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: status_types_status_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.status_types_status_type_id_seq OWNED BY public.status_types.status_type_id;


--
-- Name: store_billing_addons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_billing_addons (
    subscription_id bigint NOT NULL,
    addon_id bigint NOT NULL,
    active boolean DEFAULT true NOT NULL,
    cancel_at_period_end boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: store_business_hours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_business_hours (
    business_hours_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    day_of_week character varying(10) NOT NULL,
    open_time time without time zone,
    close_time time without time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(20) DEFAULT 'SCHEDULED'::character varying NOT NULL,
    CONSTRAINT chk_business_hours_status CHECK (((((status)::text = 'SCHEDULED'::text) AND (open_time IS NOT NULL) AND (close_time IS NOT NULL) AND (open_time <> close_time)) OR (((status)::text = ANY ((ARRAY['CLOSED'::character varying, 'OPEN_24_HOURS'::character varying, 'UNSET'::character varying])::text[])) AND (open_time IS NULL) AND (close_time IS NULL)))),
    CONSTRAINT chk_store_business_hours_day CHECK (((day_of_week)::text = ANY (ARRAY[('MONDAY'::character varying)::text, ('TUESDAY'::character varying)::text, ('WEDNESDAY'::character varying)::text, ('THURSDAY'::character varying)::text, ('FRIDAY'::character varying)::text, ('SATURDAY'::character varying)::text, ('SUNDAY'::character varying)::text])))
);


--
-- Name: store_business_hours_business_hours_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.store_business_hours ALTER COLUMN business_hours_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.store_business_hours_business_hours_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: store_contact_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_contact_info (
    contact_info_id bigint NOT NULL,
    phone_number character varying(20),
    email character varying(255),
    address character varying(500) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dgt_id character varying(50),
    store_name character varying(150)
);


--
-- Name: store_contact_info_contact_info_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.store_contact_info ALTER COLUMN contact_info_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.store_contact_info_contact_info_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: store_departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_departments (
    store_department_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    department_id bigint,
    store_department_name character varying(150) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    source_type character varying(20) DEFAULT 'CUSTOM'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT store_department_source_check CHECK (((((source_type)::text = 'DEFAULT'::text) AND (department_id IS NOT NULL)) OR (((source_type)::text = 'CUSTOM'::text) AND (department_id IS NULL))))
);


--
-- Name: store_departments_store_department_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_departments_store_department_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_departments_store_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_departments_store_department_id_seq OWNED BY public.store_departments.store_department_id;


--
-- Name: store_discounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_discounts (
    discount_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    name character varying(150) NOT NULL,
    code character varying(30) NOT NULL,
    discount_type_id bigint NOT NULL,
    value numeric(12,2) NOT NULL,
    applies_to character varying(20) NOT NULL,
    manager_approval boolean DEFAULT false NOT NULL,
    allow_restricted boolean DEFAULT false NOT NULL,
    allow_fuel boolean DEFAULT false NOT NULL,
    combine_promotions boolean DEFAULT false NOT NULL,
    daily_cap numeric(12,2) DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    eligibility_type character varying(20) DEFAULT 'NONE'::character varying NOT NULL,
    senior_age integer,
    CONSTRAINT senior_discount_age CHECK ((((eligibility_type)::text <> 'SENIOR'::text) OR (senior_age IS NOT NULL))),
    CONSTRAINT store_discounts_applies_to_check CHECK (((applies_to)::text = ANY ((ARRAY['Whole Ticket'::character varying, 'Single Item'::character varying])::text[]))),
    CONSTRAINT store_discounts_daily_cap_check CHECK ((daily_cap >= (0)::numeric)),
    CONSTRAINT store_discounts_eligibility_type_check CHECK (((eligibility_type)::text = ANY ((ARRAY['NONE'::character varying, 'EMPLOYEE'::character varying, 'STUDENT'::character varying, 'SENIOR'::character varying, 'MILITARY'::character varying])::text[]))),
    CONSTRAINT store_discounts_senior_age_check CHECK (((senior_age >= 1) AND (senior_age <= 120))),
    CONSTRAINT store_discounts_value_check CHECK ((value > (0)::numeric))
);


--
-- Name: store_discounts_discount_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.store_discounts ALTER COLUMN discount_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.store_discounts_discount_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: store_role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_role_permissions (
    dgt_id character varying(50) NOT NULL,
    role_type_id bigint NOT NULL,
    permission_code character varying(80) NOT NULL,
    allowed boolean DEFAULT false NOT NULL,
    updated_by bigint,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT store_role_permissions_permission_code_check CHECK ((((permission_code)::text = ANY (ARRAY[('STORE_SETTINGS_VIEW'::character varying)::text, ('STORE_SETTINGS_EDIT'::character varying)::text, ('DEPARTMENTS_VIEW'::character varying)::text, ('DEPARTMENTS_EDIT'::character varying)::text, ('GROCERY_VIEW_INVENTORY'::character varying)::text, ('GROCERY_ADJUST_STOCK'::character varying)::text, ('GROCERY_REDUCE_STOCK'::character varying)::text, ('GROCERY_CREATE_PO'::character varying)::text, ('GROCERY_APPROVE_PO'::character varying)::text, ('GROCERY_RECEIVE_INVENTORY'::character varying)::text, ('GROCERY_APPROVE_INVOICE'::character varying)::text, ('GROCERY_SETTINGS'::character varying)::text, ('LOTTERY_RECEIVE_DELIVERY'::character varying)::text, ('LOTTERY_CONFIRM_PACKS'::character varying)::text, ('LOTTERY_ACTIVATE_PACKS'::character varying)::text, ('LOTTERY_CLOSE_SHIFT'::character varying)::text, ('LOTTERY_RETURN_PACKS'::character varying)::text, ('LOTTERY_SETTLE_PACKS'::character varying)::text, ('LOTTERY_VIEW_REPORTS'::character varying)::text, ('LOTTERY_SETTINGS'::character varying)::text])) OR ((permission_code)::text = 'PRICE_BOOK_ACCESS'::text) OR ((permission_code)::text = 'GAS_SETTINGS'::text) OR ((permission_code)::text = ANY (ARRAY[('GAS_VIEW_DELIVERIES'::character varying)::text, ('GAS_RECORD_DELIVERY'::character varying)::text, ('GAS_RECEIVE_DELIVERY'::character varying)::text])) OR ((permission_code)::text = ANY ((ARRAY['GAS_VIEW_ADJUSTMENTS'::character varying, 'GAS_RECORD_ADJUSTMENT'::character varying, 'GAS_APPROVE_ADJUSTMENT'::character varying])::text[]))))
);


--
-- Name: store_sub_departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_sub_departments (
    store_sub_department_id bigint NOT NULL,
    store_department_id bigint NOT NULL,
    store_sub_department_name character varying(150) NOT NULL,
    is_taxable boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    source_type character varying(20) DEFAULT 'CUSTOM'::character varying NOT NULL,
    dgt_id character varying(50) NOT NULL,
    default_margin_percentage numeric(5,2),
    CONSTRAINT store_sub_department_source_check CHECK (((source_type)::text = ANY ((ARRAY['DEFAULT'::character varying, 'CUSTOM'::character varying, 'UNCLASSIFIED'::character varying])::text[]))),
    CONSTRAINT store_sub_departments_default_margin_percentage_check CHECK (((default_margin_percentage >= (0)::numeric) AND (default_margin_percentage < (100)::numeric)))
);


--
-- Name: store_sub_departments_store_sub_department_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_sub_departments_store_sub_department_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_sub_departments_store_sub_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_sub_departments_store_sub_department_id_seq OWNED BY public.store_sub_departments.store_sub_department_id;


--
-- Name: store_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_subscriptions (
    subscription_id bigint NOT NULL,
    store_id character varying(50) NOT NULL,
    subscription_plan_id bigint NOT NULL,
    subscription_status character varying(50) NOT NULL,
    start_date date NOT NULL,
    current_period_start date NOT NULL,
    current_period_end date NOT NULL,
    next_billing_date date,
    auto_renewal boolean NOT NULL,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    current_period_price numeric(10,2) DEFAULT 0 NOT NULL,
    cancel_requested_at timestamp with time zone,
    CONSTRAINT store_subscriptions_current_period_price_check CHECK ((current_period_price >= (0)::numeric))
);


--
-- Name: store_subscriptions_subscription_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.store_subscriptions ALTER COLUMN subscription_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.store_subscriptions_subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    dgt_id character varying(50) DEFAULT public.generate_dgt_id() NOT NULL,
    store_id character varying(50) NOT NULL,
    store_name character varying(150) NOT NULL,
    legal_business_name character varying(200) NOT NULL,
    tax_id character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    license_number character varying(100) NOT NULL,
    timezone character varying(80),
    company_id bigint,
    default_opening_cash numeric(14,2),
    CONSTRAINT stores_default_opening_cash_check CHECK ((default_opening_cash >= (0)::numeric))
);


--
-- Name: stores_dgt_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stores_dgt_id_seq
    START WITH 1001
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    subscription_plan_id bigint NOT NULL,
    plan_name character varying(50) NOT NULL,
    monthly_price numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_subscription_plans_monthly_price CHECK ((monthly_price >= (0)::numeric)),
    CONSTRAINT chk_subscription_plans_plan_name CHECK (((plan_name)::text = ANY (ARRAY[('Basic'::character varying)::text, ('Modern'::character varying)::text, ('Advanced'::character varying)::text])))
);


--
-- Name: subscription_plans_subscription_plan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.subscription_plans ALTER COLUMN subscription_plan_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.subscription_plans_subscription_plan_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: tender_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tender_types (
    tender_type_id bigint NOT NULL,
    tender_code character varying(50) NOT NULL,
    tender_name character varying(100) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tender_types_tender_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.tender_types ALTER COLUMN tender_type_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.tender_types_tender_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_login_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_login_events (
    event_id bigint NOT NULL,
    user_id bigint NOT NULL,
    occurred_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address character varying(64) NOT NULL,
    user_agent character varying(512) NOT NULL,
    status character varying(10) NOT NULL,
    CONSTRAINT user_login_events_status_check CHECK (((status)::text = ANY ((ARRAY['SUCCESS'::character varying, 'FAILED'::character varying])::text[])))
);


--
-- Name: user_login_events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.user_login_events ALTER COLUMN event_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.user_login_events_event_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_role_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role_type_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_roles_user_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ALTER COLUMN user_role_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.user_roles_user_role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    session_id uuid NOT NULL,
    user_id bigint NOT NULL,
    token_hash character varying(64) NOT NULL,
    credential_fingerprint character varying(64) NOT NULL,
    ip_address character varying(64) NOT NULL,
    user_agent character varying(512) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_active_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    employee_id character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    account_status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    two_factor_authentication boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_users_account_status CHECK (((account_status)::text = ANY (ARRAY[('ACTIVE'::character varying)::text, ('INACTIVE'::character varying)::text, ('LOCKED'::character varying)::text, ('SUSPENDED'::character varying)::text])))
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vendor_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_audit_log (
    audit_id bigint NOT NULL,
    vendor_id bigint NOT NULL,
    product_id bigint,
    dgt_id character varying(50) NOT NULL,
    action_type character varying(100),
    details character varying(500),
    cost_history_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: vendor_audit_log_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.vendor_audit_log ALTER COLUMN audit_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.vendor_audit_log_audit_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vendor_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_contacts (
    contact_id bigint NOT NULL,
    vendor_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    contract_number character varying(100),
    start_date date,
    end_date date,
    volume_threshold numeric(10,2),
    volume_discount_value numeric(10,2),
    volume_discount_type character varying(50),
    return_window_days integer,
    status character varying(50),
    document_url character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    force_end_date date,
    contract_type character varying(100),
    return_policy character varying(1000),
    CONSTRAINT vendor_contract_type_allowed CHECK (((contract_type)::text = ANY ((ARRAY['Purchase / Supply Agreement'::character varying, 'Fixed Price Contract'::character varying, 'Tiered / Volume Pricing Contract'::character varying, 'Cost-Plus Contract'::character varying, 'Volume Incentive Contract'::character varying, 'Exclusive Supply Contract'::character varying, 'Preferred Vendor Agreement'::character varying, 'Delivery / Distribution Agreement'::character varying, 'Lease Agreement'::character varying, 'Maintenance / Service Contract'::character varying, 'Marketing / Display Agreement'::character varying, 'Slotting / Placement Agreement'::character varying])::text[])))
);


--
-- Name: vendor_contacts_contact_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.vendor_contacts ALTER COLUMN contact_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.vendor_contacts_contact_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vendor_item_cost_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_item_cost_history (
    cost_history_id bigint NOT NULL,
    product_id bigint NOT NULL,
    vendor_id bigint NOT NULL,
    old_cost numeric(10,2),
    new_cost numeric(10,2),
    change_percentage numeric(10,2),
    effective_date date,
    change_source character varying(100),
    changed_by bigint,
    created_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: vendor_item_cost_history_cost_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.vendor_item_cost_history ALTER COLUMN cost_history_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.vendor_item_cost_history_cost_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vendor_price_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendor_price_settings (
    setting_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    price_change_alert_enabled boolean NOT NULL,
    alert_threshold_percentage numeric(10,2),
    approval_required boolean NOT NULL,
    permission_id bigint,
    approval_threshold_percentage numeric(10,2),
    auto_pick_preferred_vendor boolean NOT NULL,
    use_fallback_vendor boolean NOT NULL,
    consider_lead_time boolean NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: vendor_price_settings_setting_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.vendor_price_settings ALTER COLUMN setting_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.vendor_price_settings_setting_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vendors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendors (
    vendor_id bigint NOT NULL,
    vendor_name character varying(150) NOT NULL,
    email character varying(255),
    phone_number character varying(20),
    website_url character varying(500),
    payment_terms character varying(100),
    lead_time_days integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    dgt_id character varying(50) NOT NULL,
    contact_name character varying(150)
);


--
-- Name: vendors_vendor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.vendors ALTER COLUMN vendor_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.vendors_vendor_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: workforce_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workforce_availability (
    availability_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    employee_id bigint NOT NULL,
    kind character varying(20) NOT NULL,
    start_date date NOT NULL,
    end_date date,
    weekday integer,
    start_time time without time zone,
    end_time time without time zone,
    overnight boolean NOT NULL,
    unavailable boolean NOT NULL,
    request_id bigint NOT NULL,
    CONSTRAINT workforce_availability_check CHECK (((end_date IS NULL) OR (end_date >= start_date))),
    CONSTRAINT workforce_availability_kind_check CHECK (((kind)::text = ANY ((ARRAY['AVAILABILITY'::character varying, 'EXCEPTION'::character varying])::text[]))),
    CONSTRAINT workforce_availability_weekday_check CHECK (((weekday >= 1) AND (weekday <= 7)))
);


--
-- Name: workforce_availability_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.workforce_availability ALTER COLUMN availability_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.workforce_availability_availability_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: workforce_leave_shifts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workforce_leave_shifts (
    request_id bigint NOT NULL,
    schedule_id bigint NOT NULL,
    employee_id bigint NOT NULL,
    work_date date NOT NULL,
    start_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone NOT NULL
);


--
-- Name: workforce_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workforce_requests (
    request_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    employee_id bigint NOT NULL,
    kind character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    payload jsonb NOT NULL,
    shift_version text,
    other_shift_version text,
    submitted_by bigint NOT NULL,
    request_key uuid NOT NULL,
    leave_id bigint,
    accepted_by bigint,
    target_employee_id bigint,
    reviewed_by bigint,
    review_note character varying(500),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT workforce_requests_kind_check CHECK (((kind)::text = ANY ((ARRAY['AVAILABILITY'::character varying, 'EXCEPTION'::character varying, 'TIME_OFF'::character varying, 'COVER'::character varying, 'SWAP'::character varying])::text[]))),
    CONSTRAINT workforce_requests_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'CANCELLED'::character varying])::text[])))
);


--
-- Name: workforce_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.workforce_requests ALTER COLUMN request_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.workforce_requests_request_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: brands brand_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands ALTER COLUMN brand_id SET DEFAULT nextval('public.brands_brand_id_seq'::regclass);


--
-- Name: daily_closing_deposits deposit_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_closing_deposits ALTER COLUMN deposit_id SET DEFAULT nextval('public.daily_closing_deposits_deposit_id_seq'::regclass);


--
-- Name: daily_closing_tenders tender_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_closing_tenders ALTER COLUMN tender_id SET DEFAULT nextval('public.daily_closing_tenders_tender_id_seq'::regclass);


--
-- Name: daily_expenses expenses_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_expenses ALTER COLUMN expenses_id SET DEFAULT nextval('public.daily_expenses_expenses_id_seq'::regclass);


--
-- Name: departments department_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments ALTER COLUMN department_id SET DEFAULT nextval('public.departments_department_id_seq'::regclass);


--
-- Name: employee_compensation compensation_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_compensation ALTER COLUMN compensation_id SET DEFAULT nextval('public.employee_compensation_compensation_id_seq'::regclass);


--
-- Name: employee_documents employee_document_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents ALTER COLUMN employee_document_id SET DEFAULT nextval('public.employee_documents_employee_document_id_seq'::regclass);


--
-- Name: employee_emergency_contacts emergency_contact_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_emergency_contacts ALTER COLUMN emergency_contact_id SET DEFAULT nextval('public.employee_emergency_contacts_emergency_contact_id_seq'::regclass);


--
-- Name: employee_schedules schedule_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_schedules ALTER COLUMN schedule_id SET DEFAULT nextval('public.employee_schedules_schedule_id_seq'::regclass);


--
-- Name: employee_status_history status_history_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_status_history ALTER COLUMN status_history_id SET DEFAULT nextval('public.employee_status_history_status_history_id_seq'::regclass);


--
-- Name: employee_store_assignments employee_store_assignment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_store_assignments ALTER COLUMN employee_store_assignment_id SET DEFAULT nextval('public.employee_store_assignments_employee_store_assignment_id_seq'::regclass);


--
-- Name: employee_time_entries time_entry_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_entries ALTER COLUMN time_entry_id SET DEFAULT nextval('public.employee_time_entries_time_entry_id_seq'::regclass);


--
-- Name: employee_time_off_requests time_off_request_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_off_requests ALTER COLUMN time_off_request_id SET DEFAULT nextval('public.employee_time_off_requests_time_off_request_id_seq'::regclass);


--
-- Name: employees employee_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN employee_id SET DEFAULT nextval('public.employees_employee_id_seq'::regclass);


--
-- Name: everyday_closing everyday_closing_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.everyday_closing ALTER COLUMN everyday_closing_id SET DEFAULT nextval('public.everyday_closing_everyday_closing_id_seq'::regclass);


--
-- Name: fuel_grades fuel_grade_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_grades ALTER COLUMN fuel_grade_id SET DEFAULT nextval('public.fuel_grades_fuel_grade_id_seq'::regclass);


--
-- Name: fuel_invoice_details fuel_invoice_details_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_invoice_details ALTER COLUMN fuel_invoice_details_id SET DEFAULT nextval('public.fuel_invoice_details_fuel_invoice_details_id_seq'::regclass);


--
-- Name: fuel_invoice_items fuel_invoice_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_invoice_items ALTER COLUMN fuel_invoice_item_id SET DEFAULT nextval('public.fuel_invoice_items_fuel_invoice_item_id_seq'::regclass);


--
-- Name: fuel_prices fuel_price_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_prices ALTER COLUMN fuel_price_id SET DEFAULT nextval('public.fuel_prices_fuel_price_id_seq'::regclass);


--
-- Name: fuel_pumps pump_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_pumps ALTER COLUMN pump_id SET DEFAULT nextval('public.fuel_pumps_pump_id_seq'::regclass);


--
-- Name: fuel_tank_grade_assignments assignment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_tank_grade_assignments ALTER COLUMN assignment_id SET DEFAULT nextval('public.fuel_tank_grade_assignments_assignment_id_seq'::regclass);


--
-- Name: fuel_tank_readings tank_reading_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_tank_readings ALTER COLUMN tank_reading_id SET DEFAULT nextval('public.fuel_tank_readings_tank_reading_id_seq'::regclass);


--
-- Name: fuel_tanks tank_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_tanks ALTER COLUMN tank_id SET DEFAULT nextval('public.fuel_tanks_tank_id_seq'::regclass);


--
-- Name: grocery_invoice_items grocery_invoice_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grocery_invoice_items ALTER COLUMN grocery_invoice_item_id SET DEFAULT nextval('public.grocery_invoice_items_grocery_invoice_item_id_seq'::regclass);


--
-- Name: inventory inventory_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory ALTER COLUMN inventory_id SET DEFAULT nextval('public.inventory_inventory_id_seq'::regclass);


--
-- Name: inventory_movements movement_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements ALTER COLUMN movement_id SET DEFAULT nextval('public.inventory_movements_movement_id_seq'::regclass);


--
-- Name: inventory_reduction_requests reduction_request_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_reduction_requests ALTER COLUMN reduction_request_id SET DEFAULT nextval('public.inventory_reduction_requests_reduction_request_id_seq'::regclass);


--
-- Name: inventory_return_items return_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_return_items ALTER COLUMN return_item_id SET DEFAULT nextval('public.inventory_return_items_return_item_id_seq'::regclass);


--
-- Name: inventory_returns return_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_returns ALTER COLUMN return_id SET DEFAULT nextval('public.inventory_returns_return_id_seq'::regclass);


--
-- Name: inventory_shrinkage shrinkage_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_shrinkage ALTER COLUMN shrinkage_id SET DEFAULT nextval('public.inventory_shrinkage_shrinkage_id_seq'::regclass);


--
-- Name: inventory_shrinkage_items shrinkage_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_shrinkage_items ALTER COLUMN shrinkage_item_id SET DEFAULT nextval('public.inventory_shrinkage_items_shrinkage_item_id_seq'::regclass);


--
-- Name: inventory_transfer_items transfer_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfer_items ALTER COLUMN transfer_item_id SET DEFAULT nextval('public.inventory_transfer_items_transfer_item_id_seq'::regclass);


--
-- Name: inventory_transfers transfer_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfers ALTER COLUMN transfer_id SET DEFAULT nextval('public.inventory_transfers_transfer_id_seq'::regclass);


--
-- Name: invoice_adjustments invoice_adjustment_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_adjustments ALTER COLUMN invoice_adjustment_id SET DEFAULT nextval('public.invoice_adjustments_invoice_adjustment_id_seq'::regclass);


--
-- Name: invoice_audit_log invoice_audit_log_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_audit_log ALTER COLUMN invoice_audit_log_id SET DEFAULT nextval('public.invoice_audit_log_invoice_audit_log_id_seq'::regclass);


--
-- Name: invoice_charges invoice_charge_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_charges ALTER COLUMN invoice_charge_id SET DEFAULT nextval('public.invoice_charges_invoice_charge_id_seq'::regclass);


--
-- Name: invoice_documents invoice_document_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_documents ALTER COLUMN invoice_document_id SET DEFAULT nextval('public.invoice_documents_invoice_document_id_seq'::regclass);


--
-- Name: invoices invoice_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices ALTER COLUMN invoice_id SET DEFAULT nextval('public.invoices_invoice_id_seq'::regclass);


--
-- Name: lottery_games lottery_game_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_games ALTER COLUMN lottery_game_id SET DEFAULT nextval('public.lottery_games_lottery_game_id_seq'::regclass);


--
-- Name: lottery_pack_inventory lottery_pack_inventory_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_pack_inventory ALTER COLUMN lottery_pack_inventory_id SET DEFAULT nextval('public.lottery_pack_inventory_lottery_pack_inventory_id_seq'::regclass);


--
-- Name: lottery_pack_inventory_items lottery_pack_inventory_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_pack_inventory_items ALTER COLUMN lottery_pack_inventory_item_id SET DEFAULT nextval('public.lottery_pack_inventory_items_lottery_pack_inventory_item_id_seq'::regclass);


--
-- Name: lottery_packs lottery_pack_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_packs ALTER COLUMN lottery_pack_id SET DEFAULT nextval('public.lottery_packs_lottery_pack_id_seq'::regclass);


--
-- Name: lottery_settings lottery_setting_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_settings ALTER COLUMN lottery_setting_id SET DEFAULT nextval('public.lottery_settings_lottery_setting_id_seq'::regclass);


--
-- Name: lottery_settlements lottery_settlement_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_settlements ALTER COLUMN lottery_settlement_id SET DEFAULT nextval('public.lottery_settlements_lottery_settlement_id_seq'::regclass);


--
-- Name: new_arrivals new_arrivals_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.new_arrivals ALTER COLUMN new_arrivals_id SET DEFAULT nextval('public.new_arrivals_new_arrivals_id_seq'::regclass);


--
-- Name: price_groups price_group_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_groups ALTER COLUMN price_group_id SET DEFAULT nextval('public.price_groups_price_group_id_seq'::regclass);


--
-- Name: product_barcodes product_barcode_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_barcodes ALTER COLUMN product_barcode_id SET DEFAULT nextval('public.product_barcodes_product_barcode_id_seq'::regclass);


--
-- Name: product_price_groups product_price_group_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_price_groups ALTER COLUMN product_price_group_id SET DEFAULT nextval('public.product_price_groups_product_price_group_id_seq'::regclass);


--
-- Name: product_store_prices store_price_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_store_prices ALTER COLUMN store_price_id SET DEFAULT nextval('public.product_store_prices_store_price_id_seq'::regclass);


--
-- Name: product_vendors product_vendor_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_vendors ALTER COLUMN product_vendor_id SET DEFAULT nextval('public.product_vendors_product_vendor_id_seq'::regclass);


--
-- Name: products product_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN product_id SET DEFAULT nextval('public.products_product_id_seq'::regclass);


--
-- Name: promotion_products promotion_product_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_products ALTER COLUMN promotion_product_id SET DEFAULT nextval('public.promotion_products_promotion_product_id_seq'::regclass);


--
-- Name: promotions promotion_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions ALTER COLUMN promotion_id SET DEFAULT nextval('public.promotions_promotion_id_seq'::regclass);


--
-- Name: status_types status_type_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_types ALTER COLUMN status_type_id SET DEFAULT nextval('public.status_types_status_type_id_seq'::regclass);


--
-- Name: store_departments store_department_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_departments ALTER COLUMN store_department_id SET DEFAULT nextval('public.store_departments_store_department_id_seq'::regclass);


--
-- Name: store_sub_departments store_sub_department_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_sub_departments ALTER COLUMN store_sub_department_id SET DEFAULT nextval('public.store_sub_departments_store_sub_department_id_seq'::regclass);


--
-- Name: access_audit_events access_audit_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_audit_events
    ADD CONSTRAINT access_audit_events_pkey PRIMARY KEY (event_id);


--
-- Name: approval_requests approval_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_pkey PRIMARY KEY (request_id);


--
-- Name: approval_requests approval_requests_requested_by_idempotency_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_requested_by_idempotency_key_key UNIQUE (requested_by, idempotency_key);


--
-- Name: billing_addons billing_addons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_addons
    ADD CONSTRAINT billing_addons_code_key UNIQUE (code);


--
-- Name: billing_addons billing_addons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_addons
    ADD CONSTRAINT billing_addons_pkey PRIMARY KEY (addon_id);


--
-- Name: billing_change_requests billing_change_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_change_requests
    ADD CONSTRAINT billing_change_requests_pkey PRIMARY KEY (user_id, request_key);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (brand_id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (company_id);


--
-- Name: company_admins company_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_admins
    ADD CONSTRAINT company_admins_pkey PRIMARY KEY (company_id, user_id);


--
-- Name: credit_card_batch_payments credit_card_batch_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_batch_payments
    ADD CONSTRAINT credit_card_batch_payments_pkey PRIMARY KEY (batch_id, sale_payment_id);


--
-- Name: credit_card_batch_payments credit_card_batch_payments_sale_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_batch_payments
    ADD CONSTRAINT credit_card_batch_payments_sale_payment_id_key UNIQUE (sale_payment_id);


--
-- Name: credit_card_batches credit_card_batches_dgt_id_processor_id_batch_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_batches
    ADD CONSTRAINT credit_card_batches_dgt_id_processor_id_batch_reference_key UNIQUE (dgt_id, processor_id, batch_reference);


--
-- Name: credit_card_batches credit_card_batches_dgt_id_request_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_batches
    ADD CONSTRAINT credit_card_batches_dgt_id_request_key_key UNIQUE (dgt_id, request_key);


--
-- Name: credit_card_batches credit_card_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_batches
    ADD CONSTRAINT credit_card_batches_pkey PRIMARY KEY (batch_id);


--
-- Name: credit_card_processors credit_card_processors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_processors
    ADD CONSTRAINT credit_card_processors_pkey PRIMARY KEY (processor_id);


--
-- Name: credit_card_processors credit_card_processors_processor_id_dgt_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_processors
    ADD CONSTRAINT credit_card_processors_processor_id_dgt_id_key UNIQUE (processor_id, dgt_id);


--
-- Name: credit_card_settings credit_card_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_settings
    ADD CONSTRAINT credit_card_settings_pkey PRIMARY KEY (dgt_id);


--
-- Name: daily_closing_deposits daily_closing_deposits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_closing_deposits
    ADD CONSTRAINT daily_closing_deposits_pkey PRIMARY KEY (deposit_id);


--
-- Name: daily_closing_tenders daily_closing_tenders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_closing_tenders
    ADD CONSTRAINT daily_closing_tenders_pkey PRIMARY KEY (tender_id);


--
-- Name: daily_expenses daily_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_expenses
    ADD CONSTRAINT daily_expenses_pkey PRIMARY KEY (expenses_id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- Name: discount_type discount_type_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_type
    ADD CONSTRAINT discount_type_code_key UNIQUE (code);


--
-- Name: discount_type discount_type_contract_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_type
    ADD CONSTRAINT discount_type_contract_value_key UNIQUE (contract_value);


--
-- Name: discount_type discount_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_type
    ADD CONSTRAINT discount_type_pkey PRIMARY KEY (discount_type_id);


--
-- Name: discount_type discount_type_promotion_value_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_type
    ADD CONSTRAINT discount_type_promotion_value_key UNIQUE (promotion_value);


--
-- Name: ebt_batch_payments ebt_batch_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebt_batch_payments
    ADD CONSTRAINT ebt_batch_payments_pkey PRIMARY KEY (batch_id, sale_payment_id);


--
-- Name: ebt_batch_payments ebt_batch_payments_sale_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebt_batch_payments
    ADD CONSTRAINT ebt_batch_payments_sale_payment_id_key UNIQUE (sale_payment_id);


--
-- Name: ebt_batches ebt_batches_dgt_id_batch_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebt_batches
    ADD CONSTRAINT ebt_batches_dgt_id_batch_reference_key UNIQUE (dgt_id, batch_reference);


--
-- Name: ebt_batches ebt_batches_dgt_id_request_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebt_batches
    ADD CONSTRAINT ebt_batches_dgt_id_request_key_key UNIQUE (dgt_id, request_key);


--
-- Name: ebt_batches ebt_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebt_batches
    ADD CONSTRAINT ebt_batches_pkey PRIMARY KEY (batch_id);


--
-- Name: employee_compensation employee_compensation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_compensation
    ADD CONSTRAINT employee_compensation_pkey PRIMARY KEY (compensation_id);


--
-- Name: employee_deductions employee_deductions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_deductions
    ADD CONSTRAINT employee_deductions_pkey PRIMARY KEY (employee_id, deduction_type);


--
-- Name: employee_deposit_instructions employee_deposit_instructions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_deposit_instructions
    ADD CONSTRAINT employee_deposit_instructions_pkey PRIMARY KEY (employee_id);


--
-- Name: employee_documents employee_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT employee_documents_pkey PRIMARY KEY (employee_document_id);


--
-- Name: employee_emergency_contacts employee_emergency_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_emergency_contacts
    ADD CONSTRAINT employee_emergency_contacts_pkey PRIMARY KEY (emergency_contact_id);


--
-- Name: employee_schedules employee_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_schedules
    ADD CONSTRAINT employee_schedules_pkey PRIMARY KEY (schedule_id);


--
-- Name: employee_status_history employee_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_status_history
    ADD CONSTRAINT employee_status_history_pkey PRIMARY KEY (status_history_id);


--
-- Name: employee_store_assignments employee_store_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_store_assignments
    ADD CONSTRAINT employee_store_assignments_pkey PRIMARY KEY (employee_store_assignment_id);


--
-- Name: employee_time_entries employee_time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_entries
    ADD CONSTRAINT employee_time_entries_pkey PRIMARY KEY (time_entry_id);


--
-- Name: employee_time_off_requests employee_time_off_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_off_requests
    ADD CONSTRAINT employee_time_off_requests_pkey PRIMARY KEY (time_off_request_id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (employee_id);


--
-- Name: everyday_closing everyday_closing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.everyday_closing
    ADD CONSTRAINT everyday_closing_pkey PRIMARY KEY (everyday_closing_id);


--
-- Name: fleet_batch_payments fleet_batch_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet_batch_payments
    ADD CONSTRAINT fleet_batch_payments_pkey PRIMARY KEY (batch_id, sale_payment_id);


--
-- Name: fleet_batch_payments fleet_batch_payments_sale_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet_batch_payments
    ADD CONSTRAINT fleet_batch_payments_sale_payment_id_key UNIQUE (sale_payment_id);


--
-- Name: fleet_batches fleet_batches_dgt_id_request_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet_batches
    ADD CONSTRAINT fleet_batches_dgt_id_request_key_key UNIQUE (dgt_id, request_key);


--
-- Name: fleet_batches fleet_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet_batches
    ADD CONSTRAINT fleet_batches_pkey PRIMARY KEY (batch_id);


--
-- Name: fuel_adjustment_lines fuel_adjustment_lines_adjustment_id_tank_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_adjustment_lines
    ADD CONSTRAINT fuel_adjustment_lines_adjustment_id_tank_id_key UNIQUE (adjustment_id, tank_id);


--
-- Name: fuel_adjustment_lines fuel_adjustment_lines_adjustment_line_id_dgt_id_tank_id_fue_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_adjustment_lines
    ADD CONSTRAINT fuel_adjustment_lines_adjustment_line_id_dgt_id_tank_id_fue_key UNIQUE (adjustment_line_id, dgt_id, tank_id, fuel_grade_id);


--
-- Name: fuel_adjustment_lines fuel_adjustment_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_adjustment_lines
    ADD CONSTRAINT fuel_adjustment_lines_pkey PRIMARY KEY (adjustment_line_id);


--
-- Name: inventory_movements fuel_adjustment_post_once; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fuel_adjustment_post_once UNIQUE (fuel_adjustment_line_id);


--
-- Name: fuel_adjustments fuel_adjustments_adjustment_id_dgt_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_adjustments
    ADD CONSTRAINT fuel_adjustments_adjustment_id_dgt_id_key UNIQUE (adjustment_id, dgt_id);


--
-- Name: fuel_adjustments fuel_adjustments_dgt_id_client_request_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_adjustments
    ADD CONSTRAINT fuel_adjustments_dgt_id_client_request_id_key UNIQUE (dgt_id, client_request_id);


--
-- Name: fuel_adjustments fuel_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_adjustments
    ADD CONSTRAINT fuel_adjustments_pkey PRIMARY KEY (adjustment_id);


--
-- Name: fuel_deliveries fuel_deliveries_delivery_id_dgt_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_deliveries
    ADD CONSTRAINT fuel_deliveries_delivery_id_dgt_id_key UNIQUE (delivery_id, dgt_id);


--
-- Name: fuel_deliveries fuel_deliveries_dgt_id_client_request_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_deliveries
    ADD CONSTRAINT fuel_deliveries_dgt_id_client_request_id_key UNIQUE (dgt_id, client_request_id);


--
-- Name: fuel_deliveries fuel_deliveries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_deliveries
    ADD CONSTRAINT fuel_deliveries_pkey PRIMARY KEY (delivery_id);


--
-- Name: fuel_delivery_lines fuel_delivery_lines_delivery_id_line_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_delivery_lines
    ADD CONSTRAINT fuel_delivery_lines_delivery_id_line_number_key UNIQUE (delivery_id, line_number);


--
-- Name: fuel_delivery_lines fuel_delivery_lines_delivery_line_id_dgt_id_tank_id_fuel_gr_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_delivery_lines
    ADD CONSTRAINT fuel_delivery_lines_delivery_line_id_dgt_id_tank_id_fuel_gr_key UNIQUE (delivery_line_id, dgt_id, tank_id, fuel_grade_id);


--
-- Name: fuel_delivery_lines fuel_delivery_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_delivery_lines
    ADD CONSTRAINT fuel_delivery_lines_pkey PRIMARY KEY (delivery_line_id);


--
-- Name: inventory_movements fuel_delivery_post_once; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fuel_delivery_post_once UNIQUE (fuel_delivery_line_id);


--
-- Name: fuel_grades fuel_grades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_grades
    ADD CONSTRAINT fuel_grades_pkey PRIMARY KEY (fuel_grade_id);


--
-- Name: fuel_invoice_details fuel_invoice_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_invoice_details
    ADD CONSTRAINT fuel_invoice_details_pkey PRIMARY KEY (fuel_invoice_details_id);


--
-- Name: fuel_invoice_items fuel_invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_invoice_items
    ADD CONSTRAINT fuel_invoice_items_pkey PRIMARY KEY (fuel_invoice_item_id);


--
-- Name: fuel_prices fuel_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_prices
    ADD CONSTRAINT fuel_prices_pkey PRIMARY KEY (fuel_price_id);


--
-- Name: fuel_pumps fuel_pumps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_pumps
    ADD CONSTRAINT fuel_pumps_pkey PRIMARY KEY (pump_id);


--
-- Name: fuel_tank_grade_assignments fuel_tank_grade_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_tank_grade_assignments
    ADD CONSTRAINT fuel_tank_grade_assignments_pkey PRIMARY KEY (assignment_id);


--
-- Name: fuel_tank_readings fuel_tank_readings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_tank_readings
    ADD CONSTRAINT fuel_tank_readings_pkey PRIMARY KEY (tank_reading_id);


--
-- Name: fuel_tanks fuel_tanks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_tanks
    ADD CONSTRAINT fuel_tanks_pkey PRIMARY KEY (tank_id);


--
-- Name: fuel_tanks gas_delivery_tank_store_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_tanks
    ADD CONSTRAINT gas_delivery_tank_store_key UNIQUE (tank_id, dgt_id);


--
-- Name: gas_settings gas_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gas_settings
    ADD CONSTRAINT gas_settings_pkey PRIMARY KEY (dgt_id);


--
-- Name: grocery_invoice_items grocery_invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grocery_invoice_items
    ADD CONSTRAINT grocery_invoice_items_pkey PRIMARY KEY (grocery_invoice_item_id);


--
-- Name: grocery_settings grocery_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grocery_settings
    ADD CONSTRAINT grocery_settings_pkey PRIMARY KEY (dgt_id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (movement_id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (inventory_id);


--
-- Name: inventory_reduction_requests inventory_reduction_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_reduction_requests
    ADD CONSTRAINT inventory_reduction_requests_pkey PRIMARY KEY (reduction_request_id);


--
-- Name: inventory_return_items inventory_return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_return_items
    ADD CONSTRAINT inventory_return_items_pkey PRIMARY KEY (return_item_id);


--
-- Name: inventory_returns inventory_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_returns
    ADD CONSTRAINT inventory_returns_pkey PRIMARY KEY (return_id);


--
-- Name: inventory_shrinkage_items inventory_shrinkage_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_shrinkage_items
    ADD CONSTRAINT inventory_shrinkage_items_pkey PRIMARY KEY (shrinkage_item_id);


--
-- Name: inventory_shrinkage inventory_shrinkage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_shrinkage
    ADD CONSTRAINT inventory_shrinkage_pkey PRIMARY KEY (shrinkage_id);


--
-- Name: inventory_transfer_items inventory_transfer_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfer_items
    ADD CONSTRAINT inventory_transfer_items_pkey PRIMARY KEY (transfer_item_id);


--
-- Name: inventory_transfers inventory_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfers
    ADD CONSTRAINT inventory_transfers_pkey PRIMARY KEY (transfer_id);


--
-- Name: invoice_adjustments invoice_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_adjustments
    ADD CONSTRAINT invoice_adjustments_pkey PRIMARY KEY (invoice_adjustment_id);


--
-- Name: invoice_audit_log invoice_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_audit_log
    ADD CONSTRAINT invoice_audit_log_pkey PRIMARY KEY (invoice_audit_log_id);


--
-- Name: invoice_charges invoice_charges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_charges
    ADD CONSTRAINT invoice_charges_pkey PRIMARY KEY (invoice_charge_id);


--
-- Name: invoice_documents invoice_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_documents
    ADD CONSTRAINT invoice_documents_pkey PRIMARY KEY (invoice_document_id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (invoice_id);


--
-- Name: lottery_games lottery_games_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_games
    ADD CONSTRAINT lottery_games_pkey PRIMARY KEY (lottery_game_id);


--
-- Name: lottery_pack_inventory_items lottery_pack_inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_pack_inventory_items
    ADD CONSTRAINT lottery_pack_inventory_items_pkey PRIMARY KEY (lottery_pack_inventory_item_id);


--
-- Name: lottery_pack_inventory lottery_pack_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_pack_inventory
    ADD CONSTRAINT lottery_pack_inventory_pkey PRIMARY KEY (lottery_pack_inventory_id);


--
-- Name: lottery_packs lottery_packs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_packs
    ADD CONSTRAINT lottery_packs_pkey PRIMARY KEY (lottery_pack_id);


--
-- Name: lottery_settings lottery_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_settings
    ADD CONSTRAINT lottery_settings_pkey PRIMARY KEY (lottery_setting_id);


--
-- Name: lottery_settlements lottery_settlements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_settlements
    ADD CONSTRAINT lottery_settlements_pkey PRIMARY KEY (lottery_settlement_id);


--
-- Name: module_approval_policies module_approval_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_approval_policies
    ADD CONSTRAINT module_approval_policies_pkey PRIMARY KEY (company_id, module_id);


--
-- Name: new_arrivals new_arrivals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.new_arrivals
    ADD CONSTRAINT new_arrivals_pkey PRIMARY KEY (new_arrivals_id);


--
-- Name: billing_invoices pk_billing_invoices; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT pk_billing_invoices PRIMARY KEY (invoice_id);


--
-- Name: modules pk_modules; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT pk_modules PRIMARY KEY (module_id);


--
-- Name: permissions pk_permissions; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT pk_permissions PRIMARY KEY (permission_id);


--
-- Name: role_types pk_role_types; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_types
    ADD CONSTRAINT pk_role_types PRIMARY KEY (role_type_id);


--
-- Name: store_business_hours pk_store_business_hours; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_business_hours
    ADD CONSTRAINT pk_store_business_hours PRIMARY KEY (business_hours_id);


--
-- Name: store_contact_info pk_store_contact_info; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_contact_info
    ADD CONSTRAINT pk_store_contact_info PRIMARY KEY (contact_info_id);


--
-- Name: store_subscriptions pk_store_subscriptions; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_subscriptions
    ADD CONSTRAINT pk_store_subscriptions PRIMARY KEY (subscription_id);


--
-- Name: stores pk_stores; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT pk_stores PRIMARY KEY (dgt_id);


--
-- Name: subscription_plans pk_subscription_plans; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT pk_subscription_plans PRIMARY KEY (subscription_plan_id);


--
-- Name: user_roles pk_user_roles; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT pk_user_roles PRIMARY KEY (user_role_id);


--
-- Name: users pk_users; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT pk_users PRIMARY KEY (user_id);


--
-- Name: vendor_audit_log pk_vendor_audit_log; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_audit_log
    ADD CONSTRAINT pk_vendor_audit_log PRIMARY KEY (audit_id);


--
-- Name: vendor_contacts pk_vendor_contacts; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_contacts
    ADD CONSTRAINT pk_vendor_contacts PRIMARY KEY (contact_id);


--
-- Name: vendor_item_cost_history pk_vendor_item_cost_history; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_item_cost_history
    ADD CONSTRAINT pk_vendor_item_cost_history PRIMARY KEY (cost_history_id);


--
-- Name: vendor_price_settings pk_vendor_price_settings; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_price_settings
    ADD CONSTRAINT pk_vendor_price_settings PRIMARY KEY (setting_id);


--
-- Name: vendors pk_vendors; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT pk_vendors PRIMARY KEY (vendor_id);


--
-- Name: pos_terminals pos_terminals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_terminals
    ADD CONSTRAINT pos_terminals_pkey PRIMARY KEY (terminal_id);


--
-- Name: price_groups price_group_create_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_groups
    ADD CONSTRAINT price_group_create_key UNIQUE (dgt_id, creation_key);


--
-- Name: price_groups price_group_store_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_groups
    ADD CONSTRAINT price_group_store_key UNIQUE (price_group_id, dgt_id);


--
-- Name: price_groups price_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_groups
    ADD CONSTRAINT price_groups_pkey PRIMARY KEY (price_group_id);


--
-- Name: store_departments pricebook_department_store_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_departments
    ADD CONSTRAINT pricebook_department_store_key UNIQUE (store_department_id, dgt_id);


--
-- Name: products pricebook_product_store_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT pricebook_product_store_key UNIQUE (product_id, dgt_id);


--
-- Name: store_sub_departments pricebook_subdepartment_store_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_sub_departments
    ADD CONSTRAINT pricebook_subdepartment_store_key UNIQUE (store_sub_department_id, dgt_id);


--
-- Name: vendors pricebook_vendor_store_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT pricebook_vendor_store_key UNIQUE (vendor_id, dgt_id);


--
-- Name: product_barcodes product_barcodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_barcodes
    ADD CONSTRAINT product_barcodes_pkey PRIMARY KEY (product_barcode_id);


--
-- Name: product_price_groups product_price_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_price_groups
    ADD CONSTRAINT product_price_groups_pkey PRIMARY KEY (product_price_group_id);


--
-- Name: product_store_prices product_store_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_store_prices
    ADD CONSTRAINT product_store_prices_pkey PRIMARY KEY (store_price_id);


--
-- Name: product_vendors product_vendors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_vendors
    ADD CONSTRAINT product_vendors_pkey PRIMARY KEY (product_vendor_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- Name: promotions promotion_creation_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotion_creation_key UNIQUE (dgt_id, creation_key);


--
-- Name: promotion_products promotion_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_products
    ADD CONSTRAINT promotion_products_pkey PRIMARY KEY (promotion_product_id);


--
-- Name: promotions promotion_store_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotion_store_key UNIQUE (promotion_id, dgt_id);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (promotion_id);


--
-- Name: purchase_order_lines purchase_order_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_pkey PRIMARY KEY (purchase_order_line_id);


--
-- Name: purchase_order_lines purchase_order_lines_purchase_order_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_purchase_order_id_product_id_key UNIQUE (purchase_order_id, product_id);


--
-- Name: purchase_orders purchase_orders_dgt_id_po_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_dgt_id_po_number_key UNIQUE (dgt_id, po_number);


--
-- Name: purchase_orders purchase_orders_dgt_id_request_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_dgt_id_request_key_key UNIQUE (dgt_id, request_key);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (purchase_order_id);


--
-- Name: rebate_claim_payments rebate_claim_payments_dgt_id_request_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_claim_payments
    ADD CONSTRAINT rebate_claim_payments_dgt_id_request_key_key UNIQUE (dgt_id, request_key);


--
-- Name: rebate_claim_payments rebate_claim_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_claim_payments
    ADD CONSTRAINT rebate_claim_payments_pkey PRIMARY KEY (payment_id);


--
-- Name: rebate_claims rebate_claims_claim_id_dgt_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_claims
    ADD CONSTRAINT rebate_claims_claim_id_dgt_id_key UNIQUE (claim_id, dgt_id);


--
-- Name: rebate_claims rebate_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_claims
    ADD CONSTRAINT rebate_claims_pkey PRIMARY KEY (claim_id);


--
-- Name: rebate_claims rebate_claims_program_id_period_start_period_end_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_claims
    ADD CONSTRAINT rebate_claims_program_id_period_start_period_end_key UNIQUE (program_id, period_start, period_end);


--
-- Name: rebate_program_items rebate_program_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_program_items
    ADD CONSTRAINT rebate_program_items_pkey PRIMARY KEY (link_id);


--
-- Name: rebate_program_items rebate_program_items_program_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_program_items
    ADD CONSTRAINT rebate_program_items_program_id_product_id_key UNIQUE (program_id, product_id);


--
-- Name: rebate_programs rebate_programs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_programs
    ADD CONSTRAINT rebate_programs_pkey PRIMARY KEY (program_id);


--
-- Name: rebate_programs rebate_programs_program_id_dgt_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_programs
    ADD CONSTRAINT rebate_programs_program_id_dgt_id_key UNIQUE (program_id, dgt_id);


--
-- Name: sale_discount_applications sale_discount_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_discount_applications
    ADD CONSTRAINT sale_discount_applications_pkey PRIMARY KEY (application_id);


--
-- Name: sale_payments sale_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_payments
    ADD CONSTRAINT sale_payments_pkey PRIMARY KEY (sale_payment_id);


--
-- Name: sales_items sales_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_pkey PRIMARY KEY (sales_item_id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (sale_id);


--
-- Name: status_types status_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.status_types
    ADD CONSTRAINT status_types_pkey PRIMARY KEY (status_type_id);


--
-- Name: store_billing_addons store_billing_addons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_billing_addons
    ADD CONSTRAINT store_billing_addons_pkey PRIMARY KEY (subscription_id, addon_id);


--
-- Name: store_departments store_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_departments
    ADD CONSTRAINT store_departments_pkey PRIMARY KEY (store_department_id);


--
-- Name: store_discounts store_discounts_dgt_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_discounts
    ADD CONSTRAINT store_discounts_dgt_id_code_key UNIQUE (dgt_id, code);


--
-- Name: store_discounts store_discounts_discount_id_dgt_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_discounts
    ADD CONSTRAINT store_discounts_discount_id_dgt_id_key UNIQUE (discount_id, dgt_id);


--
-- Name: store_discounts store_discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_discounts
    ADD CONSTRAINT store_discounts_pkey PRIMARY KEY (discount_id);


--
-- Name: store_role_permissions store_role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_role_permissions
    ADD CONSTRAINT store_role_permissions_pkey PRIMARY KEY (dgt_id, role_type_id, permission_code);


--
-- Name: store_sub_departments store_sub_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_sub_departments
    ADD CONSTRAINT store_sub_departments_pkey PRIMARY KEY (store_sub_department_id);


--
-- Name: store_subscriptions store_subscription_one_per_store; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_subscriptions
    ADD CONSTRAINT store_subscription_one_per_store UNIQUE (store_id);


--
-- Name: stores stores_company_dgt_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_company_dgt_unique UNIQUE (company_id, dgt_id);


--
-- Name: tender_types tender_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tender_types
    ADD CONSTRAINT tender_types_pkey PRIMARY KEY (tender_type_id);


--
-- Name: brands uq_brands_brand_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT uq_brands_brand_name UNIQUE (brand_name);


--
-- Name: departments uq_departments_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT uq_departments_name UNIQUE (department_name);


--
-- Name: employees uq_employees_user; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT uq_employees_user UNIQUE (user_id);


--
-- Name: inventory uq_inventory_store_product; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT uq_inventory_store_product UNIQUE (dgt_id, product_id);


--
-- Name: modules uq_modules_module_submodule; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT uq_modules_module_submodule UNIQUE (module_name, submodule_name);


--
-- Name: permissions uq_permissions_user_role_module; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT uq_permissions_user_role_module UNIQUE (user_role_id, module_id);


--
-- Name: pos_terminals uq_pos_terminal_store_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_terminals
    ADD CONSTRAINT uq_pos_terminal_store_code UNIQUE (store_id, terminal_code);


--
-- Name: price_groups uq_price_groups_store_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_groups
    ADD CONSTRAINT uq_price_groups_store_name UNIQUE (dgt_id, price_group_name);


--
-- Name: product_barcodes uq_product_barcode_store_value; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_barcodes
    ADD CONSTRAINT uq_product_barcode_store_value UNIQUE (dgt_id, product_barcode_value);


--
-- Name: product_price_groups uq_product_price_groups; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_price_groups
    ADD CONSTRAINT uq_product_price_groups UNIQUE (price_group_id, product_id);


--
-- Name: product_store_prices uq_product_store_prices_store_product; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_store_prices
    ADD CONSTRAINT uq_product_store_prices_store_product UNIQUE (dgt_id, product_id);


--
-- Name: product_vendors uq_product_vendors_product_vendor; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_vendors
    ADD CONSTRAINT uq_product_vendors_product_vendor UNIQUE (product_id, vendor_id);


--
-- Name: products uq_products_store_sku; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT uq_products_store_sku UNIQUE (dgt_id, product_sku);


--
-- Name: promotion_products uq_promotion_products; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_products
    ADD CONSTRAINT uq_promotion_products UNIQUE (promotion_id, product_id);


--
-- Name: role_types uq_role_types_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_types
    ADD CONSTRAINT uq_role_types_name UNIQUE (role_type_name);


--
-- Name: sales uq_sales_store_receipt; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT uq_sales_store_receipt UNIQUE (store_id, receipt_no);


--
-- Name: sales uq_sales_transaction_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT uq_sales_transaction_id UNIQUE (transaction_id);


--
-- Name: store_business_hours uq_store_business_hours_day; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_business_hours
    ADD CONSTRAINT uq_store_business_hours_day UNIQUE (dgt_id, day_of_week);


--
-- Name: store_departments uq_store_departments; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_departments
    ADD CONSTRAINT uq_store_departments UNIQUE (dgt_id, department_id);


--
-- Name: store_sub_departments uq_store_sub_department_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_sub_departments
    ADD CONSTRAINT uq_store_sub_department_name UNIQUE (store_department_id, store_sub_department_name);


--
-- Name: stores uq_stores_legal_business_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT uq_stores_legal_business_name UNIQUE (legal_business_name);


--
-- Name: stores uq_stores_license_number; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT uq_stores_license_number UNIQUE (license_number);


--
-- Name: stores uq_stores_store_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT uq_stores_store_id UNIQUE (store_id);


--
-- Name: stores uq_stores_tax_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT uq_stores_tax_id UNIQUE (tax_id);


--
-- Name: subscription_plans uq_subscription_plans_plan_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT uq_subscription_plans_plan_name UNIQUE (plan_name);


--
-- Name: tender_types uq_tender_types_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tender_types
    ADD CONSTRAINT uq_tender_types_code UNIQUE (tender_code);


--
-- Name: user_roles uq_user_roles; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT uq_user_roles UNIQUE (user_id, role_type_id, dgt_id);


--
-- Name: users uq_users_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_email UNIQUE (email);


--
-- Name: users uq_users_employee_store; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_employee_store UNIQUE (dgt_id, employee_id);


--
-- Name: user_login_events user_login_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_login_events
    ADD CONSTRAINT user_login_events_pkey PRIMARY KEY (event_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: user_sessions user_sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_token_hash_key UNIQUE (token_hash);


--
-- Name: workforce_availability workforce_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_availability
    ADD CONSTRAINT workforce_availability_pkey PRIMARY KEY (availability_id);


--
-- Name: workforce_availability workforce_availability_request_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_availability
    ADD CONSTRAINT workforce_availability_request_id_key UNIQUE (request_id);


--
-- Name: workforce_leave_shifts workforce_leave_shifts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_leave_shifts
    ADD CONSTRAINT workforce_leave_shifts_pkey PRIMARY KEY (request_id, schedule_id);


--
-- Name: workforce_requests workforce_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_requests
    ADD CONSTRAINT workforce_requests_pkey PRIMARY KEY (request_id);


--
-- Name: workforce_requests workforce_requests_submitted_by_request_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_requests
    ADD CONSTRAINT workforce_requests_submitted_by_request_key_key UNIQUE (submitted_by, request_key);


--
-- Name: approval_requests_queue_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX approval_requests_queue_idx ON public.approval_requests USING btree (company_id, dgt_id, status, created_at);


--
-- Name: billing_invoice_period_once; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX billing_invoice_period_once ON public.billing_invoices USING btree (subscription_id, period_start) WHERE ((invoice_kind)::text = ANY ((ARRAY['INITIAL'::character varying, 'RENEWAL'::character varying])::text[]));


--
-- Name: credit_card_batches_store_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX credit_card_batches_store_date ON public.credit_card_batches USING btree (dgt_id, business_date, batch_id);


--
-- Name: credit_card_processor_store_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX credit_card_processor_store_name ON public.credit_card_processors USING btree (dgt_id, lower(TRIM(BOTH FROM processor_name)));


--
-- Name: discount_application_request_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX discount_application_request_key ON public.sale_discount_applications USING btree (dgt_id, request_key);


--
-- Name: ebt_batches_store_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ebt_batches_store_date ON public.ebt_batches USING btree (dgt_id, business_date, batch_id);


--
-- Name: everyday_closing_store_business_date; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX everyday_closing_store_business_date ON public.everyday_closing USING btree (dgt_id, business_date);


--
-- Name: fleet_batches_store_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fleet_batches_store_date ON public.fleet_batches USING btree (dgt_id, business_date, batch_id);


--
-- Name: fleet_batches_store_provider_reference; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX fleet_batches_store_provider_reference ON public.fleet_batches USING btree (dgt_id, lower(TRIM(BOTH FROM provider_name)), batch_reference);


--
-- Name: fuel_delivery_vendor_bol_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX fuel_delivery_vendor_bol_key ON public.fuel_deliveries USING btree (dgt_id, vendor_id, lower(TRIM(BOTH FROM bol_number)));


--
-- Name: idx_pos_terminals_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_terminals_store ON public.pos_terminals USING btree (store_id);


--
-- Name: idx_sale_payments_datetime; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sale_payments_datetime ON public.sale_payments USING btree (payment_datetime);


--
-- Name: idx_sale_payments_sale; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sale_payments_sale ON public.sale_payments USING btree (sale_id);


--
-- Name: idx_sale_payments_tender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sale_payments_tender ON public.sale_payments USING btree (tender_type_id);


--
-- Name: idx_sales_cashier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_cashier ON public.sales USING btree (cashier_id);


--
-- Name: idx_sales_datetime; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_datetime ON public.sales USING btree (sale_datetime);


--
-- Name: idx_sales_items_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_items_product ON public.sales_items USING btree (product_id);


--
-- Name: idx_sales_items_sale; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_items_sale ON public.sales_items USING btree (sale_id);


--
-- Name: idx_sales_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_status ON public.sales USING btree (sale_status);


--
-- Name: idx_sales_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_store ON public.sales USING btree (store_id);


--
-- Name: idx_sales_terminal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_terminal ON public.sales USING btree (terminal_id);


--
-- Name: inventory_returns_reduction_request_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX inventory_returns_reduction_request_uq ON public.inventory_returns USING btree (reduction_request_id);


--
-- Name: inventory_transfers_reduction_request_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX inventory_transfers_reduction_request_uq ON public.inventory_transfers USING btree (reduction_request_id);


--
-- Name: invoice_charges_grocery_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX invoice_charges_grocery_unique ON public.invoice_charges USING btree (invoice_id) WHERE ((charge_type)::text = 'GROCERY'::text);


--
-- Name: one_active_price_group_per_product; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX one_active_price_group_per_product ON public.product_price_groups USING btree (dgt_id, product_id) WHERE is_active;


--
-- Name: one_register_discount_per_sale; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX one_register_discount_per_sale ON public.sale_discount_applications USING btree (sale_id) WHERE ((request_key IS NOT NULL) AND ((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPLIED'::character varying])::text[])));


--
-- Name: rebate_claim_payments_claim; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rebate_claim_payments_claim ON public.rebate_claim_payments USING btree (dgt_id, claim_id);


--
-- Name: rebate_claims_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rebate_claims_store ON public.rebate_claims USING btree (dgt_id, period_start);


--
-- Name: rebate_program_items_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rebate_program_items_store ON public.rebate_program_items USING btree (dgt_id);


--
-- Name: rebate_programs_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX rebate_programs_store ON public.rebate_programs USING btree (dgt_id);


--
-- Name: sale_discount_store_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sale_discount_store_date ON public.sale_discount_applications USING btree (dgt_id, applied_at);


--
-- Name: sales_id_store_discount_link; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sales_id_store_discount_link ON public.sales USING btree (sale_id, store_id);


--
-- Name: stores_company_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX stores_company_idx ON public.stores USING btree (company_id);


--
-- Name: user_login_events_user_time_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_login_events_user_time_idx ON public.user_login_events USING btree (user_id, occurred_at DESC);


--
-- Name: user_sessions_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_sessions_user_idx ON public.user_sessions USING btree (user_id);


--
-- Name: workforce_availability_employee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workforce_availability_employee ON public.workforce_availability USING btree (employee_id, dgt_id, start_date);


--
-- Name: workforce_requests_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workforce_requests_store ON public.workforce_requests USING btree (dgt_id, employee_id);


--
-- Name: workforce_shift_employee_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX workforce_shift_employee_time ON public.employee_schedules USING btree (employee_id, schedule_start, schedule_end);


--
-- Name: credit_card_batch_payments credit_card_batch_store_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER credit_card_batch_store_guard BEFORE INSERT OR UPDATE ON public.credit_card_batch_payments FOR EACH ROW EXECUTE FUNCTION public.validate_credit_card_batch_store();


--
-- Name: ebt_batch_payments ebt_batch_payment_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ebt_batch_payment_guard BEFORE INSERT OR UPDATE ON public.ebt_batch_payments FOR EACH ROW EXECUTE FUNCTION public.validate_ebt_batch_payment();


--
-- Name: fleet_batch_payments fleet_batch_payment_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER fleet_batch_payment_guard BEFORE INSERT OR UPDATE ON public.fleet_batch_payments FOR EACH ROW EXECUTE FUNCTION public.validate_fleet_batch_payment();


--
-- Name: stores validate_store_timezone; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER validate_store_timezone BEFORE INSERT OR UPDATE OF timezone ON public.stores FOR EACH ROW EXECUTE FUNCTION public.validate_store_timezone();


--
-- Name: access_audit_events access_audit_events_actor_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_audit_events
    ADD CONSTRAINT access_audit_events_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES public.users(user_id);


--
-- Name: access_audit_events access_audit_events_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_audit_events
    ADD CONSTRAINT access_audit_events_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- Name: access_audit_events access_audit_events_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.access_audit_events
    ADD CONSTRAINT access_audit_events_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: approval_requests approval_requests_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- Name: approval_requests approval_requests_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: approval_requests approval_requests_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(module_id);


--
-- Name: approval_requests approval_requests_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(user_id);


--
-- Name: approval_requests approval_requests_requester_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_requester_role_id_fkey FOREIGN KEY (requester_role_id) REFERENCES public.user_roles(user_role_id);


--
-- Name: approval_requests approval_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approval_requests
    ADD CONSTRAINT approval_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(user_id);


--
-- Name: billing_change_requests billing_change_requests_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_change_requests
    ADD CONSTRAINT billing_change_requests_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: billing_change_requests billing_change_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_change_requests
    ADD CONSTRAINT billing_change_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: billing_invoices billing_invoices_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT billing_invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.store_subscriptions(subscription_id);


--
-- Name: companies companies_primary_store_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_primary_store_fk FOREIGN KEY (company_id, primary_store_dgt_id) REFERENCES public.stores(company_id, dgt_id);


--
-- Name: company_admins company_admins_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_admins
    ADD CONSTRAINT company_admins_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- Name: company_admins company_admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_admins
    ADD CONSTRAINT company_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: credit_card_batch_payments credit_card_batch_payments_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_batch_payments
    ADD CONSTRAINT credit_card_batch_payments_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.credit_card_batches(batch_id);


--
-- Name: credit_card_batch_payments credit_card_batch_payments_sale_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_batch_payments
    ADD CONSTRAINT credit_card_batch_payments_sale_payment_id_fkey FOREIGN KEY (sale_payment_id) REFERENCES public.sale_payments(sale_payment_id);


--
-- Name: credit_card_batches credit_card_batches_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_batches
    ADD CONSTRAINT credit_card_batches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: credit_card_batches credit_card_batches_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_batches
    ADD CONSTRAINT credit_card_batches_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: credit_card_batches credit_card_batches_fee_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_batches
    ADD CONSTRAINT credit_card_batches_fee_reviewed_by_fkey FOREIGN KEY (fee_reviewed_by) REFERENCES public.users(user_id);


--
-- Name: credit_card_batches credit_card_batches_processor_id_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_batches
    ADD CONSTRAINT credit_card_batches_processor_id_dgt_id_fkey FOREIGN KEY (processor_id, dgt_id) REFERENCES public.credit_card_processors(processor_id, dgt_id);


--
-- Name: credit_card_batches credit_card_batches_reconciled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_batches
    ADD CONSTRAINT credit_card_batches_reconciled_by_fkey FOREIGN KEY (reconciled_by) REFERENCES public.users(user_id);


--
-- Name: credit_card_batches credit_card_batches_settled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_batches
    ADD CONSTRAINT credit_card_batches_settled_by_fkey FOREIGN KEY (settled_by) REFERENCES public.users(user_id);


--
-- Name: credit_card_batches credit_card_batches_variance_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_batches
    ADD CONSTRAINT credit_card_batches_variance_reviewed_by_fkey FOREIGN KEY (variance_reviewed_by) REFERENCES public.users(user_id);


--
-- Name: credit_card_processors credit_card_processors_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_processors
    ADD CONSTRAINT credit_card_processors_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: credit_card_processors credit_card_processors_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_processors
    ADD CONSTRAINT credit_card_processors_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: credit_card_settings credit_card_settings_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_settings
    ADD CONSTRAINT credit_card_settings_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: credit_card_settings credit_card_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_card_settings
    ADD CONSTRAINT credit_card_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(user_id);


--
-- Name: daily_closing_tenders daily_closing_tenders_everyday_closing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_closing_tenders
    ADD CONSTRAINT daily_closing_tenders_everyday_closing_id_fkey FOREIGN KEY (everyday_closing_id) REFERENCES public.everyday_closing(everyday_closing_id);


--
-- Name: ebt_batch_payments ebt_batch_payments_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebt_batch_payments
    ADD CONSTRAINT ebt_batch_payments_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.ebt_batches(batch_id);


--
-- Name: ebt_batch_payments ebt_batch_payments_sale_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebt_batch_payments
    ADD CONSTRAINT ebt_batch_payments_sale_payment_id_fkey FOREIGN KEY (sale_payment_id) REFERENCES public.sale_payments(sale_payment_id);


--
-- Name: ebt_batches ebt_batches_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebt_batches
    ADD CONSTRAINT ebt_batches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: ebt_batches ebt_batches_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebt_batches
    ADD CONSTRAINT ebt_batches_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: ebt_batches ebt_batches_reconciled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebt_batches
    ADD CONSTRAINT ebt_batches_reconciled_by_fkey FOREIGN KEY (reconciled_by) REFERENCES public.users(user_id);


--
-- Name: ebt_batches ebt_batches_settled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ebt_batches
    ADD CONSTRAINT ebt_batches_settled_by_fkey FOREIGN KEY (settled_by) REFERENCES public.users(user_id);


--
-- Name: employee_deductions employee_deductions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_deductions
    ADD CONSTRAINT employee_deductions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON DELETE CASCADE;


--
-- Name: employee_deposit_instructions employee_deposit_instructions_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_deposit_instructions
    ADD CONSTRAINT employee_deposit_instructions_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id) ON DELETE CASCADE;


--
-- Name: employee_store_assignments employee_store_assignments_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_store_assignments
    ADD CONSTRAINT employee_store_assignments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- Name: employee_store_assignments employee_store_assignments_store_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_store_assignments
    ADD CONSTRAINT employee_store_assignments_store_department_id_fkey FOREIGN KEY (store_department_id) REFERENCES public.store_departments(store_department_id);


--
-- Name: employee_time_off_requests employee_time_off_requests_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_off_requests
    ADD CONSTRAINT employee_time_off_requests_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: employee_time_off_requests employee_time_off_requests_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_off_requests
    ADD CONSTRAINT employee_time_off_requests_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(user_id);


--
-- Name: everyday_closing everyday_closing_closed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.everyday_closing
    ADD CONSTRAINT everyday_closing_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.users(user_id);


--
-- Name: everyday_closing everyday_closing_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.everyday_closing
    ADD CONSTRAINT everyday_closing_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: billing_invoices fk_billing_invoices_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT fk_billing_invoices_store FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- Name: billing_invoices fk_billing_invoices_subscription_plan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_invoices
    ADD CONSTRAINT fk_billing_invoices_subscription_plan FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(subscription_plan_id);


--
-- Name: store_contact_info fk_contact_dgt_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_contact_info
    ADD CONSTRAINT fk_contact_dgt_id FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: employee_compensation fk_employee_compensation_employee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_compensation
    ADD CONSTRAINT fk_employee_compensation_employee FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: employee_documents fk_employee_documents_employee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_documents
    ADD CONSTRAINT fk_employee_documents_employee FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: employee_emergency_contacts fk_employee_emergency_contacts_employee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_emergency_contacts
    ADD CONSTRAINT fk_employee_emergency_contacts_employee FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: employee_schedules fk_employee_schedules_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_schedules
    ADD CONSTRAINT fk_employee_schedules_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: employee_schedules fk_employee_schedules_employee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_schedules
    ADD CONSTRAINT fk_employee_schedules_employee FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: employee_schedules fk_employee_schedules_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_schedules
    ADD CONSTRAINT fk_employee_schedules_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: employee_status_history fk_employee_status_history_employee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_status_history
    ADD CONSTRAINT fk_employee_status_history_employee FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: employee_status_history fk_employee_status_history_status_type; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_status_history
    ADD CONSTRAINT fk_employee_status_history_status_type FOREIGN KEY (status_type_id) REFERENCES public.status_types(status_type_id);


--
-- Name: employee_store_assignments fk_employee_store_assignment_employee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_store_assignments
    ADD CONSTRAINT fk_employee_store_assignment_employee FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: employee_store_assignments fk_employee_store_assignment_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_store_assignments
    ADD CONSTRAINT fk_employee_store_assignment_role FOREIGN KEY (role_type_id) REFERENCES public.role_types(role_type_id);


--
-- Name: employee_store_assignments fk_employee_store_assignment_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_store_assignments
    ADD CONSTRAINT fk_employee_store_assignment_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: employee_time_entries fk_employee_time_entries_employee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_entries
    ADD CONSTRAINT fk_employee_time_entries_employee FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: employee_time_entries fk_employee_time_entries_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_entries
    ADD CONSTRAINT fk_employee_time_entries_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: employee_time_off_requests fk_employee_time_off_requests_employee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_off_requests
    ADD CONSTRAINT fk_employee_time_off_requests_employee FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: employee_time_off_requests fk_employee_time_off_requests_reviewed_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_off_requests
    ADD CONSTRAINT fk_employee_time_off_requests_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES public.users(user_id);


--
-- Name: employee_time_off_requests fk_employee_time_off_requests_status_type; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_time_off_requests
    ADD CONSTRAINT fk_employee_time_off_requests_status_type FOREIGN KEY (status_type_id) REFERENCES public.status_types(status_type_id);


--
-- Name: employees fk_employees_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: fuel_prices fk_fuel_prices_changed_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_prices
    ADD CONSTRAINT fk_fuel_prices_changed_by FOREIGN KEY (changed_by) REFERENCES public.users(user_id);


--
-- Name: fuel_prices fk_fuel_prices_grade; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_prices
    ADD CONSTRAINT fk_fuel_prices_grade FOREIGN KEY (fuel_grade_id) REFERENCES public.fuel_grades(fuel_grade_id);


--
-- Name: fuel_prices fk_fuel_prices_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_prices
    ADD CONSTRAINT fk_fuel_prices_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: fuel_pumps fk_fuel_pumps_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_pumps
    ADD CONSTRAINT fk_fuel_pumps_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: fuel_tank_grade_assignments fk_fuel_tank_grade_assignment_grade; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_tank_grade_assignments
    ADD CONSTRAINT fk_fuel_tank_grade_assignment_grade FOREIGN KEY (fuel_grade_id) REFERENCES public.fuel_grades(fuel_grade_id);


--
-- Name: fuel_tank_grade_assignments fk_fuel_tank_grade_assignment_tank; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_tank_grade_assignments
    ADD CONSTRAINT fk_fuel_tank_grade_assignment_tank FOREIGN KEY (tank_id) REFERENCES public.fuel_tanks(tank_id);


--
-- Name: fuel_tank_readings fk_fuel_tank_readings_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_tank_readings
    ADD CONSTRAINT fk_fuel_tank_readings_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: fuel_tank_readings fk_fuel_tank_readings_tank; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_tank_readings
    ADD CONSTRAINT fk_fuel_tank_readings_tank FOREIGN KEY (tank_id) REFERENCES public.fuel_tanks(tank_id);


--
-- Name: fuel_tanks fk_fuel_tanks_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_tanks
    ADD CONSTRAINT fk_fuel_tanks_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: inventory_movements fk_inventory_movements_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fk_inventory_movements_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: inventory_movements fk_inventory_movements_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fk_inventory_movements_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: inventory fk_inventory_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: inventory_reduction_requests fk_inventory_reduction_requests_requested_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_reduction_requests
    ADD CONSTRAINT fk_inventory_reduction_requests_requested_by FOREIGN KEY (requested_by) REFERENCES public.users(user_id);


--
-- Name: inventory_reduction_requests fk_inventory_reduction_requests_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_reduction_requests
    ADD CONSTRAINT fk_inventory_reduction_requests_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: inventory_return_items fk_inventory_return_items_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_return_items
    ADD CONSTRAINT fk_inventory_return_items_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: inventory_return_items fk_inventory_return_items_return; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_return_items
    ADD CONSTRAINT fk_inventory_return_items_return FOREIGN KEY (return_id) REFERENCES public.inventory_returns(return_id);


--
-- Name: inventory_returns fk_inventory_returns_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_returns
    ADD CONSTRAINT fk_inventory_returns_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: inventory_returns fk_inventory_returns_vendor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_returns
    ADD CONSTRAINT fk_inventory_returns_vendor FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: inventory_shrinkage fk_inventory_shrinkage_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_shrinkage
    ADD CONSTRAINT fk_inventory_shrinkage_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: inventory_shrinkage_items fk_inventory_shrinkage_items_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_shrinkage_items
    ADD CONSTRAINT fk_inventory_shrinkage_items_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: inventory_shrinkage fk_inventory_shrinkage_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_shrinkage
    ADD CONSTRAINT fk_inventory_shrinkage_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: inventory fk_inventory_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT fk_inventory_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: inventory_transfer_items fk_inventory_transfer_items_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfer_items
    ADD CONSTRAINT fk_inventory_transfer_items_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: inventory_transfer_items fk_inventory_transfer_items_transfer; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfer_items
    ADD CONSTRAINT fk_inventory_transfer_items_transfer FOREIGN KEY (transfer_id) REFERENCES public.inventory_transfers(transfer_id);


--
-- Name: inventory_transfers fk_inventory_transfers_created_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfers
    ADD CONSTRAINT fk_inventory_transfers_created_by FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: inventory_transfers fk_inventory_transfers_from_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfers
    ADD CONSTRAINT fk_inventory_transfers_from_store FOREIGN KEY (from_dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: inventory_transfers fk_inventory_transfers_to_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfers
    ADD CONSTRAINT fk_inventory_transfers_to_store FOREIGN KEY (to_dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: lottery_games fk_lottery_games_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_games
    ADD CONSTRAINT fk_lottery_games_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: lottery_packs fk_lottery_packs_performed_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_packs
    ADD CONSTRAINT fk_lottery_packs_performed_by FOREIGN KEY (performed_by) REFERENCES public.users(user_id);


--
-- Name: lottery_packs fk_lottery_packs_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_packs
    ADD CONSTRAINT fk_lottery_packs_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: lottery_packs fk_lottery_packs_vendor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_packs
    ADD CONSTRAINT fk_lottery_packs_vendor FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: permissions fk_permissions_module; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT fk_permissions_module FOREIGN KEY (module_id) REFERENCES public.modules(module_id) ON DELETE CASCADE;


--
-- Name: permissions fk_permissions_user_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT fk_permissions_user_role FOREIGN KEY (user_role_id) REFERENCES public.user_roles(user_role_id) ON DELETE CASCADE;


--
-- Name: pos_terminals fk_pos_terminals_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_terminals
    ADD CONSTRAINT fk_pos_terminals_store FOREIGN KEY (store_id) REFERENCES public.stores(dgt_id);


--
-- Name: price_groups fk_price_groups_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_groups
    ADD CONSTRAINT fk_price_groups_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: product_barcodes fk_product_barcodes_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_barcodes
    ADD CONSTRAINT fk_product_barcodes_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: product_price_groups fk_product_price_groups_price_group; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_price_groups
    ADD CONSTRAINT fk_product_price_groups_price_group FOREIGN KEY (price_group_id) REFERENCES public.price_groups(price_group_id);


--
-- Name: product_price_groups fk_product_price_groups_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_price_groups
    ADD CONSTRAINT fk_product_price_groups_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: product_store_prices fk_product_store_prices_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_store_prices
    ADD CONSTRAINT fk_product_store_prices_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: product_store_prices fk_product_store_prices_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_store_prices
    ADD CONSTRAINT fk_product_store_prices_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: product_vendors fk_product_vendors_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_vendors
    ADD CONSTRAINT fk_product_vendors_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: product_vendors fk_product_vendors_vendor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_vendors
    ADD CONSTRAINT fk_product_vendors_vendor FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: products fk_products_brand; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES public.brands(brand_id);


--
-- Name: products fk_products_store_sub_department; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_products_store_sub_department FOREIGN KEY (store_sub_department_id) REFERENCES public.store_sub_departments(store_sub_department_id);


--
-- Name: promotion_products fk_promotion_products_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_products
    ADD CONSTRAINT fk_promotion_products_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: promotion_products fk_promotion_products_promotion; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_products
    ADD CONSTRAINT fk_promotion_products_promotion FOREIGN KEY (promotion_id) REFERENCES public.promotions(promotion_id);


--
-- Name: promotions fk_promotions_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT fk_promotions_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: sale_payments fk_sale_payments_sale; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_payments
    ADD CONSTRAINT fk_sale_payments_sale FOREIGN KEY (sale_id) REFERENCES public.sales(sale_id) ON DELETE CASCADE;


--
-- Name: sale_payments fk_sale_payments_tender; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_payments
    ADD CONSTRAINT fk_sale_payments_tender FOREIGN KEY (tender_type_id) REFERENCES public.tender_types(tender_type_id);


--
-- Name: sales fk_sales_cashier; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT fk_sales_cashier FOREIGN KEY (cashier_id) REFERENCES public.employees(employee_id);


--
-- Name: sales_items fk_sales_items_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT fk_sales_items_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: sales_items fk_sales_items_sale; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT fk_sales_items_sale FOREIGN KEY (sale_id) REFERENCES public.sales(sale_id) ON DELETE CASCADE;


--
-- Name: sales fk_sales_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT fk_sales_store FOREIGN KEY (store_id) REFERENCES public.stores(dgt_id);


--
-- Name: sales fk_sales_terminal; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT fk_sales_terminal FOREIGN KEY (terminal_id) REFERENCES public.pos_terminals(terminal_id);


--
-- Name: inventory_shrinkage_items fk_shrinkage_items_shrinkage; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_shrinkage_items
    ADD CONSTRAINT fk_shrinkage_items_shrinkage FOREIGN KEY (shrinkage_id) REFERENCES public.inventory_shrinkage(shrinkage_id);


--
-- Name: store_business_hours fk_store_business_hours_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_business_hours
    ADD CONSTRAINT fk_store_business_hours_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: store_departments fk_store_departments_department; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_departments
    ADD CONSTRAINT fk_store_departments_department FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- Name: store_departments fk_store_departments_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_departments
    ADD CONSTRAINT fk_store_departments_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: store_sub_departments fk_store_sub_departments_store_department; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_sub_departments
    ADD CONSTRAINT fk_store_sub_departments_store_department FOREIGN KEY (store_department_id) REFERENCES public.store_departments(store_department_id);


--
-- Name: store_subscriptions fk_store_subscriptions_plan; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_subscriptions
    ADD CONSTRAINT fk_store_subscriptions_plan FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(subscription_plan_id);


--
-- Name: store_subscriptions fk_store_subscriptions_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_subscriptions
    ADD CONSTRAINT fk_store_subscriptions_store FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- Name: user_roles fk_user_roles_role_type; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_role_type FOREIGN KEY (role_type_id) REFERENCES public.role_types(role_type_id);


--
-- Name: user_roles fk_user_roles_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: user_roles fk_user_roles_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: users fk_users_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: vendor_audit_log fk_vendor_audit_log_cost_history; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_audit_log
    ADD CONSTRAINT fk_vendor_audit_log_cost_history FOREIGN KEY (cost_history_id) REFERENCES public.vendor_item_cost_history(cost_history_id);


--
-- Name: vendor_audit_log fk_vendor_audit_log_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_audit_log
    ADD CONSTRAINT fk_vendor_audit_log_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: vendor_audit_log fk_vendor_audit_log_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_audit_log
    ADD CONSTRAINT fk_vendor_audit_log_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: vendor_audit_log fk_vendor_audit_log_vendor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_audit_log
    ADD CONSTRAINT fk_vendor_audit_log_vendor FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: vendor_contacts fk_vendor_contacts_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_contacts
    ADD CONSTRAINT fk_vendor_contacts_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: vendor_contacts fk_vendor_contacts_vendor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_contacts
    ADD CONSTRAINT fk_vendor_contacts_vendor FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: vendor_item_cost_history fk_vendor_item_cost_history_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_item_cost_history
    ADD CONSTRAINT fk_vendor_item_cost_history_product FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: vendor_item_cost_history fk_vendor_item_cost_history_vendor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_item_cost_history
    ADD CONSTRAINT fk_vendor_item_cost_history_vendor FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: vendor_price_settings fk_vendor_price_settings_permission; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_price_settings
    ADD CONSTRAINT fk_vendor_price_settings_permission FOREIGN KEY (permission_id) REFERENCES public.permissions(permission_id);


--
-- Name: vendor_price_settings fk_vendor_price_settings_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_price_settings
    ADD CONSTRAINT fk_vendor_price_settings_store FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: fleet_batch_payments fleet_batch_payments_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet_batch_payments
    ADD CONSTRAINT fleet_batch_payments_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.fleet_batches(batch_id);


--
-- Name: fleet_batch_payments fleet_batch_payments_sale_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet_batch_payments
    ADD CONSTRAINT fleet_batch_payments_sale_payment_id_fkey FOREIGN KEY (sale_payment_id) REFERENCES public.sale_payments(sale_payment_id);


--
-- Name: fleet_batches fleet_batches_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet_batches
    ADD CONSTRAINT fleet_batches_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: fleet_batches fleet_batches_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet_batches
    ADD CONSTRAINT fleet_batches_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: fleet_batches fleet_batches_reconciled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet_batches
    ADD CONSTRAINT fleet_batches_reconciled_by_fkey FOREIGN KEY (reconciled_by) REFERENCES public.users(user_id);


--
-- Name: fleet_batches fleet_batches_settled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet_batches
    ADD CONSTRAINT fleet_batches_settled_by_fkey FOREIGN KEY (settled_by) REFERENCES public.users(user_id);


--
-- Name: fuel_adjustment_lines fuel_adjustment_lines_adjustment_id_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_adjustment_lines
    ADD CONSTRAINT fuel_adjustment_lines_adjustment_id_dgt_id_fkey FOREIGN KEY (adjustment_id, dgt_id) REFERENCES public.fuel_adjustments(adjustment_id, dgt_id);


--
-- Name: fuel_adjustment_lines fuel_adjustment_lines_baseline_reading_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_adjustment_lines
    ADD CONSTRAINT fuel_adjustment_lines_baseline_reading_id_fkey FOREIGN KEY (baseline_reading_id) REFERENCES public.fuel_tank_readings(tank_reading_id);


--
-- Name: fuel_adjustment_lines fuel_adjustment_lines_fuel_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_adjustment_lines
    ADD CONSTRAINT fuel_adjustment_lines_fuel_grade_id_fkey FOREIGN KEY (fuel_grade_id) REFERENCES public.fuel_grades(fuel_grade_id);


--
-- Name: fuel_adjustment_lines fuel_adjustment_lines_tank_id_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_adjustment_lines
    ADD CONSTRAINT fuel_adjustment_lines_tank_id_dgt_id_fkey FOREIGN KEY (tank_id, dgt_id) REFERENCES public.fuel_tanks(tank_id, dgt_id);


--
-- Name: fuel_adjustments fuel_adjustments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_adjustments
    ADD CONSTRAINT fuel_adjustments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: fuel_adjustments fuel_adjustments_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_adjustments
    ADD CONSTRAINT fuel_adjustments_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: fuel_adjustments fuel_adjustments_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_adjustments
    ADD CONSTRAINT fuel_adjustments_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(user_id);


--
-- Name: fuel_deliveries fuel_deliveries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_deliveries
    ADD CONSTRAINT fuel_deliveries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: fuel_deliveries fuel_deliveries_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_deliveries
    ADD CONSTRAINT fuel_deliveries_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: fuel_deliveries fuel_deliveries_received_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_deliveries
    ADD CONSTRAINT fuel_deliveries_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.users(user_id);


--
-- Name: fuel_deliveries fuel_deliveries_vendor_id_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_deliveries
    ADD CONSTRAINT fuel_deliveries_vendor_id_dgt_id_fkey FOREIGN KEY (vendor_id, dgt_id) REFERENCES public.vendors(vendor_id, dgt_id);


--
-- Name: fuel_delivery_lines fuel_delivery_lines_delivery_id_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_delivery_lines
    ADD CONSTRAINT fuel_delivery_lines_delivery_id_dgt_id_fkey FOREIGN KEY (delivery_id, dgt_id) REFERENCES public.fuel_deliveries(delivery_id, dgt_id);


--
-- Name: fuel_delivery_lines fuel_delivery_lines_fuel_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_delivery_lines
    ADD CONSTRAINT fuel_delivery_lines_fuel_grade_id_fkey FOREIGN KEY (fuel_grade_id) REFERENCES public.fuel_grades(fuel_grade_id);


--
-- Name: fuel_delivery_lines fuel_delivery_lines_tank_id_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_delivery_lines
    ADD CONSTRAINT fuel_delivery_lines_tank_id_dgt_id_fkey FOREIGN KEY (tank_id, dgt_id) REFERENCES public.fuel_tanks(tank_id, dgt_id);


--
-- Name: fuel_invoice_details fuel_invoice_details_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_invoice_details
    ADD CONSTRAINT fuel_invoice_details_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id);


--
-- Name: fuel_invoice_items fuel_invoice_items_fuel_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_invoice_items
    ADD CONSTRAINT fuel_invoice_items_fuel_grade_id_fkey FOREIGN KEY (fuel_grade_id) REFERENCES public.fuel_grades(fuel_grade_id);


--
-- Name: fuel_invoice_items fuel_invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_invoice_items
    ADD CONSTRAINT fuel_invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id);


--
-- Name: inventory_movements fuel_movement_adjustment_line_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fuel_movement_adjustment_line_fk FOREIGN KEY (fuel_adjustment_line_id, dgt_id, tank_id, fuel_grade_id) REFERENCES public.fuel_adjustment_lines(adjustment_line_id, dgt_id, tank_id, fuel_grade_id);


--
-- Name: inventory_movements fuel_movement_delivery_line_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fuel_movement_delivery_line_fk FOREIGN KEY (fuel_delivery_line_id, dgt_id, tank_id, fuel_grade_id) REFERENCES public.fuel_delivery_lines(delivery_line_id, dgt_id, tank_id, fuel_grade_id);


--
-- Name: inventory_movements fuel_movement_tank_store_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT fuel_movement_tank_store_fk FOREIGN KEY (tank_id, dgt_id) REFERENCES public.fuel_tanks(tank_id, dgt_id);


--
-- Name: gas_settings gas_settings_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gas_settings
    ADD CONSTRAINT gas_settings_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: gas_settings gas_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gas_settings
    ADD CONSTRAINT gas_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(user_id);


--
-- Name: grocery_invoice_items grocery_invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grocery_invoice_items
    ADD CONSTRAINT grocery_invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id);


--
-- Name: grocery_invoice_items grocery_invoice_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grocery_invoice_items
    ADD CONSTRAINT grocery_invoice_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: grocery_settings grocery_settings_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grocery_settings
    ADD CONSTRAINT grocery_settings_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: grocery_settings grocery_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grocery_settings
    ADD CONSTRAINT grocery_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(user_id);


--
-- Name: inventory_movements inventory_movements_fuel_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_fuel_grade_id_fkey FOREIGN KEY (fuel_grade_id) REFERENCES public.fuel_grades(fuel_grade_id);


--
-- Name: inventory_returns inventory_returns_reduction_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_returns
    ADD CONSTRAINT inventory_returns_reduction_request_id_fkey FOREIGN KEY (reduction_request_id) REFERENCES public.inventory_reduction_requests(reduction_request_id);


--
-- Name: inventory_returns inventory_returns_settled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_returns
    ADD CONSTRAINT inventory_returns_settled_by_fkey FOREIGN KEY (settled_by) REFERENCES public.users(user_id);


--
-- Name: inventory_transfer_items inventory_transfer_items_destination_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfer_items
    ADD CONSTRAINT inventory_transfer_items_destination_product_id_fkey FOREIGN KEY (destination_product_id) REFERENCES public.products(product_id);


--
-- Name: inventory_transfers inventory_transfers_reduction_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_transfers
    ADD CONSTRAINT inventory_transfers_reduction_request_id_fkey FOREIGN KEY (reduction_request_id) REFERENCES public.inventory_reduction_requests(reduction_request_id);


--
-- Name: invoice_adjustments invoice_adjustments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_adjustments
    ADD CONSTRAINT invoice_adjustments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id);


--
-- Name: invoice_audit_log invoice_audit_log_action_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_audit_log
    ADD CONSTRAINT invoice_audit_log_action_by_fkey FOREIGN KEY (action_by) REFERENCES public.users(user_id);


--
-- Name: invoice_audit_log invoice_audit_log_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_audit_log
    ADD CONSTRAINT invoice_audit_log_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id);


--
-- Name: invoice_charges invoice_charges_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_charges
    ADD CONSTRAINT invoice_charges_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id);


--
-- Name: invoice_charges invoice_charges_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_charges
    ADD CONSTRAINT invoice_charges_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.status_types(status_type_id);


--
-- Name: invoice_documents invoice_documents_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_documents
    ADD CONSTRAINT invoice_documents_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(invoice_id);


--
-- Name: invoice_documents invoice_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_documents
    ADD CONSTRAINT invoice_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(user_id);


--
-- Name: invoices invoices_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(user_id);


--
-- Name: invoices invoices_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: invoices invoices_purchase_order_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_purchase_order_fk FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(purchase_order_id);


--
-- Name: invoices invoices_received_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_received_by_fkey FOREIGN KEY (received_by) REFERENCES public.users(user_id);


--
-- Name: invoices invoices_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: lottery_pack_inventory lottery_pack_inventory_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_pack_inventory
    ADD CONSTRAINT lottery_pack_inventory_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: lottery_pack_inventory_items lottery_pack_inventory_items_lottery_pack_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_pack_inventory_items
    ADD CONSTRAINT lottery_pack_inventory_items_lottery_pack_inventory_id_fkey FOREIGN KEY (lottery_pack_inventory_id) REFERENCES public.lottery_pack_inventory(lottery_pack_inventory_id);


--
-- Name: lottery_pack_inventory_items lottery_pack_inventory_items_pack_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_pack_inventory_items
    ADD CONSTRAINT lottery_pack_inventory_items_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES public.lottery_packs(lottery_pack_id);


--
-- Name: lottery_settings lottery_settings_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_settings
    ADD CONSTRAINT lottery_settings_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: lottery_settlements lottery_settlements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_settlements
    ADD CONSTRAINT lottery_settlements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: lottery_settlements lottery_settlements_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_settlements
    ADD CONSTRAINT lottery_settlements_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: lottery_settlements lottery_settlements_status_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_settlements
    ADD CONSTRAINT lottery_settlements_status_type_id_fkey FOREIGN KEY (status_type_id) REFERENCES public.status_types(status_type_id);


--
-- Name: lottery_settlements lottery_settlements_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lottery_settlements
    ADD CONSTRAINT lottery_settlements_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: module_approval_policies module_approval_policies_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_approval_policies
    ADD CONSTRAINT module_approval_policies_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- Name: module_approval_policies module_approval_policies_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_approval_policies
    ADD CONSTRAINT module_approval_policies_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(module_id);


--
-- Name: module_approval_policies module_approval_policies_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.module_approval_policies
    ADD CONSTRAINT module_approval_policies_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(user_id);


--
-- Name: new_arrivals new_arrivals_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.new_arrivals
    ADD CONSTRAINT new_arrivals_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(department_id);


--
-- Name: new_arrivals new_arrivals_invoice_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.new_arrivals
    ADD CONSTRAINT new_arrivals_invoice_item_id_fkey FOREIGN KEY (invoice_item_id) REFERENCES public.grocery_invoice_items(grocery_invoice_item_id);


--
-- Name: new_arrivals new_arrivals_store_sub_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.new_arrivals
    ADD CONSTRAINT new_arrivals_store_sub_department_id_fkey FOREIGN KEY (store_sub_department_id) REFERENCES public.store_sub_departments(store_sub_department_id);


--
-- Name: product_price_groups price_group_link_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_price_groups
    ADD CONSTRAINT price_group_link_store FOREIGN KEY (price_group_id, dgt_id) REFERENCES public.price_groups(price_group_id, dgt_id);


--
-- Name: product_price_groups price_group_product_store; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_price_groups
    ADD CONSTRAINT price_group_product_store FOREIGN KEY (product_id, dgt_id) REFERENCES public.products(product_id, dgt_id);


--
-- Name: product_barcodes pricebook_barcode_product_store_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_barcodes
    ADD CONSTRAINT pricebook_barcode_product_store_fk FOREIGN KEY (product_id, dgt_id) REFERENCES public.products(product_id, dgt_id);


--
-- Name: inventory pricebook_inventory_product_store_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT pricebook_inventory_product_store_fk FOREIGN KEY (product_id, dgt_id) REFERENCES public.products(product_id, dgt_id);


--
-- Name: product_store_prices pricebook_price_product_store_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_store_prices
    ADD CONSTRAINT pricebook_price_product_store_fk FOREIGN KEY (product_id, dgt_id) REFERENCES public.products(product_id, dgt_id);


--
-- Name: products pricebook_product_department_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT pricebook_product_department_fk FOREIGN KEY (store_sub_department_id, dgt_id) REFERENCES public.store_sub_departments(store_sub_department_id, dgt_id);


--
-- Name: products pricebook_product_store_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT pricebook_product_store_fk FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: store_sub_departments pricebook_subdepartment_store_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_sub_departments
    ADD CONSTRAINT pricebook_subdepartment_store_fk FOREIGN KEY (store_department_id, dgt_id) REFERENCES public.store_departments(store_department_id, dgt_id);


--
-- Name: product_vendors pricebook_vendor_link_product_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_vendors
    ADD CONSTRAINT pricebook_vendor_link_product_fk FOREIGN KEY (product_id, dgt_id) REFERENCES public.products(product_id, dgt_id);


--
-- Name: product_vendors pricebook_vendor_link_vendor_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_vendors
    ADD CONSTRAINT pricebook_vendor_link_vendor_fk FOREIGN KEY (vendor_id, dgt_id) REFERENCES public.vendors(vendor_id, dgt_id);


--
-- Name: vendors pricebook_vendor_store_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendors
    ADD CONSTRAINT pricebook_vendor_store_fk FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: promotion_products promotion_link_store_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_products
    ADD CONSTRAINT promotion_link_store_fk FOREIGN KEY (promotion_id, dgt_id) REFERENCES public.promotions(promotion_id, dgt_id);


--
-- Name: promotion_products promotion_product_store_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_products
    ADD CONSTRAINT promotion_product_store_fk FOREIGN KEY (product_id, dgt_id) REFERENCES public.products(product_id, dgt_id);


--
-- Name: promotions promotions_discount_type_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_discount_type_fk FOREIGN KEY (promotion_type) REFERENCES public.discount_type(promotion_value);


--
-- Name: purchase_order_lines purchase_order_lines_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: purchase_order_lines purchase_order_lines_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_order_lines
    ADD CONSTRAINT purchase_order_lines_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(purchase_order_id);


--
-- Name: purchase_orders purchase_orders_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(user_id);


--
-- Name: purchase_orders purchase_orders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: purchase_orders purchase_orders_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: purchase_orders purchase_orders_vendor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(vendor_id);


--
-- Name: rebate_claim_payments rebate_claim_payments_claim_id_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_claim_payments
    ADD CONSTRAINT rebate_claim_payments_claim_id_dgt_id_fkey FOREIGN KEY (claim_id, dgt_id) REFERENCES public.rebate_claims(claim_id, dgt_id);


--
-- Name: rebate_claim_payments rebate_claim_payments_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_claim_payments
    ADD CONSTRAINT rebate_claim_payments_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: rebate_claim_payments rebate_claim_payments_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_claim_payments
    ADD CONSTRAINT rebate_claim_payments_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(user_id);


--
-- Name: rebate_claims rebate_claims_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_claims
    ADD CONSTRAINT rebate_claims_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);


--
-- Name: rebate_claims rebate_claims_decision_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_claims
    ADD CONSTRAINT rebate_claims_decision_recorded_by_fkey FOREIGN KEY (decision_recorded_by) REFERENCES public.users(user_id);


--
-- Name: rebate_claims rebate_claims_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_claims
    ADD CONSTRAINT rebate_claims_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: rebate_claims rebate_claims_program_id_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_claims
    ADD CONSTRAINT rebate_claims_program_id_dgt_id_fkey FOREIGN KEY (program_id, dgt_id) REFERENCES public.rebate_programs(program_id, dgt_id);


--
-- Name: rebate_claims rebate_claims_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_claims
    ADD CONSTRAINT rebate_claims_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(user_id);


--
-- Name: rebate_program_items rebate_program_items_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_program_items
    ADD CONSTRAINT rebate_program_items_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: rebate_program_items rebate_program_items_product_id_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_program_items
    ADD CONSTRAINT rebate_program_items_product_id_dgt_id_fkey FOREIGN KEY (product_id, dgt_id) REFERENCES public.products(product_id, dgt_id);


--
-- Name: rebate_program_items rebate_program_items_program_id_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_program_items
    ADD CONSTRAINT rebate_program_items_program_id_dgt_id_fkey FOREIGN KEY (program_id, dgt_id) REFERENCES public.rebate_programs(program_id, dgt_id);


--
-- Name: rebate_programs rebate_programs_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_programs
    ADD CONSTRAINT rebate_programs_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: rebate_programs rebate_programs_vendor_id_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rebate_programs
    ADD CONSTRAINT rebate_programs_vendor_id_dgt_id_fkey FOREIGN KEY (vendor_id, dgt_id) REFERENCES public.vendors(vendor_id, dgt_id);


--
-- Name: sale_discount_applications sale_discount_applications_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_discount_applications
    ADD CONSTRAINT sale_discount_applications_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(user_id);


--
-- Name: sale_discount_applications sale_discount_applications_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_discount_applications
    ADD CONSTRAINT sale_discount_applications_confirmed_by_fkey FOREIGN KEY (confirmed_by) REFERENCES public.users(user_id);


--
-- Name: sale_discount_applications sale_discount_applications_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_discount_applications
    ADD CONSTRAINT sale_discount_applications_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: sale_discount_applications sale_discount_applications_discount_id_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_discount_applications
    ADD CONSTRAINT sale_discount_applications_discount_id_dgt_id_fkey FOREIGN KEY (discount_id, dgt_id) REFERENCES public.store_discounts(discount_id, dgt_id);


--
-- Name: sale_discount_applications sale_discount_applications_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_discount_applications
    ADD CONSTRAINT sale_discount_applications_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: sale_discount_applications sale_discount_applications_sale_id_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_discount_applications
    ADD CONSTRAINT sale_discount_applications_sale_id_dgt_id_fkey FOREIGN KEY (sale_id, dgt_id) REFERENCES public.sales(sale_id, store_id);


--
-- Name: store_billing_addons store_billing_addons_addon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_billing_addons
    ADD CONSTRAINT store_billing_addons_addon_id_fkey FOREIGN KEY (addon_id) REFERENCES public.billing_addons(addon_id);


--
-- Name: store_billing_addons store_billing_addons_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_billing_addons
    ADD CONSTRAINT store_billing_addons_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.store_subscriptions(subscription_id) ON DELETE CASCADE;


--
-- Name: store_discounts store_discounts_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_discounts
    ADD CONSTRAINT store_discounts_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: store_discounts store_discounts_discount_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_discounts
    ADD CONSTRAINT store_discounts_discount_type_id_fkey FOREIGN KEY (discount_type_id) REFERENCES public.discount_type(discount_type_id);


--
-- Name: store_role_permissions store_role_permissions_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_role_permissions
    ADD CONSTRAINT store_role_permissions_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: store_role_permissions store_role_permissions_role_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_role_permissions
    ADD CONSTRAINT store_role_permissions_role_type_id_fkey FOREIGN KEY (role_type_id) REFERENCES public.role_types(role_type_id);


--
-- Name: store_role_permissions store_role_permissions_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_role_permissions
    ADD CONSTRAINT store_role_permissions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(user_id);


--
-- Name: stores stores_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(company_id);


--
-- Name: user_login_events user_login_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_login_events
    ADD CONSTRAINT user_login_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: vendor_contacts vendor_contract_discount_type_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_contacts
    ADD CONSTRAINT vendor_contract_discount_type_fk FOREIGN KEY (volume_discount_type) REFERENCES public.discount_type(contract_value);


--
-- Name: vendor_contacts vendor_contract_store_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendor_contacts
    ADD CONSTRAINT vendor_contract_store_fk FOREIGN KEY (vendor_id, dgt_id) REFERENCES public.vendors(vendor_id, dgt_id);


--
-- Name: workforce_availability workforce_availability_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_availability
    ADD CONSTRAINT workforce_availability_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: workforce_availability workforce_availability_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_availability
    ADD CONSTRAINT workforce_availability_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: workforce_availability workforce_availability_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_availability
    ADD CONSTRAINT workforce_availability_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.workforce_requests(request_id);


--
-- Name: workforce_leave_shifts workforce_leave_shifts_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_leave_shifts
    ADD CONSTRAINT workforce_leave_shifts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: workforce_leave_shifts workforce_leave_shifts_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_leave_shifts
    ADD CONSTRAINT workforce_leave_shifts_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.workforce_requests(request_id);


--
-- Name: workforce_leave_shifts workforce_leave_shifts_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_leave_shifts
    ADD CONSTRAINT workforce_leave_shifts_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.employee_schedules(schedule_id);


--
-- Name: workforce_requests workforce_requests_accepted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_requests
    ADD CONSTRAINT workforce_requests_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.users(user_id);


--
-- Name: workforce_requests workforce_requests_dgt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_requests
    ADD CONSTRAINT workforce_requests_dgt_id_fkey FOREIGN KEY (dgt_id) REFERENCES public.stores(dgt_id);


--
-- Name: workforce_requests workforce_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_requests
    ADD CONSTRAINT workforce_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(employee_id);


--
-- Name: workforce_requests workforce_requests_leave_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_requests
    ADD CONSTRAINT workforce_requests_leave_id_fkey FOREIGN KEY (leave_id) REFERENCES public.employee_time_off_requests(time_off_request_id);


--
-- Name: workforce_requests workforce_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_requests
    ADD CONSTRAINT workforce_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(user_id);


--
-- Name: workforce_requests workforce_requests_submitted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_requests
    ADD CONSTRAINT workforce_requests_submitted_by_fkey FOREIGN KEY (submitted_by) REFERENCES public.users(user_id);


--
-- Name: workforce_requests workforce_requests_target_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workforce_requests
    ADD CONSTRAINT workforce_requests_target_employee_id_fkey FOREIGN KEY (target_employee_id) REFERENCES public.employees(employee_id);


--
-- PostgreSQL database dump complete
--



-- Shared application catalogs for fresh installations.
INSERT INTO public.billing_addons (addon_id, code, name, description, monthly_price) OVERRIDING SYSTEM VALUE VALUES (1, 'EXTRA_USER', 'Extra User', 'One additional user seat. User seat limits are pending implementation.', 10.00);
INSERT INTO public.billing_addons (addon_id, code, name, description, monthly_price) OVERRIDING SYSTEM VALUE VALUES (2, 'PAYROLL', 'Payroll Module', 'Payroll subscription add-on. Payroll processing is pending implementation.', 30.00);
INSERT INTO public.billing_addons (addon_id, code, name, description, monthly_price) OVERRIDING SYSTEM VALUE VALUES (3, 'ADVANCED_REPORTS', 'Advanced Reports', 'Advanced reporting subscription add-on. Report screens are pending implementation.', 20.00);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (1, 'Grocery', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (2, 'Beer, Wine & Spirits', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (3, 'Tobacco & Nicotine', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (4, 'Health & Wellness', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (5, 'Pharmacy', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (6, 'Beauty & Personal Care', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (7, 'Baby', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (8, 'Household Essentials', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (9, 'Pet Supplies', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (10, 'Electronics', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (11, 'Home', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (12, 'Clothing & Apparel', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (13, 'Shoes', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (14, 'Jewelry & Accessories', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (15, 'Automotive', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (16, 'Hardware & Home Improvement', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (17, 'Lawn & Garden', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (18, 'Sports & Outdoors', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (19, 'Toys & Games', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (20, 'Office & School Supplies', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (21, 'Books, Movies & Music', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (22, 'Arts, Crafts & Sewing', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (23, 'Party & Celebrations', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (24, 'Seasonal', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (25, 'Travel & Luggage', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (26, 'Convenience / Front End', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (27, 'Lottery', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (28, 'Fuel', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (29, 'Gift Cards & Prepaid', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (30, 'Floral', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (31, 'Photo & Printing', true);
INSERT INTO public.departments (department_id, department_name, is_default) VALUES (32, 'Services', true);
INSERT INTO public.discount_type (discount_type_id, code, name, promotion_value, contract_value, is_active, sort_order) OVERRIDING SYSTEM VALUE VALUES (1, 'PERCENT', 'Percentage', '% Discount', 'PERCENT', true, 1);
INSERT INTO public.discount_type (discount_type_id, code, name, promotion_value, contract_value, is_active, sort_order) OVERRIDING SYSTEM VALUE VALUES (2, 'AMOUNT', 'Amount off ($)', NULL, 'AMOUNT', true, 2);
INSERT INTO public.discount_type (discount_type_id, code, name, promotion_value, contract_value, is_active, sort_order) OVERRIDING SYSTEM VALUE VALUES (3, 'FIXED_PRICE', 'Fixed selling price', 'Fixed Price', NULL, true, 3);
INSERT INTO public.discount_type (discount_type_id, code, name, promotion_value, contract_value, is_active, sort_order) OVERRIDING SYSTEM VALUE VALUES (4, 'BUY_GET', 'Buy X Get Y', 'Buy X Get Y', NULL, true, 4);
INSERT INTO public.discount_type (discount_type_id, code, name, promotion_value, contract_value, is_active, sort_order) OVERRIDING SYSTEM VALUE VALUES (5, 'BUNDLE', 'Bundle price', 'Bundle', NULL, true, 5);
INSERT INTO public.modules (module_id, module_name, submodule_name, description, is_active, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (1, 'STORE_SETTINGS', NULL, NULL, true, '2026-09-11 17:02:39.063901+00', '2026-09-11 17:02:39.063901+00');
INSERT INTO public.modules (module_id, module_name, submodule_name, description, is_active, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (2, 'DEPARTMENTS', NULL, NULL, true, '2026-09-11 17:02:39.063901+00', '2026-09-11 17:02:39.063901+00');
INSERT INTO public.modules (module_id, module_name, submodule_name, description, is_active, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (3, 'PRICE_BOOK', NULL, 'Store-specific item catalog', true, '2026-09-12 14:08:18.866432+00', '2026-09-12 14:08:18.866432+00');
INSERT INTO public.role_types (role_type_id, role_type_name, description, is_active, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (1, 'ADMIN', NULL, true, '2026-09-11 17:02:39.063901+00', '2026-09-11 17:02:39.063901+00');
INSERT INTO public.role_types (role_type_id, role_type_name, description, is_active, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (2, 'MANAGER', NULL, true, '2026-09-11 17:02:39.063901+00', '2026-09-11 17:02:39.063901+00');
INSERT INTO public.role_types (role_type_id, role_type_name, description, is_active, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (3, 'CASHIER', NULL, true, '2026-09-11 17:02:39.063901+00', '2026-09-11 17:02:39.063901+00');
INSERT INTO public.role_types (role_type_id, role_type_name, description, is_active, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (4, 'ACCOUNTANT', NULL, true, '2026-09-11 17:02:39.063901+00', '2026-09-11 17:02:39.063901+00');
INSERT INTO public.status_types (status_type_id, status_name) VALUES (1, 'APPROVED');
INSERT INTO public.status_types (status_type_id, status_name) VALUES (2, 'CANCELLED');
INSERT INTO public.status_types (status_type_id, status_name) VALUES (3, 'REJECTED');
INSERT INTO public.status_types (status_type_id, status_name) VALUES (4, 'PENDING');
INSERT INTO public.subscription_plans (subscription_plan_id, plan_name, monthly_price, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (1, 'Basic', 60.00, '2026-09-11 19:16:06.303939+00', '2026-09-11 19:16:06.303939+00');
INSERT INTO public.subscription_plans (subscription_plan_id, plan_name, monthly_price, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (2, 'Modern', 90.00, '2026-09-11 19:16:06.303939+00', '2026-09-11 19:16:06.303939+00');
INSERT INTO public.subscription_plans (subscription_plan_id, plan_name, monthly_price, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES (3, 'Advanced', 120.00, '2026-09-11 19:16:06.303939+00', '2026-09-11 19:16:06.303939+00');
SELECT pg_catalog.setval('public.billing_addons_addon_id_seq', 3, true);
SELECT pg_catalog.setval('public.departments_department_id_seq', 32, true);
SELECT pg_catalog.setval('public.discount_type_discount_type_id_seq', 5, true);
SELECT pg_catalog.setval('public.fuel_grades_fuel_grade_id_seq', 1, false);
SELECT pg_catalog.setval('public.modules_module_id_seq', 3, true);
SELECT pg_catalog.setval('public.role_types_role_type_id_seq', 4, true);
SELECT pg_catalog.setval('public.status_types_status_type_id_seq', 4, true);
SELECT pg_catalog.setval('public.subscription_plans_subscription_plan_id_seq', 3, true);
SELECT pg_catalog.setval('public.tender_types_tender_type_id_seq', 1, false);
