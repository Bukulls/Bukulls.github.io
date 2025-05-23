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
  measurementId: "G-K98Q6XWTFT"                    // Tu Measurement ID (opcional para Firestore, pero está bien dejarlo)
};

// Inicializar Firebase con la configuración
firebase.initializeApp(firebaseConfig);

// Obtener una instancia de Firestore Database, Firebase Auth y Firebase Storage
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage(); // Asegúrate de que esta línea esté si planeas usar Storage

// =======================================================================
// SECCIÓN 2: CÓDIGO JAVASCRIPT PARA LA PÁGINA
// =======================================================================
document.addEventListener('DOMContentLoaded', function() {

    // --- LÓGICA DE AUTENTICACIÓN DE ADMIN (PRUEBA) ---
    const adminEmailInput = document.getElementById('admin-email');
    const adminPasswordInput = document.getElementById('admin-password');
    const btnAdminLogin = document.getElementById('btn-admin-login');
    const btnAdminRegister = document.getElementById('btn-admin-register');
    const btnAdminLogout = document.getElementById('btn-admin-logout');
    const adminStatusDiv = document.getElementById('admin-status');

    // Registrar un nuevo usuario administrador (solo necesitas hacerlo una vez)
    if (btnAdminRegister && adminEmailInput && adminPasswordInput) {
        console.log("Botón de registro de admin ENCONTRADO y configurado.");
        btnAdminRegister.addEventListener('click', function() {
            console.log("Botón 'Registrar Admin' FUE CLICKEADO.");
            const email = adminEmailInput.value;
            const password = adminPasswordInput.value;

            console.log("Email para registrar:", email, "Password:", password);

            if (!email || !password) {
                alert("Por favor, ingresa email y contraseña para registrar.");
                return;
            }
            
            if (auth && typeof auth.createUserWithEmailAndPassword === 'function') {
                console.log("Llamando a auth.createUserWithEmailAndPassword...");
                auth.createUserWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        console.log("Usuario administrador registrado:", user);
                        alert("¡Usuario administrador registrado con éxito! Ahora puedes iniciar sesión.");
                        if(adminStatusDiv) adminStatusDiv.textContent = "Admin registrado. Por favor, inicia sesión.";
                    })
                    .catch((error) => {
                        console.error("Error al registrar administrador:", error);
                        alert("Error al registrar: " + error.message);
                    });
            } else {
                console.error("'auth' o 'auth.createUserWithEmailAndPassword' no está definido. ¿Se cargó el SDK de Firebase Auth?");
                alert("Error de configuración de Firebase Auth. Revisa la consola.");
            }
        });
    } else {
        console.warn("Elementos para registro de admin (botón o inputs) NO encontrados. Verifica los IDs en HTML.");
    }

    // Iniciar sesión como administrador
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
                    const user = userCredential.user;
                    console.log("Administrador ha iniciado sesión:", user);
                    alert("¡Inicio de sesión exitoso!");
                })
                .catch((error) => {
                    console.error("Error al iniciar sesión:", error);
                    alert("Error al iniciar sesión: " + error.message);
                });
        });
    } else {
        console.warn("Elementos para login de admin (botón o inputs) NO encontrados.");
    }

    // Cerrar sesión
    if (btnAdminLogout) {
        btnAdminLogout.addEventListener('click', function() {
            auth.signOut().then(() => {
                console.log("Sesión cerrada.");
                alert("Has cerrado sesión.");
            }).catch((error) => {
                console.error("Error al cerrar sesión:", error);
                alert("Error al cerrar sesión: " + error.message);
            });
        });
    }

    // Observador del estado de autenticación (muy importante)
    auth.onAuthStateChanged(function(user) { // Corregido: 'function(user)' en lugar de '(user) =>' para mantener consistencia con tu estilo, aunque arrow function es válida.
        const adminPanel = document.getElementById('admin-panel'); 

        if (user) {
            console.log("Usuario actualmente conectado:", user.email);
            if (adminStatusDiv) adminStatusDiv.textContent = "Sesión iniciada como: " + user.email;
            if (btnAdminLogin) btnAdminLogin.style.display = 'none';
            if (btnAdminRegister) btnAdminRegister.style.display = 'none';
            if (btnAdminLogout) btnAdminLogout.style.display = 'inline-block';
            if (adminPanel) adminPanel.style.display = 'block'; 
        } else {
            console.log("Ningún usuario conectado.");
            if (adminStatusDiv) adminStatusDiv.textContent = "No has iniciado sesión.";
            if (btnAdminLogin) btnAdminLogin.style.display = 'inline-block';
            if (btnAdminRegister) btnAdminRegister.style.display = 'inline-block';
            if (btnAdminLogout) btnAdminLogout.style.display = 'none';
            if (adminPanel) adminPanel.style.display = 'none'; 
        }
    }); // Fin de auth.onAuthStateChanged

    // --- Código del botón "Leer más" ---
    const botonLeerMas = document.getElementById('btn-leer-mas');
    const masInfoDiv = document.getElementById('mas-info-nosotros');

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
    } else {
        // Esta advertencia es útil si los elementos no siempre están presentes
        // if (!botonLeerMas) console.warn("Elemento 'btn-leer-mas' no encontrado."); 
        // if (!masInfoDiv) console.warn("Elemento 'mas-info-nosotros' no encontrado.");
    }

    // --- Código para el Modal de Agendar Cita (abrir/cerrar modal) ---
    const modalAgendar = document.getElementById('modal-agendar');
    const btnAbrirModal = document.getElementById('btn-abrir-modal-agendar');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const formAgendar = document.getElementById('form-agendar');

    function abrirModal() {
        if (modalAgendar) {
            modalAgendar.style.display = 'block';
        }
    }

    function cerrarModal() {
        if (modalAgendar) {
            modalAgendar.style.display = 'none';
        }
    }

    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', abrirModal);
    } else {
        // console.warn("Botón 'btn-abrir-modal-agendar' no encontrado.");
    }

    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', cerrarModal);
    } else {
        // console.warn("Botón 'btn-cerrar-modal' no encontrado.");
    }

    if (modalAgendar) {
            window.addEventListener('click', function(event) {
                if (event.target === modalAgendar) {
                    cerrarModal();
                }
            });
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
                nombre: nombre,
                telefono: telefono,
                email: email,
                servicio: servicio,
                fecha: fecha,
                mensaje: mensaje,
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
                    alert('Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde. Detalles del error: ' + error.message);
                });
        });
    } else {
        // console.warn("Formulario 'form-agendar' no encontrado.");
    }
    const formIngresoVehiculo = document.getElementById('form-ingreso-vehiculo');
    const vehiculoImagenesInput = document.getElementById('vehiculo-imagenes');
    const previsualizacionDiv = document.getElementById('previsualizacion-imagenes');

    // Opcional: Previsualización de imágenes seleccionadas
    if (vehiculoImagenesInput && previsualizacionDiv) {
        vehiculoImagenesInput.addEventListener('change', function(event) {
            previsualizacionDiv.innerHTML = ''; // Limpiar previsualizaciones anteriores
            const files = event.target.files;
            if (files) {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (file.type.startsWith('image/')){
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const img = document.createElement('img');
                            img.src = e.target.result;
                            img.style.maxWidth = '100px';
                            img.style.maxHeight = '100px';
                            img.style.margin = '5px';
                            previsualizacionDiv.appendChild(img);
                        }
                        reader.readAsDataURL(file);
                    }
                }
            }
        });
    }


    if (formIngresoVehiculo) {
        formIngresoVehiculo.addEventListener('submit', async function(event) { // Hacemos la función async para usar await
            event.preventDefault();
            console.log("Formulario de ingreso de vehículo enviado.");

            // Verificar si el usuario está autenticado (solo admin debería poder hacer esto)
            const currentUser = auth.currentUser;
            if (!currentUser) {
                alert("Debes iniciar sesión como administrador para guardar vehículos.");
                console.warn("Intento de guardar vehículo sin iniciar sesión.");
                return;
            }

            // Obtener datos del formulario
            const patente = document.getElementById('vehiculo-patente').value.trim();
            const marca = document.getElementById('vehiculo-marca').value.trim();
            const modelo = document.getElementById('vehiculo-modelo').value.trim();
            const ano = document.getElementById('vehiculo-ano').value;
            const clienteNombre = document.getElementById('vehiculo-cliente-nombre').value.trim();
            const clienteTelefono = document.getElementById('vehiculo-cliente-telefono').value.trim();
            const descripcionTrabajo = document.getElementById('vehiculo-descripcion-trabajo').value.trim();
            const imagenesSeleccionadas = vehiculoImagenesInput.files; // Es un FileList

            if (!patente || !marca || !modelo || !ano || !descripcionTrabajo) {
                alert("Por favor, completa todos los campos obligatorios del vehículo (Patente, Marca, Modelo, Año, Descripción del Trabajo).");
                return;
            }

            // Deshabilitar el botón de submit para evitar envíos múltiples mientras se procesa
            const submitButton = formIngresoVehiculo.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Guardando...';

            try {
                const urlsImagenes = [];
                if (imagenesSeleccionadas && imagenesSeleccionadas.length > 0) {
                    console.log(`Subiendo ${imagenesSeleccionadas.length} imágenes...`);
                    for (let i = 0; i < imagenesSeleccionadas.length; i++) {
                        const imagen = imagenesSeleccionadas[i];
                        // Crear una referencia en Firebase Storage (ej: vehiculos/patente_nombrearchivo_timestamp.jpg)
                        const nombreArchivo = `${patente}_${imagen.name}_${Date.now()}`;
                        const storageRef = storage.ref(`vehiculos/${nombreArchivo}`);
                        
                        console.log(`Subiendo archivo: ${imagen.name} como ${nombreArchivo}`);
                        const uploadTaskSnapshot = await storageRef.put(imagen); // Subir el archivo
                        const downloadURL = await uploadTaskSnapshot.ref.getDownloadURL(); // Obtener la URL de descarga
                        urlsImagenes.push(downloadURL);
                        console.log(`Archivo ${imagen.name} subido. URL: ${downloadURL}`);
                    }
                } else {
                    console.log("No se seleccionaron imágenes para subir.");
                }

                // Crear el objeto de datos del vehículo para Firestore
                const datosVehiculo = {
                    patente: patente,
                    marca: marca,
                    modelo: modelo,
                    ano: parseInt(ano), // Guardar como número
                    clienteNombre: clienteNombre,
                    clienteTelefono: clienteTelefono,
                    descripcionTrabajo: descripcionTrabajo,
                    imagenesURLs: urlsImagenes, // Array con las URLs de las imágenes
                    registradoPor: currentUser.email, // Guardar quién lo registró
                    registradoEl: firebase.firestore.FieldValue.serverTimestamp()
                };

                // Guardar en Firestore en una nueva colección "vehiculos"
                console.log("Guardando datos del vehículo en Firestore:", datosVehiculo);
                const docRef = await db.collection("vehiculos").add(datosVehiculo);
                
                console.log("Vehículo registrado en Firestore con ID: ", docRef.id);
                alert(`¡Vehículo con patente ${patente} guardado con éxito!`);
                formIngresoVehiculo.reset(); // Limpiar el formulario
                if(previsualizacionDiv) previsualizacionDiv.innerHTML = ''; // Limpiar previsualizaciones

            } catch (error) {
                console.error("Error al guardar el vehículo: ", error);
                alert("Hubo un error al guardar el vehículo. Revisa la consola para más detalles. Error: " + error.message);
            } finally {
                // Volver a habilitar el botón de submit
                submitButton.disabled = false;
                submitButton.textContent = 'Guardar Vehículo';
            }
        });
    } else {
        console.warn("Formulario 'form-ingreso-vehiculo' no encontrado.");
    }

}); // FIN de document.addEventListener('DOMContentLoaded', ...)