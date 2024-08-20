-- dropping tables
drop table interested_in_gender;
drop table interested_in_relation;
drop table relationship_type;
drop table user_photo;
drop table gender;
drop table message;
drop table participant;
drop table conversation;
drop table users;

-- dropping sequences
drop sequence users_id_seq;
drop sequence gender_id_seq;
drop sequence interested_in_relation_id_seq;
drop sequence interested_in_gender_id_seq;
drop sequence interested_int_gender_id_seq;
drop sequence relationship_type_id_seq;
drop sequence user_photo_id_seq;
drop sequence participant_id_seq;
drop sequence message_id_seq;
drop sequence conversation_id_seq;

-- creating sequences
Create sequences if they do not exist
DO $$ 
BEGIN
    CREATE SEQUENCE IF NOT EXISTS users_id_seq;
    CREATE SEQUENCE IF NOT EXISTS gender_id_seq;
    CREATE SEQUENCE IF NOT EXISTS interested_in_gender_id_seq;
    CREATE SEQUENCE IF NOT EXISTS interested_in_relation_id_seq;
    CREATE SEQUENCE IF NOT EXISTS relationship_type_id_seq;
    CREATE SEQUENCE IF NOT EXISTS user_photo_id_seq;
    CREATE SEQUENCE IF NOT EXISTS conversation_id_seq;
    CREATE SEQUENCE IF NOT EXISTS participant_id_seq;
    CREATE SEQUENCE IF NOT EXISTS message_id_seq;
EXCEPTION 
    WHEN duplicate_table THEN 
        -- Sequences already exist, no action needed
        NULL;
END $$;

-- Create tables

CREATE TABLE IF NOT EXISTS public.users
(
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    firstname character varying(15) COLLATE pg_catalog."default",
    lastname character varying(15) COLLATE pg_catalog."default",
    email character varying(100) COLLATE pg_catalog."default",
    famerate numeric(5,2),
    password character varying(64) COLLATE pg_catalog."default",
    aboutme character varying(100) COLLATE pg_catalog."default",
    username character varying(50) COLLATE pg_catalog."default",
    auth_provider character varying(100) COLLATE pg_catalog."default",
    provider_id character varying(255) COLLATE pg_catalog."default",
    birthday Date,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT unique_email UNIQUE (email)
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public.gender
(
    id integer NOT NULL DEFAULT nextval('gender_id_seq'::regclass),
    name character varying(32) COLLATE pg_catalog."default",
    CONSTRAINT gender_pkey PRIMARY KEY (id)
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.gender
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public.relationship_type
(
    id integer NOT NULL DEFAULT nextval('relationship_type_id_seq'::regclass),
    name character varying(32) COLLATE pg_catalog."default",
    CONSTRAINT relationship_type_pkey PRIMARY KEY (id)
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.relationship_type
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public.interested_in_gender
(
    id integer NOT NULL DEFAULT nextval('interested_in_gender_id_seq'::regclass),
    user_id integer,
    gender_id integer,
    CONSTRAINT interested_in_gender_pkey PRIMARY KEY (id),
    CONSTRAINT fk_gender FOREIGN KEY (gender_id)
        REFERENCES public.gender (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.interested_in_gender
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public.interested_in_relation
(
    id integer NOT NULL DEFAULT nextval('interested_in_relation_id_seq'::regclass),
    user_id integer,
    relationship_type_id integer,
    CONSTRAINT interested_in_relation_pkey PRIMARY KEY (id),
    CONSTRAINT fk_relationship_type FOREIGN KEY (relationship_type_id)
        REFERENCES public.relationship_type (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.interested_in_relation
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public.user_photo
(
    id integer NOT NULL DEFAULT nextval('user_photo_id_seq'::regclass),
    user_id integer,
    photo_url character varying(255) COLLATE pg_catalog."default",
    upload_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    active boolean,
    CONSTRAINT user_photo_pkey PRIMARY KEY (id),
    CONSTRAINT fk_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.user_photo
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public.conversation
(
    id integer NOT NULL DEFAULT nextval('conversation_id_seq'::regclass),
    user_id integer,
    time_started timestamp,
    time_ended timestamp,
        CONSTRAINT conversation_pkey PRIMARY KEY (id),
        CONSTRAINT fk_user FOREIGN KEY (user_id)
            REFERENCES public.users (id) MATCH SIMPLE
            ON UPDATE NO ACTION
            ON DELETE NO ACTION
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.conversation
    OWNER to postgres;


CREATE TABLE IF NOT EXISTS public.participant
(
    id integer NOT NULL DEFAULT nextval('participant_id_seq'::regclass),
    user_id integer,
    conversation_id integer,
    time_joined timestamp,
    time_left timestamp,
        CONSTRAINT participant_pkey PRIMARY KEY (id),
	    CONSTRAINT fk_user FOREIGN KEY (user_id)
	        REFERENCES public.users (id) MATCH SIMPLE
	        ON UPDATE NO ACTION
	        ON DELETE NO ACTION,
	    CONSTRAINT fk_conversation FOREIGN KEY (conversation_id)
	        REFERENCES public.conversation (id) MATCH SIMPLE
	        ON UPDATE NO ACTION
	        ON DELETE NO ACTION
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.participant
    OWNER to postgres;


CREATE TABLE IF NOT EXISTS public.message
(
    id integer NOT NULL DEFAULT nextval('message_id_seq'::regclass),
    participant_id integer,
    message_text text,
    ts timestamp,
        CONSTRAINT message_pkey PRIMARY KEY (id),
        CONSTRAINT fk_user FOREIGN KEY (participant_id)
            REFERENCES public.participant (id) MATCH SIMPLE
            ON UPDATE NO ACTION
            ON DELETE NO ACTION
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.message
    OWNER to postgres;

