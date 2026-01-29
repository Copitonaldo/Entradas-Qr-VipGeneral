// Importar Supabase
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.4/+esm";

// 🔑 CONFIGURACIÓN — VALIDADA
const SUPABASE_URL = 'https://tljnvaveeoptlbcugbmk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsam52YXZlZW9wdGxiY3VnYm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTc4ODUsImV4cCI6MjA3ODM3Mzg4NX0.hucHM1tnNxZ0_th6bEKVjeVe-FUO-JPrwjxAkSsWRcs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const urlParams = new URLSearchParams(window.location.search);
const formId = urlParams.get('id_formulario');

const formPadreNombreElem = document.getElementById('formPadreNombre');
const formPadreCodigoElem = document.getElementById('formPadreCodigo');
const crearReferenciaForm = document.getElementById('crearReferenciaForm');
const codigoReferenciaInput = document.getElementById('codigoReferencia');
const usosReferenciaInput = document.getElementById('usosReferencia');
const tipoEntradaInput = document.getElementById('tipoEntrada');
const referenciasTableBody = document.querySelector('#referenciasTable tbody');
const noReferenciasMsg = document.getElementById('noReferencias');
const errorMensajeElem = document.getElementById('errorMensaje');
const exitoMensajeElem = document.getElementById('exitoMensaje');

let currentFormDbId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!formId) {
    mostrarError('Error: No se especificó id_formulario en la URL.');
    return;
  }

  if (formPadreCodigoElem) formPadreCodigoElem.textContent = formId;
  await cargarInformacionFormularioPadre();
  if (currentFormDbId) await cargarReferenciasExistentes();
});

async function cargarInformacionFormularioPadre() {
  const { data, error } = await supabase
    .from('formularios')
    .select('id, nombre')
    .eq('codigo_form', formId)
    .single();

  if (error || !data) {
    mostrarError(`Formulario "${formId}" no encontrado.`);
    return;
  }

  currentFormDbId = data.id;
  if (formPadreNombreElem) formPadreNombreElem.textContent = data.nombre;
}

crearReferenciaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  ocultarMensajes();

  if (!currentFormDbId) {
    mostrarError("Formulario padre no identificado.");
    return;
  }

  const codigo = codigoReferenciaInput.value.trim();
  const usos = parseInt(usosReferenciaInput.value.trim());
  const tipo = tipoEntradaInput.value.trim();

  if (!/^\d{4}$/.test(codigo)) {
    mostrarError('Código debe ser 4 dígitos.');
    return;
  }
  if (isNaN(usos) || usos < 1) {
    mostrarError('Usos debe ser ≥ 1.');
    return;
  }
  if (!['VIP', 'General'].includes(tipo)) {
    mostrarError('Tipo debe ser VIP o General.');
    return;
  }

  const { data: existing } = await supabase
    .from('referencias_usos')
    .select('id')
    .eq('formulario_id', currentFormDbId)
    .eq('codigo_referencia', codigo)
    .maybeSingle();

  if (existing) {
    mostrarError(`Código "${codigo}" ya existe.`);
    return;
  }

  const { error } = await supabase.from('referencias_usos').insert([{
    formulario_id: currentFormDbId,
    codigo_referencia: codigo,
    usos_disponibles: usos,
    usos_iniciales: usos,
    tipo_entrada: tipo
  }]);

  if (error) {
    mostrarError(`Error: ${error.message}`);
  } else {
    mostrarExito(`Creada: ${codigo} (${tipo}) con ${usos} usos.`);
    crearReferenciaForm.reset();
    await cargarReferenciasExistentes();
  }
});

async function cargarReferenciasExistentes() {
  if (!currentFormDbId) return;

  const { data, error } = await supabase
    .from('referencias_usos')
    .select('id, codigo_referencia, tipo_entrada, usos_disponibles, usos_iniciales')
    .eq('formulario_id', currentFormDbId)
    .order('created_at', { ascending: false });

  if (error) {
    mostrarError(`Error: ${error.message}`);
    return;
  }

  referenciasTableBody.innerHTML = '';
  if (data?.length > 0) {
    noReferenciasMsg.style.display = 'none';
    data.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.codigo_referencia}</td>
        <td>${r.tipo_entrada}</td>
        <td>${r.usos_disponibles} / ${r.usos_iniciales}</td>
        <td><button onclick="borrarReferencia('${r.id}', '${r.codigo_referencia}')">Borrar</button></td>
      `;
      referenciasTableBody.appendChild(tr);
    });
  } else {
    noReferenciasMsg.style.display = 'block';
  }
}

window.borrarReferencia = async (id, codigo) => {
  if (!confirm(`¿Borrar "${codigo}"?`)) return;
  const { error } = await supabase.from('referencias_usos').delete().eq('id', id);
  if (error) {
    mostrarError(`Error: ${error.message}`);
  } else {
    mostrarExito(`Borrado: ${codigo}`);
    await cargarReferenciasExistentes();
  }
};

function mostrarError(msg) {
  if (errorMensajeElem) {
    errorMensajeElem.textContent = msg;
    errorMensajeElem.style.display = 'block';
  }
}
function mostrarExito(msg) {
  if (exitoMensajeElem) {
    exitoMensajeElem.textContent = msg;
    exitoMensajeElem.style.display = 'block';
  }
}
function ocultarMensajes() {
  if (errorMensajeElem) errorMensajeElem.style.display = 'none';
  if (exitoMensajeElem) exitoMensajeElem.style.display = 'none';
}
