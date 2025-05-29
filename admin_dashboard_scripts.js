document.addEventListener('DOMContentLoaded', function() {
    // Lógica del menú hamburguesa (si no está en script.js global y es necesaria aquí)
    const adminMenuToggle = document.getElementById('adminMenuToggle');
    const adminMenu = document.getElementById('adminMenu'); 
    if (adminMenuToggle && adminMenu) {
        adminMenuToggle.addEventListener('click', function() {
        adminMenu.classList.toggle('admin-menu-open');
        const isExpanded = adminMenu.classList.contains('admin-menu-open');
        this.setAttribute('aria-expanded', isExpanded);
        this.innerHTML = isExpanded ? '&times;' : '&#9776;'; // Alterna entre X y hamburguesa
        this.setAttribute('aria-label', isExpanded ? 'Cerrar menú' : 'Abrir menú');
        });
    }

    // Verificar si Firebase Firestore (db) está inicializado
    if (typeof db === 'undefined') {
        console.error("Firebase Firestore (db) no está inicializado. Asegúrate de que script.js se cargue correctamente y defina 'db'.");
        // Actualizar contadores con mensaje de error si los elementos existen
        const countVehiculosSpan = document.getElementById('count-vehiculos');
        const countPresupuestosPendientesSpan = document.getElementById('count-presupuestos-pendientes');
        const countTrabajosProcesoSpan = document.getElementById('count-trabajos-proceso');

        if(countVehiculosSpan) countVehiculosSpan.textContent = 'Error DB';
        if(countPresupuestosPendientesSpan) countPresupuestosPendientesSpan.textContent = 'Error DB';
        if(countTrabajosProcesoSpan) countTrabajosProcesoSpan.textContent = 'Error DB';
        return;
    }

    // Función para obtener y mostrar contadores del dashboard
    async function cargarContadoresDashboard() {
        const countVehiculosSpan = document.getElementById('count-vehiculos');
        const countPresupuestosPendientesSpan = document.getElementById('count-presupuestos-pendientes');
        const countTrabajosProcesoSpan = document.getElementById('count-trabajos-proceso');

        // Asegurarse de que los elementos span existan antes de intentar usarlos
        if (!countVehiculosSpan || !countPresupuestosPendientesSpan || !countTrabajosProcesoSpan) {
            console.warn("Alguno de los elementos span para contadores no fue encontrado en el DOM del dashboard.");
            return;
        }

        try {
            // Contar vehículos
            const vehiculosSnapshot = await db.collection("vehiculos").get();
            countVehiculosSpan.textContent = vehiculosSnapshot.size;

            // Contar presupuestos pendientes
            const presupuestosSnapshot = await db.collection("presupuestos").where("estado", "==", "Pendiente").get();
            countPresupuestosPendientesSpan.textContent = presupuestosSnapshot.size;

            // Contar trabajos en proceso
            const trabajosSnapshot = await db.collection("trabajos_en_curso").where("estadoTrabajo", "==", "En Proceso").get();
            countTrabajosProcesoSpan.textContent = trabajosSnapshot.size;

        } catch (error) {
            console.error("Error al cargar contadores del dashboard: ", error);
            countVehiculosSpan.textContent = 'Error';
            countPresupuestosPendientesSpan.textContent = 'Error';
            countTrabajosProcesoSpan.textContent = 'Error';
        }
    }

    // Cargar los contadores solo si estamos en una página que tiene los elementos del dashboard
    if (document.getElementById('count-vehiculos')) { // Chequea si un elemento del dashboard existe
        cargarContadoresDashboard();
    }
});