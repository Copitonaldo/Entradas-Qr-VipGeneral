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

// --- Evento: Enviar formulario (botón "Generar QR") ---
if (formData) {
  formData.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorMsg.style.display = 'none';

    // Validar que los elementos existan
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
    if (isNaN(edad) || edad < 0) {
        errorMsg.textContent = 'Edad inválida.';
        errorMsg.style.display = 'block';
        return;
    }
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
        tipo_entrada: validRef.datosReferencia.tipo_entrada
      };
      if (numero) nuevaRespuesta.numero_telefono = numero;
      if (correo) nuevaRespuesta.correo_electronico = correo;

      const { data: insertData, error: insErr } = await supabase.from('respuestas').insert([nuevaRespuesta]).select().single();
      if (insErr) throw insErr;

      await decrementarUsoReferencia(validRef.datosReferencia.id);

      // Mostrar ticket
      if (outNombre) outNombre.textContent = insertData.nombre_completo;
      if (outCedula) outCedula.textContent = formatCedula(insertData.cedula);
      if (outEdad) outEdad.textContent = `${insertData.edad} años`;
      if (outNumero) outNumero.textContent = insertData.numero_telefono || '-';
      if (outCorreo) outCorreo.textContent = insertData.correo_electronico || '-';
      if (outCodigo) outCodigo.textContent = insertData.codigo_secuencial;
      if (outReferencia) outReferencia.textContent = insertData.referencia_usada;
      if (outReferenciaContenedor) outReferenciaContenedor.style.display = 'block';

      if (outTipoEntrada && insertData.tipo_entrada) {
        outTipoEntrada.textContent = insertData.tipo_entrada;
        if (outTipoEntradaContenedor) outTipoEntradaContenedor.style.display = 'block';
      }
      if (codigoQR) codigoQR.textContent = "Código: " + insertData.codigo_secuencial;

      const formDisplayName = (formTitleElement ? formTitleElement.textContent : "Evento").replace("Formulario: ", "").trim();
      let datosQR = `${formDisplayName}
Nombre: ${insertData.nombre_completo}
Cédula: ${insertData.cedula}
Edad: ${insertData.edad}
Código: ${insertData.codigo_secuencial}`;
      if (insertData.numero_telefono) datosQR += `\nNúmero: ${insertData.numero_telefono}`;
      if (insertData.correo_electronico) datosQR += `\nCorreo: ${insertData.correo_electronico}`;
      if (insertData.referencia_usada) datosQR += `\nRef: ${insertData.referencia_usada}`;
      if (insertData.tipo_entrada) datosQR += `\nTipo: ${insertData.tipo_entrada}`;

      if (qrCanvas) {
        QRCode.toCanvas(qrCanvas, datosQR, { width: 70, height: 70, margin: 1 }, err => {
          if (err) console.error('Error QR:', err);
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
      console.log("Iniciando captura de imagen...");
      if (typeof html2canvas === 'undefined') {
        throw new Error('La librería html2canvas no se ha cargado correctamente.');
      }

      const elementToCapture = document.querySelector('#entradaGenerada .ticket-img-wrap');
      if (!elementToCapture) return alert('No se pudo encontrar el ticket');

      // Crear clon para la captura
      const clone = elementToCapture.cloneNode(true);
      const targetWidth = 2500;
      const targetHeight = 960;
      const baseWidth = elementToCapture.offsetWidth || 500;
      const baseHeight = elementToCapture.offsetHeight || 170;

      // Estilo del clon (fuera de vista)
      clone.style.width = `${baseWidth}px`;
      clone.style.height = `${baseHeight}px`;
      clone.style.position = 'fixed';
      clone.style.left = '-10000px';
      clone.style.top = '0';
      clone.style.backgroundColor = '#ffffff';
      clone.style.borderRadius = '0'; // Remover borde redondeado del contenedor para la descarga
      document.body.appendChild(clone);

      // Remover borde redondeado de elementos internos en el clon
      const cloneBg = clone.querySelector('.ticket-bg');
      if (cloneBg) cloneBg.style.borderRadius = '0';

      // Ajustar posición del QR en el clon para que coincida con la solicitud (más a la izquierda)
      const qrAbsolute = clone.querySelector('.qr-absolute');
      if (qrAbsolute) {
        qrAbsolute.style.position = 'absolute';
        qrAbsolute.style.top = '50%';
        qrAbsolute.style.left = '100px'; // Reducido de 150px para mover más a la izquierda
        qrAbsolute.style.transform = 'translate(-50%, -50%)';
        qrAbsolute.style.display = 'flex';
        qrAbsolute.style.flexDirection = 'column';
        qrAbsolute.style.alignItems = 'center';
        qrAbsolute.style.background = 'rgba(255, 255, 255, 0.9)';
        qrAbsolute.style.padding = '6px';
        qrAbsolute.style.borderRadius = '0'; // Remover borde redondeado del fondo del QR
      }

      const clonedCanvas = clone.querySelector('#qrCanvas');
      if (clonedCanvas) clonedCanvas.style.borderRadius = '0'; // Remover borde redondeado del canvas QR
      if (clonedCanvas) {
        const formDisplayName = (formTitleElement ? formTitleElement.textContent : "Evento").replace("Formulario: ", "").trim();
        let datosQR = `${formDisplayName}\nNombre: ${outNombre ? outNombre.textContent : ''}\nCédula: ${outCedula ? outCedula.textContent.replace(/\./g, '') : ''}\nEdad: ${outEdad ? outEdad.textContent : ''}\nCódigo: ${outCodigo ? outCodigo.textContent : ''}`;
        
        if (outNumero && outNumero.textContent && outNumero.textContent !== '-') datosQR += `\nNúmero: ${outNumero.textContent}`;
        if (outCorreo && outCorreo.textContent && outCorreo.textContent !== '-') datosQR += `\nCorreo: ${outCorreo.textContent}`;
        if (outReferencia && outReferencia.textContent) datosQR += `\nRef: ${outReferencia.textContent}`;
        if (outTipoEntrada && outTipoEntrada.textContent) datosQR += `\nTipo: ${outTipoEntrada.textContent}`;

        await new Promise(resolve => {
          QRCode.toCanvas(clonedCanvas, datosQR, { width: 70, height: 70, margin: 1 }, resolve);
        });
      }

      await new Promise(r => setTimeout(r, 250));

      console.log("Generando canvas con html2canvas...");
      const canvas = await html2canvas(clone, {
        useCORS: true,
        scale: targetWidth / baseWidth,
        backgroundColor: '#ffffff',
        logging: true
      });

      console.log("Redimensionando a 2500x960...");
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = targetWidth;
      finalCanvas.height = targetHeight;
      const ctx = finalCanvas.getContext('2d');
      // Dibujar el canvas capturado en el canvas final de alta resolución
      ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, targetWidth, targetHeight);

      console.log("Iniciando descarga...");
      const link = document.createElement('a');
      const nombre = (outNombre ? outNombre.textContent.trim() : 'Entrada');
      const safeCodigo = (outCodigo ? outCodigo.textContent.trim() : '');
      const fileName = `${safeCodigo}${nombre}.jpg`;
      
      link.download = fileName;
      link.href = finalCanvas.toDataURL('image/jpeg', 0.9);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpieza
      document.body.removeChild(clone);
      console.log("Proceso completado con éxito.");
    } catch (e) {
      console.error("Error detallado al guardar imagen:", e);
      alert('Error al guardar imagen: ' + e.message);
    }
  });
}

console.log("form.js cargado.");
