// Importar Supabase
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.4/+esm";

// 🔑 CONFIGURACIÓN — ¡VALIDADA!
const SUPABASE_URL = 'https://tljnvaveeoptlbcugbmk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsam52YXZlZW9wdGxiY3VnYm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTc4ODUsImV4cCI6MjA3ODM3Mzg4NX0.hucHM1tnNxZ0_th6bEKVjeVe-FUO-JPrwjxAkSsWRcs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PASSWORD = 'admin123';

const loginSection = document.getElementById('loginSection');
const adminPanel = document.getElementById('adminPanel');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const createForm = document.getElementById('createForm');
const formNameInput = document.getElementById('formName');
const minAgeInput = document.getElementById('minAge');
const maxAgeInput = document.getElementById('maxAge');
const formBgInput = document.getElementById('formBgInput');
const formulariosTableBody = document.querySelector('#formulariosTable tbody');

let formulariosCache = [];

async function cargarFormularios() {
  const { data, error } = await supabase
    .from('formularios')
    .select('id, codigo_form, nombre, imagen_url, min_age, max_age')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error cargando formularios:", error);
    formulariosCache = [];
  } else {
    formulariosCache = data.map(f => ({
      db_id: f.id,
      codigo: f.codigo_form,
      nombre: f.nombre,
      imagenFondoUrl: f.imagen_url || '',
      min_age: f.min_age,
      max_age: f.max_age
    }));
  }
  renderFormularios();
}

function generarCodigoFormulario() {
  return 'FORM' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function renderFormularios() {
  formulariosTableBody.innerHTML = '';
  formulariosCache.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${f.codigo}</td>
      <td>${f.nombre}</td>
      <td><img src="${f.imagenFondoUrl}" alt="Fondo" class="thumb" style="width:60px;height:auto;" /></td>
      <td>
        <a href="form.html?id=${f.codigo}" target="_blank">Formulario</a> |
        <a href="respuestas.html?id=${f.codigo}" target="_blank">Lista de Datos</a> |
        <a href="referencia.html?id_formulario=${f.codigo}" target="_blank">Referencias</a> |
        <button class="delete-btn" onclick="borrarFormulario('${f.codigo}', '${f.db_id}')">Borrar</button>
      </td>
    `;
    formulariosTableBody.appendChild(tr);
  });
}

createForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = formNameInput.value.trim();
  if (!nombre) return alert('Ingrese un nombre');

  let minAge = null;
  const minAgeValue = minAgeInput.value.trim();
  if (minAgeValue) {
    minAge = parseInt(minAgeValue);
    if (isNaN(minAge) || minAge < 0) return alert('Edad mínima inválida.');
  }

  let maxAge = null;
  const maxAgeValue = maxAgeInput.value.trim();
  if (maxAgeValue) {
    maxAge = parseInt(maxAgeValue);
    if (isNaN(maxAge) || maxAge < 0) return alert('Edad máxima inválida.');
  }

  if (minAge !== null && maxAge !== null && minAge > maxAge) {
    return alert('La edad mínima no puede ser mayor que la máxima.');
  }

  const file = formBgInput.files[0] || null;
  let imagenUrl = null;

  if (file) {
    const filePath = `public/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const { error: uploadError } = await supabase.storage.from('form-backgrounds').upload(filePath, file);
    if (!uploadError) {
      const { data } = supabase.storage.from('form-backgrounds').getPublicUrl(filePath);
      imagenUrl = data.publicUrl;
    }
  }

  const codigoForm = generarCodigoFormulario();
  const nuevoFormulario = { codigo_form: codigoForm, nombre, min_age: minAge, max_age: maxAge, imagen_url: imagenUrl };

  const { error: insertError } = await supabase.from('formularios').insert([nuevoFormulario]);

  if (insertError) {
    console.error("Error al crear formulario:", insertError);
    alert(`No se pudo crear: ${insertError.message}`);
    return;
  }

  alert(`✅ Formulario creado: ${codigoForm}`);
  await cargarFormularios();
  createForm.reset();
});

window.borrarFormulario = async function(codigoForm, db_id) {
  if (!confirm(`¿Borrar "${codigoForm}" y todos sus datos?`)) return;

  try {
    await supabase.from('respuestas').delete().eq('formulario_id', db_id);
    await supabase.from('contadores_formularios').delete().eq('formulario_id', db_id);
    
    const { data: formData } = await supabase.from('formularios').select('imagen_url').eq('id', db_id).single();
    if (formData?.imagen_url) {
      const path = formData.imagen_url.split('/').slice(-2).join('/');
      await supabase.storage.from('form-backgrounds').remove([path]);
    }

    await supabase.from('formularios').delete().eq('id', db_id);
    alert(`✅ Eliminado: ${codigoForm}`);
    await cargarFormularios();
  } catch (e) {
    console.error("Error al borrar:", e);
    alert(`❌ Error: ${e.message}`);
  }
};

loginBtn.addEventListener('click', () => {
  if (passwordInput.value === PASSWORD) {
    loginError.style.display = 'none';
    loginSection.style.display = 'none';
    adminPanel.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    cargarFormularios();
  } else {
    loginError.style.display = 'block';
  }
});

logoutBtn.addEventListener('click', () => {
  loginSection.style.display = 'block';
  adminPanel.style.display = 'none';
  logoutBtn.style.display = 'none';
  passwordInput.value = '';
  loginError.style.display = 'none';
  formulariosCache = [];
  renderFormularios();
});

