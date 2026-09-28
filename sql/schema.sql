-- Schema sugerido para la base de datos MySQL (RDS)
-- Ejecutar una sola vez en tu instancia RDS.

CREATE DATABASE IF NOT EXISTS appointments
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE appointments;

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id   VARCHAR(36)  NOT NULL PRIMARY KEY,
  insured_id       VARCHAR(5)   NOT NULL,
  schedule_id      INT          NOT NULL,
  country_iso      CHAR(2)      NOT NULL COMMENT 'PE | CL',
  status           VARCHAR(20)  NOT NULL DEFAULT 'registered',
  center_id        INT          NULL,
  specialty_id     INT          NULL,
  medic_id         INT          NULL,
  appointment_date DATETIME     NULL,
  created_at       DATETIME     NOT NULL,
  updated_at       DATETIME     NOT NULL,
  INDEX idx_insured_id (insured_id),
  INDEX idx_country_iso (country_iso),
  INDEX idx_schedule_id (schedule_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
