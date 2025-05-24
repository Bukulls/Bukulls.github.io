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
const storage = firebase.storage();

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

    // --- LÓGICA PARA MOSTRAR VEHÍCULOS INGRESADOS ---
    const listaVehiculosDiv = document.getElementById('lista-vehiculos');

    async function cargarYMostrarVehiculos() {
        if (!listaVehiculosDiv) {
            console.warn("Elemento 'lista-vehiculos' no encontrado en el DOM.");
            return;
        }

        const currentUser = auth.currentUser;
        if (currentUser) { 
            console.log("Cargando vehículos desde Firestore...");
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

                    htmlVehiculos += `<li style="border: 1px solid #555; margin-bottom: 15px; padding: 10px; list-style-type: none;">`;
                    htmlVehiculos += `<h4>Patente: ${vehiculo.patente || 'N/A'} (ID: ${vehiculoId})</h4>`;
                    htmlVehiculos += `<p><strong>Marca:</strong> ${vehiculo.marca || 'N/A'} - <strong>Modelo:</strong> ${vehiculo.modelo || 'N/A'} - <strong>Año:</strong> ${vehiculo.ano || 'N/A'}</p>`;
                    htmlVehiculos += `<p><strong>Cliente:</strong> ${vehiculo.clienteNombre || 'N/A'} - <strong>Tel:</strong> ${vehiculo.clienteTelefono || 'N/A'}</p>`;
                    htmlVehiculos += `<p><strong>Trabajo a realizar:</strong> ${vehiculo.descripcionTrabajo || 'N/A'}</p>`;
                    htmlVehiculos += `<p><strong>Registrado por:</strong> ${vehiculo.registradoPor || 'N/A'} el ${vehiculo.registradoEl ? new Date(vehiculo.registradoEl.seconds * 1000).toLocaleString() : 'Fecha no disponible'}</p>`;
                    
                    if (vehiculo.imagenesURLs && vehiculo.imagenesURLs.length > 0) {
                        htmlVehiculos += '<p><strong>Imágenes:</strong></p><div>';
                        vehiculo.imagenesURLs.forEach(url => {
                            htmlVehiculos += `<img src="${url}" alt="Imagen vehículo ${vehiculo.patente}" style="max-width: 150px; max-height: 150px; margin: 5px; border: 1px solid #ddd;">`;
                        });
                        htmlVehiculos += '</div>';
                    }
                    htmlVehiculos += `</li>`;
                });
                htmlVehiculos += '</ul>';

                listaVehiculosDiv.innerHTML = htmlVehiculos;
                console.log("Vehículos cargados y mostrados.");

            } catch (error) {
                console.error("Error al cargar vehículos: ", error);
                // Mostrar el error al usuario puede ser útil, o un mensaje genérico
                let mensajeError = '<p style="color:red;">Error al cargar los vehículos. Revisa la consola.';
                if (error.code === 'failed-precondition' && error.message.includes('index')) {
                    mensajeError += '<br>Este error puede requerir la creación de un índice en Firestore. Por favor, revisa la consola para ver un enlace de creación de índice y haz clic en él.';
                }
                mensajeError += '</p>';
                listaVehiculosDiv.innerHTML = mensajeError;
            }
        } else {
            listaVehiculosDiv.innerHTML = '<p>Debes iniciar sesión para ver los vehículos.</p>';
        }
    }

    // Observador del estado de autenticación (muy importante)
    auth.onAuthStateChanged(function(user) { 
        const adminPanel = document.getElementById('admin-panel'); 

        if (user) {
            console.log("Usuario actualmente conectado:", user.email);
            if (adminStatusDiv) adminStatusDiv.textContent = "Sesión iniciada como: " + user.email;
            if (btnAdminLogin) btnAdminLogin.style.display = 'none';
            if (btnAdminRegister) btnAdminRegister.style.display = 'none';
            if (btnAdminLogout) btnAdminLogout.style.display = 'inline-block';
            if (adminPanel) {
                adminPanel.style.display = 'block'; 
                cargarYMostrarVehiculos(); // LLAMAR A LA FUNCIÓN AQUÍ para cargar vehículos cuando el admin inicia sesión
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
    } 
    
    // --- LÓGICA PARA EL FORMULARIO DE INGRESO DE VEHÍCULOS ---
    const formIngresoVehiculo = document.getElementById('form-ingreso-vehiculo');
    const vehiculoImagenesInput = document.getElementById('vehiculo-imagenes');
    const previsualizacionDiv = document.getElementById('previsualizacion-imagenes');

    // Opcional: Previsualización de imágenes seleccionadas
    if (vehiculoImagenesInput && previsualizacionDiv) {
        vehiculoImagenesInput.addEventListener('change', function(event) {
            previsualizacionDiv.innerHTML = ''; 
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
        formIngresoVehiculo.addEventListener('submit', async function(event) { 
            event.preventDefault();
            console.log("Formulario de ingreso de vehículo enviado.");

            const currentUser = auth.currentUser;
            if (!currentUser) {
                alert("Debes iniciar sesión como administrador para guardar vehículos.");
                console.warn("Intento de guardar vehículo sin iniciar sesión.");
                return;
            }

            const patente = document.getElementById('vehiculo-patente').value.trim();
            const marca = document.getElementById('vehiculo-marca').value.trim();
            const modelo = document.getElementById('vehiculo-modelo').value.trim();
            const ano = document.getElementById('vehiculo-ano').value;
            const clienteNombre = document.getElementById('vehiculo-cliente-nombre').value.trim();
            const clienteTelefono = document.getElementById('vehiculo-cliente-telefono').value.trim();
            const descripcionTrabajo = document.getElementById('vehiculo-descripcion-trabajo').value.trim();
            const imagenesSeleccionadas = vehiculoImagenesInput.files; 

            if (!patente || !marca || !modelo || !ano || !descripcionTrabajo) {
                alert("Por favor, completa todos los campos obligatorios del vehículo (Patente, Marca, Modelo, Año, Descripción del Trabajo).");
                return;
            }

            const submitButton = formIngresoVehiculo.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Guardando...';

            try {
                const urlsImagenes = [];
                if (imagenesSeleccionadas && imagenesSeleccionadas.length > 0) {
                    console.log(`Subiendo ${imagenesSeleccionadas.length} imágenes...`);
                    for (let i = 0; i < imagenesSeleccionadas.length; i++) {
                        const imagen = imagenesSeleccionadas[i];
                        const nombreArchivo = `${patente}_${imagen.name}_${Date.now()}`;
                        const storageRef = storage.ref(`vehiculos/${nombreArchivo}`);
                        
                        console.log(`Subiendo archivo: ${imagen.name} como ${nombreArchivo}`);
                        const uploadTaskSnapshot = await storageRef.put(imagen); 
                        const downloadURL = await uploadTaskSnapshot.ref.getDownloadURL(); 
                        urlsImagenes.push(downloadURL);
                        console.log(`Archivo ${imagen.name} subido. URL: ${downloadURL}`);
                    }
                } else {
                    console.log("No se seleccionaron imágenes para subir.");
                }

                const datosVehiculo = {
                    patente: patente,
                    marca: marca,
                    modelo: modelo,
                    ano: parseInt(ano), 
                    clienteNombre: clienteNombre,
                    clienteTelefono: clienteTelefono,
                    descripcionTrabajo: descripcionTrabajo,
                    imagenesURLs: urlsImagenes, 
                    registradoPor: currentUser.email, 
                    registradoEl: firebase.firestore.FieldValue.serverTimestamp()
                };

                console.log("Guardando datos del vehículo en Firestore:", datosVehiculo);
                const docRef = await db.collection("vehiculos").add(datosVehiculo);
                
                console.log("Vehículo registrado en Firestore con ID: ", docRef.id);
                alert(`¡Vehículo con patente ${patente} guardado con éxito!`);
                formIngresoVehiculo.reset(); 
                if(previsualizacionDiv) previsualizacionDiv.innerHTML = ''; 
                
                cargarYMostrarVehiculos(); // Volver a cargar la lista de vehículos después de agregar uno nuevo

            } catch (error) {
                console.error("Error al guardar el vehículo: ", error);
                alert("Hubo un error al guardar el vehículo. Revisa la consola para más detalles. Error: " + error.message);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Guardar Vehículo';
            }
        });
    } else {
        console.warn("Formulario 'form-ingreso-vehiculo' no encontrado.");
    }

}); // FIN de document.addEventListener('DOMContentLoaded', ...)