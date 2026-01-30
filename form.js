// Importar Supabase
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.4/+esm";

// Configuración de Supabase
const SUPABASE_URL = 'https://tljnvaveeoptlbcugbmk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIscCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsam52YXZlZW9wdGxiY3VnYm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTc4ODUsImV4cCI6MjA3ODM3Mzg4NX0.hucHM1tnNxZ0_th6bEKVjeVe-FUO-JPrwjxAkSsWRcs';

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
      errorMsg.textContent = "Error: Formulario incompleto.";
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
      errorMsg.textContent = !nombre ? 'Nombre requerido' : !/^\d{8}$/.test(cedulaRaw) ? 'Cédula 8 dígitos' : !edadValue ? 'Edad requerida' : 'Referencia requerida';
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

    confNombre.textContent = toTitleCase(nombre);
    confCedula.textContent = formatCedula(cedulaRaw);
    confEdad.textContent = `${edad} años`;
    confNumero.textContent = numeroValue || '-';
    confCorreo.textContent = correoValue || '-';
    confReferencia.textContent = referenciaValue;
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
  if (error || !data) return { valida: false, mensaje: "Código no válido o agotado." };
  if (data.usos_disponibles <= 0) return { valida: false, mensaje: "Código ya usado." };
  return { valida: true, datosReferencia: data };
}

async function decrementarUsoReferencia(idReferencia) {
  const { data: refData } = await supabase
    .from('referencias_usos')
    .select('usos_disponibles')
    .eq('id', idReferencia)
    .single();
  if (refData) {
    await supabase
      .from('referencias_usos')
      .update({ usos_disponibles: refData.usos_disponibles - 1 })
      .eq('id', idReferencia);
  }
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
      if (!formId || !currentFormDbId) throw new Error('ID inválido');

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
        errorMsg.textContent = "Cédula ya registrada.";
        errorMsg.style.display = 'block';
        return;
      }

      // Contador
      let { data: contador } = await supabase
        .from('contadores_formularios')
        .select('ultimo_codigo')
        .eq('formulario_id', currentFormDbId)
        .single();
      const nuevoCodigoSecuencial = (contador?.ultimo_codigo || 0) + 1;

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

      const { data: insertData } = await supabase.from('respuestas').insert([nuevaRespuesta]).select().single();

      await decrementarUsoReferencia(validRef.datosReferencia.id);

      // Mostrar ticket
      outNombre.textContent = insertData.nombre_completo;
      outCedula.textContent = formatCedula(insertData.cedula);
      outEdad.textContent = `${insertData.edad} años`;
      outNumero.textContent = insertData.numero_telefono || '-';
      outCorreo.textContent = insertData.correo_electronico || '-';
      outCodigo.textContent = insertData.codigo_secuencial;
      outReferencia.textContent = insertData.referencia_usada;
      outReferenciaContenedor.style.display = 'block';
      if (insertData.tipo_entrada) {
        outTipoEntrada.textContent = insertData.tipo_entrada;
        outTipoEntradaContenedor.style.display = 'block';
      }
      if (codigoQR) codigoQR.textContent = "Código: " + insertData.codigo_secuencial;

      const formDisplayName = (formTitleElement.textContent || "").replace("Formulario: ", "").trim();
      let datosQR = `${formDisplayName}\nNombre: ${insertData.nombre_completo}\nCédula: ${insertData.cedula}\nEdad: ${insertData.edad}\nCódigo: ${insertData.codigo_secuencial}`;
      if (insertData.numero_telefono) datosQR += `\nNúmero: ${insertData.numero_telefono}`;
      if (insertData.correo_electronico) datosQR += `\nCorreo: ${insertData.correo_electronico}`;
      if (insertData.referencia_usada) datosQR += `\nRef: ${insertData.referencia_usada}`;
      if (insertData.tipo_entrada) datosQR += `\nTipo: ${insertData.tipo_entrada}`;

      if (qrCanvas) {
        QRCode.toCanvas(qrCanvas, datosQR, { width: 70, height: 70, margin: 1 }, err => {
          if (err) console.error('QR error:', err);
        });
      }

      confirmacionDatos.style.display = 'none';
      entradaGenerada.style.display = 'block';

    } catch (e) {
      console.error("Error:", e);
      errorMsg.textContent = e.message || "Error";
      errorMsg.style.display = 'block';
    } finally {
      isSubmitting = false;
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = 'Sí, son correctos';
    }
  });
}

// --- Corregir ---
if (btnCorregir) {
  btnCorregir.addEventListener('click', () => {
    confirmacionDatos.style.display = 'none';
    formData.style.display = 'block';
    errorMsg.style.display = 'none';
  });
}

// --- Guardar imagen (CORREG) ---
if (guardarBtn) {
  guardarBtn.addEventListener('click', async () => {
    try {
      const elementToCapture = document.querySelector('#entradaGenerada .ticket-img-wrap');
      if (!elementToCapture) return alert('Ticket no encontrado');

      // ✅ Crear clon con diseño FIJO (como en PC) para que sea igual en todos los dispositivos
      const clone = elementToCapture.cloneNode(true);

      // Forzar tamaño fijo para consistencia (500x170 px = aspect-ratio 500/170)
      clone.style.width = '500px';
      clone.style.height = '170px';
      clone.style.aspectRatio = '500 / 170';
      clone.style.borderRadius = '0'; // ← Elimina bordes redondeados
      clone.style.boxShadow = 'none';
      clone.style.overflow = 'visible';

      // Eliminar bordes redondeados en elementos internos
      const bg = clone.querySelector('.ticket-bg');
      if (bg) {
        bg.style.borderRadius = '0';
        bg.style.objectFit = 'cover';
      }
      const qrAbs = clone.querySelector('.qr-absolute');
      if (qrAbs) {
        qrAbs.style.position = 'absolute';
        qrAbs.style.top = '50%';
        qrAbs.style.left = '100px'; // Ajuste fino para alinear con la primera imagen
        qrAbs.style.transform = 'translate(-50%, -50%)';
        qrAbs.style.background = 'transparent';
        qrAbs.style.boxShadow = 'none';
        qrAbs.style.padding = '0';
      }

      // Insertar clon fuera de vista
      clone.style.position = 'fixed';
      clone.style.left = '-10000px';
      clone.style.top = '0';
      clone.style.backgroundColor = '#ffffff';
      document.body.appendChild(clone);

      // Regenerar QR en el clon (para que use los valores actuales)
      const clonedQr = clone.querySelector('#qrCanvas');
      if (clonedQr) {
        const datosQR = `${outNombre.textContent}\n${outCedula.textContent}\n${outEdad.textContent}\n${outCodigo.textContent}`;
        QRCode.toCanvas(clonedQr, datosQR, { width: 70, height: 70, margin: 1 }, () => {});
      }

      await new Promise(r => setTimeout(r, 200));

      // Capturar con html2canvas
      const html2canvas = (await import('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.esm.min.js')).default;
      const canvas = await html2canvas(clone, {
        useCORS: true,
        scale: 5, // Alta resolución
        backgroundColor: '#ffffff',
        logging: false,
        width: 500,
        height: 170
      });

      // Crear canvas final de 2500x960 (proporción 2500:960 ≈ 500:192 → pero usamos 500x170 para mantener el diseño original)
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = 2500;
      finalCanvas.height = 960;
      const ctx = finalCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 2500, 960);
      ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 2500, 960);

      // Descargar
      const link = document.createElement('a');
      link.download = `Entrada_${outCodigo.textContent || '000'}.jpg`;
      link.href = finalCanvas.toDataURL('image/jpeg', 0.9);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      document.body.removeChild(clone);

      alert('¡Descargada! La imagen es rectangular y se ve igual en PC, móvil y tablet.');

    } catch (e) {
      console.error("Error al guardar:", e);
      alert('Error: ' + e.message);
    }
  });
}

console.log("form.js cargado — ticket consistente en todos los dispositivos, descarga rectangular.");
