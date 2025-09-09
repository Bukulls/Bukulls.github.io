document.addEventListener('DOMContentLoaded', function() {
    // --- OBTENER DATOS ---
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const presupuestos = JSON.parse(localStorage.getItem('presupuestos')) || [];
    const urlParams = new URLSearchParams(window.location.search);
    const presupuestoId = parseInt(urlParams.get('id'), 10);

    // --- FORMATEAR MONEDA ---
    const formatearMoneda = (valor) => {
        return valor.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
    };

    // --- CARGAR DATOS EN EL FORMULARIO ---
    function cargarDatosOT() {
        if (isNaN(presupuestoId) || !presupuestos[presupuestoId]) {
            alert("Error: No se encontró el presupuesto.");
            return;
        }

        const presupuesto = presupuestos[presupuestoId];
        const cliente = clientes[presupuesto.clienteIndex];

        if (!cliente) {
            alert("Error: No se encontró el cliente asociado.");
            return;
        }

        // Llenar datos de la OT
        document.getElementById('ot-numero').textContent = String(presupuestoId + 1).padStart(4, '0');
        document.getElementById('fecha-ingreso').value = new Date().toLocaleDateString('es-CL');
        
        // Llenar datos del cliente
        document.getElementById('cliente-nombre').value = cliente.nombre || '';
        document.getElementById('cliente-rut').value = cliente.rut || '';
        document.getElementById('cliente-direccion').value = cliente.direccion || '';
        document.getElementById('cliente-comuna').value = cliente.comuna || '';
        document.getElementById('cliente-telefono').value = cliente.telefono || '';
        
        // Llenar datos del vehículo
        document.getElementById('vehiculo-marca').value = cliente.marca || '';
        document.getElementById('vehiculo-modelo').value = cliente.modelo || '';
        document.getElementById('vehiculo-anio').value = cliente.anio || '';
        document.getElementById('vehiculo-patente').value = cliente.patente || '';

        // Llenar datos del trabajo
        document.getElementById('trabajo-realizar').value = presupuesto.diagnostico || '';
        document.getElementById('valor-trabajo').value = formatearMoneda(presupuesto.total);
    }

    // --- BOTÓN IMPRIMIR ---
    const btnImprimir = document.getElementById('btn-imprimir-ot');
    btnImprimir.addEventListener('click', () => {
        window.print();
    });

    // --- INICIALIZACIÓN ---
    cargarDatosOT();
});