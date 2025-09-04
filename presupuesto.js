document.addEventListener('DOMContentLoaded', function() {
    
    // --- SELECCIÓN DE ELEMENTOS DEL DOM (sin cambios) ---
    const clienteSelect = document.getElementById('cliente-select');
    const clienteInfoCard = document.getElementById('cliente-info');
    const manoObraInput = document.getElementById('mano-obra-monto');
    const repuestosContainer = document.getElementById('repuestos-container');
    const btnAgregarRepuesto = document.getElementById('btn-agregar-repuesto');
    const totalSpan = document.getElementById('total-presupuesto');
    const presupuestoForm = document.getElementById('presupuesto-form');

    // --- CARGAR CLIENTES DESDE LOCALSTORAGE (sin cambios) ---
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];

    // --- FUNCIONES Y EVENTOS (sin cambios hasta el submit) ---
    function cargarClientesEnSelect() {
        if (clientes.length === 0) {
            clienteSelect.innerHTML = '<option value="">No hay clientes registrados</option>';
            return;
        }
        clienteSelect.innerHTML = '<option value="">-- Seleccione un Cliente --</option>';
        clientes.forEach((cliente, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${cliente.nombre} - ${cliente.patente}`;
            clienteSelect.appendChild(option);
        });
    }

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

    function calcularTotal() {
        let total = 0;
        const manoObra = parseFloat(manoObraInput.value) || 0;
        total += manoObra;
        const montosRepuestos = document.querySelectorAll('.monto-repuesto');
        montosRepuestos.forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        totalSpan.textContent = total.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
    }

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
            calcularTotal();
        }
    });

    presupuestoForm.addEventListener('input', function(e) {
        if (e.target.id === 'mano-obra-monto' || e.target.classList.contains('monto-repuesto')) {
            calcularTotal();
        }
    });

    // --- MODIFICADO: GUARDAR PRESUPUESTO ---
    presupuestoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const selectedClientIndex = clienteSelect.value;
        if (!selectedClientIndex) {
            alert('Error: Debe seleccionar un cliente antes de guardar.');
            return;
        }

        const manoObra = parseFloat(manoObraInput.value) || 0;
        if (manoObra <= 0) {
            alert('Error: El monto de la mano de obra debe ser mayor a cero.');
            return;
        }

        // Recolectar los repuestos
        const repuestos = [];
        const repuestoItems = document.querySelectorAll('.repuesto-item');
        repuestoItems.forEach(item => {
            const nombre = item.querySelector('.nombre-repuesto').value.trim();
            const monto = parseFloat(item.querySelector('.monto-repuesto').value) || 0;
            if (nombre && monto > 0) {
                repuestos.push({ nombre, monto });
            }
        });

        // Calcular total final
        const totalFinal = manoObra + repuestos.reduce((sum, rep) => sum + rep.monto, 0);

        // Crear el objeto del presupuesto
        const presupuestoData = {
            clienteIndex: selectedClientIndex,
            diagnostico: document.getElementById('diagnostico-obs').value,
            manoObra: manoObra,
            repuestos: repuestos,
            total: totalFinal,
            fecha: new Date().toLocaleDateString('es-CL') // Guarda la fecha actual
        };

        // Cargar presupuestos existentes, agregar el nuevo y guardar
        let presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
        presupuestos.push(presupuestoData);
        localStorage.setItem('presupuestos', JSON.stringify(presupuestos));
        
        alert('¡Presupuesto guardado exitosamente!');
        
        // Redirigir a la lista de clientes para ver el resultado
        window.location.href = 'clientes_registrados.html';
    });


    // --- INICIALIZACIÓN ---
    cargarClientesEnSelect();
});