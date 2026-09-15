CREATE VIEW vw_reincidencias AS
SELECT
    e.id AS entidade_id,
    e.razao_social,
    n.codigo AS norma_codigo,
    n.descricao AS norma_descricao,
    COUNT(*) AS qtd_ocorrencias
FROM nao_conformidades nc
JOIN inspecoes i ON nc.inspecao_id = i.id
JOIN entidades_fiscalizadas e ON i.entidade_id = e.id
JOIN normas_conformidade n ON nc.norma_id = n.id
GROUP BY e.id, e.razao_social, n.codigo, n.descricao
HAVING COUNT(*) > 1;