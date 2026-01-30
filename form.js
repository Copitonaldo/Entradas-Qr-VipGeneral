// Importar Supabase
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.4/+esm";

// Configuración de Supabase
const SUPABASE_URL = 'https://tljnvaveeoptlbcugbmk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsam52YXZlZW9wdGxiY3VnYm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTc4ODUsImV4cCI6MjA3ODM3Mzg4NX0.hucHM1tnNxZ0_th6bEKVjeVe-FUO-JPrwjxAkSsWRcs';

// Inicializar Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variables del DOM
const urlParams = new URLSearchParams(window.location.search);
const formId = urlParams.get('id');
const formTitleElement = document.getElementById('formTitle');
const formData = document.getElementById('formData');
const inputNombre = document.getElementById('nombre');
const inputCedula = document.getElementById('cedula');
const inputEdad = document.getElementById('edad');
const inputNumero = document.getElementById('numero');
const inputCorreo = document.getElementById('correo');
const inputReferencia = document.getElementById('referencia');
const errorMsg = document.getElementById('errorMsg');
const confirmacionDatos = document.getElementById('confirmacionDatos');
const confNombre = document.getElementById('confNombre');
const confCedula = document.getElementById('confCedula');
const confEdad = document.getElementById('confEdad');
const confNumero = document.getElementById('confNumero');
const confCorreo = document.getElementById('confCorreo');
const confReferencia = document.getElementById('confReferencia');
const btnConfirmar = document.getElementById('btnConfirmar');
const btnCorregir = document.getElementById('btnCorregir');
const outNombre = document.getElementById('outNombre');
const outCedula = document.getElementById('outCedula');
const outEdad = document.getElementById('outEdad');
const outNumero = document.getElementById('outNumero');
const outCorreo = document.getElementById('outCorreo');
const outCodigo = document.getElementById('outCodigo');
const outReferencia = document.getElementById('outReferencia');
const outReferenciaContenedor = document.getElementById('outReferenciaContenedor');
const outTipoEntrada = document.getElementById('outTipoEntrada');
const outTipoEntradaContenedor = document.getElementById('outTipoEntradaContenedor');
const codigoQR = document.getElementById('codigoQR');
const qrCanvas = document.getElementById('qrCanvas');
const entradaGenerada = document.getElementById('entradaGenerada');
const ticketBg = document.getElementById('ticketBg');
const guardarBtn = document.getElementById('guardarBtn');
let currentMinAge = null;
let currentMaxAge = null;
let currentFormDbId = null;
let isSubmitting = false;

// --- Carga de datos del formulario ---
async function cargarDatosFormulario() {
  if (!formId) return;
  const { data: formDataResult, error: formError } = await supabase
    .from('formularios')
    .select('id, nombre, imagen_url, min_age, max_age')
    .eq('codigo_form', formId)
    .single();
  if (formError) {
    console.error("Error al cargar datos del formulario:", formError);
    if (formTitleElement) formTitleElement.textContent = 'Error al cargar formulario';
    if (ticketBg) ticketBg.style.display = 'none';
    if (formData) formData.style.display = 'none';
    errorMsg.innerHTML = '<b>Error:</b> No se pudo cargar la información del formulario.';
    errorMsg.style.display = 'block';
    return;
  }
  if (formDataResult) {
    currentFormDbId = formDataResult.id;
    if (formTitleElement) {
      formTitleElement.textContent = `Formulario: ${formDataResult.nombre || formId}`;
    }
    if (ticketBg && formDataResult.imagen_url) {
      ticketBg.src = formDataResult.imagen_url;
      ticketBg.style.display = 'block';
    } else if (ticketBg) {
      ticketBg.style.display = 'none';
    }
    currentMinAge = formDataResult.min_age ?? null;
    currentMaxAge = formDataResult.max_age ?? null;
  } else {
    if (formTitleElement) formTitleElement.textContent = 'Formulario no encontrado';
    if (ticketBg) ticketBg.style.display = 'none';
    if (formData) formData.style.display = 'none';
    errorMsg.innerHTML = '<b>Error:</b> Formulario no existe.';
    errorMsg.style.display = 'block';
  }
}

if (!formId || formId.trim() === "") {
  if (formTitleElement) formTitleElement.textContent = 'Error: Formulario no especificado';
  if (errorMsg) {
    errorMsg.innerHTML = '<b>Error Crítico:</b> Falta parámetro `?id=` en la URL.';
    errorMsg.style.display = 'block';
  }
  if (formData) formData.style.display = 'none';
  if (ticketBg) ticketBg.style.display = 'none';
} else {
  cargarDatosFormulario();
}

function toTitleCase(str) {
  return str.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
}
function formatCedula(cedula) {
  return cedula.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
}
function formatSequentialCode(number) {
  return number.toString().padStart(3, '0');
}

// --- Evento: Enviar formulario ---
if (formData) {
  formData.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorMsg.style.display = 'none';

    if (!inputNombre || !inputCedula || !inputEdad || !inputReferencia) {
      errorMsg.textContent = "Error: Formulario incompleto. Recargue la página.";
      errorMsg.style.display = 'block';
      return;
    }

    const nombre = inputNombre.value.trim();
    const cedulaRaw = inputCedula.value.replace(/\D/g, '');
    const edadValue = inputEdad.value.trim();
    const numeroValue = inputNumero?.value?.trim() || '';
    const correoValue = inputCorreo?.value?.trim() || '';
    const referenciaValue = inputReferencia.value.trim();

    if (!nombre || !/^\d{8}$/.test(cedulaRaw) || !edadValue || !referenciaValue) {
      errorMsg.textContent =
        !nombre ? 'Debe ingresar un nombre.' :
        !/^\d{8}$/.test(cedulaRaw) ? 'La cédula debe tener exactamente 8 dígitos.' :
        !edadValue ? 'Debe ingresar una edad.' : 'Debe ingresar un código de referencia.';
      errorMsg.style.display = 'block';
      return;
    }

    if (numeroValue && !/^\d+$/.test(numeroValue.replace(/\D/g, ''))) {
        errorMsg.textContent = 'Número de teléfono inválido.';
        errorMsg.style.display = 'block';
        return;
    }
    if (correoValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoValue)) {
        errorMsg.textContent = 'Correo electrónico inválido.';
        errorMsg.style.display = 'block';
        return;
    }

    const edad = parseInt(edadValue);
    if (currentMinAge !== null && edad < currentMinAge) {
      errorMsg.textContent = `Error: Edad mínima es ${currentMinAge}.`;
      errorMsg.style.display = 'block';
      return;
    }
    if (currentMaxAge !== null && edad > currentMaxAge) {
      errorMsg.textContent = `Error: Edad máxima es ${currentMaxAge}.`;
      errorMsg.style.display = 'block';
      return;
    }

    if (confNombre) confNombre.textContent = toTitleCase(nombre);
    if (confCedula) confCedula.textContent = formatCedula(cedulaRaw);
    if (confEdad) confEdad.textContent = `${edad} años`;
    if (confNumero) confNumero.textContent = numeroValue || '-';
    if (confCorreo) confCorreo.textContent = correoValue || '-';
    if (confReferencia) confReferencia.textContent = referenciaValue;
    formData.style.display = 'none';
    entradaGenerada.style.display = 'none';
    confirmacionDatos.style.display = 'block';
    window.datosParaConfirmar = { nombre, cedula: cedulaRaw, edad: edadValue, edadInt: edad, numero: numeroValue, correo: correoValue, referencia: referenciaValue };
  });
}

// --- Validación de referencia ---
async function validarYObtenerReferencia(codigoReferencia, formDbId) {
  const { data, error } = await supabase
    .from('referencias_usos')
    .select('id, usos_disponibles, tipo_entrada')
    .eq('formulario_id', formDbId)
    .eq('codigo_referencia', codigoReferencia)
    .single();
  if (error || !data) {
    return { valida: false, mensaje: "Código de referencia no válido o agotado." };
  }
  if (data.usos_disponibles <= 0) {
    return { valida: false, mensaje: "Este código ya fue usado." };
  }
  return { valida: true, datosReferencia: data };
}

async function decrementarUsoReferencia(idReferencia) {
  const { data: refData, error } = await supabase
    .from('referencias_usos')
    .select('usos_disponibles')
    .eq('id', idReferencia)
    .single();
  if (error || !refData) return;
  await supabase
    .from('referencias_usos')
    .update({ usos_disponibles: refData.usos_disponibles - 1 })
    .eq('id', idReferencia);
}

// --- Confirmar y guardar ---
if (btnConfirmar) {
  btnConfirmar.addEventListener('click', async function () {
    if (isSubmitting) return;
    isSubmitting = true;
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = 'Procesando...';
    errorMsg.style.display = 'none';

    try {
      if (!formId || !currentFormDbId) throw new Error('ID de formulario no válido');

      const { nombre, cedula, edadInt, numero, correo, referencia } = window.datosParaConfirmar;

      const validRef = await validarYObtenerReferencia(referencia, currentFormDbId);
      if (!validRef.valida) {
        errorMsg.textContent = validRef.mensaje;
        errorMsg.style.display = 'block';
        return;
      }

      const { data: existing } = await supabase
        .from('respuestas')
        .select('cedula')
        .eq('formulario_id', currentFormDbId)
        .eq('cedula', cedula)
        .maybeSingle();
      if (existing) {
        errorMsg.textContent = "Esta cédula ya está registrada.";
        errorMsg.style.display = 'block';
        return;
      }

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
        tipo_entrada: validRef.datosReferencia.tipo_entrada
      };
      if (numero) nuevaRespuesta.numero_telefono = numero;
      if (correo) nuevaRespuesta.correo_electronico = correo;

      const { data: insertData, error: insErr } = await supabase.from('respuestas').insert([nuevaRespuesta]).select().single();
      if (insErr) throw insErr;

      await decrementarUsoReferencia(validRef.datosReferencia.id);

      if (outNombre) outNombre.textContent = insertData.nombre_completo;
      if (outCedula) outCedula.textContent = formatCedula(insertData.cedula);
      if (outEdad) outEdad.textContent = `${insertData.edad} años`;
      if (outCodigo) outCodigo.textContent = insertData.codigo_secuencial;
      if (outReferencia) outReferencia.textContent = insertData.referencia_usada;
      if (outTipoEntrada && insertData.tipo_entrada) {
        outTipoEntrada.textContent = insertData.tipo_entrada;
      }

      const wrap = document.querySelector('.ticket-img-wrap');
      if (wrap) {
        wrap.style.containerType = 'inline-size';
        let overlay = wrap.querySelector('.datos-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'datos-overlay';
          wrap.appendChild(overlay);
        }

        overlay.style.position = 'absolute';
        overlay.style.top = '35%';
        overlay.style.left = '25%';
        overlay.style.color = '#fff';
        overlay.style.fontSize = '2.2cqw';
        overlay.style.fontFamily = 'Arial, sans-serif';
        overlay.style.zIndex = '11';
        overlay.style.pointerEvents = 'none';
        overlay.style.textShadow = '0 0 3px #000';

        overlay.innerHTML = '';
        const campos = [
            { l: 'Nombre:', v: insertData.nombre_completo },
            { l: 'Cédula:', v: formatCedula(insertData.cedula) },
            { l: 'Edad:', v: `${insertData.edad} años` },
            { l: 'CÓDIGO:', v: insertData.codigo_secuencial },
            { l: 'Referencia:', v: insertData.referencia_usada }
        ];
        if (insertData.tipo_entrada) campos.push({ l: 'Tipo de entrada:', v: insertData.tipo_entrada });

        campos.forEach(c => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.marginBottom = '0.3cqw';
            const b = document.createElement('b');
            b.style.width = '14cqw';
            b.textContent = c.l;
            const s = document.createElement('span');
            s.textContent = c.v;
            row.appendChild(b);
            row.appendChild(s);
            overlay.appendChild(row);
        });

        const qrBox = wrap.querySelector('.qr-absolute');
        if (qrBox) {
          qrBox.style.top = '35%';
          qrBox.style.left = '4%';
          qrBox.style.width = '16%';
          qrBox.style.height = 'auto';
          qrBox.style.background = '#fff';
          qrBox.style.padding = '0.8cqw';
          qrBox.style.borderRadius = '0px';
          qrBox.style.boxShadow = '0 0.5cqw 1cqw rgba(0,0,0,0.3)';
        }

        const formDisplayName = (formTitleElement ? formTitleElement.textContent : "Evento").replace("Formulario: ", "").trim();
        let datosQR = `${formDisplayName}\nNombre: ${insertData.nombre_completo}\nCédula: ${insertData.cedula}\nCódigo: ${insertData.codigo_secuencial}`;

        if (qrCanvas) {
          await QRCode.toCanvas(qrCanvas, datosQR, { width: 300, margin: 1 });
          qrCanvas.style.width = '100%';
          qrCanvas.style.height = 'auto';
          qrCanvas.style.display = 'block';
          qrCanvas.style.borderRadius = '0px';
        }
        if (codigoQR) {
           codigoQR.textContent = "CÓDIGO: " + insertData.codigo_secuencial;
           codigoQR.style.fontSize = '1.8cqw';
           codigoQR.style.marginTop = '0.5cqw';
           codigoQR.style.color = '#000';
           codigoQR.style.fontWeight = 'bold';
           codigoQR.style.textShadow = 'none';
        }
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

// --- Corregir datos ---
if (btnCorregir) {
  btnCorregir.addEventListener('click', () => {
    confirmacionDatos.style.display = 'none';
    formData.style.display = 'block';
    errorMsg.style.display = 'none';
  });
}

// --- Guardar imagen ---
if (guardarBtn) {
  guardarBtn.addEventListener('click', async () => {
    try {
      const elementToCapture = document.querySelector('#entradaGenerada .ticket-img-wrap');
      if (!elementToCapture) return;

      const clone = elementToCapture.cloneNode(true);
      const baseWidth = 500;
      const baseHeight = 170;
      const scaleFactor = 5;

      clone.style.width = `${baseWidth}px`;
      clone.style.height = `${baseHeight}px`;
      clone.style.position = 'fixed';
      clone.style.left = '-10000px';
      clone.style.top = '0';
      clone.style.borderRadius = '0px';
      document.body.appendChild(clone);

      const bg = clone.querySelector('.ticket-bg');
      if (bg) bg.style.borderRadius = '0px';

      const qrAbsolute = clone.querySelector('.qr-absolute');
      if (qrAbsolute) {
        qrAbsolute.style.top = '35%';
        qrAbsolute.style.left = '4%';
        qrAbsolute.style.width = '16%';
        qrAbsolute.style.padding = '4px';
        qrAbsolute.style.background = '#fff';
        qrAbsolute.style.borderRadius = '0px';
      }

      const clOverlay = clone.querySelector('.datos-overlay');
      if (clOverlay) {
        clOverlay.style.top = '35%';
        clOverlay.style.left = '25%';
        clOverlay.style.fontSize = '11px';
        clOverlay.style.color = '#fff';
        clOverlay.style.textShadow = '0 0 3px #000';
        const labels = clOverlay.querySelectorAll('b');
        labels.forEach(b => b.style.width = '70px');
      }

      const clonedCanvas = clone.querySelector('#qrCanvas');
      if (clonedCanvas) {
        const formDisplayName = (formTitleElement ? formTitleElement.textContent : "Evento").replace("Formulario: ", "").trim();
        let datosQR = `${formDisplayName}\nNombre: ${outNombre.textContent}\nCédula: ${outCedula.textContent.replace(/\./g, '')}\nCódigo: ${outCodigo.textContent}`;

        await QRCode.toCanvas(clonedCanvas, datosQR, { width: 400, margin: 1 });
        clonedCanvas.style.width = '100%';
        clonedCanvas.style.height = 'auto';
        clonedCanvas.style.borderRadius = '0px';
      }

      const clCodigoQR = clone.querySelector('#codigoQR');
      if (clCodigoQR) {
          clCodigoQR.style.fontSize = '9px';
          clCodigoQR.style.color = '#000';
          clCodigoQR.style.textShadow = 'none';
      }

      await new Promise(r => setTimeout(r, 300));

      const canvas = await html2canvas(clone, {
        useCORS: true,
        scale: scaleFactor,
        backgroundColor: null
      });

      const link = document.createElement('a');
      link.download = `${outCodigo.textContent}${outNombre.textContent}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();

      document.body.removeChild(clone);
    } catch (e) {
      console.error("Error al guardar imagen:", e);
    }
  });
}

console.log("form.js cargado.");
