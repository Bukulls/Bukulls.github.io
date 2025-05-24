// =======================================================================
// SECCIÓN 1: CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
// =======================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAySrOuWY7Zr7Etq_iFKSFLiWsng3KTkXA", // Tu API Key
  authDomain: "edc-automotriz.firebaseapp.com",     // Tu Auth Domain
  projectId: "edc-automotriz",                     // Tu Project ID
  storageBucket: "edc-automotriz.firebasestorage.app", // Tu Storage Bucket
  messagingSenderId: "387959087823",               // Tu Sender ID
  appId: "1:387959087823:web:03469bf7d12f4e78674dba", // Tu App ID
  measurementId: "G-K98Q6XWTFT"                    // Tu Measurement ID
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// =======================================================================
// SECCIÓN 2: CÓDIGO JAVASCRIPT PARA LA PÁGINA
// =======================================================================
document.addEventListener('DOMContentLoaded', function() {

    // --- IDs DE ELEMENTOS HTML ---
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasswordInput = document.getElementById('admin-password');
    const btnAdminLogin = document.getElementById('btn-admin-login');
    const btnAdminRegister = document.getElementById('btn-admin-register');
    const btnAdminLogout = document.getElementById('btn-admin-logout');
    const adminStatusDiv = document.getElementById('admin-status');
    const adminPanel = document.getElementById('admin-panel');

    const botonLeerMas = document.getElementById('btn-leer-mas');
    const masInfoDiv = document.getElementById('mas-info-nosotros');

    const modalAgendar = document.getElementById('modal-agendar');
    const btnAbrirModal = document.getElementById('btn-abrir-modal-agendar');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const formAgendar = document.getElementById('form-agendar');

    const formIngresoVehiculo = document.getElementById('form-ingreso-vehiculo');
    const vehiculoImagenesInput = document.getElementById('vehiculo-imagenes');
    const previsualizacionDiv = document.getElementById('previsualizacion-imagenes');
    const listaVehiculosDiv = document.getElementById('lista-vehiculos');
    
    // Variable para guardar el ID del vehículo que se está editando
    let editandoVehiculoId = null;


    // --- LÓGICA DE AUTENTICACIÓN DE ADMIN ---
    if (btnAdminRegister && adminEmailInput && adminPasswordInput) {
        btnAdminRegister.addEventListener('click', function() {
            const email = adminEmailInput.value;
            const password = adminPasswordInput.value;
            if (!email || !password) {
                alert("Por favor, ingresa email y contraseña para registrar.");
                return;
            }
            if (auth && typeof auth.createUserWithEmailAndPassword === 'function') {
                auth.createUserWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        console.log("Usuario administrador registrado:", userCredential.user);
                        alert("¡Usuario administrador registrado con éxito! Ahora puedes iniciar sesión.");
                        if(adminStatusDiv) adminStatusDiv.textContent = "Admin registrado. Por favor, inicia sesión.";
                    })
                    .catch((error) => {
                        console.error("Error al registrar administrador:", error);
                        alert("Error al registrar: " + error.message);
                    });
            } else {
                console.error("'auth' o 'auth.createUserWithEmailAndPassword' no está definido.");
                alert("Error de configuración de Firebase Auth.");
            }
        });
    } else {
        console.warn("Elementos para registro de admin NO encontrados.");
    }

    if (btnAdminLogin && adminEmailInput && adminPasswordInput) { 
        btnAdminLogin.addEventListener('click', function() {
            const email = adminEmailInput.value;
            const password = adminPasswordInput.value;
            if (!email || !password) {
                alert("Por favor, ingresa email y contraseña.");
                return;
            }
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log("Administrador ha iniciado sesión:", userCredential.user);
                    alert("¡Inicio de sesión exitoso!");
                })
                .catch((error) => {
                    console.error("Error al iniciar sesión:", error);
                    alert("Error al iniciar sesión: " + error.message);
                });
        });
    } else {
        console.warn("Elementos para login de admin NO encontrados.");
    }

    if (btnAdminLogout) {
        btnAdminLogout.addEventListener('click', function() {
            auth.signOut().then(() => {
                console.log("Sesión cerrada.");
                alert("Has cerrado sesión.");
                editandoVehiculoId = null; // Resetear ID de edición al cerrar sesión
                if(formIngresoVehiculo) formIngresoVehiculo.reset();
                if(previsualizacionDiv) previsualizacionDiv.innerHTML = '';
            }).catch((error) => {
                console.error("Error al cerrar sesión:", error);
                alert("Error al cerrar sesión: " + error.message);
            });
        });
    }

    auth.onAuthStateChanged(function(user) { 
        if (user) {
            console.log("Usuario actualmente conectado:", user.email);
            if (adminStatusDiv) adminStatusDiv.textContent = "Sesión iniciada como: " + user.email;
            if (btnAdminLogin) btnAdminLogin.style.display = 'none';
            if (btnAdminRegister) btnAdminRegister.style.display = 'none';
            if (btnAdminLogout) btnAdminLogout.style.display = 'inline-block';
            if (adminPanel) {
                adminPanel.style.display = 'block'; 
                cargarYMostrarVehiculos(); 
            }
        } else {
            console.log("Ningún usuario conectado.");
            if (adminStatusDiv) adminStatusDiv.textContent = "No has iniciado sesión.";
            if (btnAdminLogin) btnAdminLogin.style.display = 'inline-block';
            if (btnAdminRegister) btnAdminRegister.style.display = 'inline-block';
            if (btnAdminLogout) btnAdminLogout.style.display = 'none';
            if (adminPanel) {
                adminPanel.style.display = 'none'; 
                if(listaVehiculosDiv) listaVehiculosDiv.innerHTML = '<p>Debes iniciar sesión para ver los vehículos.</p>';
            }
        }
    }); 

    // --- LÓGICA PARA MOSTRAR VEHÍCULOS INGRESADOS ---
    async function cargarYMostrarVehiculos() {
        if (!listaVehiculosDiv) return;
        const currentUser = auth.currentUser;
        if (currentUser) { 
            listaVehiculosDiv.innerHTML = '<p>Cargando vehículos...</p>'; 
            try {
                const querySnapshot = await db.collection("vehiculos")
                                            .orderBy("registradoEl", "desc") 
                                            .get();
                if (querySnapshot.empty) {
                    listaVehiculosDiv.innerHTML = '<p>Aún no hay vehículos registrados.</p>';
                    return;
                }
                let htmlVehiculos = '<ul>';
                querySnapshot.forEach(doc => {
                    const vehiculo = doc.data();
                    const vehiculoId = doc.id; 
                    htmlVehiculos += `<li data-vehiculo-id="${vehiculoId}" style="border: 1px solid #555; margin-bottom: 15px; padding: 10px; list-style-type: none;">`;
                    htmlVehiculos += `<h4>Patente: ${vehiculo.patente || 'N/A'}</h4>`; // Quitamos el ID de aquí para más limpieza
                    htmlVehiculos += `<p><strong>Marca:</strong> ${vehiculo.marca || 'N/A'} - <strong>Modelo:</strong> ${vehiculo.modelo || 'N/A'} - <strong>Año:</strong> ${vehiculo.ano || 'N/A'}</p>`;
                    htmlVehiculos += `<p><strong>Cliente:</strong> ${vehiculo.clienteNombre || 'N/A'} - <strong>Tel:</strong> ${vehiculo.clienteTelefono || 'N/A'}</p>`;
                    htmlVehiculos += `<p><strong>Trabajo a realizar:</strong> ${vehiculo.descripcionTrabajo || 'N/A'}</p>`;
                    htmlVehiculos += `<p><small>Registrado por: ${vehiculo.registradoPor || 'N/A'} el ${vehiculo.registradoEl ? new Date(vehiculo.registradoEl.seconds * 1000).toLocaleString() : 'N/A'} (ID: ${vehiculoId})</small></p>`;
                    if (vehiculo.imagenesURLs && vehiculo.imagenesURLs.length > 0) {
                        htmlVehiculos += '<p><strong>Imágenes:</strong></p><div>';
                        vehiculo.imagenesURLs.forEach(url => {
                            htmlVehiculos += `<img src="${url}" alt="Imagen vehículo ${vehiculo.patente}" style="max-width: 150px; max-height: 150px; margin: 5px; border: 1px solid #ddd;">`;
                        });
                        htmlVehiculos += '</div>';
                    }
                    htmlVehiculos += `<div style="margin-top: 10px;">`;
                    htmlVehiculos += `<button class="btn-editar-vehiculo" data-id="${vehiculoId}">Editar</button> `;
                    htmlVehiculos += `<button class="btn-borrar-vehiculo" data-id="${vehiculoId}">Borrar</button>`;
                    htmlVehiculos += `</div></li>`;
                });
                htmlVehiculos += '</ul>';
                listaVehiculosDiv.innerHTML = htmlVehiculos;
            } catch (error) {
                console.error("Error al cargar vehículos: ", error);
                let mensajeError = '<p style="color:red;">Error al cargar los vehículos. Revisa la consola.';
                if (error.code === 'failed-precondition' && error.message.includes('index')) {
                    mensajeError += '<br>Este error puede requerir la creación de un índice en Firestore. Por favor, revisa la consola para ver un enlace y créalo.';
                }
                mensajeError += '</p>';
                listaVehiculosDiv.innerHTML = mensajeError;
            }
        } else {
            listaVehiculosDiv.innerHTML = '<p>Debes iniciar sesión para ver los vehículos.</p>';
        }
    }
    
    // --- EVENT LISTENER DELEGADO PARA BOTONES DE EDITAR Y BORRAR ---
    if (listaVehiculosDiv) {
        listaVehiculosDiv.addEventListener('click', async function(event) {
            const target = event.target;
            const vehiculoId = target.dataset.id;

            // --- LÓGICA PARA BORRAR VEHÍCULO ---
            if (target.classList.contains('btn-borrar-vehiculo')) {
                const listItem = target.closest('li');
                const patenteConfirm = listItem ? (listItem.querySelector('h4') ? listItem.querySelector('h4').textContent : `ID: ${vehiculoId}`) : `ID: ${vehiculoId}`;

                if (confirm(`¿Estás seguro de que quieres borrar ${patenteConfirm}? Esta acción no se puede deshacer.`)) {
                    console.log(`Intentando borrar vehículo con ID: ${vehiculoId}`);
                    try {
                        const docRef = db.collection("vehiculos").doc(vehiculoId);
                        const docSnap = await docRef.get();

                        if (docSnap.exists) {
                            const vehiculoData = docSnap.data();
                            if (vehiculoData.imagenesURLs && vehiculoData.imagenesURLs.length > 0) {
                                console.log("Borrando imágenes de Firebase Storage...");
                                const promesasBorradoImagenes = vehiculoData.imagenesURLs.map(async (urlImagen) => {
                                    try {
                                        const urlDecodificada = decodeURIComponent(urlImagen);
                                        const rutaArchivo = urlDecodificada.substring(
                                            urlDecodificada.indexOf('/o/') + 3,
                                            urlDecodificada.indexOf('?alt=media')
                                        );
                                        if (rutaArchivo) {
                                            const imagenStorageRef = storage.ref(rutaArchivo);
                                            await imagenStorageRef.delete();
                                            console.log(`Imagen ${rutaArchivo} borrada de Storage.`);
                                        }
                                    } catch (imgError) {
                                        console.error("Error al borrar una imagen de Storage:", imgError, "URL:", urlImagen);
                                    }
                                });
                                await Promise.all(promesasBorradoImagenes);
                                console.log("Proceso de borrado de imágenes de Storage completado.");
                            }
                        }
                        await db.collection("vehiculos").doc(vehiculoId).delete();
                        console.log("Vehículo borrado de Firestore con ID: ", vehiculoId);
                        alert(`Vehículo ${patenteConfirm} borrado con éxito.`);
                        cargarYMostrarVehiculos(); 
                    } catch (error) {
                        console.error("Error al borrar el vehículo: ", error);
                        alert("Error al borrar el vehículo: " + error.message);
                    }
                }
            }

            // --- LÓGICA PARA EDITAR VEHÍCULO (CARGAR DATOS AL FORMULARIO) ---
            if (target.classList.contains('btn-editar-vehiculo')) {
                console.log(`Editar vehículo con ID: ${vehiculoId}`);
                try {
                    const docRef = db.collection("vehiculos").doc(vehiculoId);
                    const docSnap = await docRef.get();
                    if (docSnap.exists()) {
                        const vehiculo = docSnap.data();
                        document.getElementById('vehiculo-patente').value = vehiculo.patente || '';
                        document.getElementById('vehiculo-marca').value = vehiculo.marca || '';
                        document.getElementById('vehiculo-modelo').value = vehiculo.modelo || '';
                        document.getElementById('vehiculo-ano').value = vehiculo.ano || '';
                        document.getElementById('vehiculo-cliente-nombre').value = vehiculo.clienteNombre || '';
                        document.getElementById('vehiculo-cliente-telefono').value = vehiculo.clienteTelefono || '';
                        document.getElementById('vehiculo-descripcion-trabajo').value = vehiculo.descripcionTrabajo || '';
                        
                        // Manejo de previsualización de imágenes existentes (más complejo, por ahora solo limpiamos)
                        if(previsualizacionDiv) previsualizacionDiv.innerHTML = ''; 
                        if (vehiculo.imagenesURLs && vehiculo.imagenesURLs.length > 0) {
                            vehiculo.imagenesURLs.forEach(url => {
                                const img = document.createElement('img');
                                img.src = url;
                                img.style.maxWidth = '50px'; img.style.maxHeight = '50px'; img.style.margin = '2px';
                                if(previsualizacionDiv) previsualizacionDiv.appendChild(img);
                            });
                            if(previsualizacionDiv) previsualizacionDiv.insertAdjacentHTML('beforeend', '<p><small>Imágenes actuales. Selecciona nuevas para reemplazarlas o añadir (la lógica de reemplazo aún no está implementada).</small></p>');
                        }
                        
                        vehiculoImagenesInput.value = ''; // Resetear el input de archivos

                        editandoVehiculoId = vehiculoId; // Guardar el ID del vehículo que estamos editando
                        formIngresoVehiculo.querySelector('h3').textContent = `Editando Vehículo (Patente: ${vehiculo.patente})`;
                        formIngresoVehiculo.querySelector('button[type="submit"]').textContent = 'Actualizar Vehículo';
                        
                        // Scroll al formulario para facilitar la edición
                        formIngresoVehiculo.scrollIntoView({ behavior: 'smooth' });

                    } else {
                        alert("Vehículo no encontrado para editar.");
                        console.warn("Documento no encontrado para editar: ", vehiculoId);
                    }
                } catch (error) {
                    console.error("Error al cargar datos del vehículo para editar:", error);
                    alert("Error al cargar datos para editar: " + error.message);
                }
            }
        });
    }

    // --- Código del botón "Leer más" ---
    if (botonLeerMas && masInfoDiv) {
        botonLeerMas.addEventListener('click', function() {
            if (masInfoDiv.style.display === 'none' || masInfoDiv.style.display === '') {
                masInfoDiv.style.display = 'block';
                botonLeerMas.textContent = 'Leer menos';
            } else {
                masInfoDiv.style.display = 'none';
                botonLeerMas.textContent = 'Leer más';
            }
        });
    }

    // --- Código para el Modal de Agendar Cita ---
    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', abrirModal);
    } 
    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', cerrarModal);
    } 
    if (modalAgendar) {
        window.addEventListener('click', function(event) {
            if (event.target === modalAgendar) {
                cerrarModal();
            }
        });
    }
    function abrirModal() {
        if (modalAgendar) modalAgendar.style.display = 'block';
    }
    function cerrarModal() {
        if (modalAgendar) modalAgendar.style.display = 'none';
    }

    // --- Manejar el envío del formulario CON FIREBASE (CITAS) ---
    if (formAgendar) {
        formAgendar.addEventListener('submit', function(event) {
            event.preventDefault(); 
            const nombre = document.getElementById('nombre').value.trim();
            const telefono = document.getElementById('telefono').value.trim();
            const email = document.getElementById('email').value.trim();
            const servicio = document.getElementById('servicio-deseado').value;
            const fecha = document.getElementById('fecha-preferida').value;
            const mensaje = document.getElementById('mensaje').value.trim();

            if (!nombre || !telefono || !email) {
                alert('Por favor, completa los campos obligatorios: Nombre, Teléfono y Correo Electrónico.');
                return; 
            }
            const datosCita = {
                nombre, telefono, email, servicio, fecha, mensaje,
                registradoEl: firebase.firestore.FieldValue.serverTimestamp()
            };
            db.collection("citas").add(datosCita)
                .then((docRef) => {
                    console.log("Cita registrada en Firestore con ID: ", docRef.id);
                    alert('¡Gracias ' + nombre + '! Tu solicitud de cita ha sido registrada con éxito.');
                    formAgendar.reset(); 
                    cerrarModal(); 
                })
                .catch((error) => {
                    console.error("Error al registrar la cita en Firestore: ", error);
                    alert('Hubo un error al procesar tu solicitud. Error: ' + error.message);
                });
        });
    } 
    
    // --- LÓGICA PARA EL FORMULARIO DE INGRESO/EDICIÓN DE VEHÍCULOS ---
    if (vehiculoImagenesInput && previsualizacionDiv) {
        vehiculoImagenesInput.addEventListener('change', function(event) {
            if(editandoVehiculoId && previsualizacionDiv.querySelector('p > small') && previsualizacionDiv.querySelector('p > small').textContent.includes('Imágenes actuales')) {
                // Si estamos editando y ya hay previsualización de imágenes actuales, no las borramos al instante
                // El usuario debe verlas y decidir si sube nuevas para reemplazarlas
            } else {
                previsualizacionDiv.innerHTML = ''; 
            }
            const files = event.target.files;
            if (files) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (file.type.startsWith('image/')){
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const img = document.createElement('img');
                            img.src = e.target.result;
                            img.style.maxWidth = '100px'; img.style.maxHeight = '100px'; img.style.margin = '5px';
                            previsualizacionDiv.appendChild(img);
                        }
                        reader.readAsDataURL(file);
                    }
                }
                 if (files.length > 0 && editandoVehiculoId && previsualizacionDiv.querySelector('p > small') && previsualizacionDiv.querySelector('p > small').textContent.includes('Imágenes actuales')) {
                    previsualizacionDiv.querySelector('p > small').innerHTML = '<small>Nuevas imágenes seleccionadas (reemplazarán a las anteriores al guardar).</small>';
                }
            }
        });
    }

    if (formIngresoVehiculo) {
        formIngresoVehiculo.addEventListener('submit', async function(event) { 
            event.preventDefault();
            const currentUser = auth.currentUser;
            if (!currentUser) {
                alert("Debes iniciar sesión como administrador.");
                return;
            }

            const patente = document.getElementById('vehiculo-patente').value.trim();
            const marca = document.getElementById('vehiculo-marca').value.trim();
            const modelo = document.getElementById('vehiculo-modelo').value.trim();
            const ano = document.getElementById('vehiculo-ano').value;
            const clienteNombre = document.getElementById('vehiculo-cliente-nombre').value.trim();
            const clienteTelefono = document.getElementById('vehiculo-cliente-telefono').value.trim();
            const descripcionTrabajo = document.getElementById('vehiculo-descripcion-trabajo').value.trim();
            const imagenesNuevasSeleccionadas = vehiculoImagenesInput.files; 

            if (!patente || !marca || !modelo || !ano || !descripcionTrabajo) {
                alert("Por favor, completa Patente, Marca, Modelo, Año y Descripción del Trabajo.");
                return;
            }

            const submitButton = formIngresoVehiculo.querySelector('button[type="submit"]');
            const originalButtonText = editandoVehiculoId ? 'Actualizar Vehículo' : 'Guardar Vehículo';
            submitButton.disabled = true;
            submitButton.textContent = editandoVehiculoId ? 'Actualizando...' : 'Guardando...';

            try {
                let urlsImagenesNuevas = [];
                let urlsImagenesAntiguasParaBorrar = [];
                let urlsImagenesFinales = [];

                // Si estamos editando, obtenemos las URLs de las imágenes antiguas
                if (editandoVehiculoId) {
                    const docSnap = await db.collection("vehiculos").doc(editandoVehiculoId).get();
                    if (docSnap.exists() && docSnap.data().imagenesURLs) {
                        urlsImagenesFinales = [...docSnap.data().imagenesURLs]; // Copiamos las antiguas por defecto
                    }
                }

                // Subir nuevas imágenes si se seleccionaron
                if (imagenesNuevasSeleccionadas && imagenesNuevasSeleccionadas.length > 0) {
                    console.log(`Subiendo ${imagenesNuevasSeleccionadas.length} nuevas imágenes...`);
                    if (editandoVehiculoId && urlsImagenesFinales.length > 0) {
                        // Si estamos editando y hay imágenes nuevas, marcamos las antiguas para borrar
                        urlsImagenesAntiguasParaBorrar = [...urlsImagenesFinales];
                        urlsImagenesFinales = []; // Y empezamos de cero con las URLs para este guardado
                    }
                    for (let i = 0; i < imagenesNuevasSeleccionadas.length; i++) {
                        const imagen = imagenesNuevasSeleccionadas[i];
                        const nombreArchivo = `${patente}_${imagen.name}_${Date.now()}`;
                        const storageRef = storage.ref(`vehiculos/${nombreArchivo}`);
                        const uploadTaskSnapshot = await storageRef.put(imagen); 
                        const downloadURL = await uploadTaskSnapshot.ref.getDownloadURL(); 
                        urlsImagenesNuevas.push(downloadURL);
                    }
                    urlsImagenesFinales = urlsImagenesNuevas; // Usar solo las nuevas si se subieron nuevas
                    console.log("Nuevas imágenes subidas:", urlsImagenesFinales);

                    // Borrar imágenes antiguas de Storage si se reemplazaron
                    if (urlsImagenesAntiguasParaBorrar.length > 0) {
                        console.log("Borrando imágenes antiguas de Storage...", urlsImagenesAntiguasParaBorrar);
                        const promesasBorrado = urlsImagenesAntiguasParaBorrar.map(async (url) => {
                             try {
                                const urlDecodificada = decodeURIComponent(url);
                                const ruta = urlDecodificada.substring(urlDecodificada.indexOf('/o/') + 3, urlDecodificada.indexOf('?alt=media'));
                                if (ruta) await storage.ref(ruta).delete();
                            } catch (e) { console.error("Error borrando imagen antigua de Storage:", e, url); }
                        });
                        await Promise.all(promesasBorrado);
                        console.log("Imágenes antiguas borradas de Storage.");
                    }
                } else {
                    console.log("No se seleccionaron nuevas imágenes.");
                    // Si no se seleccionaron nuevas y no estamos editando, urlsImagenesFinales estará vacío.
                    // Si estamos editando y no se seleccionaron nuevas, urlsImagenesFinales ya tiene las antiguas.
                }

                const datosVehiculo = {
                    patente, marca, modelo, ano: parseInt(ano), clienteNombre, clienteTelefono, 
                    descripcionTrabajo, imagenesURLs: urlsImagenesFinales, registradoPor: currentUser.email,
                    // No actualizamos 'registradoEl' al editar, o lo hacemos con un campo 'actualizadoEl'
                    // Si es una nueva creación, añadimos 'registradoEl'
                    ...(editandoVehiculoId ? { actualizadoEl: firebase.firestore.FieldValue.serverTimestamp() } 
                                          : { registradoEl: firebase.firestore.FieldValue.serverTimestamp() })
                };

                if (editandoVehiculoId) {
                    console.log("Actualizando datos del vehículo en Firestore:", datosVehiculo);
                    await db.collection("vehiculos").doc(editandoVehiculoId).update(datosVehiculo);
                    alert(`¡Vehículo con patente ${patente} actualizado con éxito!`);
                } else {
                    console.log("Guardando nuevo vehículo en Firestore:", datosVehiculo);
                    await db.collection("vehiculos").add(datosVehiculo);
                    alert(`¡Vehículo con patente ${patente} guardado con éxito!`);
                }
                
                formIngresoVehiculo.reset(); 
                if(previsualizacionDiv) previsualizacionDiv.innerHTML = ''; 
                formIngresoVehiculo.querySelector('h3').textContent = 'Ingresar Nuevo Vehículo'; // Resetear título del form
                editandoVehiculoId = null; // Resetear ID de edición
                cargarYMostrarVehiculos(); 

            } catch (error) {
                console.error("Error al guardar/actualizar el vehículo: ", error);
                alert("Hubo un error. Revisa la consola. Error: " + error.message);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText; // Restaurar texto original
            }
        });
    } else {
        console.warn("Formulario 'form-ingreso-vehiculo' no encontrado.");
    }

}); // FIN de document.addEventListener('DOMContentLoaded', ...)