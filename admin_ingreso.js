document.addEventListener('DOMContentLoaded', function() {

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    const formulario = document.getElementById('registro-form');

    // --- VARIABLES DE ESTADO ---
    let modoEdicion = false;
    let clienteIndex = null;

    // --- CARGAR DATOS DESDE LOCALSTORAGE ---
    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];

    // --- FUNCIÓN PARA GUARDAR LOS CLIENTES EN LOCALSTORAGE ---
    function guardarClientes() {
        localStorage.setItem('clientes', JSON.stringify(clientes));
    }

    // --- FUNCIÓN PARA CARGAR DATOS EN EL FORMULARIO (MODO EDICIÓN) ---
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

        modoEdicion = true;
        clienteIndex = index;

        const btnSubmit = formulario.querySelector('.btn-submit');
        btnSubmit.textContent = 'Guardar Cambios';
        btnSubmit.style.backgroundColor = 'var(--color-editar)';

        // La patente no se debería poder editar para mantener la integridad de los datos
        document.getElementById('vehiculo-patente').readOnly = true;
        document.getElementById('vehiculo-patente').style.backgroundColor = '#555';
    }

    // --- EVENTO DE ENVÍO DEL FORMULARIO ---
    formulario.addEventListener('submit', function(evento) {
        evento.preventDefault();

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
            clientes[clienteIndex] = clienteData;
            alert('¡Cliente actualizado exitosamente!');
        } else {
             // Evitar duplicados por patente
            if (clientes.some(c => c.patente === clienteData.patente)) {
                alert('Error: Ya existe un cliente con esa patente.');
                return;
            }
            clientes.push(clienteData);
            alert('¡Cliente agregado exitosamente!');
        }

        guardarClientes();
        
        // Redirigimos al usuario a la lista de clientes para que vea el resultado
        window.location.href = 'clientes_registrados.html';
    });

    // --- INICIALIZACIÓN: COMPROBAR SI VIENE DE UNA PETICIÓN DE EDICIÓN ---
    const urlParams = new URLSearchParams(window.location.search);
    const editarIndex = urlParams.get('editar');

    if (editarIndex !== null && clientes[editarIndex]) {
        cargarClienteEnFormulario(editarIndex);
    }
});