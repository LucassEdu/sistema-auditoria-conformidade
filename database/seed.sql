-- ========================================
-- Entidades fiscalizadas (empresas de transporte)
-- ========================================
INSERT INTO entidades_fiscalizadas (razao_social, cnpj, tipo_servico, status) VALUES
('Viação Rio Negro LTDA', '12.345.678/0001-90', 'intermunicipal', 'ativa'),
('Transporte Solimões S.A.', '23.456.789/0001-01', 'intermunicipal', 'ativa'),
('Urbano Manaus Transportes', '34.567.890/0001-12', 'urbano', 'ativa'),
('Fretamento Amazônia LTDA', '45.678.901/0001-23', 'fretamento', 'inativa');

-- ========================================
-- Normas de conformidade (checklist regulatório)
-- ========================================
INSERT INTO normas_conformidade (codigo, descricao, categoria, severidade_padrao) VALUES
('NC-001', 'Veículo com documentação (CRLV) vencida', 'documentacao', 'alta'),
('NC-002', 'Motorista sem uniforme ou identificação visível', 'operacional', 'baixa'),
('NC-003', 'Ausência de extintor de incêndio válido', 'seguranca', 'alta'),
('NC-004', 'Itinerário divergente do autorizado', 'operacional', 'media'),
('NC-005', 'Excesso de passageiros acima da capacidade', 'seguranca', 'alta');

-- ========================================
-- Inspeções (eventos de fiscalização)
-- ========================================
INSERT INTO inspecoes (entidade_id, fiscal_responsavel, data_inspecao, status) VALUES
(1, 'Lucas Onofre', '2024-03-10', 'concluida'),
(1, 'Lucas Onofre', '2024-06-15', 'concluida'),
(2, 'Ana Paula Souza', '2024-04-02', 'concluida'),
(3, 'Lucas Onofre', '2024-07-20', 'concluida'),
(2, 'Ana Paula Souza', '2024-08-05', 'em_andamento');

-- ========================================
-- Não-conformidades (achados de cada inspeção)
-- ========================================
INSERT INTO nao_conformidades (inspecao_id, norma_id, descricao_achado, severidade, prazo_correcao, status) VALUES
(1, 1, 'CRLV do veículo placa ABC-1234 vencido há 2 meses', 'alta', '2024-04-10', 'corrigida'),
(1, 3, 'Extintor com validade expirada', 'alta', '2024-04-10', 'corrigida'),
(2, 1, 'CRLV vencido novamente no mesmo veículo', 'alta', '2024-07-15', 'aberta'),
(3, 4, 'Ônibus fora da rota autorizada no trecho Manaus-Itacoatiara', 'media', '2024-05-02', 'corrigida'),
(4, 2, 'Motorista sem crachá de identificação', 'baixa', NULL, 'aberta'),
(5, 5, 'Veículo com 12 passageiros em pé, acima do permitido', 'alta', '2024-09-05', 'vencida');