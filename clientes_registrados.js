document.addEventListener('DOMContentLoaded', function() {

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    const tablaBody = document.getElementById('tabla-body');
    const filtroInput = document.getElementById('filtro-busqueda');

    // --- CARGAR DATOS DESDE LOCALSTORAGE ---
    // Cargar ambos arrays desde localStorage para tener toda la información necesaria.
    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    let presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];

    // --- FUNCIÓN PARA GUARDAR LOS CLIENTES EN LOCALSTORAGE ---
    function guardarClientes() {
        localStorage.setItem('clientes', JSON.stringify(clientes));
    }

    // --- FUNCIÓN PARA MOSTRAR LOS CLIENTES EN LA TABLA (MODIFICADA)---
    // La función ahora busca presupuestos para cada cliente que muestra.
    function renderizarTabla(clientesAMostrar = clientes) {
        tablaBody.innerHTML = ''; // Limpiamos la tabla antes de volver a dibujarla.

        // Mensaje para cuando no hay clientes que mostrar.
        if (clientesAMostrar.length === 0) {
            const mensaje = filtroInput.value ? 'No hay clientes que coincidan con la búsqueda.' : 'Aún no hay clientes registrados.';
            tablaBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">${mensaje}</td></tr>`;
            return;
        }
        
        // Recorremos el array de clientes para crear una fila por cada uno.
        clientesAMostrar.forEach(cliente => {
            // Buscamos el índice real del cliente en el array original. Es crucial para la consistencia de los datos.
            const index = clientes.findIndex(c => c.patente === cliente.patente);
            const fila = document.createElement('tr');
            
            // --- LÓGICA PARA EL BOTÓN DE PRESUPUESTO ---
            // Buscamos si este cliente tiene un presupuesto asociado.
            // Usamos lastIndexOf para encontrar el último presupuesto generado para este cliente.
            const presupuestoIndex = presupuestos.map(p => p.clienteIndex).lastIndexOf(index.toString());
            
            let botonPresupuestoHTML = ''; // Por defecto, no hay botón.
            if (presupuestoIndex !== -1) {
                // Si encontramos un presupuesto, creamos el botón "Ver Presupuesto".
                // Este botón es un enlace (<a>) que redirige a la nueva página 'ver_presupuesto.html'.
                // Le pasamos el índice del presupuesto como un parámetro en la URL (?id=...).
                botonPresupuestoHTML = `<a href="ver_presupuesto.html?id=${presupuestoIndex}" class="btn-accion btn-ver">Ver Presupuesto</a>`;
            }

            // Creamos el contenido HTML de la fila, incluyendo los botones de acción.
            fila.innerHTML = `
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.patente}</td>
                <td>${cliente.marca}</td>
                <td>${cliente.modelo}</td>
                <td>${cliente.anio}</td>
                <td class="acciones-cell">
                    <a href="admin_ingreso.html?editar=${index}" class="btn-accion btn-editar">Editar</a>
                    <button class="btn-accion btn-eliminar" data-index="${index}">Eliminar</button>
                    ${botonPresupuestoHTML} </td>
            `;
            
            // Añadimos la fila completa al cuerpo de la tabla.
            tablaBody.appendChild(fila);
        });
    }

    // --- EVENTO PARA ELIMINAR UN CLIENTE ---
    tablaBody.addEventListener('click', function(evento) {
        // Nos aseguramos de que el clic fue en un botón de eliminar.
        if (evento.target.classList.contains('btn-eliminar')) {
            const index = evento.target.getAttribute('data-index');
            
            const confirmar = confirm('¿Estás seguro de que deseas eliminar este cliente? Al hacerlo, los presupuestos asociados podrían quedar inaccesibles.');
            if (confirmar) {
                clientes.splice(index, 1); // Eliminamos el cliente del array.
                guardarClientes(); // Guardamos el array actualizado.
                filtrarYRenderizar(); // Volvemos a dibujar la tabla.
            }
        }
    });

    // --- FUNCIÓN Y EVENTO PARA EL FILTRO DE BÚSQUEDA ---
    function filtrarYRenderizar() {
        const terminoBusqueda = filtroInput.value.toLowerCase();

        const clientesFiltrados = clientes.filter(cliente => {
            // Comprobamos si el término de búsqueda está en cualquiera de los campos relevantes.
            return cliente.nombre.toLowerCase().includes(terminoBusqueda) ||
                   cliente.patente.toLowerCase().includes(terminoBusqueda) ||
                   cliente.telefono.includes(terminoBusqueda) ||
                   cliente.marca.toLowerCase().includes(terminoBusqueda) ||
                   cliente.modelo.toLowerCase().includes(terminoBusqueda);
        });

        // Llamamos a renderizarTabla() solo con los clientes que pasaron el filtro.
        renderizarTabla(clientesFiltrados);
    }

    filtroInput.addEventListener('keyup', filtrarYRenderizar);

    // --- INICIALIZACIÓN ---
    // Llamamos a la función por primera vez para que cargue los clientes al abrir la página.
    renderizarTabla();
});