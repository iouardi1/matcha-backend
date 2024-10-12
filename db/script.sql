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
drop sequence relationship_type_id_seq;
drop sequence user_photo_id_seq;
drop sequence participant_id_seq;
drop sequence message_id_seq;
drop sequence conversation_id_seq;
drop sequence interests_id_seq;

-- Sequences

CREATE SEQUENCE IF NOT EXISTS public.conversation_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE public.conversation_id_seq
    OWNER TO postgres;

CREATE SEQUENCE IF NOT EXISTS public.gender_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE public.gender_id_seq
    OWNER TO postgres;

CREATE SEQUENCE IF NOT EXISTS public.interested_in_gender_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE public.interested_in_gender_id_seq
    OWNER TO postgres;

CREATE SEQUENCE IF NOT EXISTS public.interested_in_relation_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE public.interested_in_relation_id_seq
    OWNER TO postgres;

CREATE SEQUENCE IF NOT EXISTS public.interests_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.interests_id_seq
    OWNER TO postgres;

CREATE SEQUENCE IF NOT EXISTS public.message_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE public.message_id_seq
    OWNER TO postgres;

CREATE SEQUENCE IF NOT EXISTS public.participant_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE public.participant_id_seq
    OWNER TO postgres;

CREATE SEQUENCE IF NOT EXISTS public.relationship_type_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE public.relationship_type_id_seq
    OWNER TO postgres;

CREATE SEQUENCE IF NOT EXISTS public.user_photo_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE public.user_photo_id_seq
    OWNER TO postgres;

CREATE SEQUENCE IF NOT EXISTS public.users_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 9223372036854775807
    CACHE 1;

ALTER SEQUENCE public.users_id_seq
    OWNER TO postgres;

CREATE SEQUENCE IF NOT EXISTS public.user_matches_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.user_matches_id_seq
    OWNER TO postgres;

CREATE SEQUENCE IF NOT EXISTS public.user_likes_id_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE public.user_likes_id_seq
    OWNER TO postgres;

-- Tables

CREATE TABLE IF NOT EXISTS public.gender
(
    id integer NOT NULL DEFAULT nextval('gender_id_seq'::regclass),
    name character varying(32) COLLATE pg_catalog."default",
    CONSTRAINT gender_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.gender
    OWNER to postgres;

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
    birthday date,
    gender_id integer,
    verified_account boolean DEFAULT false,
    setup_finished boolean DEFAULT false,
    verification_token character varying(255) COLLATE pg_catalog."default",
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT unique_email UNIQUE (email),
    CONSTRAINT gender_id FOREIGN KEY (gender_id)
        REFERENCES public.gender (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public.conversation
(
    id integer NOT NULL DEFAULT nextval('conversation_id_seq'::regclass),
    user_id integer,
    time_started timestamp without time zone,
    time_ended timestamp without time zone,
    CONSTRAINT conversation_pkey PRIMARY KEY (id),
    CONSTRAINT fk_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.conversation
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

CREATE TABLE IF NOT EXISTS public.interests
(
    id integer NOT NULL DEFAULT nextval('interests_id_seq'::regclass),
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT interests_pkey PRIMARY KEY (id),
    CONSTRAINT interests_name_key UNIQUE (name)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.interests
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public.message
(
    id integer NOT NULL DEFAULT nextval('message_id_seq'::regclass),
    participant_id integer,
    message_text text COLLATE pg_catalog."default",
    ts timestamp without time zone,
    CONSTRAINT message_pkey PRIMARY KEY (id),
    CONSTRAINT fk_user FOREIGN KEY (participant_id)
        REFERENCES public.participant (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.message
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public.participant
(
    id integer NOT NULL DEFAULT nextval('participant_id_seq'::regclass),
    user_id integer,
    conversation_id integer,
    time_joined timestamp without time zone,
    time_left timestamp without time zone,
    CONSTRAINT participant_pkey PRIMARY KEY (id),
    CONSTRAINT fk_conversation FOREIGN KEY (conversation_id)
        REFERENCES public.conversation (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT fk_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.participant
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

CREATE TABLE IF NOT EXISTS public.user_interests
(
    user_id integer NOT NULL,
    interest_id integer NOT NULL,
    CONSTRAINT user_interests_pkey PRIMARY KEY (user_id, interest_id),
    CONSTRAINT user_interests_interest_id_fkey FOREIGN KEY (interest_id)
        REFERENCES public.interests (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT user_interests_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.user_interests
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

CREATE TABLE IF NOT EXISTS public.user_likes
(
    id integer NOT NULL DEFAULT nextval('user_likes_id_seq'::regclass),
    liker_id integer NOT NULL,
    liked_user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_likes_pkey PRIMARY KEY (id),
    CONSTRAINT user_likes_liker_id_liked_user_id_key UNIQUE (liker_id, liked_user_id),
    CONSTRAINT fk_liked_user FOREIGN KEY (liked_user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_liker FOREIGN KEY (liker_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.user_likes
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public.user_matches
(
    id integer NOT NULL DEFAULT nextval('user_matches_id_seq'::regclass),
    user1_id integer NOT NULL,
    user2_id integer NOT NULL,
    matched_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_matches_pkey PRIMARY KEY (id),
    CONSTRAINT user_matches_user1_id_user2_id_key UNIQUE (user1_id, user2_id),
    CONSTRAINT fk_user1 FOREIGN KEY (user1_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT fk_user2 FOREIGN KEY (user2_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT check_user_order CHECK (user1_id < user2_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.user_matches
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public.notification
(
    id integer NOT NULL DEFAULT nextval('notification_id_seq'::regclass),
    senderid character varying COLLATE pg_catalog."default" NOT NULL,
    receiverid character varying COLLATE pg_catalog."default" NOT NULL,
    type character varying COLLATE pg_catalog."default" NOT NULL,
    read boolean DEFAULT false,
    interactedwith boolean DEFAULT false,
    createdat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updatedat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notification_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.notification
    OWNER to postgres;

    -- INSERT INTO gender (name)
-- VALUES ('Man'), ('Woman')

-- insert into relationship_type (name) values ('long term relationship'), ('casual'), ('short term relationship'), ('still figuring out')

-- INSERT INTO public.interests(
--     id, name)
--     VALUES (1,'Music'),
--     (2,'Travel'),
--     (3,'Reading'),
--     (4,'Sport'),
--     (5,'Movies'),
--     (6,'Art'),
--     (7,'Technology'),
--     (8,'Chess')

-- CREATE TABLE user_likes (
--     id SERIAL PRIMARY KEY,
--     liker_id INT NOT NULL,
--     liked_user_id INT NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     -- Ensure liker_id cannot like the same user multiple times
--     UNIQUE (liker_id, liked_user_id),
--     -- Foreign key to the users table (liker)
--     CONSTRAINT fk_liker
--       FOREIGN KEY (liker_id) 
--       REFERENCES users(id)
--       ON DELETE CASCADE,
--     -- Foreign key to the users table (liked user)
--     CONSTRAINT fk_liked_user
--       FOREIGN KEY (liked_user_id) 
--       REFERENCES users(id)
--       ON DELETE CASCADE
-- );


-- CREATE TABLE user_matches (
--     id SERIAL PRIMARY KEY,
--     user1_id INT NOT NULL,
--     user2_id INT NOT NULL,
--     matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     -- Ensure each match is unique between two users
--     UNIQUE (user1_id, user2_id),
--     -- Foreign key for user1
--     CONSTRAINT fk_user1
--       FOREIGN KEY (user1_id) 
--       REFERENCES users(id)
--       ON DELETE CASCADE,
--     -- Foreign key for user2
--     CONSTRAINT fk_user2
--       FOREIGN KEY (user2_id) 
--       REFERENCES users(id)
--       ON DELETE CASCADE,
-- );

-- CREATE TABLE Notification (
--   id SERIAL PRIMARY KEY,
--   senderId VARCHAR NOT NULL,
--   receiverId VARCHAR NOT NULL,
--   type VARCHAR NOT NULL,
--   read BOOLEAN DEFAULT FALSE,
--   interactedWith BOOLEAN DEFAULT FALSE,
--   createdAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
--   updatedAt TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
-- );