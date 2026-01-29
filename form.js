// Importar Supabase
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.4/+esm";

// 🔑 CONFIGURACIÓN — VALIDADA
const SUPABASE_URL = 'https://tljnvaveeoptlbcugbmk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsam52YXZlZW9wdGxiY3VnYm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTc4ODUsImV4cCI6MjA3ODM3Mzg4NX0.hucHM1tnNxZ0_th6bEKVjeVe-FUO-JPrwjxAkSsWRcs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const urlParams = new URLSearchParams(window.location.search);
const formId = urlParams.get('id');

const formTitleElement = document.getElementById('formTitle');
const formData = document.getElementById('formData');
const inputNombre = document.getElementById('nombre');
const inputCedula = document.getElementById('cedula');
const inputEdad = document.getElementById('edad');
const inputNumero = document.getElementById('numero');
const inputCorreo = document.getElementById('correo');
const inputReferencia = document.getElementById('referencia'); // ← ¡DEBE EXISTIR EN HTML!

const errorMsg = document.getElementById('errorMsg');
const confirmacionDatos = document.getElementById('confirmacionDatos');
const btnConfirmar = document.getElementById('btnConfirmar');
const btnCorregir = document.getElementById('btnCorregir');
const outNombre = document.getElementById('outNombre');
const outCedula = document.getElementById('outCedula');
const outEdad = document.getElementById('outEdad');
const outNumero = document.getElementById('outNumero');
const outCorreo = document.getElementById('outCorreo');
const outCodigo = document.getElementById('outCodigo');
const outReferencia = document.getElementById('outReferencia');
const qrCanvas = document.getElementById('qrCanvas');
const entradaGenerada = document.getElementById('entradaGenerada');
const ticketBg = document.getElementById('ticketBg');
const guardarBtn = document.getElementById('guardarBtn');

let currentMinAge = null;
let currentMaxAge = null;
let currentFormDbId = null;
let isSubmitting = false;

// ✅ Validación crítica: si inputReferencia es null → error amigable
if (!inputReferencia) {
  console.error("❌ Campo #referencia no encontrado. Revisa tu form.html");
  if (errorMsg) {
    errorMsg.innerHTML = "<b>Error:</b> El formulario está incompleto. Contacte al administrador.";
    errorMsg.style.display = 'block';
  }
  if (formData) formData.style.display = 'none';
  if (formTitleElement) formTitleElement.textContent = "Error: Campo 'referencia' faltante";
}

async function cargarDatosFormulario() {
  if (!formId) return;
  const { data, error } = await supabase
    .from('formularios')
    .select('id, nombre, imagen_url, min_age, max_age')
    .eq('codigo_form', formId)
    .single();

  if (error) {
    console.error("Error al cargar formulario:", error);
    if (formTitleElement) formTitleElement.textContent = 'Error: Formulario no encontrado';
    if (errorMsg) {
      errorMsg.innerHTML = `<b>Error:</b> No se encontró el formulario con código "${formId}".`;
      errorMsg.style.display = 'block';
    }
    return;
  }

  currentFormDbId = data.id;
  if (formTitleElement) formTitleElement.textContent = `Formulario: ${data.nombre}`;
  if (ticketBg && data.imagen_url) ticketBg.src = data.imagen_url;
  currentMinAge = data.min_age ?? null;
  currentMaxAge = data.max_age ?? null;
}

if (!formId) {
  if (formTitleElement) formTitleElement.textContent = 'Error: ID de formulario requerido';
  if (errorMsg) {
    errorMsg.innerHTML = '<b>Error Crítico:</b> URL sin parámetro `?id=`.';
    errorMsg.style.display = 'block';
  }
} else {
  cargarDatosFormulario();
}

function toTitleCase(str) {
  return str.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
}
function formatCedula(cedula) {
  return cedula.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
}
function formatSequentialCode(n) {
  return n.toString().padStart(3, '0');
}

if (formData) {
  formData.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';

    const nombre = inputNombre?.value?.trim() || '';
    const cedulaRaw = inputCedula?.value?.replace(/\D/g, '') || '';
    const edadValue = inputEdad?.value?.trim() || '';
    const numeroValue = inputNumero?.value?.trim() || '';
    const correoValue = inputCorreo?.value?.trim() || '';
    const referenciaValue = inputReferencia?.value?.trim() || '';

    if (!nombre || !/^\d{8}$/.test(cedulaRaw) || !edadValue || !referenciaValue) {
      errorMsg.textContent = 
        !nombre ? 'Nombre requerido' :
        !/^\d{8}$/.test(cedulaRaw) ? 'Cédula debe ser 8 dígitos' :
        !edadValue ? 'Edad requerida' : 'Código de referencia requerido';
      errorMsg.style.display = 'block';
      return;
    }

    const edad = parseInt(edadValue);
    if (isNaN(edad) || edad < 0) {
      errorMsg.textContent = 'Edad inválida';
      errorMsg.style.display = 'block';
      return;
    }
    if (currentMinAge !== null && edad < currentMinAge) {
      errorMsg.textContent = `Edad mínima: ${currentMinAge}`;
      errorMsg.style.display = 'block';
      return;
    }
    if (currentMaxAge !== null && edad > currentMaxAge) {
      errorMsg.textContent = `Edad máxima: ${currentMaxAge}`;
      errorMsg.style.display = 'block';
      return;
    }

    window.datosParaConfirmar = { nombre, cedula: cedulaRaw, edad, edadInt: edadValue, numero: numeroValue, correo: correoValue, referencia: referenciaValue };
    formData.style.display = 'none';
    confirmacionDatos.style.display = 'block';

    document.getElementById('confNombre')?.textContent = toTitleCase(nombre);
    document.getElementById('confCedula')?.textContent = formatCedula(cedulaRaw);
    document.getElementById('confEdad')?.textContent = `${edad} años`;
    document.getElementById('confNumero')?.textContent = numeroValue || '-';
    document.getElementById('confCorreo')?.textContent = correoValue || '-';
    document.getElementById('confReferencia')?.textContent = referenciaValue;
  });
}

async function validarYObtenerReferencia(codigo, formId) {
  const { data, error } = await supabase
    .from('referencias_usos')
    .select('id, usos_disponibles, tipo_entrada')
    .eq('formulario_id', formId)
    .eq('codigo_referencia', codigo)
    .single();
  if (error || !data) return { valida: false, mensaje: "Código no válido o agotado." };
  if (data.usos_disponibles <= 0) return { valida: false, mensaje: "Código ya usado." };
  return { valida: true, datos: data };
}

async function decrementarUso(id) {
  const { data: ref, error } = await supabase
    .from('referencias_usos')
    .select('usos_disponibles')
    .eq('id', id)
    .single();
  if (error || !ref) return;
  await supabase.from('referencias_usos').update({ usos_disponibles: ref.usos_disponibles - 1 }).eq('id', id);
}

if (btnConfirmar) {
  btnConfirmar.addEventListener('click', async () => {
    if (isSubmitting) return;
    isSubmitting = true;
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = 'Procesando...';

    try {
      if (!formId || !currentFormDbId) throw new Error('ID de formulario no válido');

      const { nombre, cedula, edadInt, numero, correo, referencia } = window.datosParaConfirmar;

      const validRef = await validarYObtenerReferencia(referencia, currentFormDbId);
      if (!validRef.valida) {
        errorMsg.textContent = validRef.mensaje;
        errorMsg.style.display = 'block';
        isSubmitting = false;
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = 'Sí, son correctos';
        return;
      }

      const { data: existing, error: checkErr } = await supabase
        .from('respuestas')
        .select('cedula')
        .eq('formulario_id', currentFormDbId)
        .eq('cedula', cedula)
        .maybeSingle();
      if (checkErr) throw checkErr;
      if (existing) {
        errorMsg.textContent = 'Esta cédula ya está registrada.';
        errorMsg.style.display = 'block';
        isSubmitting = false;
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = 'Sí, son correctos';
        return;
      }

      // Contador
      let nuevoCodigoSecuencial;
      let { data: contador, error: cntErr } = await supabase
        .from('contadores_formularios')
        .select('ultimo_codigo')
        .eq('formulario_id', currentFormDbId)
        .single();
      if (cntErr && cntErr.code !== 'PGRST116') throw cntErr;
      nuevoCodigoSecuencial = (contador?.ultimo_codigo || 0) + 1;

      await supabase.from('contadores_formularios').upsert(
        { formulario_id: currentFormDbId, ultimo_codigo: nuevoCodigoSecuencial },
        { onConflict: 'formulario_id' }
      );

      const nuevaRespuesta = {
        formulario_id: currentFormDbId,
        codigo_secuencial: formatSequentialCode(nuevoCodigoSecuencial),
        nombre_completo: toTitleCase(nombre),
        cedula,
        edad: edadInt,
        referencia_usada: referencia,
        tipo_entrada: validRef.datos.tipo_entrada // <-- clave: usa el tipo de la referencia
      };
      if (numero) nuevaRespuesta.numero_telefono = numero;
      if (correo) nuevaRespuesta.correo_electronico = correo;

      const { data: insertData, error: insErr } = await supabase.from('respuestas').insert([nuevaRespuesta]).select().single();
      if (insErr) throw insErr;

      if (validRef.datos.id) await decrementarUso(validRef.datos.id);

      outNombre.textContent = insertData.nombre_completo;
      outCedula.textContent = formatCedula(insertData.cedula);
      outEdad.textContent = `${insertData.edad} años`;
      outNumero.textContent = insertData.numero_telefono || '-';
      outCorreo.textContent = insertData.correo_electronico || '-';
      outCodigo.textContent = insertData.codigo_secuencial;
      outReferencia.textContent = insertData.referencia_usada;

      const qrText = `${formTitleElement.textContent.replace('Formulario: ', '')}\nNombre: ${insertData.nombre_completo}\nCédula: ${insertData.cedula}\nCódigo: ${insertData.codigo_secuencial}`;
      if (qrCanvas) {
        QRCode.toCanvas(qrCanvas, qrText, { width: 70, height: 70 }, err => {
          if (err) console.error('QR error:', err);
        });
      }

      confirmacionDatos.style.display = 'none';
      entradaGenerada.style.display = 'block';

    } catch (e) {
      console.error("Error:", e);
      errorMsg.textContent = e.message || "Error inesperado";
      errorMsg.style.display = 'block';
    } finally {
      isSubmitting = false;
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = 'Sí, son correctos';
    }
  });
}

if (btnCorregir) btnCorregir.onclick = () => {
  confirmacionDatos.style.display = 'none';
  formData.style.display = 'block';
  errorMsg.style.display = 'none';
};

if (guardarBtn) {
  guardarBtn.addEventListener('click', async () => {
    try {
      const html2canvas = (await import('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.esm.min.js')).default;
      const el = document.querySelector('#entradaGenerada .ticket-img-wrap');
      if (!el) return alert('Ticket no encontrado');

      const clone = el.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      document.body.appendChild(clone);

      await new Promise(r => setTimeout(r, 200));
      html2canvas(clone, {
        useCORS: true,
        scale: 3,
        backgroundColor: '#ffffff',
        onclone: (doc) => {
          const qr = doc.querySelector('#qrCanvas');
          if (qr) QRCode.toCanvas(qr, `${outCodigo.textContent}`, { width: 70, height: 70 }, () => {});
        }
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Ticket_${outCodigo.textContent}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
        document.body.removeChild(clone);
      });
    } catch (e) {
      console.error(e);
      alert('Error al guardar');
    }
  });
}
