--
-- PostgreSQL database dump
--

\restrict 34UDlPz1GkVbYGijSfFUCVxlRLkFTPB29ZOUtiRcOT2mrBUm8ywUrxR5JWgzI2Z

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 16.13 (Debian 16.13-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: estadoenvio; Type: TYPE; Schema: public; Owner: slogs
--

CREATE TYPE public.estadoenvio AS ENUM (
    'PENDIENTE',
    'EN_TRANSITO',
    'ENTREGADO',
    'CANCELADO'
);


ALTER TYPE public.estadoenvio OWNER TO slogs;

--
-- Name: tipobodega; Type: TYPE; Schema: public; Owner: slogs
--

CREATE TYPE public.tipobodega AS ENUM (
    'NACIONAL',
    'INTERNACIONAL'
);


ALTER TYPE public.tipobodega OWNER TO slogs;

--
-- Name: tipopuerto; Type: TYPE; Schema: public; Owner: slogs
--

CREATE TYPE public.tipopuerto AS ENUM (
    'NACIONAL',
    'INTERNACIONAL'
);


ALTER TYPE public.tipopuerto OWNER TO slogs;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: slogs
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO slogs;

--
-- Name: bodegas; Type: TABLE; Schema: public; Owner: slogs
--

CREATE TABLE public.bodegas (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    ciudad character varying(100) NOT NULL,
    direccion character varying(255) NOT NULL,
    capacidad integer NOT NULL,
    tipo public.tipobodega NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bodegas OWNER TO slogs;

--
-- Name: bodegas_id_seq; Type: SEQUENCE; Schema: public; Owner: slogs
--

CREATE SEQUENCE public.bodegas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bodegas_id_seq OWNER TO slogs;

--
-- Name: bodegas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: slogs
--

ALTER SEQUENCE public.bodegas_id_seq OWNED BY public.bodegas.id;


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: slogs
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    nit character varying(20) NOT NULL,
    email character varying(255) NOT NULL,
    telefono character varying(20) NOT NULL,
    direccion character varying(255) NOT NULL,
    ciudad character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.clientes OWNER TO slogs;

--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: slogs
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_id_seq OWNER TO slogs;

--
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: slogs
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- Name: envios_maritimos; Type: TABLE; Schema: public; Owner: slogs
--

CREATE TABLE public.envios_maritimos (
    id integer NOT NULL,
    numero_guia character varying(10) NOT NULL,
    cliente_id integer NOT NULL,
    producto_id integer NOT NULL,
    puerto_id integer NOT NULL,
    cantidad integer NOT NULL,
    fecha_registro date NOT NULL,
    fecha_entrega date NOT NULL,
    precio_envio numeric(12,2) NOT NULL,
    descuento_pct numeric(4,2) NOT NULL,
    precio_final numeric(12,2) NOT NULL,
    numero_flota character varying(8) NOT NULL,
    estado public.estadoenvio NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.envios_maritimos OWNER TO slogs;

--
-- Name: envios_maritimos_id_seq; Type: SEQUENCE; Schema: public; Owner: slogs
--

CREATE SEQUENCE public.envios_maritimos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.envios_maritimos_id_seq OWNER TO slogs;

--
-- Name: envios_maritimos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: slogs
--

ALTER SEQUENCE public.envios_maritimos_id_seq OWNED BY public.envios_maritimos.id;


--
-- Name: envios_terrestres; Type: TABLE; Schema: public; Owner: slogs
--

CREATE TABLE public.envios_terrestres (
    id integer NOT NULL,
    numero_guia character varying(10) NOT NULL,
    cliente_id integer NOT NULL,
    producto_id integer NOT NULL,
    bodega_id integer NOT NULL,
    cantidad integer NOT NULL,
    fecha_registro date NOT NULL,
    fecha_entrega date NOT NULL,
    precio_envio numeric(12,2) NOT NULL,
    descuento_pct numeric(4,2) NOT NULL,
    precio_final numeric(12,2) NOT NULL,
    placa character varying(6) NOT NULL,
    estado public.estadoenvio NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.envios_terrestres OWNER TO slogs;

--
-- Name: envios_terrestres_id_seq; Type: SEQUENCE; Schema: public; Owner: slogs
--

CREATE SEQUENCE public.envios_terrestres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.envios_terrestres_id_seq OWNER TO slogs;

--
-- Name: envios_terrestres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: slogs
--

ALTER SEQUENCE public.envios_terrestres_id_seq OWNED BY public.envios_terrestres.id;


--
-- Name: productos; Type: TABLE; Schema: public; Owner: slogs
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion text,
    categoria character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.productos OWNER TO slogs;

--
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: slogs
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_seq OWNER TO slogs;

--
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: slogs
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- Name: puertos; Type: TABLE; Schema: public; Owner: slogs
--

CREATE TABLE public.puertos (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    ciudad character varying(100) NOT NULL,
    pais character varying(100) NOT NULL,
    codigo character varying(10) NOT NULL,
    tipo public.tipopuerto NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.puertos OWNER TO slogs;

--
-- Name: puertos_id_seq; Type: SEQUENCE; Schema: public; Owner: slogs
--

CREATE SEQUENCE public.puertos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.puertos_id_seq OWNER TO slogs;

--
-- Name: puertos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: slogs
--

ALTER SEQUENCE public.puertos_id_seq OWNED BY public.puertos.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: slogs
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    hashed_password character varying(255) NOT NULL,
    nombre character varying(100) NOT NULL,
    rol character varying(50) NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO slogs;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: slogs
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO slogs;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: slogs
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: bodegas id; Type: DEFAULT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.bodegas ALTER COLUMN id SET DEFAULT nextval('public.bodegas_id_seq'::regclass);


--
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- Name: envios_maritimos id; Type: DEFAULT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.envios_maritimos ALTER COLUMN id SET DEFAULT nextval('public.envios_maritimos_id_seq'::regclass);


--
-- Name: envios_terrestres id; Type: DEFAULT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.envios_terrestres ALTER COLUMN id SET DEFAULT nextval('public.envios_terrestres_id_seq'::regclass);


--
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- Name: puertos id; Type: DEFAULT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.puertos ALTER COLUMN id SET DEFAULT nextval('public.puertos_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: bodegas bodegas_pkey; Type: CONSTRAINT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.bodegas
    ADD CONSTRAINT bodegas_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: envios_maritimos envios_maritimos_pkey; Type: CONSTRAINT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.envios_maritimos
    ADD CONSTRAINT envios_maritimos_pkey PRIMARY KEY (id);


--
-- Name: envios_terrestres envios_terrestres_pkey; Type: CONSTRAINT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.envios_terrestres
    ADD CONSTRAINT envios_terrestres_pkey PRIMARY KEY (id);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: puertos puertos_pkey; Type: CONSTRAINT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.puertos
    ADD CONSTRAINT puertos_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_clientes_nit; Type: INDEX; Schema: public; Owner: slogs
--

CREATE UNIQUE INDEX ix_clientes_nit ON public.clientes USING btree (nit);


--
-- Name: ix_envios_maritimos_numero_guia; Type: INDEX; Schema: public; Owner: slogs
--

CREATE UNIQUE INDEX ix_envios_maritimos_numero_guia ON public.envios_maritimos USING btree (numero_guia);


--
-- Name: ix_envios_terrestres_numero_guia; Type: INDEX; Schema: public; Owner: slogs
--

CREATE UNIQUE INDEX ix_envios_terrestres_numero_guia ON public.envios_terrestres USING btree (numero_guia);


--
-- Name: ix_puertos_codigo; Type: INDEX; Schema: public; Owner: slogs
--

CREATE UNIQUE INDEX ix_puertos_codigo ON public.puertos USING btree (codigo);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: slogs
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: envios_maritimos envios_maritimos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.envios_maritimos
    ADD CONSTRAINT envios_maritimos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: envios_maritimos envios_maritimos_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.envios_maritimos
    ADD CONSTRAINT envios_maritimos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: envios_maritimos envios_maritimos_puerto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.envios_maritimos
    ADD CONSTRAINT envios_maritimos_puerto_id_fkey FOREIGN KEY (puerto_id) REFERENCES public.puertos(id);


--
-- Name: envios_terrestres envios_terrestres_bodega_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.envios_terrestres
    ADD CONSTRAINT envios_terrestres_bodega_id_fkey FOREIGN KEY (bodega_id) REFERENCES public.bodegas(id);


--
-- Name: envios_terrestres envios_terrestres_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.envios_terrestres
    ADD CONSTRAINT envios_terrestres_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: envios_terrestres envios_terrestres_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: slogs
--

ALTER TABLE ONLY public.envios_terrestres
    ADD CONSTRAINT envios_terrestres_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 34UDlPz1GkVbYGijSfFUCVxlRLkFTPB29ZOUtiRcOT2mrBUm8ywUrxR5JWgzI2Z

