// Esperamos a que todo el contenido HTML (el DOM) se haya cargado
// antes de ejecutar nuestro código JavaScript. Es una buena práctica.
document.addEventListener('DOMContentLoaded', function() {

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    // Guardamos en variables los elementos HTML con los que vamos a trabajar.
    const formulario = document.getElementById('registro-form');
    const tablaBody = document.getElementById('tabla-body');
    // NUEVO: Seleccionamos el campo de búsqueda
    const filtroInput = document.getElementById('filtro-busqueda');

    // NUEVO: Variables para gestionar el modo de edición.
    let modoEdicion = false;
    let clienteIndex = null; // Guardará el índice del cliente que estamos editando.

    // --- CARGAR DATOS DESDE LOCALSTORAGE ---
    // Buscamos si hay clientes guardados en el almacenamiento local del navegador.
    // JSON.parse convierte el texto guardado de vuelta a un array de objetos.
    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];

    // --- FUNCIÓN PARA MOSTRAR LOS CLIENTES EN LA TABLA ---
    // MODIFICADO: Ahora acepta un array de clientes para renderizar.
    // Esto nos permite mostrar la lista completa o una lista filtrada.
    function renderizarTabla(clientesAMostrar = clientes) {
        // Limpiamos la tabla para no duplicar datos
        tablaBody.innerHTML = '';

        // Si no hay clientes, mostramos un mensaje
        if (clientesAMostrar.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No hay clientes que coincidan con la búsqueda.</td></tr>`;
            return;
        }
        
        // Recorremos el array de clientes y creamos una fila (<tr>) por cada uno.
        clientesAMostrar.forEach(cliente => {
            // Buscamos el índice real del cliente en el array original para asegurar la consistencia.
            const index = clientes.findIndex(c => c.patente === cliente.patente);
            const fila = document.createElement('tr');
            
            // MODIFICADO: Añadimos el botón de Editar y la clase genérica "btn-accion".
            fila.innerHTML = `
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.patente}</td>
                <td>${cliente.marca}</td>
                <td>${cliente.modelo}</td>
                <td>${cliente.anio}</td>
                <td>
                    <button class="btn-accion btn-editar" data-index="${index}">Editar</button>
                    <button class="btn-accion btn-eliminar" data-index="${index}">Eliminar</button>
                </td>
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

    // NUEVO: FUNCIÓN PARA CARGAR LOS DATOS DE UN CLIENTE EN EL FORMULARIO PARA EDITAR
    function cargarClienteEnFormulario(index) {
        const cliente = clientes[index];
        document.getElementById('cliente-nombre').value = cliente.nombre;
        document.getElementById('cliente-telefono').value = cliente.telefono;
        document.getElementById('cliente-email').value = cliente.email;
        document.getElementById('vehiculo-patente').value = cliente.patente;
        document.getElementById('vehiculo-marca').value = cliente.marca;
        document.getElementById('vehiculo-modelo').value = cliente.modelo;
        document.getElementById('vehiculo-anio').value = cliente.anio;
        document.getElementById('vehiculo-obs').value = cliente.observaciones;

        // Cambiamos el estado a modo edición
        modoEdicion = true;
        clienteIndex = index;

        // Cambiamos el texto del botón y el estilo para que sea claro que estamos editando
        const btnSubmit = formulario.querySelector('.btn-submit');
        btnSubmit.textContent = 'Guardar Cambios';
        btnSubmit.style.backgroundColor = 'var(--color-editar)';

        // Hacemos scroll hacia el formulario para que el usuario vea que se cargaron los datos.
        formulario.scrollIntoView({ behavior: 'smooth' });
    }

    // --- EVENTO DE ENVÍO DEL FORMULARIO ---
    // MODIFICADO: Ahora maneja tanto la creación de nuevos clientes como la actualización de existentes.
    formulario.addEventListener('submit', function(evento) {
        // Prevenimos el comportamiento por defecto del formulario (que es recargar la página).
        evento.preventDefault();

        // Creamos un objeto 'clienteData' con los valores de los campos del formulario.
        const clienteData = {
            nombre: document.getElementById('cliente-nombre').value,
            telefono: document.getElementById('cliente-telefono').value,
            email: document.getElementById('cliente-email').value,
            patente: document.getElementById('vehiculo-patente').value.toUpperCase(),
            marca: document.getElementById('vehiculo-marca').value,
            modelo: document.getElementById('vehiculo-modelo').value,
            anio: document.getElementById('vehiculo-anio').value,
            observaciones: document.getElementById('vehiculo-obs').value
        };

        if (modoEdicion) {
            // --- LÓGICA DE ACTUALIZACIÓN ---
            // Si estamos en modo edición, actualizamos el cliente en el array.
            clientes[clienteIndex] = clienteData;
            alert('¡Cliente actualizado exitosamente!');
        } else {
            // --- LÓGICA DE CREACIÓN ---
            // Si no, añadimos el nuevo cliente al array de clientes.
            clientes.push(clienteData);
            alert('¡Cliente agregado exitosamente!');
        }

        // Guardamos el array actualizado en LocalStorage.
        guardarClientes();

        // Volvemos a dibujar la tabla con los datos actualizados.
        renderizarTabla();

        // Limpiamos el formulario para el siguiente ingreso.
        formulario.reset();

        // Reseteamos el modo edición
        modoEdicion = false;
        clienteIndex = null;
        const btnSubmit = formulario.querySelector('.btn-submit');
        btnSubmit.textContent = 'Agregar Cliente al Registro';
        btnSubmit.style.backgroundColor = 'var(--color-primario)';
    });

    // --- EVENTO PARA EDITAR O ELIMINAR UN CLIENTE ---
    // MODIFICADO: Ahora "escucha" clicks en los botones de editar también.
    tablaBody.addEventListener('click', function(evento) {
        const elementoClickeado = evento.target;
        const index = elementoClickeado.getAttribute('data-index');

        // Verificamos si se hizo clic en un botón de EDITAR.
        if (elementoClickeado.classList.contains('btn-editar')) {
            cargarClienteEnFormulario(index);
        }

        // Verificamos si se hizo clic en un botón de ELIMINAR.
        if (elementoClickeado.classList.contains('btn-eliminar')) {
            // Pedimos confirmación antes de borrar.
            const confirmar = confirm('¿Estás seguro de que deseas eliminar este cliente?');
            if (confirmar) {
                // Eliminamos el cliente del array usando su índice.
                clientes.splice(index, 1);
                
                // Guardamos los cambios y actualizamos la tabla.
                guardarClientes();
                renderizarTabla();
            }
        }
    });

    // --- NUEVO: EVENTO PARA EL FILTRO DE BÚSQUEDA ---
    // Se activa cada vez que el usuario suelta una tecla dentro del campo de búsqueda.
    filtroInput.addEventListener('keyup', function() {
        const terminoBusqueda = filtroInput.value.toLowerCase();

        const clientesFiltrados = clientes.filter(cliente => {
            // Comprobamos si el término de búsqueda está incluido en alguno de estos campos.
            return cliente.nombre.toLowerCase().includes(terminoBusqueda) ||
                   cliente.patente.toLowerCase().includes(terminoBusqueda) ||
                   cliente.telefono.includes(terminoBusqueda) ||
                   cliente.marca.toLowerCase().includes(terminoBusqueda) ||
                   cliente.modelo.toLowerCase().includes(terminoBusqueda);
        });

        // Llamamos a renderizarTabla() pero solo con los clientes que pasaron el filtro.
        renderizarTabla(clientesFiltrados);
    });


    // --- INICIALIZACIÓN ---
    // Llamamos a la función por primera vez para que cargue los clientes guardados al abrir la página.
    renderizarTabla();
});