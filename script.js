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
                    mensajeError += '