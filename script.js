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

// Obtener una instancia de Firestore Database para poder usarla luego
const db = firebase.firestore(); // La variable 'db' ahora contiene nuestra conexión a Firestore
const auth = firebase.auth(); // NUEVA LÍNEA: Instancia de Firebase Auth

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
    if (btnAdminRegister && adminEmailInput && adminPasswordInput) { // Verificación de inputs
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
                        // Usuario registrado
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
    if (btnAdminLogin && adminEmailInput && adminPasswordInput) { // Verificación de inputs
        btnAdminLogin.addEventListener('click', function() {
            const email = adminEmailInput.value;
            const password = adminPasswordInput.value;

            if (!email || !password) {
                alert("Por favor, ingresa email y contraseña.");
                return;
            }

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Inicio de sesión exitoso
                    const user = userCredential.user;
                    console.log("Administrador ha iniciado sesión:", user);
                    alert("¡Inicio de sesión exitoso!");
                    // Aquí podrías redirigir a un panel de admin o mostrar contenido de admin
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
    // Esto se ejecuta cuando la página carga y cada vez que el estado de auth cambia
    auth.onAuthStateChanged(function(user) {
        if (user) {
            // El usuario ha iniciado sesión
            console.log("Usuario actualmente conectado:", user.email);
            if(adminStatusDiv) adminStatusDiv.textContent = "Sesión iniciada como: " + user.email;
            if(btnAdminLogin) btnAdminLogin.style.display = 'none';
            if(btnAdminRegister) btnAdminRegister.style.display = 'none';
            if(btnAdminLogout) btnAdminLogout.style.display = 'inline-block';

            // AQUÍ ES DONDE HABILITARÍAS EL ACCESO A FUNCIONES DE ADMINISTRADOR
            // Por ejemplo, podrías mostrar un botón para "Ingresar Vehículo"
            // o permitir ciertas acciones que antes estaban deshabilitadas.

        } else {
            // El usuario no ha iniciado sesión o ha cerrado sesión
            console.log("Ningún usuario conectado.");
            if(adminStatusDiv) adminStatusDiv.textContent = "No has iniciado sesión.";
            if(btnAdminLogin) btnAdminLogin.style.display = 'inline-block';
            if(btnAdminRegister) btnAdminRegister.style.display = 'inline-block';
            if(btnAdminLogout) btnAdminLogout.style.display = 'none';

            // AQUÍ DESHABILITARÍAS O OCULTARÍAS LAS FUNCIONES DE ADMINISTRADOR
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
    } else {
        if (!botonLeerMas) console.warn("Elemento 'btn-leer-mas' no encontrado.");
        if (!masInfoDiv) console.warn("Elemento 'mas-info-nosotros' no encontrado.");
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
        console.warn("Botón 'btn-abrir-modal-agendar' no encontrado.");
    }

    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', cerrarModal);
    } else {
        console.warn("Botón 'btn-cerrar-modal' no encontrado.");
    }

    if (modalAgendar) {
                window.addEventListener('click', function(event) {
                    if (event.target === modalAgendar) {
                        cerrarModal();
                    }
                });
            }
        }); // <-- Cierra el addEventListener('DOMContentLoaded', ...)