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

}); // FIN de document.addEventListener('DOMContentLoaded', ...)