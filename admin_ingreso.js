// Esperamos a que todo el contenido HTML (el DOM) se haya cargado
// antes de ejecutar nuestro código JavaScript. Es una buena práctica.
document.addEventListener('DOMContentLoaded', function() {

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    // Guardamos en variables los elementos HTML con los que vamos a trabajar.
    const formulario = document.getElementById('registro-form');
    const tablaBody = document.getElementById('tabla-body');

    // --- CARGAR DATOS DESDE LOCALSTORAGE ---
    // Buscamos si hay clientes guardados en el almacenamiento local del navegador.
    // JSON.parse convierte el texto guardado de vuelta a un array de objetos.
    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];

    // --- FUNCIÓN PARA MOSTRAR LOS CLIENTES EN LA TABLA ---
    function renderizarTabla() {
        // Limpiamos la tabla para no duplicar datos
        tablaBody.innerHTML = '';

        // Si no hay clientes, mostramos un mensaje
        if (clientes.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No hay clientes registrados.</td></tr>`;
            return;
        }
        
        // Recorremos el array de clientes y creamos una fila (<tr>) por cada uno.
        clientes.forEach((cliente, index) => {
            const fila = document.createElement('tr');
            
            // Creamos las celdas (<td>) con la información del cliente.
            fila.innerHTML = `
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.patente}</td>
                <td>${cliente.marca}</td>
                <td>${cliente.modelo}</td>
                <td>${cliente.anio}</td>
                <td><button class="btn-eliminar" data-index="${index}">Eliminar</button></td>
            `;
            
            // Añadimos la fila completa al cuerpo de la tabla.
            tablaBody.appendChild(fila);
        });
    }

    // --- FUNCIÓN PARA GUARDAR LOS CLIENTES EN LOCALSTORAGE ---
    function guardarClientes() {
        // Convertimos el array de clientes a un string en formato JSON y lo guardamos.
        localStorage.setItem('clientes', JSON.stringify(clientes));
    }

    // --- EVENTO DE ENVÍO DEL FORMULARIO ---
    formulario.addEventListener('submit', function(evento) {
        // Prevenimos el comportamiento por defecto del formulario (que es recargar la página).
        evento.preventDefault();

        // Creamos un objeto 'nuevoCliente' con los valores de los campos del formulario.
        // .value nos da el texto que el usuario escribió en cada input.
        const nuevoCliente = {
            nombre: document.getElementById('cliente-nombre').value,
            telefono: document.getElementById('cliente-telefono').value,
            email: document.getElementById('cliente-email').value,
            patente: document.getElementById('vehiculo-patente').value.toUpperCase(),
            marca: document.getElementById('vehiculo-marca').value,
            modelo: document.getElementById('vehiculo-modelo').value,
            anio: document.getElementById('vehiculo-anio').value,
            observaciones: document.getElementById('vehiculo-obs').value
        };

        // Añadimos el nuevo cliente al array de clientes.
        clientes.push(nuevoCliente);

        // Guardamos el array actualizado en LocalStorage.
        guardarClientes();

        // Volvemos a dibujar la tabla con el cliente nuevo.
        renderizarTabla();

        // Limpiamos el formulario para el siguiente ingreso.
        formulario.reset();
        
        // Opcional: Mostramos una alerta de éxito.
        alert('¡Cliente agregado exitosamente!');
    });

    // --- EVENTO PARA ELIMINAR UN CLIENTE ---
    // Agregamos un listener al cuerpo de la tabla para "escuchar" clicks.
    tablaBody.addEventListener('click', function(evento) {
        // Verificamos si el elemento clickeado es un botón de eliminar.
        if (evento.target.classList.contains('btn-eliminar')) {
            // Pedimos confirmación antes de borrar.
            const confirmar = confirm('¿Estás seguro de que deseas eliminar este cliente?');
            if (confirmar) {
                // Obtenemos el índice del cliente a eliminar desde el atributo 'data-index'.
                const index = evento.target.getAttribute('data-index');
                
                // Eliminamos el cliente del array usando su índice.
                clientes.splice(index, 1);
                
                // Guardamos los cambios y actualizamos la tabla.
                guardarClientes();
                renderizarTabla();
            }
        }
    });

    // --- INICIALIZACIÓN ---
    // Llamamos a la función por primera vez para que cargue los clientes guardados al abrir la página.
    renderizarTabla();
});
