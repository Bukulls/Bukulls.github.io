document.addEventListener('DOMContentLoaded', function() {
    
    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    const clienteSelect = document.getElementById('cliente-select');
    const clienteInfoCard = document.getElementById('cliente-info');
    const manoObraInput = document.getElementById('mano-obra-monto');
    const repuestosContainer = document.getElementById('repuestos-container');
    const btnAgregarRepuesto = document.getElementById('btn-agregar-repuesto');
    const totalSpan = document.getElementById('total-presupuesto');
    const presupuestoForm = document.getElementById('presupuesto-form');

    // --- CARGAR CLIENTES DESDE LOCALSTORAGE ---
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];

    function cargarClientesEnSelect() {
        if (clientes.length === 0) {
            clienteSelect.innerHTML = '<option value="">No hay clientes registrados</option>';
            return;
        }
        // Limpiamos el select y añadimos la opción por defecto
        clienteSelect.innerHTML = '<option value="">-- Seleccione un Cliente --</option>';

        // Añadimos cada cliente como una opción en el select
        clientes.forEach((cliente, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${cliente.nombre} - ${cliente.patente}`;
            clienteSelect.appendChild(option);
        });
    }

    // --- MOSTRAR INFO DEL CLIENTE SELECCIONADO ---
    clienteSelect.addEventListener('change', function() {
        const selectedIndex = this.value;

        if (selectedIndex) {
            const cliente = clientes[selectedIndex];
            clienteInfoCard.innerHTML = `
                <p><strong>Vehículo:</strong> ${cliente.marca} ${cliente.modelo} (${cliente.anio})</p>
                <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                <p><strong>Email:</strong> ${cliente.email || 'No ingresado'}</p>
            `;
            clienteInfoCard.style.display = 'block';
        } else {
            clienteInfoCard.style.display = 'none';
        }
    });

    // --- FUNCIÓN PARA CALCULAR EL TOTAL ---
    function calcularTotal() {
        let total = 0;
        
        // Sumar mano de obra
        const manoObra = parseFloat(manoObraInput.value) || 0;
        total += manoObra;

        // Sumar todos los repuestos
        const montosRepuestos = document.querySelectorAll('.monto-repuesto');
        montosRepuestos.forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        
        // Formatear como moneda CLP y mostrar
        totalSpan.textContent = total.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
    }

    // --- AGREGAR Y QUITAR REPUESTOS DINÁMICAMENTE ---
    btnAgregarRepuesto.addEventListener('click', function() {
        const nuevoRepuesto = document.createElement('div');
        nuevoRepuesto.classList.add('repuesto-item');
        
        nuevoRepuesto.innerHTML = `
            <input type="text" class="nombre-repuesto" placeholder="Nombre del Repuesto">
            <input type="number" class="monto-repuesto" placeholder="Monto" min="0">
            <button type="button" class="btn-eliminar-repuesto">-</button>
        `;
        
        repuestosContainer.appendChild(nuevoRepuesto);
    });

    repuestosContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-eliminar-repuesto')) {
            e.target.parentElement.remove();
            calcularTotal(); // Recalcular total al eliminar un repuesto
        }
    });

    // --- EVENT LISTENERS PARA ACTUALIZAR TOTAL ---
    // Usamos 'input' para que se actualice mientras el usuario escribe
    presupuestoForm.addEventListener('input', function(e) {
        if (e.target.id === 'mano-obra-monto' || e.target.classList.contains('monto-repuesto')) {
            calcularTotal();
        }
    });

    // --- GUARDAR PRESUPUESTO (EJEMPLO) ---
    presupuestoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Funcionalidad para "Guardar Presupuesto" no implementada aún.');
        // Aquí iría la lógica para guardar el presupuesto, por ejemplo, en localStorage.
    });


    // --- INICIALIZACIÓN ---
    cargarClientesEnSelect();
});