-- ========================================
-- Novo tipo: tipo de veículo
-- ========================================
CREATE TYPE tipo_veiculo AS ENUM ('onibus', 'micro_onibus', 'van', 'taxi');

-- ========================================
-- Nova tabela: veículos
-- ========================================
CREATE TABLE veiculos (
    id SERIAL PRIMARY KEY,
    entidade_id INTEGER NOT NULL REFERENCES entidades_fiscalizadas(id),
    placa VARCHAR(8) NOT NULL UNIQUE,
    tipo_veiculo tipo_veiculo NOT NULL,
    numero_servico VARCHAR(50) NOT NULL,
    status status_entidade NOT NULL DEFAULT 'ativa'
);

-- ========================================
-- Ligando não-conformidades a um veículo específico (opcional)
-- ========================================
ALTER TABLE nao_conformidades ADD COLUMN veiculo_id INTEGER REFERENCES veiculos(id);