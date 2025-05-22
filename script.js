
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAySrOuWY7Zr7Etq_iFKSFLiWsng3KTkXA",
  authDomain: "edc-automotriz.firebaseapp.com",
  projectId: "edc-automotriz",
  storageBucket: "edc-automotriz.firebasestorage.app",
  messagingSenderId: "387959087823",
  appId: "1:387959087823:web:03469bf7d12f4e78674dba",
  measurementId: "G-K98Q6XWTFT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Espera a que todo el contenido del DOM esté completamente cargado y parseado
document.addEventListener('DOMContentLoaded', function() {

    // 1. Seleccionar los elementos del DOM
    const botonLeerMas = document.getElementById('btn-leer-mas');
    const masInfoDiv = document.getElementById('mas-info-nosotros');

    // 2. Verificar que los elementos existen (buena práctica)
    if (botonLeerMas && masInfoDiv) {
        
        // 3. Añadir un "escuchador de eventos" al botón
        botonLeerMas.addEventListener('click', function() {
            // 4. Lógica para mostrar u ocultar el contenido
            if (masInfoDiv.style.display === 'none' || masInfoDiv.style.display === '') {
                // Si está oculto, lo mostramos
                masInfoDiv.style.display = 'block';
                botonLeerMas.textContent = 'Leer menos'; // Cambiamos el texto del botón
            } else {
                // Si está visible, lo ocultamos
                masInfoDiv.style.display = 'none';
                botonLeerMas.textContent = 'Leer más'; // Cambiamos el texto del botón
            }
        });
    } else {
        console.error("No se encontraron los elementos 'btn-leer-mas' o 'mas-info-nosotros'.");
    }

});

document.addEventListener('DOMContentLoaded', function() {

    // --- Código del botón "Leer más" (ya lo teníamos) ---
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
        // Se movió el console.error para que no interfiera si solo falta uno de estos
        if (!botonLeerMas) console.warn("Elemento 'btn-leer-mas' no encontrado.");
        if (!masInfoDiv) console.warn("Elemento 'mas-info-nosotros' no encontrado.");
    }

    // --- NUEVO: Código para el Modal de Agendar Cita ---

    // 1. Seleccionar los elementos del DOM para el modal
    const modalAgendar = document.getElementById('modal-agendar');
    const btnAbrirModal = document.getElementById('btn-abrir-modal-agendar');
    const btnCerrarModal = document.getElementById('btn-cerrar-modal');
    const formAgendar = document.getElementById('form-agendar');

    // 2. Funciones para abrir y cerrar el modal
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

    // 3. Asignar eventos a los botones y al modal
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

    // Cerrar el modal si se hace clic fuera del contenido del modal (en el fondo)
    if (modalAgendar) {
        window.addEventListener('click', function(event) {
            if (event.target === modalAgendar) {
                cerrarModal();
            }
        });
    }

    // 4. Manejar el envío del formulario
    if (formAgendar) {
        formAgendar.addEventListener('submit', function(event) {
            event.preventDefault(); // Previene el envío tradicional del formulario (que recargaría la página)

            // Obtener los valores de los campos del formulario
            const nombre = document.getElementById('nombre').value.trim();
            const telefono = document.getElementById('telefono').value.trim();
            const email = document.getElementById('email').value.trim();
            const servicio = document.getElementById('servicio-deseado').value;
            const fecha = document.getElementById('fecha-preferida').value;
            const mensaje = document.getElementById('mensaje').value.trim();

            // Validaciones básicas (puedes expandirlas mucho más)
            if (!nombre || !telefono || !email) {
                alert('Por favor, completa los campos obligatorios: Nombre, Teléfono y Correo Electrónico.');
                return; // Detiene la ejecución si faltan campos
            }

            // Aquí es donde normalmente enviarías los datos a un backend.
            // Por ahora, solo los mostraremos en la consola.
            console.log('--- Datos de la Solicitud de Cita ---');
            console.log('Nombre:', nombre);
            console.log('Teléfono:', telefono);
            console.log('Email:', email);
            console.log('Servicio:', servicio);
            console.log('Fecha Preferida:', fecha);
            console.log('Mensaje:', mensaje);

            alert('¡Gracias por tu solicitud! Hemos recibido tus datos. (Revisa la consola del navegador para verlos).');
            
            formAgendar.reset(); // Limpia el formulario
            cerrarModal(); // Cierra el modal después de enviar
        });
    } else {
        console.warn("Formulario 'form-agendar' no encontrado.");
    }
});
