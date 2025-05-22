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

// =======================================================================
// SECCIÓN 2: CÓDIGO JAVASCRIPT PARA LA PÁGINA
// =======================================================================
document.addEventListener('DOMContentLoaded', function() {

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

    // --- Manejar el envío del formulario CON FIREBASE ---
    if (formAgendar) {
        formAgendar.addEventListener('submit', function(event) {
            event.preventDefault(); // Previene el envío tradicional del formulario

            // Obtener los valores de los campos del formulario
            const nombre = document.getElementById('nombre').value.trim();
            const telefono = document.getElementById('telefono').value.trim();
            const email = document.getElementById('email').value.trim();
            const servicio = document.getElementById('servicio-deseado').value;
            const fecha = document.getElementById('fecha-preferida').value;
            const mensaje = document.getElementById('mensaje').value.trim();

            // Validaciones básicas
            if (!nombre || !telefono || !email) {
                alert('Por favor, completa los campos obligatorios: Nombre, Teléfono y Correo Electrónico.');
                return; // Detiene la ejecución si faltan campos
            }

            // Crear el objeto con los datos de la cita para Firestore
            const datosCita = {
                nombre: nombre,
                telefono: telefono,
                email: email,
                servicio: servicio,
                fecha: fecha,
                mensaje: mensaje,
                registradoEl: firebase.firestore.FieldValue.serverTimestamp() // Añade marca de tiempo del servidor
            };

            // Guardar los datos en la colección "citas" de Firestore
            db.collection("citas").add(datosCita)
                .then((docRef) => {
                    // Esto se ejecuta si los datos se guardaron correctamente
                    console.log("Cita registrada en Firestore con ID: ", docRef.id);
                    alert('¡Gracias ' + nombre + '! Tu solicitud de cita ha sido registrada con éxito.');
                    formAgendar.reset(); // Limpia el formulario
                    cerrarModal(); // Cierra el modal
                })
                .catch((error) => {
                    // Esto se ejecuta si hubo un error al guardar
                    console.error("Error al registrar la cita en Firestore: ", error);
                    alert('Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde. Detalles del error: ' + error.message);
                });
        });
    } else {
        console.warn("Formulario 'form-agendar' no encontrado.");
    }
}); // FIN de document.addEventListener('DOMContentLoaded', ...)
