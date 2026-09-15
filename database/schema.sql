-- ========================================
-- 1. Tipos customizados (ENUMs)
-- ========================================
CREATE TYPE status_entidade AS ENUM ('ativa', 'inativa');
CREATE TYPE tipo_servico_transporte AS ENUM ('urbano', 'intermunicipal', 'fretamento');
CREATE TYPE status_inspecao AS ENUM ('agendada', 'em_andamento', 'concluida');
CREATE TYPE severidade_nc AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE status_nc AS ENUM ('aberta', 'corrigida', 'vencida');

-- ========================================
-- 2. Entidades fiscalizadas (as empresas)
-- ========================================
CREATE TABLE entidades_fiscalizadas (
    id SERIAL PRIMARY KEY,
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    tipo_servico tipo_servico_transporte NOT NULL,
    status status_entidade NOT NULL DEFAULT 'ativa',
    data_cadastro TIMESTAMP NOT NULL DEFAULT now()
);

-- ========================================
-- 3. Normas de conformidade (o checklist regulatório)
-- ========================================
CREATE TABLE normas_conformidade (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    severidade_padrao severidade_nc NOT NULL DEFAULT 'media'
);

-- ========================================
-- 4. Inspeções (o evento de fiscalização)
-- ========================================
CREATE TABLE inspecoes (
    id SERIAL PRIMARY KEY,
    entidade_id INTEGER NOT NULL REFERENCES entidades_fiscalizadas(id),
    fiscal_responsavel VARCHAR(100) NOT NULL,
    data_inspecao DATE NOT NULL,
    status status_inspecao NOT NULL DEFAULT 'agendada'
);

-- ========================================
-- 5. Não-conformidades (os achados de uma inspeção)
-- ========================================
CREATE TABLE nao_conformidades (
    id SERIAL PRIMARY KEY,
    inspecao_id INTEGER NOT NULL REFERENCES inspecoes(id),
    norma_id INTEGER NOT NULL REFERENCES normas_conformidade(id),
    descricao_achado TEXT NOT NULL,
    severidade severidade_nc NOT NULL,
    prazo_correcao DATE,
    status status_nc NOT NULL DEFAULT 'aberta'
);