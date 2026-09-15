const btnTema = document.getElementById('btn-tema');

function aplicarTemaSalvo() {
  const temaSalvo = localStorage.getItem('tema');
  if (temaSalvo === 'escuro') {
    document.body.classList.add('modo-escuro');
    btnTema.textContent = '☀️ Modo Claro';
  }
}

btnTema.addEventListener('click', () => {
  document.body.classList.toggle('modo-escuro');
  const estaEscuro = document.body.classList.contains('modo-escuro');
  btnTema.textContent = estaEscuro ? '☀️ Modo Claro' : '🌙 Modo Escuro';
  localStorage.setItem('tema', estaEscuro ? 'escuro' : 'claro');
});

aplicarTemaSalvo();
let empresaSelecionadaAtual = null;
let naoConformidadesAtuais = [];
let empresasAtuais = [];
let veiculosAtuais = [];

const modal = document.getElementById('modal-empresa');
const btnNovaEmpresa = document.getElementById('btn-nova-empresa');
const btnCancelar = document.getElementById('btn-cancelar');
const formEmpresa = document.getElementById('form-empresa');

async function carregarEmpresas() {
  const resposta = await fetch('/entidades');
  empresasAtuais = await resposta.json();
  renderizarListaEmpresas(empresasAtuais);
}

function renderizarListaEmpresas(lista) {
  const listaHtml = document.getElementById('lista-empresas');
  listaHtml.innerHTML = '';

  if (lista.length === 0) {
    listaHtml.innerHTML = '<li class="sem-resultado">Nenhuma empresa encontrada.</li>';
    return;
  }

  lista.forEach((empresa) => {
    const item = document.createElement('li');
    item.textContent = empresa.razao_social;
    item.dataset.id = empresa.id;
    if (empresaSelecionadaAtual && empresaSelecionadaAtual.id === empresa.id) {
      item.classList.add('ativo');
    }
    item.addEventListener('click', () => selecionarEmpresa(empresa, item));
    listaHtml.appendChild(item);
  });
}

document.getElementById('busca-empresa').addEventListener('input', (evento) => {
  const termo = evento.target.value.toLowerCase();
  const filtradas = empresasAtuais.filter((empresa) =>
    empresa.razao_social.toLowerCase().includes(termo)
  );
  renderizarListaEmpresas(filtradas);
});

async function selecionarEmpresa(empresa, itemClicado) {
  empresaSelecionadaAtual = empresa;

  document.querySelectorAll('#lista-empresas li').forEach((li) => li.classList.remove('ativo'));
  if (itemClicado) itemClicado.classList.add('ativo');

  document.getElementById('detalhes-vazio').style.display = 'none';
  document.getElementById('detalhes-conteudo').style.display = 'block';

  document.getElementById('nome-empresa').textContent = empresa.razao_social;
  document.getElementById('info-empresa').textContent =
    `CNPJ: ${empresa.cnpj} · Tipo: ${empresa.tipo_servico} · Status: ${empresa.status}`;

  const dataRegistroEmpresa = empresa.data_registro
    ? new Date(empresa.data_registro).toLocaleDateString('pt-BR')
    : '—';
  document.getElementById('resumo-data-registro').textContent = dataRegistroEmpresa;

  await carregarVeiculos(empresa.id);
  await carregarNaoConformidades(empresa.id);
}

async function carregarVeiculos(entidadeId) {
  const resposta = await fetch(`/entidades/${entidadeId}/veiculos`);
  veiculosAtuais = await resposta.json();

  document.getElementById('busca-veiculo-placa').value = '';
  document.getElementById('resumo-veiculos').textContent = veiculosAtuais.length;

  renderizarTabelaVeiculos(veiculosAtuais);
  atualizarDropdownVeiculoNc(veiculosAtuais);
}

const nomesTipoVeiculo = {
  onibus: 'Ônibus',
  micro_onibus: 'Micro-ônibus',
  van: 'Van',
  taxi: 'Táxi',
};

function renderizarTabelaVeiculos(lista) {
  const corpoTabela = document.getElementById('corpo-tabela-veiculos');
  corpoTabela.innerHTML = '';

  if (lista.length === 0) {
    corpoTabela.innerHTML = '<tr><td colspan="5">Nenhum veículo encontrado.</td></tr>';
    return;
  }

  lista.forEach((veiculo) => {
    const dataRegistroFormatada = new Date(veiculo.data_registro).toLocaleDateString('pt-BR');

    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td>${veiculo.placa}</td>
      <td>${nomesTipoVeiculo[veiculo.tipo_veiculo] || veiculo.tipo_veiculo}</td>
      <td>${veiculo.numero_servico}</td>
      <td>${veiculo.regularizado ? 'Sim' : 'Não'}</td>
      <td>${dataRegistroFormatada}</td>
    `;
    corpoTabela.appendChild(linha);
  });
}

function atualizarDropdownVeiculoNc(lista) {
  const selectVeiculoNc = document.getElementById('nc-veiculo');
  selectVeiculoNc.innerHTML = '<option value="">Nenhum veículo específico</option>';
  lista.forEach((veiculo) => {
    const opcao = document.createElement('option');
    opcao.value = veiculo.id;
    opcao.textContent = `${veiculo.placa} (${nomesTipoVeiculo[veiculo.tipo_veiculo] || veiculo.tipo_veiculo})`;
    selectVeiculoNc.appendChild(opcao);
  });
}

document.getElementById('busca-veiculo-placa').addEventListener('input', (evento) => {
  const termo = evento.target.value.toLowerCase();
  const filtrados = veiculosAtuais.filter((v) => v.placa.toLowerCase().includes(termo));
  renderizarTabelaVeiculos(filtrados);
});

const modalVeiculo = document.getElementById('modal-veiculo');
const formVeiculo = document.getElementById('form-veiculo');

document.getElementById('btn-novo-veiculo').addEventListener('click', () => {
  formVeiculo.reset();
  modalVeiculo.classList.remove('modal-oculto');
  modalVeiculo.classList.add('modal-visivel');
});

document.getElementById('btn-cancelar-veiculo').addEventListener('click', () => {
  modalVeiculo.classList.remove('modal-visivel');
  modalVeiculo.classList.add('modal-oculto');
});

formVeiculo.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const dadosVeiculo = {
    placa: document.getElementById('veiculo-placa').value,
    tipo_veiculo: document.getElementById('veiculo-tipo').value,
    numero_servico: document.getElementById('veiculo-numero-servico').value,
    regularizado: document.getElementById('veiculo-regularizado').value === 'true',
    data_registro: document.getElementById('veiculo-data-registro').value || null,
  };

  try {
    const resposta = await fetch(`/entidades/${empresaSelecionadaAtual.id}/veiculos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosVeiculo),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.erro || 'Erro ao cadastrar veículo');
      return;
    }

    modalVeiculo.classList.remove('modal-visivel');
    modalVeiculo.classList.add('modal-oculto');
    carregarVeiculos(empresaSelecionadaAtual.id);
  } catch (erro) {
    console.error(erro);
    alert('Erro de conexão ao cadastrar veículo');
  }
});

async function carregarNaoConformidades(entidadeId) {
  const resposta = await fetch(`/entidades/${entidadeId}/nao-conformidades`);
  naoConformidadesAtuais = await resposta.json();

  document.getElementById('filtro-data-inicio').value = '';
  document.getElementById('filtro-data-fim').value = '';

  renderizarTabelaNc(naoConformidadesAtuais);
}

function renderizarTabelaNc(lista) {
  const corpoTabela = document.getElementById('corpo-tabela-nc');
  corpoTabela.innerHTML = '';

  const totalInfracoes = lista.length;
  const infracoesAbertas = lista.filter((nc) => nc.status === 'aberta').length;
  document.getElementById('resumo-infracoes-total').textContent = totalInfracoes;
  document.getElementById('resumo-infracoes-abertas').textContent = infracoesAbertas;

  if (lista.length === 0) {
    corpoTabela.innerHTML = '<tr><td colspan="8">Nenhuma não-conformidade encontrada.</td></tr>';
    return;
  }

  lista.forEach((nc) => {
    const prazoFormatado = nc.prazo_correcao
      ? new Date(nc.prazo_correcao).toLocaleDateString('pt-BR')
      : '—';

    const prazoVencido = nc.prazo_correcao &&
      new Date(nc.prazo_correcao) < new Date() &&
      nc.status !== 'corrigida';

    const classePrazo = prazoVencido ? 'prazo-vencido' : '';

    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td>${nc.codigo}</td>
      <td>${nc.descricao_achado}</td>
      <td>${nc.fiscal_responsavel}</td>
      <td>${nc.placa || '—'}</td>
      <td class="severidade-${nc.severidade}">${nc.severidade}</td>
      <td>${nc.status}</td>
      <td>${new Date(nc.data_inspecao).toLocaleDateString('pt-BR')}</td>
      <td class="${classePrazo}">${prazoFormatado}</td>
    `;
    corpoTabela.appendChild(linha);
  });
}

function aplicarFiltroData() {
  const dataInicio = document.getElementById('filtro-data-inicio').value;
  const dataFim = document.getElementById('filtro-data-fim').value;

  let listaFiltrada = naoConformidadesAtuais;

  if (dataInicio) {
    listaFiltrada = listaFiltrada.filter((nc) => nc.data_inspecao.slice(0, 10) >= dataInicio);
  }

  if (dataFim) {
    listaFiltrada = listaFiltrada.filter((nc) => nc.data_inspecao.slice(0, 10) <= dataFim);
  }

  renderizarTabelaNc(listaFiltrada);
}

document.getElementById('filtro-data-inicio').addEventListener('change', aplicarFiltroData);
document.getElementById('filtro-data-fim').addEventListener('change', aplicarFiltroData);

document.getElementById('btn-limpar-filtro').addEventListener('click', () => {
  document.getElementById('filtro-data-inicio').value = '';
  document.getElementById('filtro-data-fim').value = '';
  renderizarTabelaNc(naoConformidadesAtuais);
});

btnNovaEmpresa.addEventListener('click', () => {
  formEmpresa.reset();
  delete formEmpresa.dataset.modo;
  delete formEmpresa.dataset.idEditando;
  modal.classList.remove('modal-oculto');
  modal.classList.add('modal-visivel');
});

btnCancelar.addEventListener('click', () => {
  fecharModal();
});

function fecharModal() {
  modal.classList.remove('modal-visivel');
  modal.classList.add('modal-oculto');
  formEmpresa.reset();
}

formEmpresa.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const dadosEmpresa = {
    razao_social: document.getElementById('input-razao-social').value,
    cnpj: document.getElementById('input-cnpj').value,
    tipo_servico: document.getElementById('input-tipo-servico').value,
    status: document.getElementById('input-status').value,
    data_registro: document.getElementById('input-data-registro').value || null,
  };

  const modoEdicao = formEmpresa.dataset.modo === 'editar';
  const url = modoEdicao ? `/entidades/${formEmpresa.dataset.idEditando}` : '/entidades';
  const metodo = modoEdicao ? 'PUT' : 'POST';

  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosEmpresa),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.erro || 'Erro ao salvar empresa');
      return;
    }

    delete formEmpresa.dataset.modo;
    delete formEmpresa.dataset.idEditando;

    fecharModal();
    carregarEmpresas();
    document.getElementById('detalhes-conteudo').style.display = 'none';
    document.getElementById('detalhes-vazio').style.display = 'block';
  } catch (erro) {
    console.error(erro);
    alert('Erro de conexão ao salvar empresa');
  }
});

const modalNc = document.getElementById('modal-nc');
const formNc = document.getElementById('form-nc');
const selectNorma = document.getElementById('nc-norma');

async function carregarNormas() {
  const resposta = await fetch('/normas');
  const normas = await resposta.json();

  selectNorma.innerHTML = '';
  normas.forEach((norma) => {
    const opcao = document.createElement('option');
    opcao.value = norma.id;
    opcao.textContent = `${norma.codigo} — ${norma.descricao}`;
    selectNorma.appendChild(opcao);
  });
}

document.getElementById('btn-nova-nc').addEventListener('click', async () => {
  if (!empresaSelecionadaAtual) return;
  await carregarNormas();
  formNc.reset();
  modalNc.classList.remove('modal-oculto');
  modalNc.classList.add('modal-visivel');
});

document.getElementById('btn-cancelar-nc').addEventListener('click', () => {
  modalNc.classList.remove('modal-visivel');
  modalNc.classList.add('modal-oculto');
});

formNc.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const dadosNc = {
    data_inspecao: document.getElementById('nc-data-inspecao').value,
    fiscal_responsavel: document.getElementById('nc-fiscal').value,
    veiculo_id: document.getElementById('nc-veiculo').value || null,
    norma_id: document.getElementById('nc-norma').value,
    descricao_achado: document.getElementById('nc-descricao').value,
    severidade: document.getElementById('nc-severidade').value,
    status: document.getElementById('nc-status').value,
    prazo_correcao: document.getElementById('nc-prazo').value || null,
  };

  try {
    const resposta = await fetch(`/entidades/${empresaSelecionadaAtual.id}/nao-conformidades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosNc),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.erro || 'Erro ao registrar não-conformidade');
      return;
    }

    modalNc.classList.remove('modal-visivel');
    modalNc.classList.add('modal-oculto');

    carregarNaoConformidades(empresaSelecionadaAtual.id);
  } catch (erro) {
    console.error(erro);
    alert('Erro de conexão ao registrar não-conformidade');
  }
});

carregarEmpresas();

document.querySelectorAll('.botao-aba').forEach((botao) => {
  botao.addEventListener('click', () => {
    document.querySelectorAll('.botao-aba').forEach((b) => b.classList.remove('ativo'));
    document.querySelectorAll('.conteudo-aba').forEach((c) => c.classList.remove('ativo'));

    botao.classList.add('ativo');
    document.getElementById(`aba-${botao.dataset.aba}`).classList.add('ativo');
  });
});