--
-- PostgreSQL database dump
--

\restrict mvieodcoeeVKnDQZxGdjQ14QO7eHuQ52aGT8hK6L6odqslEr9qWuHcbuFA3fDPx

-- Dumped from database version 17.11 (Debian 17.11-1.pgdg13+2)
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

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


SET default_tablespace = '';

SET default_table_access_method = heap;

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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
-- Name: daily_closing_deposits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_closing_deposits (
    deposit_id bigint NOT NULL,
    everyday_closing_id bigint NOT NULL,
    deposit_date date NOT NULL,
    bank_account_id bigint NOT NULL,
    amount numeric(12,2) NOT NULL,
    receipt_url text,
    deposited_by bigint NOT NULL,
    status character varying(30) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    role_type_id bigint NOT NULL,
    CONSTRAINT chk_employee_store_assignment_dates CHECK (((effective_to IS NULL) OR (effective_to >= effective_from)))
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
    user_id bigint NOT NULL,
    CONSTRAINT chk_employee_dates CHECK (((termination_date IS NULL) OR (termination_date >= hire_date)))
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


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
    product_id bigint NOT NULL,
    movement_type character varying(30) NOT NULL,
    qty_changed numeric(12,3) NOT NULL,
    unit_cost numeric(12,2) DEFAULT 0 NOT NULL,
    reference_id bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_inventory_movements_unit_cost CHECK ((unit_cost >= (0)::numeric))
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    purchase_order_id bigint
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    CONSTRAINT chk_product_vendors_unit_cost CHECK ((unit_cost >= (0)::numeric))
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
    is_ebt boolean DEFAULT false NOT NULL
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    CONSTRAINT chk_promotions_dates CHECK ((end_date >= start_date)),
    CONSTRAINT chk_promotions_discount_value CHECK (((discount_value IS NULL) OR (discount_value >= (0)::numeric)))
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
-- Name: store_business_hours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_business_hours (
    business_hours_id bigint NOT NULL,
    dgt_id character varying(50) NOT NULL,
    day_of_week character varying(10) NOT NULL,
    open_time time without time zone NOT NULL,
    close_time time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
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
    department_id bigint NOT NULL,
    store_department_name character varying(150) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    source_type character varying(20) DEFAULT 'DEFAULT'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
-- Name: store_sub_departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_sub_departments (
    store_sub_department_id bigint NOT NULL,
    store_department_id bigint NOT NULL,
    store_sub_department_name character varying(150) NOT NULL,
    is_taxable boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
    license_number character varying(100) NOT NULL
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
    force_end_date date
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
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (brand_id);


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
-- Name: employee_compensation employee_compensation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_compensation
    ADD CONSTRAINT employee_compensation_pkey PRIMARY KEY (compensation_id);


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
-- Name: grocery_invoice_items grocery_invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grocery_invoice_items
    ADD CONSTRAINT grocery_invoice_items_pkey PRIMARY KEY (grocery_invoice_item_id);


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
-- Name: price_groups price_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_groups
    ADD CONSTRAINT price_groups_pkey PRIMARY KEY (price_group_id);


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
-- Name: promotion_products promotion_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_products
    ADD CONSTRAINT promotion_products_pkey PRIMARY KEY (promotion_product_id);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (promotion_id);


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
-- Name: store_departments store_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_departments
    ADD CONSTRAINT store_departments_pkey PRIMARY KEY (store_department_id);


--
-- Name: store_sub_departments store_sub_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_sub_departments
    ADD CONSTRAINT store_sub_departments_pkey PRIMARY KEY (store_sub_department_id);


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
-- Name: product_barcodes uq_product_barcode_value; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_barcodes
    ADD CONSTRAINT uq_product_barcode_value UNIQUE (product_barcode_value);


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
-- Name: products uq_products_sku; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT uq_products_sku UNIQUE (product_sku);


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
-- Name: daily_closing_tenders daily_closing_tenders_everyday_closing_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_closing_tenders
    ADD CONSTRAINT daily_closing_tenders_everyday_closing_id_fkey FOREIGN KEY (everyday_closing_id) REFERENCES public.everyday_closing(everyday_closing_id);


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
-- PostgreSQL database dump complete
--

\unrestrict mvieodcoeeVKnDQZxGdjQ14QO7eHuQ52aGT8hK6L6odqslEr9qWuHcbuFA3fDPx
