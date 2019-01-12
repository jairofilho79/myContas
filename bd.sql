CREATE SCHEMA IF NOT EXISTS `minhascontas`;

USE `minhascontas`;

CREATE TABLE IF NOT EXISTS `Usuario`
  (
      user_id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      senha VARCHAR(255) NOT NULL,
      sexo TINYINT NOT NULL,
      criacao DATE NOT NULL
  );

CREATE TABLE IF NOT EXISTS `Fonte_dinheiro`
(
    ftd_id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    valor DECIMAL(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS `Categoria`
(
    cat_id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS `Meio_pagamento`
(
    mpg_id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS `Lancamento`
(
    tsc_id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    a_pagar TINYINT NOT NULL,
    data_pag DATE NOT NULL,
    comentario VARCHAR(255),
    cat_id BIGINT NOT NULL,
    ftd_id BIGINT NOT NULL,
    agente VARCHAR(255) NOT NULL,
    mpg_id BIGINT NOT NULL,
    status TINYINT NOT NULL,
    criacao DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS `Fixo`
(
    f_id SERIAL PRIMARY KEY,
    tsc_id BIGINT NOT NULL,
    status TINYINT NOT NULL
);

INSERT INTO `Usuario` (nome,email,senha,sexo,criacao) VALUES ('Jairo Filho','jairofilho79@gmail.com','jairofilho',1,'2019-01-01');

INSERT INTO `Fonte_dinheiro` (user_id,nome,valor) VALUES (1,'Banco',0);
INSERT INTO `Fonte_dinheiro` (user_id,nome,valor) VALUES (1,'Baú',0);

INSERT INTO `Categoria` (nome) VALUES ('Compra');
INSERT INTO `Categoria` (nome) VALUES ('Empréstimo');
INSERT INTO `Categoria` (nome) VALUES ('Venda');
INSERT INTO `Categoria` (nome) VALUES ('Doação');
INSERT INTO `Categoria` (nome) VALUES ('Salário');

INSERT INTO `Meio_pagamento` (nome) VALUES ('Débito');
INSERT INTO `Meio_pagamento` (nome) VALUES ('Dinheiro');

--Open the MySQL command line.
--Type the path of your mysql bin directory and press Enter.
--Paste your SQL file inside the bin folder of mysql server.
--Create a database in MySQL.
--Use that particular database where you want to import the SQL file.
--Type source databasefilename.sql and Enter.
--Your SQL file upload successfully.