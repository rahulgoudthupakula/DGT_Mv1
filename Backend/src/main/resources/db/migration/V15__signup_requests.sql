CREATE TABLE public.signup_requests (
 request_id uuid PRIMARY KEY,
 first_name varchar(100) NOT NULL,
 last_name varchar(100) NOT NULL,
 email varchar(254) NOT NULL,
 phone varchar(40) NOT NULL,
 business_name varchar(200) NOT NULL,
 store_name varchar(200) NOT NULL,
 store_code varchar(100) NOT NULL,
 status varchar(20) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW','APPROVED','REJECTED')),
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX signup_requests_pending_email ON public.signup_requests(lower(email)) WHERE status='PENDING_REVIEW';
