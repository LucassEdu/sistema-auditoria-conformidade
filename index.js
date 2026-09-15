const express = require('express');
const pool = require('./db');

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(express.static('public'));

app.get('/reincidencias', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM vw_reincidencias');
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao consultar reincidências' });
  }
});

app.get('/entidades', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM entidades_fiscalizadas ORDER BY razao_social');
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao consultar entidades' });
  }
});

app.post('/entidades', async (req, res) => {
  const { razao_social, cnpj, tipo_servico, status, data_registro } = req.body;

  if (!razao_social || !cnpj || !tipo_servico) {
    return res.status(400).json({ erro: 'razao_social, cnpj e tipo_servico são obrigatórios' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO entidades_fiscalizadas (razao_social, cnpj, tipo_servico, status, data_registro)
       VALUES ($1, $2, $3, COALESCE($4, 'ativa')::status_entidade, COALESCE($5, CURRENT_DATE))
       RETURNING *`,
      [razao_social, cnpj, tipo_servico, status, data_registro || null]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    if (erro.code === '23505') {
      return res.status(409).json({ erro: 'Já existe uma empresa cadastrada com esse CNPJ' });
    }
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao cadastrar entidade' });
  }
});

app.get('/entidades/:id/veiculos', async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query(
      'SELECT * FROM veiculos WHERE entidade_id = $1 ORDER BY placa',
      [id]
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao consultar veículos' });
  }
});

app.post('/entidades/:id/veiculos', async (req, res) => {
  const { id } = req.params;
  const { placa, tipo_veiculo, numero_servico, regularizado, data_registro } = req.body;

  if (!placa || !tipo_veiculo || !numero_servico) {
    return res.status(400).json({ erro: 'placa, tipo_veiculo e numero_servico são obrigatórios' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO veiculos (entidade_id, placa, tipo_veiculo, numero_servico, regularizado, data_registro)
       VALUES ($1, $2, $3::tipo_veiculo, $4, COALESCE($5, true), COALESCE($6, CURRENT_DATE))
       RETURNING *`,
      [id, placa, tipo_veiculo, numero_servico, regularizado, data_registro || null]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    if (erro.code === '23505') {
      return res.status(409).json({ erro: 'Já existe um veículo cadastrado com essa placa' });
    }
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao cadastrar veículo' });
  }
});

app.put('/veiculos/:id', async (req, res) => {
  const { id } = req.params;
  const { placa, tipo_veiculo, numero_servico, regularizado, data_registro } = req.body;

  try {
    const resultado = await pool.query(
      `UPDATE veiculos
       SET placa = $1, tipo_veiculo = $2::tipo_veiculo, numero_servico = $3, regularizado = $4, data_registro = $5
       WHERE id = $6 RETURNING *`,
      [placa, tipo_veiculo, numero_servico, regularizado, data_registro, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    if (erro.code === '23505') {
      return res.status(409).json({ erro: 'Já existe um veículo cadastrado com essa placa' });
    }
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao editar veículo' });
  }
});

app.get('/entidades/:id/nao-conformidades', async (req, res) => {
  const { id } = req.params;
  try {
    const resultado = await pool.query(
      `SELECT nc.id, n.codigo, n.descricao AS norma, nc.descricao_achado, nc.severidade, nc.status,
              i.data_inspecao, i.fiscal_responsavel, nc.prazo_correcao, v.placa
       FROM nao_conformidades nc
       JOIN inspecoes i ON nc.inspecao_id = i.id
       JOIN normas_conformidade n ON nc.norma_id = n.id
       LEFT JOIN veiculos v ON nc.veiculo_id = v.id
       WHERE i.entidade_id = $1
       ORDER BY i.data_inspecao DESC`,
      [id]
    );
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao consultar não-conformidades da entidade' });
  }
});

app.post('/entidades/:id/nao-conformidades', async (req, res) => {
  const { id } = req.params;
  const { fiscal_responsavel, data_inspecao, norma_id, descricao_achado, severidade, status, prazo_correcao, veiculo_id } = req.body;

  if (!fiscal_responsavel || !data_inspecao || !norma_id || !descricao_achado || !severidade) {
    return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const inspecao = await client.query(
      `INSERT INTO inspecoes (entidade_id, fiscal_responsavel, data_inspecao, status)
       VALUES ($1, $2, $3, 'concluida') RETURNING id`,
      [id, fiscal_responsavel, data_inspecao]
    );

    const inspecaoId = inspecao.rows[0].id;

    const naoConformidade = await client.query(
      `INSERT INTO nao_conformidades (inspecao_id, norma_id, descricao_achado, severidade, status, prazo_correcao, veiculo_id)
       VALUES ($1, $2, $3, $4::severidade_nc, COALESCE($5, 'aberta')::status_nc, $6, $7)
       RETURNING *`,
      [inspecaoId, norma_id, descricao_achado, severidade, status, prazo_correcao || null, veiculo_id || null]
    );

    await client.query('COMMIT');
    res.status(201).json(naoConformidade.rows[0]);
  } catch (erro) {
    await client.query('ROLLBACK');
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao registrar não-conformidade' });
  } finally {
    client.release();
  }
});

app.get('/normas', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM normas_conformidade ORDER BY codigo');
    res.json(resultado.rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: 'Erro ao consultar normas' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});